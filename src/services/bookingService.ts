import { Prospect } from '../types/calendar';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you should have these values in your env)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Helper function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function updateProspect(prospect: Prospect): Promise<Prospect[]> {
  try {
    // First update the prospect
    const { error: prospectError } = await supabase
      .from('prospects')
      .update({
        name: prospect.name,
        phone: prospect.phone,
        datetime: prospect.datetime,
        location: prospect.location,
        address: prospect.address,
        notes: prospect.notes,
        status: prospect.status,
        priority: prospect.priority,
        is_all_day: prospect.isAllDay,
      })
      .eq('id', prospect.id);

    if (prospectError) throw prospectError;

    // Handle reminders
    // First, get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .eq('prospect_id', prospect.id);

    if (remindersError) throw remindersError;

    // Delete reminders that are no longer present
    const reminderIdsToKeep = prospect.reminders
      .filter(r => !r.id.includes('temp_'))
      .map(r => r.id);
    const remindersToDelete = existingReminders
      .filter(r => !reminderIdsToKeep.includes(r.id))
      .map(r => r.id);

    if (remindersToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('reminders')
        .delete()
        .in('id', remindersToDelete);

      if (deleteError) throw deleteError;
    }

    // Handle new and existing reminders
    const reminderPromises = prospect.reminders.map(reminder => {
      if (reminder.id.includes('temp_')) {
        // This is a new reminder, insert it with a proper UUID
        return supabase
          .from('reminders')
          .insert({
            id: generateUUID(), // Generate a proper UUID
            prospect_id: prospect.id,
            datetime: reminder.datetime,
            note: reminder.note || '',
            completed: reminder.completed
          });
      } else {
        // This is an existing reminder, update it
        return supabase
          .from('reminders')
          .update({
            datetime: reminder.datetime,
            note: reminder.note || '',
            completed: reminder.completed
          })
          .eq('id', reminder.id);
      }
    });

    // Wait for all reminder operations to complete
    const reminderResults = await Promise.all(reminderPromises);
    
    // Check for any errors in the reminder operations
    for (const result of reminderResults) {
      if (result.error) throw result.error;
    }

    // Fetch the updated prospect with all related data
    const { data: finalProspect, error: finalError } = await supabase
      .from('prospects')
      .select(`
        *,
        reminders (*),
        services (*)
      `)
      .eq('id', prospect.id)
      .single();

    if (finalError) throw finalError;

    return [finalProspect];
  } catch (error: unknown) {
    console.error('Error in updateProspect:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update prospect');
  }
} 