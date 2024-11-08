import { useState } from 'react';
import { Reminder } from '../types/calendar';
import { updateReminder } from '../lib/api';

interface UseRemindersProps {
  bookingId: string;
  initialReminders: Reminder[];
  onBookingsChange?: (reminderId: string, completed: boolean) => Promise<void>;
}

export function useReminders({ 
  bookingId, 
  initialReminders, 
  onBookingsChange 
}: UseRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (reminderId: string, completed: boolean) => {
    try {
      setIsLoading(true);
      
      // Optimistically update UI
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? { ...reminder, completed } : reminder
      ));

      // Call the callback with the updated status
      if (onBookingsChange) {
        await onBookingsChange(reminderId, completed);
      }
    } catch (error) {
      // Revert on error
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId ? { ...reminder, completed: !completed } : reminder
      ));
      console.error('Failed to update reminder:', error);
      setError('Failed to update reminder status');
    } finally {
      setIsLoading(false);
    }
  };

  // Update local reminders when initialReminders changes
  useState(() => {
    setReminders(initialReminders);
  }, [initialReminders]);

  return {
    reminders,
    setReminders,
    handleComplete,
    error,
    setError,
    isLoading
  };
} 