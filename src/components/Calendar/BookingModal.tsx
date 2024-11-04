import React from 'react';
import { X, Calendar, Clock, MapPin, Phone, User, Flag, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from '../../types/calendar';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { AddBookingModal } from './AddBookingModal';

interface BookingModalProps {
  booking: Booking;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
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

export function BookingModal({ booking, onClose, onEdit, onDelete }: BookingModalProps) {
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const deleteButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(booking.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">
                Prospect Details
              </h2>
              {booking.name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{booking.name}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services
              </label>
              <ServiceTypeSelector
                selectedServices={booking.services.map(s => s.type)}
                serviceDetails={booking.services.reduce((acc, service) => ({
                  ...acc,
                  [service.type]: service.details[service.type]
                }), {})}
                onToggleService={() => {}}
                onUpdateDetails={() => {}}
                readOnly
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-sm ${statusColors[booking.status]}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-sm ${priorityColors[booking.priority]}`}>
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  {booking.priority.charAt(0).toUpperCase() + booking.priority.slice(1)} Priority
                </div>
              </span>
              {booking.isAllDay && (
                <span className="px-2.5 py-1 rounded-full text-sm bg-purple-50 text-purple-800">
                  All day
                </span>
              )}
            </div>

            {booking.datetime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(booking.datetime), 'EEEE, MMMM d, yyyy')}</span>
                {!booking.isAllDay && booking.datetime && (
                  <>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{format(new Date(booking.datetime), 'HH:mm')}</span>
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{booking.phone}</span>
              </div>

              {(booking.location || booking.address) && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    {booking.location && <div>{booking.location}</div>}
                    {booking.address && <div className="text-sm">{booking.address}</div>}
                  </div>
                </div>
              )}
            </div>

            {booking.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <div className="relative">
              <button
                ref={deleteButtonRef}
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                      <h3 className="text-sm font-medium text-gray-900">Delete Prospect</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Are you sure you want to delete this prospect? This action cannot be undone.
                      </p>
                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <AddBookingModal
          initialBooking={booking}
          initialType={booking.datetime ? 'booking' : 'follow-up'}
          onClose={() => {
            setShowEditModal(false);
            onClose();
          }}
          onAdd={(updatedBooking) => {
            onEdit({ ...updatedBooking, id: booking.id });
            setShowEditModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}