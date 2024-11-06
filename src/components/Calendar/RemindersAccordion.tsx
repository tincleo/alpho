import React from 'react';
import { ChevronDown, ChevronUp, Plus, X, Bell } from 'lucide-react';
import { Reminder } from '../../types/calendar';
import { format } from 'date-fns';

interface RemindersAccordionProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
}

export function RemindersAccordion({ reminders, onChange }: RemindersAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  const addReminder = () => {
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      datetime: new Date().toISOString(),
      completed: false
    };
    onChange([...reminders, newReminder]);
  };

  const deleteReminder = (id: string) => {
    onChange(reminders.filter(reminder => reminder.id !== id));
  };

  const updateReminderDateTime = (id: string, datetime: string) => {
    onChange(reminders.map(reminder => 
      reminder.id === id ? { ...reminder, datetime } : reminder
    ));
  };

  const toggleReminderComplete = (id: string) => {
    onChange(reminders.map(reminder => 
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    ));
  };

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
        <div className="p-4 space-y-3 bg-white">
          {reminders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              No reminders set
            </p>
          ) : (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-2"
                >
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => toggleReminderComplete(reminder.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    type="datetime-local"
                    value={format(new Date(reminder.datetime), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => updateReminderDateTime(reminder.id, new Date(e.target.value).toISOString())}
                    className={`flex-1 text-sm border-0 bg-transparent focus:ring-0 ${
                      reminder.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
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