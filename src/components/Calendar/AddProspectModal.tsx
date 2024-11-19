import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, ChevronDown, Plus, Check, CheckCircle, Flag } from 'lucide-react';
import { format, setHours, setMinutes, parse, addHours } from 'date-fns';
import { Prospect, ServiceType, ServiceDetails, Location, Priority, Reminder } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { fetchLocationIdByName, fetchLocations, LocationRow } from '../../lib/api';
import { toast } from 'react-toastify';
import Select from 'react-select';

interface AddProspectModalProps {
  onClose: () => void;
  onAdd: (prospect: Omit<Prospect, 'id'>) => Promise<void>;
  selectedDate?: Date;
  initialProspect?: Prospect;
  hideServices?: boolean;
  prefillData?: Omit<Prospect, 'id'>;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 7; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      options.push(format(setMinutes(setHours(new Date(), hour), minute), 'HH:mm'));
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5)}`;
  return `${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 7)} ${numbers.slice(7)}`;
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-600',
  confirmed: 'bg-green-100 text-green-600',
  completed: 'bg-blue-100 text-blue-600',
  cancelled: 'bg-red-100 text-red-600',
};

const priorityColors = {
  low: 'bg-green-100 text-green-600',
  medium: 'bg-yellow-100 text-yellow-600',
  high: 'bg-red-100 text-red-600',
};

export function AddProspectModal({ onClose, onAdd, selectedDate, initialProspect, hideServices = false, prefillData }: AddProspectModalProps) {
  const [selectedServices, setSelectedServices] = React.useState<ServiceInstance[]>(
    initialProspect?.services.map(s => ({
      id: s.id,
      type: s.type,
      details: s.details[s.type]
    })) ?? []
  );
  const [serviceDetails, setServiceDetails] = React.useState<Record<string, ServiceDetails[string]>>(
    initialProspect?.services.reduce((acc, s) => ({
      ...acc,
      [s.id]: s.details[s.type]
    }), {}) ?? {}
  );
  const [reminders, setReminders] = React.useState<Reminder[]>(
    initialProspect?.reminders || []
  );
  const [formData, setFormData] = React.useState({
    location: prefillData?.location ?? initialProspect?.location ?? '',
    address: prefillData?.address ?? initialProspect?.address ?? '',
    phone: prefillData?.phone ?? initialProspect?.phone ?? '',
    date: initialProspect?.datetime
      ? format(new Date(initialProspect.datetime), 'yyyy-MM-dd')
      : prefillData?.datetime
        ? format(new Date(prefillData.datetime), 'yyyy-MM-dd')
        : selectedDate 
          ? format(selectedDate, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
    startTime: initialProspect?.datetime
      ? format(new Date(initialProspect.datetime), 'HH:mm')
      : prefillData?.datetime
        ? format(new Date(prefillData.datetime), 'HH:mm')
        : '09:00',
    endTime: initialProspect?.datetime
      ? format(addHours(new Date(initialProspect.datetime), 2), 'HH:mm')
      : '11:00',
    notes: prefillData?.notes ?? initialProspect?.notes ?? '',
    status: prefillData?.status ?? initialProspect?.status ?? 'pending',
    isAllDay: prefillData?.isAllDay ?? initialProspect?.isAllDay ?? false,
    priority: prefillData?.priority ?? initialProspect?.priority ?? 'medium',
    name: prefillData?.name ?? initialProspect?.name ?? '',
  });
  const [showNotes, setShowNotes] = React.useState(!!initialProspect?.notes);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);

  const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
  const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPriorityDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchLocations().then((data: any) =>
      setLocations(data.map((location: LocationRow) => location.name))
    );
  }, []);

  const locationOptions = React.useMemo(() => 
    locations
      .sort((a, b) => a.localeCompare(b))
      .map(location => ({
        value: location,
        label: location
      }))
  , [locations]);

  const selectedLocationOption = React.useMemo(() => 
    formData.location ? {
      value: formData.location,
      label: formData.location
    } : null
  , [formData.location]);

  const handleServiceToggle = (service: ServiceInstance) => {
    if (selectedServices.some(s => s.id === service.id)) {
      // Remove service
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
      setServiceDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[service.id];
        return newDetails;
      });
    } else {
      // Add new service
      setSelectedServices(prev => [...prev, service]);
      setServiceDetails(prev => ({
        ...prev,
        [service.id]: service.details
      }));
    }
  };

  const handleServiceDetailsUpdate = (serviceId: string, details: ServiceDetails[string]) => {
    setServiceDetails(prev => ({
      ...prev,
      [serviceId]: details
    }));
  };

  const handleStartTimeChange = (newStartTime: string) => {
    const startDate = parse(newStartTime, 'HH:mm', new Date());
    const endDate = addHours(startDate, 2);
    setFormData(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: format(endDate, 'HH:mm')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location) {
      toast.error('Please select a location');
      return;
    }

    if (!formData.phone) {
      toast.error('Please enter a phone number');
      return;
    }

    if (formData.status === 'confirmed' && !formData.startTime) {
      toast.error('Start time is required for confirmed prospects');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    // Create services array with proper structure
    const services = selectedServices.map(service => ({
      id: service.id,
      type: service.type,
      details: {
        [service.type]: serviceDetails[service.id]
      }
    }));

    const startDateTime = parse(formData.startTime, 'HH:mm', new Date(formData.date));

    const location = await fetchLocationIdByName(formData.location);
    const prospect = {
      services,
      location_id: location?.id,
      location: location?.name,
      address: formData.address,
      phone: formData.phone,
      datetime: startDateTime.toISOString(),
      notes: formData.notes,
      status: formData.status,
      isAllDay: formData.isAllDay,
      priority: formData.priority,
      name: formData.name,
      reminders: initialProspect ? reminders : [], // Keep existing reminders when editing
    };

    // Close the modal immediately
    onClose();

    // Use toast.promise to track the prospect creation/update
    toast.promise(onAdd(prospect), {
      pending: initialProspect ? "Updating prospect..." : "Creating prospect...",
      success: initialProspect ? "Prospect updated 👌" : "Prospect created 👌",
      error: {
        render({ data }) {
          // When the promise rejects, data will contain the error
          const action = initialProspect ? "update" : "create";
          return `Failed to ${action} prospect: ${data.message}`;
        },
      },
    });
  };

  // Helper function to generate UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {initialProspect ? 'Edit Prospect' : 'New Prospect'}
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowPriorityDropdown(false);
                }}
                className={`px-2.5 py-1 rounded-full text-sm ${
                  statusColors[formData.status]
                } flex items-center gap-1 hover:ring-2 hover:ring-gray-200 transition-all`}
              >
                {formData.status === 'pending' && <Clock className="w-3 h-3" />}
                {formData.status === 'confirmed' && <Check className="w-3 h-3" />}
                {formData.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                {formData.status === 'cancelled' && <X className="w-3 h-3" />}
                {formData.status.charAt(0).toUpperCase() +
                  formData.status.slice(1)}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => 
                        setFormData(prev => ({
                          ...prev,
                          status
                        }))
                      }
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2
                        ${formData.status === status ? 'bg-gray-50' : ''}`}
                    >
                      {status === 'pending' && <Clock className="w-3 h-3" />}
                      {status === 'confirmed' && <Check className="w-3 h-3" />}
                      {status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {status === 'cancelled' && <X className="w-3 h-3" />}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={priorityDropdownRef}>
              <button
                onClick={() => {
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowStatusDropdown(false);
                }}
                className={`px-2.5 py-1 rounded-full text-sm ${
                  priorityColors[formData.priority]
                } hover:ring-2 hover:ring-gray-200 transition-all`}
              >
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  {formData.priority.charAt(0).toUpperCase() +
                    formData.priority.slice(1)}
                  <ChevronDown className="w-3 h-3" />
                </div>
              </button>
              {showPriorityDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <button
                      key={priority}
                      onClick={() => 
                        setFormData(prev => ({
                          ...prev,
                          priority
                        }))
                      }
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2
                        ${formData.priority === priority ? 'bg-gray-50' : ''}`}
                    >
                      <Flag className="w-3 h-3" />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form className="space-y-4 text-sm">
            {!hideServices && (
              <div className="border rounded-lg overflow-visible">
                <div className="p-4">
                  <ServiceTypeSelector
                    isAddProspectModal={true}
                    selectedServices={selectedServices}
                    serviceDetails={serviceDetails}
                    onToggleService={handleServiceToggle}
                    onUpdateDetails={handleServiceDetailsUpdate}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Select
                  value={selectedLocationOption}
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: option?.value || '',
                    }))
                  }
                  options={locationOptions}
                  className="text-sm"
                  classNames={{
                    control: () => "!min-h-[38px]",
                  }}
                  placeholder="Select location..."
                  isClearable
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter address..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter name..."
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: formatPhoneNumber(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="block font-medium text-gray-700">
                All Day
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isAllDay: !prev.isAllDay }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isAllDay ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isAllDay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add note
                </button>
              ) : (
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Additional notes about the prospect"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-2 py-3 px-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {initialProspect ? 'Save Changes' : 'Create Prospect'}
          </button>
        </div>
      </div>
    </div>
  );
}