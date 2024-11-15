import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Phone, User, Flag, AlertTriangle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Prospect, Reminder } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { AddProspectModal } from './AddProspectModal';
import { RemindersAccordion } from './RemindersAccordion';

interface ProspectModalProps {
  prospect: Prospect;
  onClose: () => void;
  onEdit: (prospect: Prospect) => Promise<void>;
  onDelete: (prospectId: string) => Promise<void>;
  onUpdateReminder: (prospectId: string, reminderId: string, completed: boolean) => Promise<void>;
}

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-800',
  confirmed: 'bg-green-50 text-green-800',
  completed: 'bg-blue-50 text-blue-800',
  cancelled: 'bg-red-50 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-50 text-gray-800',
  medium: 'bg-blue-50 text-blue-800',
  high: 'bg-red-50 text-red-800'
};

export function ProspectModal({ prospect, onClose, onEdit, onDelete, onUpdateReminder }: ProspectModalProps) {
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [currentProspect, setCurrentProspect] = useState<Prospect>(prospect);
  const [reminders, setReminders] = React.useState<Reminder[]>(prospect.reminders || []);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPhoneMenu, setShowPhoneMenu] = React.useState(false);
  const phoneMenuRef = React.useRef<HTMLDivElement>(null);
  const [localServices, setLocalServices] = React.useState(prospect.services);

  const handleEdit = async (updatedProspect: Omit<Prospect, 'id'>) => {
    try {
      setIsLoading(true);
      const fullProspect = { 
        ...updatedProspect, 
        id: currentProspect.id,
      };
      await onEdit(fullProspect as Prospect);
      
      // Update the current prospect state with the new data
      setCurrentProspect(fullProspect as Prospect);
      setReminders(fullProspect.reminders);
      setShowEditModal(false);
    } catch {
      setError('Failed to update prospect');
    } finally {
      setIsLoading(false);
    }
  };

  // Keep local state in sync with prop updates
  React.useEffect(() => {
    setCurrentProspect(prospect);
    setReminders(prospect.reminders || []);
    setLocalServices(prospect.services);
  }, [prospect]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (phoneMenuRef.current && !phoneMenuRef.current.contains(event.target as Node)) {
        setShowPhoneMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await onDelete(prospect.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: unknown) {
      setError(`Failed to delete prospect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemindersChange = async (updatedReminders: Reminder[]) => {
    setReminders(updatedReminders);

    try {
      setIsLoading(true);
      await onEdit({
        ...prospect,
        reminders: updatedReminders
      });
    } catch (err: unknown) {
      setReminders(prospect.reminders || []);
      console.error('Failed to update reminders:', err);
      setError(`Failed to update reminders: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${prospect.phone}`;
    setShowPhoneMenu(false);
  };

  const handleWhatsApp = () => {
    // Add Cameroon country code (+237) if not present
    const phoneNumber = prospect.phone.startsWith('+237') 
      ? prospect.phone.replace(/\s/g, '') 
      : '+237' + prospect.phone.replace(/\s/g, '');
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
    setShowPhoneMenu(false);
  };

  const handleRefresh = async () => {
    try {
      await onEdit(prospect);
    } catch (error) {
      console.error('Failed to refresh prospect:', error);
    }
  };

  const handleServiceToggle = async (service: ServiceInstance) => {
    try {
      // Optimistically update local state
      const updatedServices = currentProspect.services.some(s => s.id === service.id)
        ? localServices.filter(s => s.id !== service.id) // Remove service
        : [...localServices, {  // Add service
            id: service.id,
            type: service.type,
            details: { [service.type]: service.details }
          }];
      
      setLocalServices(updatedServices);

      // Update in background
      const updatedProspect = {
        ...currentProspect,
        services: updatedServices
      };

      await onEdit(updatedProspect);
      setCurrentProspect(updatedProspect);
    } catch (error) {
      // Revert on error
      setLocalServices(currentProspect.services);
      setError('Failed to update services');
      console.error('Failed to update services:', error);
    }
  };

  const handleServiceDetailsUpdate = async (serviceId: string, details: ServiceDetails[string]) => {
    try {
      // Optimistically update local state
      const updatedServices = localServices.map(service => 
        service.id === serviceId ? {
          ...service,
          details: { [service.type]: details }
        } : service
      );
      
      setLocalServices(updatedServices);

      // Update in background
      const updatedProspect = {
        ...currentProspect,
        services: updatedServices
      };

      await onEdit(updatedProspect);
      setCurrentProspect(updatedProspect);
    } catch (error) {
      // Revert on error
      setLocalServices(currentProspect.services);
      setError('Failed to update service details');
      console.error('Failed to update service details:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      setIsLoading(true);

      // Remove reminder from local state
      const updatedReminders = currentProspect.reminders.filter(
        (reminder) => reminder.id !== reminderId
      );
      const updatedProspect = {
        ...currentProspect,
        reminders: updatedReminders,
      };
      setCurrentProspect(updatedProspect);

      // Save to database
      await onEdit(updatedProspect);
    } catch (error) {
      // Revert on error
      setCurrentProspect(prospect);
      setError("Failed to delete reminder");
      console.error("Failed to delete reminder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminder = async (newReminder: Omit<Reminder, 'id' | 'prospect_id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      // Create a temporary reminder object with a temp ID
      const tempReminder: Reminder = {
        id: `temp_${Date.now()}`,
        prospect_id: prospect.id,
        datetime: newReminder.datetime,
        note: newReminder.note,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update local state first (optimistic update)
      const updatedProspect = {
        ...currentProspect,
        reminders: [...currentProspect.reminders, tempReminder]
      };
      setCurrentProspect(updatedProspect);

      // Save to database
      await onEdit(updatedProspect);
    } catch (error) {
      // Revert on error
      setCurrentProspect(prospect);
      setError('Failed to add reminder');
      console.error('Failed to add reminder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onEdit(currentProspect);
      onClose();
    } catch (error) {
      console.error('Error saving prospect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <h3 className="text-red-600 font-medium mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              Prospect Details
            </h2>
            {currentProspect.name && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{currentProspect.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Reminders */}
            <RemindersAccordion
              reminders={currentProspect.reminders}
              prospectId={currentProspect.id}
              handleDeleteReminder={handleDeleteReminder}
              onChange={(updatedReminders) => {
                setCurrentProspect((prev) => ({
                  ...prev,
                  reminders: updatedReminders,
                }));
              }}
              onAddReminder={handleAddReminder}
              onUpdateReminder={onUpdateReminder}
            />

            {/* Services - Updated styling */}
            <div className="border rounded-lg overflow-visible">
              <div className="p-4">
                <ServiceTypeSelector
                  selectedServices={localServices}
                  serviceDetails={localServices.reduce(
                    (acc, s) => ({
                      ...acc,
                      [s.id]: s.details[s.type],
                    }),
                    {}
                  )}
                  onToggleService={handleServiceToggle}
                  onUpdateDetails={handleServiceDetailsUpdate}
                  readOnly={false}
                />
              </div>
            </div>

            {/* Status and Priority */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-sm ${
                  statusColors[currentProspect.status]
                }`}
              >
                {currentProspect.status.charAt(0).toUpperCase() +
                  currentProspect.status.slice(1)}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-sm ${
                  priorityColors[currentProspect.priority]
                }`}
              >
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  {currentProspect.priority.charAt(0).toUpperCase() +
                    currentProspect.priority.slice(1)}{" "}
                  Priority
                </div>
              </span>
              {currentProspect.isAllDay && (
                <span className="px-2.5 py-1 rounded-full text-sm bg-purple-50 text-purple-800">
                  All day
                </span>
              )}
            </div>

            {/* Date and Time */}
            {currentProspect.datetime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(
                    new Date(currentProspect.datetime),
                    "EEEE, MMMM d, yyyy"
                  )}
                </span>
                {!currentProspect.isAllDay && currentProspect.datetime && (
                  <>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>
                      {format(new Date(currentProspect.datetime), "HH:mm")}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="relative">
                <button
                  onClick={() => setShowPhoneMenu(!showPhoneMenu)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <Phone className="w-4 h-4 group-hover:text-blue-500" />
                  <span className="group-hover:text-blue-500">
                    {currentProspect.phone}
                  </span>
                </button>

                {showPhoneMenu && (
                  <div
                    ref={phoneMenuRef}
                    className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <button
                      onClick={handleCall}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {(currentProspect.location || currentProspect.address) && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    {currentProspect.location && (
                      <div>{currentProspect.location}</div>
                    )}
                    {currentProspect.address && (
                      <div className="text-sm">{currentProspect.address}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {currentProspect.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {currentProspect.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end gap-2 p-6 border-t">
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Delete
            </button>

            {showDeleteConfirm && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Delete Prospect
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Are you sure you want to delete this prospect? This action
                      cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Edit
          </button>
        </div>
      </div>

      {showEditModal && (
        <AddProspectModal
          initialProspect={{
            ...currentProspect,
            reminders: reminders,
          }}
          initialType={currentProspect.datetime ? "prospect" : "follow-up"}
          onClose={() => setShowEditModal(false)}
          onAdd={handleEdit}
          hideServices={true}
        />
      )}
    </div>
  );
}