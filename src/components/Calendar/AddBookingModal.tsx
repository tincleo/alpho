import React from 'react';
import { X } from 'lucide-react';
import { format, setHours, setMinutes, parse, addHours } from 'date-fns';
import { Booking, ServiceType, ServiceDetails, Location } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';

interface AddBookingModalProps {
  onClose: () => void;
  onAdd: (booking: Omit<Booking, 'id'>) => void;
  selectedDate?: Date;
  initialBooking?: Booking;
}

const LOCATIONS: Location[] = [
  'Bastos', 'Mvan', 'Nsam', 'Mvog-Mbi', 'Essos', 
  'Mimboman', 'Nkoldongo', 'Ekounou', 'Emana', 
  'Nkolbisson', 'Olembe', 'Ngousso', 'Messa', 
  'Omnisport', 'Tsinga', 'Etoa-Meki', 'Nlongkak'
];

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

export function AddBookingModal({ onClose, onAdd, selectedDate, initialBooking }: AddBookingModalProps) {
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
  });

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

    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    const missingDetails = selectedServices.some(service => !serviceDetails[service]);
    if (missingDetails) {
      alert('Please fill in all service details');
      return;
    }

    const datetime = parse(
      `${formData.date} ${formData.startTime}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    ).toISOString();

    const endTime = formData.isAllDay ? undefined : parse(
      `${formData.date} ${formData.endTime}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    ).toISOString();

    onAdd({
      services: selectedServices.map(type => ({
        type,
        details: {
          [type]: serviceDetails[type]
        }
      })),
      location: formData.location as Location,
      address: formData.address,
      phone: formData.phone.replace(/\s/g, ''),
      datetime,
      endTime,
      notes: formData.notes,
      status: formData.status as Booking['status'],
      isAllDay: formData.isAllDay,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-40">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {initialBooking ? 'Edit Booking' : 'New Booking'}
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
            <div className="w-full">
              <ServiceTypeSelector
                selectedServices={selectedServices}
                serviceDetails={serviceDetails}
                onToggleService={handleServiceToggle}
                onUpdateDetails={handleServiceDetailsUpdate}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
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
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value as Location,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">All day</span>
                    <input
                      type="checkbox"
                      checked={formData.isAllDay}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isAllDay: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
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

            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <select
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
                placeholder="Additional notes about the booking"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>

        <div className="p-3 border-t sticky bottom-0 bg-white z-10">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialBooking ? 'Save Changes' : 'Add Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}