import { supabase } from './supabase';
import type { Prospect, ServiceDetails, ServiceType, Service, Reminder } from '../types/calendar';
import type { Database } from './database.types';

type ProspectRow = Database['public']['Tables']['prospects']['Row'];
type ServiceRow = Database['public']['Tables']['services']['Row'];
type ReminderRow = Database["public"]["Tables"]["reminders"]["Row"];
export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fetch location by ID from Supabase
const fetchLocationById = async (
  locationId: string
): Promise<LocationRow | null> => {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", locationId)
    .single();

  if (error) {
    console.error("Error fetching location:", error);
    return null;
  }
  return data as LocationRow;
};

// Fetch location by ID from Supabase
export const fetchLocationIdByName = async (
  name: string
): Promise<LocationRow | null> => {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("name", name)
    .single();

  if (error) {
    console.error("Error fetching location:", error);
    return null;
  }
  return data as LocationRow;
};

export const fetchLocations = async (): Promise<LocationRow[] | null> => {
  const { data, error } = await supabase.from("locations").select("*");

  if (error) {
    console.error("Error fetching location:", error);
    return null;
  }
  return data as LocationRow[];
};

// Convert database row to Prospect type
const rowToProspect = async (
  prospect: ProspectRow,
  services: ServiceRow[],
  reminders: ReminderRow[]
): Promise<Prospect> => {
  const location = await fetchLocationById(prospect.location_id); // Fetch the location details
  return {
    id: prospect.id,
    name: prospect.name ?? "",
    phone: prospect.phone,
    location: location?.name ?? "Bastos",
    location_id: prospect.location_id,
    address: prospect.address ?? "",
    datetime: prospect.datetime,
    status: prospect.status,
    priority: prospect.priority,
    isAllDay: prospect.is_all_day,
    notes: prospect.notes ?? "",
    services: services.map((s) => ({
      id: s.id,
      type: s.type as ServiceType,
      details: { [s.type]: s.details } as ServiceDetails,
    })),
    reminders: reminders.map((r) => ({
      id: r.id,
      prospect_id: r.prospect_id,
      datetime: r.datetime,
      note: r.note ?? undefined,
      completed: r.completed,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
  };
};

// Fetch all prospects
export async function fetchProspects() {
  const { data: prospects, error: prospectsError } = await supabase
    .from('prospects')
    .select('*')
    .order('datetime', { ascending: true });

  if (prospectsError) throw prospectsError;

  const prospectsList: Prospect[] = [];

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

    prospectsList.push(await rowToProspect(prospect, services || [], reminders || []));
  }
// console.log({ prospectsList });

  return prospectsList;
}

// Create a new prospect with services
export async function createProspect(newProspect: Omit<Prospect, 'id'>) {
  try {
    // Create prospect first
    const { data: createdProspect, error: prospectError } = await supabase
      .from('prospects')
      .insert({
        name: newProspect.name,
        phone: newProspect.phone,
        location_id: newProspect.location_id,
        address: newProspect.address,
        datetime: newProspect.datetime,
        status: newProspect.status,
        priority: newProspect.priority,
        is_all_day: newProspect.isAllDay,
        notes: newProspect.notes
      })
      .select()
      .single();

    if (prospectError) throw prospectError;

    // Create services with proper prospect_id
    if (newProspect.services.length > 0) {
      const servicesData = newProspect.services.map((service: Service) => ({
        id: generateUUID(),
        prospect_id: createdProspect.id,
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
          .eq('id', createdProspect.id);
        throw servicesError;
      }
    }

    // Create reminders if any
    if (newProspect.reminders?.length) {
      const remindersData = newProspect.reminders.map((reminder: Reminder) => ({
        id: generateUUID(),
        prospect_id: createdProspect.id,
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
          .eq('id', createdProspect.id);
        throw remindersError;
      }
    }

    return fetchProspects();
  } catch (error) {
    console.error('Error creating prospect:', error);
    throw error;
  }
}

// Update an existing prospect and its services
export async function updateProspect(prospect: Prospect) {
  try {
    // Start a transaction by using multiple operations

    // 1. Update prospect first
    const { error: prospectError } = await supabase
      .from("prospects")
      .update({
        name: prospect.name,
        phone: prospect.phone,
        location_id: prospect?.location_id,
        address: prospect.address,
        datetime: prospect.datetime,
        status: prospect.status,
        priority: prospect.priority,
        is_all_day: prospect.isAllDay,
        notes: prospect.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospect.id);

    if (prospectError) throw prospectError;

    // Get existing services
    const { data: existingServices, error: getServicesError } = await supabase
      .from("services")
      .select("*")
      .eq("prospect_id", prospect.id);
    if (getServicesError) throw getServicesError;
    // Delete all existing services
    if (existingServices?.length > 0) {
      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .eq("prospect_id", prospect.id);
      if (deleteError) throw deleteError;
    }
    // Insert all services as new entries
    if (prospect.services.length > 0) {
      const servicesData = prospect.services.map((service) => {
        // Ensure we have valid details object
        const details = service.details[service.type] || {};

        // Add default values based on service type
        const defaultDetails = {
          couch: { material: "fabric", seats: 7 },
          carpet: { size: "medium", quantity: 1 },
          "auto-detailing": { cleaningMode: "seats-only", seats: 5 },
          mattress: { size: "medium", quantity: 1 },
        };
        // Merge default details with provided details
        const finalDetails = {
          ...defaultDetails[service.type],
          ...details,
        };
        return {
          id: generateUUID(),
          prospect_id: prospect.id,
          type: service.type,
          details: finalDetails, // Use the merged details
        };
      });
      // Insert services one by one to avoid potential conflicts
      for (const serviceData of servicesData) {
        const { error: insertError } = await supabase
          .from("services")
          .insert(serviceData);
        if (insertError) {
          console.error("Error inserting service:", insertError);
          throw insertError;
        }
      }
    }

    // 2. Handle reminders update
    await handleRemindersUpdate(prospect);

    // 3. Handle services update (existing code)
    // ... rest of the services update code remains the same

    return fetchProspects();
  } catch (error) {
    console.error('Error updating prospect:', error);
    throw error;
  }
}

// Helper function to handle reminders update
async function handleRemindersUpdate(prospect: Prospect) {
  try {
    // Get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .eq('prospect_id', prospect.id);

    if (remindersError) throw remindersError;

    // Handle new reminders first (those with temp_ prefix)
    const newReminders = prospect.reminders.filter(r => r.id.startsWith('temp_'));
    if (newReminders.length > 0) {
      const newRemindersData = newReminders.map(reminder => ({
        prospect_id: prospect.id,
        datetime: reminder.datetime,
        note: reminder.note || '',
        completed: reminder.completed || false
      }));

      const { error: insertError } = await supabase
        .from('reminders')
        .insert(newRemindersData);

      if (insertError) {
        console.error('Error inserting reminders:', insertError);
        throw insertError;
      }
    }

    // Handle existing reminders (those without temp_ prefix)
    const existingRemindersToUpdate = prospect.reminders.filter(r => !r.id.startsWith('temp_'));

    // Update existing reminders
    for (const reminder of existingRemindersToUpdate) {
      // Validate datetime field before updating
      if (!reminder.datetime) {
        console.error(`Missing datetime for reminder ID ${reminder.id}`);
        continue; // Skip this update if datetime is missing
      }

      const { error: updateError } = await supabase
        .from('reminders')
        .update({
          datetime: reminder.datetime,
          note: reminder.note || '',
          completed: reminder.completed
        })
        .eq('id', reminder.id)
        .eq('prospect_id', prospect.id);

      if (updateError) throw updateError;
    }

    // Delete reminders that no longer exist
    const currentReminderIds = existingRemindersToUpdate.map(r => r.id);
    const remindersToDelete = (existingReminders || [])
      .filter(r => !currentReminderIds.includes(r.id));

    if (remindersToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('reminders')
        .delete()
        .in('id', remindersToDelete.map(r => r.id));

      if (deleteError) throw deleteError;
    }

  } catch (error) {
    console.error('Error handling reminders update:', error);
    throw error;
  }
}


// Delete a prospect and its related services
export async function deleteProspect(prospectId: string) {
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', prospectId);

  if (error) throw error;

  return fetchProspects();
}

// Update a reminder's completed status
export async function updateReminder(prospectId: string, reminderId: string, completed: boolean) {
  const { error } = await supabase
    .from('reminders')
    .update({ completed })
    .eq('id', reminderId)
    .eq('prospect_id', prospectId);

  if (error) throw error;

  return fetchProspects();
}

// Create a new reminder
export async function createReminder(prospectId: string, reminder: Omit<Reminder, 'id' | 'prospect_id' | 'created_at' | 'updated_at'>) {
  const { error } = await supabase
    .from('reminders')
    .insert({
      prospect_id: prospectId,
      datetime: reminder.datetime,
      note: reminder.note || '',
      completed: reminder.completed || false
    });

  if (error) throw error;

  return fetchProspects();
}