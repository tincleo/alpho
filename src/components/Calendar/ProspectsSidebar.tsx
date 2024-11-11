import React from 'react';
import { X, Search, Check } from 'lucide-react';
import { Booking, Priority } from '../../types/calendar';
import { BookingPreview } from './ProspectPreview';
import { BookingModal } from './ProspectModal';

interface ProspectsSidebarProps {
  bookings: Booking[];
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];

export function ProspectsSidebar({ 
  bookings, 
  onUpdateBooking, 
  onDeleteBooking,
  isExpanded,
  onToggle
}: ProspectsSidebarProps) {
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatuses, setSelectedStatuses] = React.useState<typeof STATUS_OPTIONS[number][]>([...STATUS_OPTIONS]);
  const [selectedPriorities, setSelectedPriorities] = React.useState<Priority[]>([...PRIORITY_OPTIONS]);
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = React.useState(false);

  const filteredBookings = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.services.some(service => service.type.toLowerCase().includes(query)) ||
        booking.location.toLowerCase().includes(query) ||
        (booking.address?.toLowerCase().includes(query) || false) ||
        booking.phone.includes(query) ||
        (booking.name?.toLowerCase().includes(query) || false);

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(booking.status);
      const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(booking.priority);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [bookings, searchQuery, selectedStatuses, selectedPriorities]);

  const handleClickOutside = React.useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-dropdown') && !target.closest('.priority-dropdown')) {
      setShowStatusDropdown(false);
      setShowPriorityDropdown(false);
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

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
            <h2 className="text-lg font-semibold text-gray-900">
              Prospects <span className="text-sm text-gray-500">({bookings.length})</span>
            </h2>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200 space-y-4">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="relative status-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowPriorityDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {selectedStatuses.length === 0 
                      ? 'Status' 
                      : `${selectedStatuses.length} selected`}
                  </span>
                  <span className="text-xs text-gray-500">▼</span>
                </button>
                {showStatusDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={(e) => {
                            setSelectedStatuses(prev => 
                              e.target.checked
                                ? [...prev, status]
                                : prev.filter(s => s !== status)
                            );
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative priority-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityDropdown(!showPriorityDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {selectedPriorities.length === 0 
                      ? 'Priority' 
                      : `${selectedPriorities.length} selected`}
                  </span>
                  <span className="text-xs text-gray-500">▼</span>
                </button>
                {showPriorityDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {PRIORITY_OPTIONS.map((priority) => (
                      <label
                        key={priority}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPriorities.includes(priority)}
                          onChange={(e) => {
                            setSelectedPriorities(prev => 
                              e.target.checked
                                ? [...prev, priority]
                                : prev.filter(p => p !== priority)
                            );
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
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
                  <div 
                    key={booking.id} 
                    onClick={() => setSelectedBooking(booking)}
                    className="transition-all duration-200 hover:bg-gray-50 hover:border-blue-200 rounded-lg cursor-pointer border border-transparent"
                  >
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