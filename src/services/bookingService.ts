import { Booking } from '../types/calendar';

export async function updateBooking(booking: Booking): Promise<Booking[]> {
  const response = await fetch(`/api/prospects/${booking.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: booking.name,
      phone: booking.phone,
      datetime: booking.datetime,
      location: booking.location,
      address: booking.address,
      notes: booking.notes,
      status: booking.status,
      priority: booking.priority,
      is_all_day: booking.isAllDay,
      // Send service IDs instead of full service objects
      service_ids: booking.services.map(service => service.id),
      reminders: booking.reminders,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update booking');
  }

  return response.json();
} 