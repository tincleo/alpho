import { supabase } from './supabase';
import type { Booking, ServiceType, ServiceDetails, Location } from '../types/calendar';
import type { Database } from './database.types';

type ProspectRow = Database['public']['Tables']['prospects']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];
type ReminderRow = Database['public']['Tables']['reminders']['Row'];

// Helper function to validate location
function isValidLocation(location: string): location is Location {
  return ['Bastos', 'Mvan', 'Nsam', 'Mvog-Mbi', 'Essos', 
          'Mimboman', 'Nkoldongo', 'Ekounou', 'Emana', 
          'Nkolbisson', 'Olembe', 'Ngousso', 'Messa', 
          'Omnisport', 'Tsinga', 'Etoa-Meki', 'Nlongkak'].includes(location);
}

// Convert database row to Booking type
const rowToBooking = async (
  prospect: ProspectRow,
  services: ServiceRow[],
  reminders: ReminderRow[]
): Promise<Booking> => {
  if (!isValidLocation(prospect.location)) {
    throw new Error(`Invalid location: ${prospect.location}`);
  }

  return {
    id: prospect.id,
    name: prospect.name || undefined,
    phone: prospect.phone,
    location: prospect.location, // TypeScript now knows this is a valid Location
    address: prospect.address || '',
    datetime: prospect.datetime,
    endTime: prospect.end_time || undefined,
    status: prospect.status,
    priority: prospect.priority,
    isAllDay: prospect.is_all_day,
    notes: prospect.notes || undefined,
    services: services.map(s => ({
      type: s.type as ServiceType,
      details: s.details as ServiceDetails
    })),
    reminders: reminders.map(r => ({
      id: r.id,
      datetime: r.datetime,
      note: r.note || undefined,
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
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .insert({
      name: booking.name,
      phone: booking.phone,
      location: booking.location.toString(),
      address: booking.address,
      datetime: booking.datetime,
      end_time: booking.endTime,
      status: booking.status,
      priority: booking.priority,
      is_all_day: booking.isAllDay,
      notes: booking.notes
    })
    .select()
    .single();

  if (prospectError) throw prospectError;

  // Insert services
  const servicesPromise = supabase
    .from('services')
    .insert(
      booking.services.map(service => ({
        prospect_id: prospect.id,
        type: service.type.toString(),
        details: service.details
      }))
    );

  // Insert reminders if any
  const remindersPromise = booking.reminders?.length
    ? supabase
        .from('reminders')
        .insert(
          booking.reminders.map(reminder => ({
            prospect_id: prospect.id,
            datetime: reminder.datetime,
            note: reminder.note,
            completed: reminder.completed || false
          }))
        )
    : Promise.resolve();

  await Promise.all([servicesPromise, remindersPromise]);

  return fetchBookings();
}

// Update a reminder
export async function updateReminder(
  prospectId: string,
  reminderId: string,
  completed: boolean
) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed })
    .eq('id', reminderId)
    .eq('prospect_id', prospectId);

  if (error) throw error;

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

// Update a booking
export async function updateBooking(booking: Booking) {
  try {
    // Update prospect
    const { error: prospectError } = await supabase
      .from('prospects')
      .update({
        name: booking.name,
        phone: booking.phone,
        location: booking.location.toString(),
        address: booking.address,
        datetime: booking.datetime,
        end_time: booking.endTime,
        status: booking.status,
        priority: booking.priority,
        is_all_day: booking.isAllDay,
        notes: booking.notes
      })
      .eq('id', booking.id);

    if (prospectError) throw prospectError;

    // Update services using upsert
    const { error: servicesError } = await supabase
      .from('services')
      .upsert(
        booking.services.map(service => ({
          prospect_id: booking.id,
          type: service.type.toString(),
          details: service.details
        })),
        {
          onConflict: 'prospect_id,type',
          ignoreDuplicates: false
        }
      );

    if (servicesError) throw servicesError;

    // First, delete all existing reminders for this prospect
    const { error: deleteRemindersError } = await supabase
      .from('reminders')
      .delete()
      .eq('prospect_id', booking.id);

    if (deleteRemindersError) throw deleteRemindersError;

    // Then insert new reminders if any exist
    if (booking.reminders && booking.reminders.length > 0) {
      const { error: remindersError } = await supabase
        .from('reminders')
        .insert(
          booking.reminders.map(reminder => ({
            id: reminder.id,
            prospect_id: booking.id,
            datetime: reminder.datetime,
            note: reminder.note,
            completed: reminder.completed || false
          }))
        );

      if (remindersError) throw remindersError;
    }
    
    // Fetch the updated booking with all its relations
    const { data: updatedProspect, error: fetchError } = await supabase
      .from('prospects')
      .select(`
        *,
        services (*),
        reminders (*)
      `)
      .eq('id', booking.id)
      .single();

    if (fetchError) throw fetchError;

    return fetchBookings();
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
} 