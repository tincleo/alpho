import React from 'react';
import { X } from 'lucide-react';
import { Booking } from '../../types/calendar';
import { format } from 'date-fns';
import { BookingPreview } from './BookingPreview';
import { BookingModal } from './BookingModal';

interface DayBookingsModalProps {
  date: Date;
  bookings: Booking[];
  onClose: () => void;
  onEdit?: (booking: Booking) => void;
  onDelete?: (bookingId: string) => void;
}

export function DayBookingsModal({ date, bookings, onClose, onEdit, onDelete }: DayBookingsModalProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(
    null
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No bookings for this day
              </p>
            ) : (
              bookings.map((booking) => (
                <BookingPreview
                  key={booking.id}
                  booking={booking}
                  onClick={() => setSelectedBooking(booking)}
                  view="agenda"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}