import React from 'react';
import { format, isToday } from 'date-fns';
import { Booking } from '../../types/calendar';
import { BookingPreview } from './BookingPreview';
import { BookingModal } from './BookingModal';

interface AgendaViewProps {
  bookings: Booking[];
  onUpdateBooking: (booking: Booking) => Promise<void>;
  onDeleteBooking?: (bookingId: string) => void;
}

export function AgendaView({ bookings, onUpdateBooking, onDeleteBooking }: AgendaViewProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

  const groupedBookings = React.useMemo(() => {
    const sorted = [...bookings]
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    const groups = new Map<string, Booking[]>();
    sorted.forEach(booking => {
      const date = new Date(booking.datetime);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(booking);
    });

    return Array.from(groups.entries()).map(([dateStr, dayBookings]) => ({
      date: new Date(dateStr),
      bookings: dayBookings.sort((a, b) => 
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      ),
    }));
  }, [bookings]);

  if (groupedBookings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No upcoming bookings
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto py-2 px-4 space-y-2">
        {groupedBookings.map(({ date, bookings }) => (
          <div key={date.toISOString()} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <h2 className={`text-sm font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            <div className="space-y-2 p-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="cursor-pointer">
                  <BookingPreview
                    booking={booking}
                    onClick={() => setSelectedBooking(booking)}
                    view="agenda"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={onUpdateBooking}
          onDelete={onDeleteBooking ? (bookingId: string) => onDeleteBooking(bookingId) : undefined}
        />
      )}
    </div>
  );
}