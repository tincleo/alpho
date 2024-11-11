import React from 'react';
import { format, isToday } from 'date-fns';
import { Booking } from '../../types/calendar';
import { BookingPreview } from './ProspectPreview';
import { BookingModal } from './ProspectModal';
import { updateReminder } from '../../lib/api';
import { X } from 'lucide-react';

interface AgendaViewProps {
  bookings: Booking[];
  onUpdateBooking: (booking: Booking) => Promise<void>;
  onDeleteBooking: (bookingId: string) => Promise<void>;
  onBookingsChange?: () => void;
  onUpdateReminder: (prospectId: string, reminderId: string, completed: boolean) => Promise<void>;
}

export function AgendaView({ 
  bookings, 
  onUpdateBooking, 
  onDeleteBooking, 
  onBookingsChange,
  onUpdateReminder 
}: AgendaViewProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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

  const handleUpdateReminder = async (prospectId: string, reminderId: string, completed: boolean) => {
    try {
      await updateReminder(prospectId, reminderId, completed);
      onBookingsChange?.();
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await onDeleteBooking(bookingId);
      setSelectedBooking(null);
      onBookingsChange?.();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      throw error;
    }
  };

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
          onDelete={handleDeleteBooking}
          onUpdateReminder={onUpdateReminder}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}