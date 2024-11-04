import React from 'react';
import { X, Search } from 'lucide-react';
import { Booking } from '../../types/calendar';
import { BookingPreview } from './BookingPreview';
import { BookingModal } from './BookingModal';

interface ProspectsSidebarProps {
  bookings: Booking[];
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ProspectsSidebar({ 
  bookings, 
  onUpdateBooking, 
  onDeleteBooking,
  isExpanded,
  onToggle
}: ProspectsSidebarProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredBookings = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return bookings.filter(booking => 
      booking.services.some(service => service.type.toLowerCase().includes(query)) ||
      booking.location.toLowerCase().includes(query) ||
      booking.address.toLowerCase().includes(query) ||
      booking.phone.includes(query)
    );
  }, [bookings, searchQuery]);

  return (
    <>
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-40 bg-white border-l border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out w-[90%] md:w-96 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="sticky top-0 z-20 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-gray-900">Prospects</h2>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredBookings.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No prospects found
                </p>
              ) : (
                filteredBookings.map((booking) => (
                  <div key={booking.id} onClick={() => setSelectedBooking(booking)}>
                    <BookingPreview
                      booking={booking}
                      onClick={() => setSelectedBooking(booking)}
                      view="agenda"
                      draggable={false}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={onUpdateBooking}
          onDelete={onDeleteBooking}
        />
      )}
    </>
  );
} 