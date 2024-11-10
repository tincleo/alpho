import { supabase } from './supabase';
import type { Booking } from '../types/calendar';
import type { Database } from './database.types';

type ProspectRow = Database['public']['Tables']['prospects']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];
type ReminderRow = Database['public']['Tables']['reminders']['Row'];

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Convert database row to Booking type
const rowToBooking = async (
  prospect: ProspectRow,
  services: ServiceRow[],
  reminders: ReminderRow[]
): Promise<Booking> => {
  return {
    id: prospect.id,
    name: prospect.name ?? '',
    phone: prospect.phone,
    location: prospect.location ?? 'Bastos',
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

// Create a new booking with services
export async function createBooking(booking: Omit<Booking, 'id'>) {
  try {
    // Create prospect first
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

    // Create services with proper prospect_id
    if (booking.services.length > 0) {
      const servicesData = booking.services.map(service => ({
        id: generateUUID(),
        prospect_id: prospect.id,
        type: service.type,
        details: service.details[service.type]
      }));

      const { error: servicesError } = await supabase
        .from('services')
        .insert(servicesData);

      if (servicesError) {
        // Rollback prospect creation if services fail
        await supabase
          .from('prospects')
          .delete()
          .eq('id', prospect.id);
        throw servicesError;
      }
    }

    // Create reminders if any
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
        // Rollback prospect and services if reminders fail
        await supabase
          .from('prospects')
          .delete()
          .eq('id', prospect.id);
        throw remindersError;
      }
    }

    return fetchBookings();
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Update an existing booking and its services
export async function updateBooking(booking: Booking) {
  try {
    // Update prospect
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

    // Get existing services
    const { data: existingServices, error: getServicesError } = await supabase
      .from('services')
      .select('*')
      .eq('prospect_id', booking.id);

    if (getServicesError) throw getServicesError;

    // Delete all existing services
    if (existingServices?.length > 0) {
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('prospect_id', booking.id);

      if (deleteError) throw deleteError;
    }

    // Insert all services as new entries
    if (booking.services.length > 0) {
      const servicesData = booking.services.map(service => ({
        id: generateUUID(), // Always generate new UUID for services
        prospect_id: booking.id,
        type: service.type,
        details: service.details[service.type]
      }));

      // Insert services one by one to avoid potential conflicts
      for (const serviceData of servicesData) {
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData);

        if (insertError) {
          console.error('Error inserting service:', insertError);
          throw insertError;
        }
      }
    }

    // Handle reminders update
    await handleRemindersUpdate(booking);

    return fetchBookings();
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

// Helper function to handle reminders update
async function handleRemindersUpdate(booking: Booking) {
  // Get existing reminders
  const { data: existingReminders, error: remindersError } = await supabase
    .from('reminders')
    .select('*')
    .eq('prospect_id', booking.id);

  if (remindersError) throw remindersError;

  // Delete removed reminders
  const reminderIdsToKeep = booking.reminders
    .filter(r => !r.id.includes('temp_'))
    .map(r => r.id);

  if (existingReminders?.length) {
    const { error: deleteError } = await supabase
      .from('reminders')
      .delete()
      .eq('prospect_id', booking.id)
      .not('id', 'in', reminderIdsToKeep);

    if (deleteError) throw deleteError;
  }

  // Update existing and create new reminders
  const reminderPromises = booking.reminders.map(reminder => {
    const reminderData = {
      prospect_id: booking.id,
      datetime: reminder.datetime,
      note: reminder.note || '',
      completed: reminder.completed
    };

    if (reminder.id.includes('temp_')) {
      return supabase
        .from('reminders')
        .insert({
          ...reminderData,
          id: generateUUID()
        });
    } else {
      return supabase
        .from('reminders')
        .update(reminderData)
        .eq('id', reminder.id);
    }
  });

  const reminderResults = await Promise.all(reminderPromises);
  
  for (const result of reminderResults) {
    if (result.error) throw result.error;
  }
}

// Delete a booking and its related services
export async function deleteBooking(bookingId: string) {
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', bookingId);

  if (error) throw error;

  return fetchBookings();
}

// Update a reminder's completed status
export async function updateReminder(prospectId: string, reminderId: string, completed: boolean) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed })
    .eq('id', reminderId)
    .eq('prospect_id', prospectId);

  if (error) throw error;

  return fetchBookings();
}