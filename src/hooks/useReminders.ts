import React, { useState, useEffect } from 'react';
import { Reminder } from '../types/calendar';

interface UseRemindersProps {
  bookingId: string;
  initialReminders: Reminder[];
  onComplete: (reminderId: string, completed: boolean) => Promise<void>;
}

export function useReminders({ 
  bookingId, 
  initialReminders, 
  onComplete 
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

      // Call the parent's complete handler
      await onComplete(reminderId, completed);
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
  useEffect(() => {
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