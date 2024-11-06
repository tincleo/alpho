import React from 'react';
import { ChevronDown, ChevronUp, Plus, X, Bell } from 'lucide-react';
import { Reminder } from '../../types/calendar';
import { format, startOfDay, isBefore, isSameDay, addDays } from 'date-fns';

interface RemindersAccordionProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
}

export function RemindersAccordion({ reminders, onChange }: RemindersAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  // Check and remove outdated reminders
  React.useEffect(() => {
    const today = startOfDay(new Date());
    const hasOutdatedReminders = reminders.some(reminder => 
      isBefore(new Date(reminder.datetime), today)
    );

    if (hasOutdatedReminders) {
      // Remove outdated reminders
      const updatedReminders = reminders.filter(reminder => 
        !isBefore(new Date(reminder.datetime), today)
      );
      onChange(updatedReminders);
    }
  }, [reminders, onChange]);

  const addReminder = () => {
    // Find the next available date starting from today
    let nextDate = startOfDay(new Date());
    
    // Keep incrementing the date until we find a day without a reminder
    while (reminders.some(reminder => isSameDay(new Date(reminder.datetime), nextDate))) {
      nextDate = addDays(nextDate, 1);
    }
    
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      datetime: nextDate.toISOString(),
    };
    
    // Add new reminder and sort
    const updatedReminders = [...reminders, newReminder].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    
    onChange(updatedReminders);
    
    // After adding the reminder, focus and open the date picker
    setTimeout(() => {
      const lastDateInput = document.querySelector<HTMLInputElement>('.reminder-date-input:last-of-type');
      if (lastDateInput) {
        lastDateInput.focus();
        lastDateInput.showPicker();
      }
    }, 0);
  };

  const deleteReminder = (id: string) => {
    onChange(reminders.filter(reminder => reminder.id !== id));
  };

  const updateReminderDateTime = (id: string, dateStr: string) => {
    // Prevent selecting dates before today
    const selectedDate = startOfDay(new Date(dateStr));
    const today = startOfDay(new Date());

    if (isBefore(selectedDate, today)) {
      return; // Don't update if selected date is before today
    }

    // Check if another reminder already exists for this date
    const hasExistingReminder = reminders.some(reminder => 
      reminder.id !== id && // Exclude current reminder from check
      isSameDay(new Date(reminder.datetime), selectedDate)
    );

    if (hasExistingReminder) {
      alert('A reminder already exists for this date. Please choose a different date.');
      return;
    }
    
    // Update reminder and sort the array
    const updatedReminders = reminders.map(reminder => 
      reminder.id === id ? { 
        ...reminder, 
        datetime: selectedDate.toISOString(),
      } : reminder
    ).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    onChange(updatedReminders);
  };

  const today = startOfDay(new Date());

  // Sort reminders by date
  const sortedReminders = [...reminders].sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">Reminders</span>
          {reminders.length > 0 && (
            <span className="text-sm text-gray-500">({reminders.length})</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 bg-white">
          <div className="rounded-lg overflow-hidden">
            {sortedReminders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sortedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 px-3 py-2 relative hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="date"
                      value={format(new Date(reminder.datetime), "yyyy-MM-dd")}
                      onChange={(e) => updateReminderDateTime(reminder.id, e.target.value)}
                      min={format(today, "yyyy-MM-dd")}
                      className="reminder-date-input absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <span className="flex-1 text-sm text-gray-900">
                      {format(new Date(reminder.datetime), "EEEE, dd MMMM, yyyy")}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReminder(reminder.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors relative z-10"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                No upcoming reminders
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={addReminder}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add reminder
          </button>
        </div>
      )}
    </div>
  );
}