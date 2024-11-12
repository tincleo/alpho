import React from 'react';
import { X, Bell, Flag, Check } from 'lucide-react';
import { Prospect } from '../../types/calendar';
import { format, startOfDay, differenceInDays } from 'date-fns';

interface RemindersPaneProps {
  isOpen: boolean;
  onClose: () => void;
  prospects: Prospect[];
  onProspectClick: (prospect: Prospect) => void;
  onUpdateReminder: (prospectId: string, reminderId: string, completed: boolean) => void;
}

const SERVICE_TYPES: Record<string, string> = {
  'couch': 'Couch Cleaning',
  'carpet': 'Carpet Cleaning',
  'auto-detailing': 'Auto Detailing',
  'mattress': 'Mattress Cleaning'
};

const priorityColors = {
  low: 'bg-gray-50 text-gray-800',
  medium: 'bg-blue-50 text-blue-800',
  high: 'bg-red-50 text-red-800'
};

type ReminderWithProspect = {
  id: string;
  datetime: string;
  completed?: boolean;
  prospect: Prospect;
};

export function RemindersPane({ isOpen, onClose, prospects, onProspectClick, onUpdateReminder }: RemindersPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'open' | 'completed'>('open');

  // Reset to 'open' tab whenever the pane is opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab('open');
    }
  }, [isOpen]);

  // Get all reminders from all prospects and sort them
  const allReminders = React.useMemo(() => {
    const reminders = prospects.flatMap(prospect => 
      (prospect.reminders || []).map(reminder => ({
        ...reminder,
        prospect
      }))
    );

    return reminders.sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  }, [prospects]);

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

  const handleReminderComplete = async (reminder: ReminderWithProspect) => {
    try {
      await onUpdateReminder(reminder.prospect.id, reminder.id, !reminder.completed);
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
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
            className={`flex-1 px-4 py-2.5 text-sm font-medium ${
              activeTab === 'open' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Open ({openReminders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium ${
              activeTab === 'completed' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed ({completedRemindersList.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayReminders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {displayReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  onClick={() => onProspectClick(reminder.prospect)}
                  className="w-full text-left group cursor-pointer hover:bg-gray-50"
                >
                  <div className="px-4 py-2.5 relative">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {formatReminderDate(new Date(reminder.datetime))}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="font-medium">
                        {reminder.prospect.services.map(s => SERVICE_TYPES[s.type]).join(', ')}
                      </span>
                      <span>•</span>
                      <span>{reminder.prospect.location}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                        priorityColors[reminder.prospect.priority]
                      }`}>
                        <Flag className="w-2.5 h-2.5" />
                        {reminder.prospect.priority.charAt(0).toUpperCase() + reminder.prospect.priority.slice(1)}
                      </span>
                    </div>

                    {reminder.note && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {reminder.note}
                      </div>
                    )}

                    {activeTab === 'open' && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReminderComplete(reminder);
                          }}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-green-600 opacity-0 group-hover:opacity-100"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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