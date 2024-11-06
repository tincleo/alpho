import React from 'react';
import { X, Bell, Flag, Check } from 'lucide-react';
import { Booking } from '../../types/calendar';
import { format, startOfDay, differenceInDays } from 'date-fns';

interface RemindersPaneProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  onUpdateReminder: (bookingId: string, reminderId: string, completed: boolean) => void;
}

const SERVICE_TYPES: Record<string, string> = {
  'couch': 'Couch Cleaning',
  'carpet': 'Carpet Cleaning',
  'car-seats': 'Car Seats Cleaning',
  'mattress': 'Mattress Cleaning'
};

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

type ReminderWithBooking = {
  id: string;
  datetime: string;
  completed?: boolean;
  booking: Booking;
};

export function RemindersPane({ isOpen, onClose, bookings, onBookingClick, onUpdateReminder }: RemindersPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'open' | 'completed'>('open');

  // Reset to 'open' tab whenever the pane is opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('open');
    }
  }, [isOpen]);

  // Get all reminders from all bookings and sort them
  const allReminders = React.useMemo(() => {
    const reminders = bookings.flatMap(booking => 
      (booking.reminders || []).map(reminder => ({
        ...reminder,
        booking
      }))
    );

    return reminders.sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  }, [bookings]);

  const openReminders = allReminders.filter(r => !r.completed);
  const completedRemindersList = allReminders.filter(r => r.completed);

  const formatReminderDate = (date: Date) => {
    const days = differenceInDays(date, startOfDay(new Date()));
    let daysText = '';
    
    if (days === 0) {
      daysText = 'today';
    } else if (days === 1) {
      daysText = 'tomorrow';
    } else {
      daysText = `in ${days} days`;
    }
    
    return `${format(date, "EEEE, dd MMMM")} (${daysText})`;
  };

  const handleCompleteReminder = (reminder: ReminderWithBooking, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateReminder(reminder.booking.id, reminder.id, true);
  };

  const displayReminders = activeTab === 'open' ? openReminders : completedRemindersList;

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'open' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Open ({openReminders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'completed' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({completedRemindersList.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {displayReminders.length > 0 ? (
            <div className="space-y-3">
              {displayReminders.map((reminder) => (
                <button
                  key={reminder.id}
                  onClick={() => onBookingClick(reminder.booking)}
                  className="w-full text-left group"
                >
                  <div className="bg-white border rounded-lg p-3 hover:border-blue-500 transition-colors">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {formatReminderDate(new Date(reminder.datetime))}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {reminder.booking.services.map(s => SERVICE_TYPES[s.type]).join(', ')}
                        </span>
                        •
                        <span>{reminder.booking.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          statusColors[reminder.booking.status]
                        }`}>
                          {reminder.booking.status.charAt(0).toUpperCase() + reminder.booking.status.slice(1)}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                          priorityColors[reminder.booking.priority]
                        }`}>
                          <Flag className="w-3 h-3" />
                          {reminder.booking.priority.charAt(0).toUpperCase() + reminder.booking.priority.slice(1)}
                        </span>

                        {activeTab === 'open' && (
                          <button
                            onClick={(e) => handleCompleteReminder(reminder, e)}
                            className="ml-auto p-1 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              {activeTab === 'open' ? 'No open reminders' : 'No completed reminders'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 