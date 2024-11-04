import React from 'react';
import { X, Calendar, UserCheck } from 'lucide-react';
import { format, setHours, setMinutes, parse, addHours } from 'date-fns';
import { Booking, ServiceType, ServiceDetails, Location, Priority } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';

interface AddBookingModalProps {
  onClose: () => void;
  onAdd: (booking: Omit<Booking, 'id'>) => void;
  selectedDate?: Date;
  initialBooking?: Booking;
  initialType?: 'booking' | 'follow-up';
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

export function AddBookingModal({ onClose, onAdd, selectedDate, initialBooking, initialType }: AddBookingModalProps) {
  const [selectedServices, setSelectedServices] = React.useState<ServiceType[]>(
    initialBooking?.services.map(s => s.type) ?? []
  );
  const [serviceDetails, setServiceDetails] = React.useState<ServiceDetails>(
    initialBooking?.services.reduce((acc, service) => ({
      ...acc,
      [service.type]: service.details[service.type]
    }), {}) ?? {}
  );
  const [formData, setFormData] = React.useState({
    location: initialBooking?.location ?? 'Bastos',
    address: initialBooking?.address ?? '',
    phone: initialBooking?.phone ?? '',
    date: initialBooking
      ? format(new Date(initialBooking.datetime), 'yyyy-MM-dd')
      : selectedDate 
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    startTime: initialBooking?.isAllDay ? '09:00' : initialBooking
      ? format(new Date(initialBooking.datetime), 'HH:mm')
      : '09:00',
    endTime: initialBooking?.isAllDay ? '11:00' : initialBooking
      ? format(new Date(initialBooking.endTime || ''), 'HH:mm')
      : '11:00',
    notes: initialBooking?.notes ?? '',
    status: initialBooking?.status ?? 'pending',
    isAllDay: initialBooking?.isAllDay ?? false,
    priority: initialBooking?.priority ?? 'medium',
    name: initialBooking?.name ?? '',
  });
  const [prospectType, setProspectType] = React.useState<'booking' | 'follow-up'>(initialType ?? 'follow-up');

  const handleServiceToggle = (type: ServiceType) => {
    setSelectedServices(prev => {
      if (prev.includes(type)) {
        const newServices = prev.filter(t => t !== type);
        setServiceDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          delete newDetails[type];
          return newDetails;
        });
        return newServices;
      }
      return [...prev, type];
    });
  };

  const handleServiceDetailsUpdate = (type: ServiceType, details: ServiceDetails) => {
    setServiceDetails(prev => ({
      ...prev,
      [type]: details[type]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const services = selectedServices.map(type => ({
      type,
      details: { [type]: serviceDetails[type] || {} }
    }));

    onAdd({
      services,
      location: formData.location,
      address: formData.address,
      phone: formData.phone,
      datetime: prospectType === 'booking' ? 
        new Date(`${formData.date}T${formData.startTime}`).toISOString() :
        new Date().toISOString(),
      endTime: prospectType === 'booking' && formData.endTime ?
        new Date(`${formData.date}T${formData.endTime}`).toISOString() :
        undefined,
      notes: formData.notes,
      status: formData.status,
      isAllDay: formData.isAllDay,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {initialBooking ? 'Edit Prospect' : 'New Prospect'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services <span className="text-red-500">*</span>
              </label>
              <ServiceTypeSelector
                selectedServices={selectedServices}
                serviceDetails={serviceDetails}
                onToggleService={handleServiceToggle}
                onUpdateDetails={handleServiceDetailsUpdate}
                detailsOptional={prospectType === 'follow-up'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prospect Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Customer name"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as Booking['status'],
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value as Priority,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {prospectType === 'booking' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Booking date <span className="text-red-500">*</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAllDay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isAllDay: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">All day</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      required={prospectType === 'booking'}
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {!formData.isAllDay && (
                    <div>
                      <select
                        required
                        value={formData.startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}