import React from 'react';
import { X, Calendar, UserCheck, ChevronDown, Plus } from 'lucide-react';
import { format, setHours, setMinutes, parse, addHours } from 'date-fns';
import { Booking, ServiceType, ServiceDetails, Location, Priority, Reminder } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';

interface AddBookingModalProps {
  onClose: () => void;
  onAdd: (booking: Omit<Booking, 'id'>) => Promise<void>;
  selectedDate?: Date;
  initialBooking?: Booking;
  initialType?: 'booking' | 'follow-up';
  hideServices?: boolean;
}

const LOCATIONS: Location[] = [
  'Bastos', 'Mvan', 'Nsam', 'Mvog-Mbi', 'Essos', 
  'Mimboman', 'Nkoldongo', 'Ekounou', 'Emana', 
  'Nkolbisson', 'Olembe', 'Ngousso', 'Messa', 
  'Omnisport', 'Tsinga', 'Etoa-Meki', 'Nlongkak'
];

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

export function AddBookingModal({ onClose, onAdd, selectedDate, initialBooking, initialType, hideServices = false }: AddBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedServices, setSelectedServices] = React.useState<ServiceInstance[]>(
    initialBooking?.services.map(s => ({
      id: s.id,
      type: s.type,
      details: s.details[s.type]
    })) ?? []
  );
  const [serviceDetails, setServiceDetails] = React.useState<Record<string, ServiceDetails[string]>>(
    initialBooking?.services.reduce((acc, s) => ({
      ...acc,
      [s.id]: s.details[s.type]
    }), {}) ?? {}
  );
  const [formData, setFormData] = React.useState({
    location: initialBooking?.location ?? '',
    address: initialBooking?.address ?? '',
    phone: initialBooking?.phone ?? '',
    date: initialBooking?.datetime
      ? format(new Date(initialBooking.datetime), 'yyyy-MM-dd')
      : selectedDate 
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    startTime: initialBooking?.datetime
      ? format(new Date(initialBooking.datetime), 'HH:mm')
      : '09:00',
    endTime: initialBooking?.endTime
      ? format(new Date(initialBooking.endTime), 'HH:mm')
      : '11:00',
    notes: initialBooking?.notes ?? '',
    status: initialBooking?.status ?? 'pending',
    isAllDay: initialBooking?.isAllDay ?? false,
    priority: initialBooking?.priority ?? 'medium',
    name: initialBooking?.name ?? '',
  });
  const [prospectType, setProspectType] = React.useState<'booking' | 'follow-up'>(
    initialType ?? (selectedDate ? 'booking' : 'follow-up')
  );
  const [showNotes, setShowNotes] = React.useState(!!initialBooking?.notes);
  const [locationSearch, setLocationSearch] = React.useState(initialBooking?.location || '');
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false);
  const [reminders] = React.useState<Reminder[]>(initialBooking?.reminders || []);

  const filteredLocations = React.useMemo(() => {
    return LOCATIONS.filter(location => 
      location.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locationSearch]);

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
      alert('Please select a location');
      return;
    }

    if (prospectType === 'booking' && !formData.date) {
      alert('Booking date is required for confirmed bookings');
      return;
    }

    if (formData.status === 'confirmed' && (!formData.startTime || !formData.endTime)) {
      alert('Start and end time are required for confirmed bookings');
      return;
    }

    if (selectedServices.length === 0) {
      alert('Please select at least one service');
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

    try {
      setIsSubmitting(true);
      await onAdd({
        services,
        location: formData.location,
        address: formData.address,
        phone: formData.phone,
        datetime: prospectType === 'booking' ? 
          new Date(`${formData.date}T${formData.startTime}`).toISOString() :
          new Date().toISOString(),
        notes: formData.notes,
        status: formData.status,
        isAllDay: formData.isAllDay,
        priority: formData.priority,
        name: formData.name,
        reminders,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Failed to update booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            {initialBooking ? 'Edit Prospect' : 'New Prospect'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
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
                  onClick={() => setProspectType('booking')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                    prospectType === 'booking'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Booking</span>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    placeholder="Select a location..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8 ${
                      !formData.location ? 'border-red-300' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {showLocationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredLocations.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, location }));
                          setLocationSearch(location);
                          setShowLocationDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          location === formData.location ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : initialBooking ? 'Save Changes' : 'Create Prospect'}
          </button>
        </div>
      </div>
    </div>
  );
}