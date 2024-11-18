import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Phone, User, Flag, AlertTriangle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Prospect, Reminder } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { AddProspectModal } from './AddProspectModal';
import { RemindersAccordion } from './RemindersAccordion';
import { realtimeManager } from '../../lib/realtimeManager';
import { fetchProspectById } from '../../lib/api';

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
    try {
      setIsLoading(true);
      
      // Optimistically update local state
      setReminders(updatedReminders);
      setCurrentProspect(prev => ({
        ...prev,
        reminders: updatedReminders
      }));
      
      // Update the prospect with new reminders
      const updatedProspect = {
        ...currentProspect,
        reminders: updatedReminders
      };
      
      await onEdit(updatedProspect);
    } catch (err: unknown) {
      // Revert on error
      setReminders(currentProspect.reminders || []);
      setCurrentProspect(prev => ({
        ...prev,
        reminders: currentProspect.reminders || []
      }));
      console.error('Failed to update reminders:', err);
      setError(`Failed to update reminders: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminder = async (newReminder: Reminder) => {
    try {
      setIsLoading(true);
      
      // Add the new reminder to the current list
      const updatedReminders = [...reminders, newReminder].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
      
      // Optimistically update local state
      setReminders(updatedReminders);
      setCurrentProspect(prev => ({
        ...prev,
        reminders: updatedReminders
      }));
      
      // Update the prospect with the new reminder
      const updatedProspect = {
        ...currentProspect,
        reminders: updatedReminders
      };
      
      await onEdit(updatedProspect);
    } catch (err: unknown) {
      // Revert on error
      setReminders(currentProspect.reminders || []);
      setCurrentProspect(prev => ({
        ...prev,
        reminders: currentProspect.reminders || []
      }));
      console.error('Failed to add reminder:', err);
      setError(`Failed to add reminder: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReminder = async (prospectId: string, reminderId: string, completed: boolean) => {
    try {
      // If it's a temporary reminder, we need to save it first
      if (reminderId.includes('temp_')) {
        // Find the reminder
        const reminder = reminders.find(r => r.id === reminderId);
        if (!reminder) throw new Error('Reminder not found');
        
        // Update the reminder list with the completion status
        const updatedReminders = reminders.map(r =>
          r.id === reminderId ? { ...r, completed } : r
        );
        
        // Save all changes
        await handleRemindersChange(updatedReminders);
      } else {
        // For existing reminders, just update the completion status
        await onUpdateReminder(prospectId, reminderId, completed);
        
        // Update local state after successful save
        setReminders(prev => prev.map(r =>
          r.id === reminderId ? { ...r, completed } : r
        ));
        setCurrentProspect(prev => ({
          ...prev,
          reminders: prev.reminders.map(r =>
            r.id === reminderId ? { ...r, completed } : r
          )
        }));
      }
    } catch (error) {
      throw error; // Let RemindersAccordion handle the error
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

  const handleServiceToggle = async (
    service: ServiceInstance
  ): Promise<void> => {
    return new Promise(async (resolve) => {
      // Perform synchronous updates
      try {
        // Optimistically update local state
        const updatedServices = currentProspect.services.some(
          (s) => s.id === service.id
        )
          ? localServices.filter((s) => s.id !== service.id) // Remove service
          : [
              ...localServices,
              {
                // Add service
                id: service.id,
                type: service.type,
                details: { [service.type]: service.details },
              },
            ];

        setLocalServices(updatedServices);

        // Update in background
        const updatedProspect = {
          ...currentProspect,
          services: updatedServices,
        };

        await onEdit(updatedProspect);
        setCurrentProspect(updatedProspect);
      } catch (error) {
        // Revert on error
        setLocalServices(currentProspect.services);
        setError("Failed to update services");
        console.error("Failed to update services:", error);
      }
      resolve();

    });

  };


  const handleServiceDetailsUpdate = async (
    serviceId: string,
    details: ServiceDetails[string]
  ): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        // Optimistically update local state
        const updatedServices = localServices.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                details: { [service.type]: details },
              }
            : service
        );

        setLocalServices(updatedServices);

        // Update in background
        const updatedProspect = {
          ...currentProspect,
          services: updatedServices,
        };

        await onEdit(updatedProspect);
        setCurrentProspect(updatedProspect);
      } catch (error) {
        // Revert on error
        setLocalServices(currentProspect.services);
        setError("Failed to update service details");
        console.error("Failed to update service details:", error);
      }
      resolve();
    });
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

  // Subscribe to realtime updates for this specific prospect
  React.useEffect(() => {
    const channelId = `prospect-${prospect.id}`;
    let isMounted = true;

    const refreshProspect = async () => {
      if (!isMounted) return;
      
      try {
        const updatedProspect = await fetchProspectById(prospect.id);
        
        if (!isMounted) return;
        
        if (updatedProspect) {
          setCurrentProspect(updatedProspect);
          setReminders(updatedProspect.reminders || []);
          setLocalServices(updatedProspect.services || []);
        } else {
          // If prospect no longer exists, close the modal
          onClose();
        }
      } catch (error) {
        console.error('Error refreshing prospect:', error);
        if (isMounted) {
          setError('Failed to refresh prospect data');
        }
      }
    };
    
    // Initial refresh
    refreshProspect();
    
    realtimeManager.subscribe(channelId, {
      onProspectChange: async (payload) => {
        if (!isMounted) return;
        
        if (payload.eventType === 'DELETE' || !payload.new) {
          onClose();
          return;
        }
        
        if (payload.new.id === prospect.id) {
          await refreshProspect();
        }
      },
      onReminderChange: async (payload) => {
        if (!isMounted) return;
        
        const isRelevant = 
          (payload.new?.prospect_id === prospect.id) || 
          (payload.old?.prospect_id === prospect.id);
          
        if (isRelevant) {
          await refreshProspect();
        }
      },
      onServiceChange: async (payload) => {
        if (!isMounted) return;
        
        const isRelevant = 
          (payload.new?.prospect_id === prospect.id) || 
          (payload.old?.prospect_id === prospect.id);
          
        if (isRelevant) {
          await refreshProspect();
        }
      }
    });

    return () => {
      isMounted = false;
      realtimeManager.unsubscribe(channelId);
    };
  }, [prospect.id]);

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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                {currentProspect.name || 'Prospect'}
              </h2>
            </div>
            <div className="flex gap-2">
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
                    currentProspect.priority.slice(1)}
                </div>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Reminders */}
            <RemindersAccordion
              reminders={reminders}
              prospectId={currentProspect.id}
              handleDeleteReminder={handleDeleteReminder}
              onChange={(updatedReminders) => {
                setReminders(updatedReminders);
                setCurrentProspect(prev => ({
                  ...prev,
                  reminders: updatedReminders
                }));
              }}
              onAddReminder={handleAddReminder}
              onUpdateReminder={handleUpdateReminder}
              onRefresh={async () => {
                // Refresh prospect data if needed
              }}
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

            {/* Date and Time */}
            {currentProspect.datetime && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="ml-2">
                  {format(new Date(currentProspect.datetime), "d MMM yyyy")}
                </span>
                {!currentProspect.isAllDay && (
                  <>
                    <Clock className="w-4 h-4 ml-2" />
                    <span className="ml-1">
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
                <div className="flex gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    {currentProspect.location && (
                      <span>{currentProspect.location}</span>
                    )}
                    {currentProspect.location && currentProspect.address && (
                      <span className="text-gray-600">, </span>
                    )}
                    {currentProspect.address && (
                      <span className="text-gray-600">{currentProspect.address}</span>
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
        <div className="flex justify-end gap-2 py-3 px-6 border-t">
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