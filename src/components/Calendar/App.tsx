import React, { useState, useCallback } from 'react';
import { Booking } from '../../types/calendar';
import { fetchBookings, updateBooking, deleteBooking } from '../../lib/api';
import { AgendaView } from './AgendaView';

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const updatedBookings = await fetchBookings();
      setBookings(updatedBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    }
  }, []);

  // Load bookings on mount
  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    try {
      setIsSaving(true);
      await updateBooking(updatedBooking);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      console.error('Error updating booking:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setIsSaving(true);
      await deleteBooking(bookingId);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
      console.error('Error deleting booking:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AgendaView
        bookings={bookings}
        onUpdateBooking={handleUpdateBooking}
        onDeleteBooking={handleDeleteBooking}
        onBookingsChange={loadBookings}
      />

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm">{error}</div>
        </div>
      )}
      
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm text-gray-600">Saving changes...</div>
        </div>
      )}
    </div>
  );
} 