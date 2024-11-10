import { supabase } from './supabase';
import type { Booking, Service } from '../types/calendar';
import type { Database } from './database.types';

type ProspectRow = Database['public']['Tables']['prospects']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];
type ReminderRow = Database['public']['Tables']['reminders']['Row'];

// Valid locations
const VALID_LOCATIONS = [
  'Bastos', 'Mvan', 'Nsam', 'Mvog-Mbi', 'Essos', 
  'Mimboman', 'Nkoldongo', 'Ekounou', 'Emana', 
  'Nkolbisson', 'Olembe', 'Ngousso', 'Messa', 
  'Omnisport', 'Tsinga', 'Etoa-Meki', 'Nlongkak'
] as const;

type Location = typeof VALID_LOCATIONS[number];

// Helper function to validate location
function isValidLocation(location: string): location is Location {
  return VALID_LOCATIONS.includes(location as Location);
}

// Convert database row to Booking type
const rowToBooking = async (
  prospect: ProspectRow,
  services: ServiceRow[],
  reminders: ReminderRow[]
): Promise<Booking> => {
  if (!prospect.location || !isValidLocation(prospect.location)) {
    throw new Error(`Invalid location: ${prospect.location}`);
  }

  return {
    id: prospect.id,
    name: prospect.name ?? '',
    phone: prospect.phone,
    location: prospect.location,
    address: prospect.address ?? '',
    datetime: prospect.datetime,
    status: prospect.status,
    priority: prospect.priority,
    isAllDay: prospect.is_all_day,
    notes: prospect.notes ?? '',
    services: services.map(s => ({
      id: s.id,
      type: s.type,
      details: { [s.type]: s.details }
    })),
    reminders: reminders.map(r => ({
      id: r.id,
      datetime: r.datetime,
      note: r.note ?? undefined,
      completed: r.completed
    }))
  };
};

// Fetch all bookings
export async function fetchBookings() {
  const { data: prospects, error: prospectsError } = await supabase
    .from('prospects')
    .select('*')
    .order('datetime', { ascending: true });

  if (prospectsError) throw prospectsError;

  const bookings: Booking[] = [];

  for (const prospect of prospects) {
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('prospect_id', prospect.id);

    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('prospect_id', prospect.id)
      .order('datetime', { ascending: true });

    bookings.push(await rowToBooking(prospect, services || [], reminders || []));
  }

  return bookings;
}

// Create a new booking
export async function createBooking(booking: Omit<Booking, 'id'>) {
  try {
    // First create the prospect
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .insert({
        name: booking.name,
        phone: booking.phone,
        location: booking.location ?? 'Bastos',
        address: booking.address,
        datetime: booking.datetime,
        status: booking.status,
        priority: booking.priority,
        is_all_day: booking.isAllDay,
        notes: booking.notes
      })
      .select()
      .single();

    if (prospectError) throw prospectError;

    // Insert services if any
    if (booking.services.length > 0) {
      // Prepare services data with proper structure
      const servicesData = booking.services.map(service => ({
        id: generateUUID(),
        prospect_id: prospect.id,
        type: service.type,
        details: service.details[service.type] // Get the actual details object
      }));

      // Insert all services in a single operation
      const { error: servicesError } = await supabase
        .from('services')
        .insert(servicesData);

      if (servicesError) {
        console.error('Error inserting services:', servicesError);
        // If services insertion fails, delete the prospect to maintain consistency
        await supabase
          .from('prospects')
          .delete()
          .eq('id', prospect.id);
        throw servicesError;
      }
    }

    // Insert reminders if any
    if (booking.reminders?.length) {
      const remindersData = booking.reminders.map(reminder => ({
        id: generateUUID(),
        prospect_id: prospect.id,
        datetime: reminder.datetime,
        note: reminder.note || '',
        completed: reminder.completed || false
      }));

      const { error: remindersError } = await supabase
        .from('reminders')
        .insert(remindersData);

      if (remindersError) {
        console.error('Error inserting reminders:', remindersError);
        // If reminders insertion fails, delete the prospect and services
        await supabase
          .from('prospects')
          .delete()
          .eq('id', prospect.id);
        throw remindersError;
      }
    }

    // Return updated bookings
    return fetchBookings();
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Keep only this simple function for reminder completion
export async function toggleReminderComplete(reminderId: string, completed: boolean) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed })
    .eq('id', reminderId);

  if (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }

  return fetchBookings();
}

// Delete a booking
export async function deleteBooking(bookingId: string) {
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', bookingId);

  if (error) throw error;

  return fetchBookings();
}

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Update a booking
export async function updateBooking(booking: Booking) {
  try {
    // Update prospect first
    const { error: prospectError } = await supabase
      .from('prospects')
      .update({
        name: booking.name,
        phone: booking.phone,
        location: booking.location ?? 'Bastos',
        address: booking.address,
        datetime: booking.datetime,
        status: booking.status,
        priority: booking.priority,
        is_all_day: booking.isAllDay,
        notes: booking.notes
      })
      .eq('id', booking.id);

    if (prospectError) throw prospectError;

    // Delete all existing services for this prospect
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('prospect_id', booking.id);

    if (deleteError) throw deleteError;

    // Insert all services with properly structured data
    if (booking.services.length > 0) {
      const servicesData = booking.services.map(service => ({
        id: service.id.includes('temp_') || service.id.includes('_') 
          ? generateUUID() 
          : service.id,
        prospect_id: booking.id,
        type: service.type,
        details: service.details[service.type] || {}  // Get the actual details object
      }));

      const { error: insertError } = await supabase
        .from('services')
        .insert(servicesData);

      if (insertError) {
        console.error('Error inserting services:', insertError);
        throw insertError;
      }
    }

    // Handle reminders
    // First, get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .eq('prospect_id', booking.id);

    if (remindersError) throw remindersError;

    // Delete reminders that are no longer present
    const reminderIdsToKeep = booking.reminders
      .filter(r => !r.id.includes('temp_'))
      .map(r => r.id);
    const remindersToDelete = (existingReminders || [])
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
    const reminderPromises = booking.reminders.map(reminder => {
      if (reminder.id.includes('temp_')) {
        // This is a new reminder, insert it with a proper UUID
        return supabase
          .from('reminders')
          .insert({
            id: generateUUID(),
            prospect_id: booking.id,
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

    return fetchBookings();
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

// Update a reminder's completed status
export async function updateReminder(prospectId: string, reminderId: string, completed: boolean) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed })
    .eq('id', reminderId)
    .eq('prospect_id', prospectId);

  if (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }

  // Return updated bookings
  return fetchBookings();
} 