import React, { useEffect } from 'react';
import { X, Calendar, UserCheck, ChevronDown, Plus } from 'lucide-react';
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
  initialType?: 'prospect' | 'follow-up';
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

export function AddProspectModal({ onClose, onAdd, selectedDate, initialProspect, initialType, hideServices = false, prefillData }: AddProspectModalProps) {
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
  const [formData, setFormData] = React.useState({
    location: prefillData?.location ?? initialProspect?.location ?? '',
    address: prefillData?.address ?? initialProspect?.address ?? '',
    phone: prefillData?.phone ?? initialProspect?.phone ?? '',
    date: prefillData?.datetime
      ? format(new Date(prefillData.datetime), 'yyyy-MM-dd')
      : selectedDate 
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    startTime: prefillData?.datetime
      ? format(new Date(prefillData.datetime), 'HH:mm')
      : '09:00',
    endTime: prefillData?.endTime
      ? format(new Date(prefillData.endTime), 'HH:mm')
      : '11:00',
    notes: prefillData?.notes ?? initialProspect?.notes ?? '',
    status: prefillData?.status ?? initialProspect?.status ?? 'pending',
    isAllDay: prefillData?.isAllDay ?? initialProspect?.isAllDay ?? false,
    priority: prefillData?.priority ?? initialProspect?.priority ?? 'medium',
    name: prefillData?.name ?? initialProspect?.name ?? '',
  });
  const [prospectType, setProspectType] = React.useState<'prospect' | 'follow-up'>(
    initialType ?? (selectedDate ? 'prospect' : 'follow-up')
  );
  const [showNotes, setShowNotes] = React.useState(!!initialProspect?.notes);
  const [locations, setLocations] = React.useState<Location[]>([]);

  useEffect(() => {
    fetchLocations().then((data: any) =>
      setLocations(data.map((location: LocationRow) => location.name))
    );
  }, []);

  const locationOptions = React.useMemo(() => 
    locations.map(location => ({
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

  const handleEndTimeChange = (newEndTime: string) => {
    const endDate = parse(newEndTime, 'HH:mm', new Date());
    const startDate = addHours(endDate, -2);
    setFormData(prev => ({
      ...prev,
      startTime: format(startDate, 'HH:mm'),
      endTime: newEndTime
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.location) {
      toast.error('Please select a location');
      return;
    }

    if (prospectType === 'prospect' && !formData.date) {
      toast.error('Prospect date is required for confirmed prospects');
      return;
    }

    if (formData.status === 'confirmed' && (!formData.startTime || !formData.endTime)) {
      toast.error('Start and end time are required for confirmed prospects');
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

    const location = await fetchLocationIdByName(formData.location);
    const newProspect = {
      services,
      location_id: location?.id,
      location: location?.name,
      address: formData.address,
      phone: formData.phone,
      datetime:
        prospectType === "prospect"
          ? new Date(`${formData.date}T${formData.startTime}`).toISOString()
          : new Date().toISOString(),
      notes: formData.notes,
      status: formData.status,
      isAllDay: formData.isAllDay,
      priority: formData.priority,
      name: formData.name,
      reminders: [],
    };

    // Close the modal immediately
    onClose();

    // Use toast.promise to track the prospect creation
    toast.promise(
      onAdd(newProspect),
      {
        pending: 'Creating prospect...',
        success: 'Prospect created 👌',
        error: {
          render({data}) {
            // When the promise rejects, data will contain the error
            return `Failed to create prospect: ${data.message}`;
          }
        }
      }
    );
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
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {initialProspect ? 'Edit Prospect' : 'New Prospect'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setProspectType('prospect')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                    prospectType === 'prospect'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Prospect</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProspectType('follow-up')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                    prospectType === 'follow-up'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">Follow-up</span>
                </button>
              </div>
            </div>

            {!hideServices && (
              <ServiceTypeSelector
              isAddProspectModal={true}
                selectedServices={selectedServices}
                serviceDetails={serviceDetails}
                onToggleService={handleServiceToggle}
                onUpdateDetails={handleServiceDetailsUpdate}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Prospect Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData((prev) => ({ ...prev, phone: formatted }));
                  }}
                  placeholder="699 88 77 66"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedLocationOption}
                  onChange={(option) => {
                    if (option) {
                      setFormData(prev => ({ ...prev, location: option.value }));
                    } else {
                      setFormData(prev => ({ ...prev, location: '' }));
                    }
                  }}
                  options={locationOptions}
                  isClearable
                  isSearchable
                  placeholder="Select location..."
                  className="text-sm"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: '#e5e7eb',
                      '&:hover': {
                        borderColor: '#d1d5db'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Enter precise address"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Additional notes about the prospect"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {initialProspect ? 'Save Changes' : 'Create Prospect'}
          </button>
        </div>
      </div>
    </div>
  );
}