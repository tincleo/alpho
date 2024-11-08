import React from 'react';
import { ChevronDown, ChevronUp, Plus, X, Bell, Check } from 'lucide-react';
import { Reminder } from '../../types/calendar';
import { format, startOfDay, isBefore, isSameDay, differenceInDays } from 'date-fns';
import { useReminders } from '../../hooks/useReminders';

interface RemindersAccordionProps {
  bookingId: string;
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
  onComplete: (reminderId: string, completed: boolean) => Promise<void>;
}

const MAX_REMINDERS = 5;

export function RemindersAccordion({ 
  bookingId,
  reminders: initialReminders, 
  onChange, 
  onComplete 
}: RemindersAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = React.useState('');
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const {
    reminders: localReminders,
    setReminders: setLocalReminders,
    handleComplete
  } = useReminders({
    bookingId,
    initialReminders,
    onBookingsChange: async (reminderId: string, completed: boolean) => {
      if (onComplete) {
        await onComplete(reminderId, completed);
      }
    }
  });

  const hasReachedLimit = localReminders.length >= MAX_REMINDERS;

  // Check and remove outdated reminders
  React.useEffect(() => {
    const today = startOfDay(new Date());
    const hasOutdatedReminders = localReminders.some(reminder => 
      isBefore(new Date(reminder.datetime), today)
    );

    if (hasOutdatedReminders) {
      const updatedReminders = localReminders.filter(reminder => 
        !isBefore(new Date(reminder.datetime), today)
      );
      // Only call onChange if reminders actually changed
      if (JSON.stringify(updatedReminders) !== JSON.stringify(localReminders)) {
        onChange(updatedReminders);
      }
    }
  }, [localReminders, onChange]);

  // Close popover on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const addReminder = () => {
    const selectedDateTime = startOfDay(new Date(selectedDate));
    
    // Check if a reminder already exists for this date
    const hasExistingReminder = localReminders.some(reminder => 
      isSameDay(new Date(reminder.datetime), selectedDateTime)
    );

    if (hasExistingReminder) {
      alert('A reminder already exists for this date. Please choose a different date.');
      return;
    }
    
    const newReminder: Reminder = {
      id: `temp_${Math.random().toString(36).substr(2, 9)}`,
      datetime: selectedDateTime.toISOString(),
      note: note.trim(),
      completed: false
    };
    
    // Add new reminder and sort
    const updatedReminders = [...localReminders, newReminder].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
    
    // Update local state immediately
    setLocalReminders(updatedReminders);
    
    // Trigger the change
    onChange(updatedReminders);
    
    // Reset UI state
    setShowDatePicker(false);
    setNote('');
  };

  const deleteReminder = (id: string) => {
    // Update local state immediately
    const updatedReminders = localReminders.filter(reminder => reminder.id !== id);
    setLocalReminders(updatedReminders);
    
    // Trigger the change
    onChange(updatedReminders);
  };

  const updateReminderDateTime = (id: string, dateStr: string) => {
    // Prevent selecting dates before today
    const selectedDate = startOfDay(new Date(dateStr));
    const today = startOfDay(new Date());

    if (isBefore(selectedDate, today)) {
      return;
    }

    // Check if another reminder already exists for this date
    const hasExistingReminder = localReminders.some(reminder => 
      reminder.id !== id && 
      isSameDay(new Date(reminder.datetime), selectedDate)
    );

    if (hasExistingReminder) {
      alert('A reminder already exists for this date. Please choose a different date.');
      return;
    }
    
    // Update reminder and sort the array
    const updatedReminders = localReminders.map(reminder => 
      reminder.id === id ? { 
        ...reminder, 
        datetime: selectedDate.toISOString(),
      } : reminder
    ).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    // Update local state immediately
    setLocalReminders(updatedReminders);
    
    // Trigger the change
    onChange(updatedReminders);
  };

  const today = startOfDay(new Date());

  // Sort reminders by date
  const sortedReminders = React.useMemo(() => 
    [...localReminders].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    ), 
    [localReminders]
  );

  const getReminderMessage = (date: string) => {
    const days = differenceInDays(new Date(date), startOfDay(new Date()));
    if (days === 0) return "You'll get a reminder today";
    if (days === 1) return "You'll get a reminder tomorrow";
    return `You'll get a reminder in ${days} days`;
  };

  // Reset selected date to today whenever the popover opens
  const openDatePicker = () => {
    if (hasReachedLimit) return;
    
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setShowDatePicker(true);
    // Focus and open the date picker after a short delay to ensure the input is rendered
    setTimeout(() => {
      if (dateInputRef.current) {
        dateInputRef.current.focus();
        dateInputRef.current.showPicker();
      }
    }, 100);
  };

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

  // Add effect to log reminders changes
  React.useEffect(() => {
    console.log('RemindersAccordion received reminders:', localReminders);
  }, [localReminders]);

  return (
    <div className="border rounded-lg overflow-hidden relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">Reminders</span>
          {localReminders.length > 0 && (
            <span className="text-sm text-gray-500">({localReminders.length})</span>
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
          {sortedReminders.length > 0 && (
            <div className="rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-100">
                {sortedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-3 px-3 py-2 relative hover:bg-gray-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(reminder.id, !reminder.completed);
                      }}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        reminder.completed 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {reminder.completed && <Check className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <input
                          type="date"
                          value={format(new Date(reminder.datetime), "yyyy-MM-dd")}
                          onChange={(e) => updateReminderDateTime(reminder.id, e.target.value)}
                          min={format(today, "yyyy-MM-dd")}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        />
                        <span className={`block text-sm ${
                          reminder.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}>
                          {formatReminderDate(new Date(reminder.datetime))}
                        </span>
                      </div>
                      {reminder.note && (
                        <span className="block text-xs text-gray-500 mt-0.5 truncate">
                          {reminder.note}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReminder(reminder.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            type="button"
            onClick={openDatePicker}
            disabled={hasReachedLimit}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              hasReachedLimit 
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            title={hasReachedLimit ? `Maximum ${MAX_REMINDERS} reminders allowed` : undefined}
          >
            <Plus className="w-4 h-4" />
            {hasReachedLimit ? `Maximum ${MAX_REMINDERS} reminders reached` : 'Add reminder'}
          </button>
        </div>
      )}

      {showDatePicker && !hasReachedLimit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowDatePicker(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm">
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select date
                    </label>
                    <div 
                      className="relative"
                      onClick={() => dateInputRef.current?.showPicker()}
                    >
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate}
                        min={format(today, "yyyy-MM-dd")}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      />
                      <div className="absolute inset-0" />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {getReminderMessage(selectedDate)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note for this reminder..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDatePicker(false);
                      setNote('');
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addReminder}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}