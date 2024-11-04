import React from 'react';
import { X, Pencil, Trash2, Clock, MapPin, FileText, AlertTriangle, Phone } from 'lucide-react';
import { Booking } from '../../types/calendar';
import { format } from 'date-fns';
import { AddBookingModal } from './AddBookingModal';
import { ServiceTypeSelector } from './ServiceTypeSelector';

interface BookingModalProps {
  booking: Booking;
  onClose: () => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (bookingId: string) => void;
}

export function BookingModal({ booking, onClose, onEdit, onDelete }: BookingModalProps) {
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeletePopover, setShowDeletePopover] = React.useState(false);
  const [currentBooking, setCurrentBooking] = React.useState(booking);
  const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setCurrentBooking(booking);
  }, [booking]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const handleDelete = () => {
    onDelete?.(currentBooking.id);
    onClose();
  };

  const handleEdit = (updatedBooking: Omit<Booking, 'id'>) => {
    const newBooking = { ...updatedBooking, id: currentBooking.id };
    onEdit?.(newBooking);
    setCurrentBooking(newBooking);
    setShowEditModal(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDeletePopover &&
        deleteButtonRef.current &&
        !deleteButtonRef.current.contains(event.target as Node)
      ) {
        setShowDeletePopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDeletePopover]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-40">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Booking Details</h2>
              <div className="flex items-center gap-1 sm:gap-2">
                {onEdit && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Edit booking"
                  >
                    <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
                {onDelete && (
                  <div className="relative">
                    <button
                      ref={deleteButtonRef}
                      onClick={() => setShowDeletePopover(true)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete booking"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {showDeletePopover && (
                      <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3 sm:p-4 z-50">
                        <div className="flex items-start gap-2 sm:gap-3 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-gray-900">Delete Booking</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Are you sure you want to delete this booking? This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowDeletePopover(false)}
                            className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDelete}
                            className="px-2.5 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services
                </label>
                <ServiceTypeSelector
                  selectedServices={currentBooking.services.map(s => s.type)}
                  serviceDetails={currentBooking.services.reduce((acc, service) => ({
                    ...acc,
                    [service.type]: service.details[service.type]
                  }), {})}
                  onToggleService={() => {}}
                  onUpdateDetails={() => {}}
                  readOnly
                />
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <span className={`px-2.5 py-1 rounded-full text-sm ${statusColors[currentBooking.status]}`}>
                  {currentBooking.status.charAt(0).toUpperCase() + currentBooking.status.slice(1)}
                </span>
                {currentBooking.isAllDay && (
                  <span className="px-2.5 py-1 rounded-full text-sm bg-yellow-50 text-yellow-800">
                    All day
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <div className="text-sm sm:text-base">
                  <p>{format(new Date(currentBooking.datetime), 'EEEE, MMMM d, yyyy')}</p>
                  {!currentBooking.isAllDay && currentBooking.endTime && (
                    <p>
                      {format(new Date(currentBooking.datetime), 'HH:mm')} - {format(new Date(currentBooking.endTime), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <div className="text-sm sm:text-base">
                  <p className="font-medium">{currentBooking.location}</p>
                  <p>{currentBooking.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <p className="text-sm sm:text-base">{currentBooking.phone}</p>
              </div>

              {currentBooking.notes && (
                <div className="flex items-start gap-2 text-gray-700">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-1" />
                  <p className="text-sm sm:text-base whitespace-pre-wrap">{currentBooking.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="z-50">
          <AddBookingModal
            onClose={() => setShowEditModal(false)}
            onAdd={handleEdit}
            initialBooking={currentBooking}
          />
        </div>
      )}
    </>
  );
}