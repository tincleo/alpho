import React, { useState } from 'react';
import { Booking } from '../../types/calendar';
import { updateBooking } from '../../services/bookingService';

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    try {
      setIsSaving(true);
      const updatedBookings = await updateBooking(updatedBooking);
      setBookings(updatedBookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      console.error('Error updating booking:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
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