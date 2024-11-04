import React from 'react';
import { addWeeks, addMonths, subWeeks, subMonths, startOfWeek, startOfMonth } from 'date-fns';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { CalendarGrid } from './components/Calendar/CalendarGrid';
import { AgendaView } from './components/Calendar/AgendaView';
import { AddBookingModal } from './components/Calendar/AddBookingModal';
import { Booking, ViewMode, ServiceType, Location } from './types/calendar';
import { Sidebar } from './components/Calendar/Sidebar';

const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: '1',
    services: [{ type: 'couch', details: { couch: { type: 'leather', seats: 3 } } }],
    location: 'Bastos',
    address: '123 Avenue Kennedy',
    phone: '677889900',
    datetime: new Date(2024, 10, 1, 9, 0).toISOString(),
    endTime: new Date(2024, 10, 1, 11, 0).toISOString(),
    status: 'confirmed',
    notes: 'Premium leather couch cleaning',
  },
  {
    id: '2',
    services: [{ type: 'carpet', details: { carpet: { size: 'large', quantity: 2 } } }],
    location: 'Mvan',
    address: '45 Rue des Manguiers',
    phone: '699001122',
    datetime: new Date(2024, 10, 4, 14, 0).toISOString(),
    endTime: new Date(2024, 10, 4, 16, 0).toISOString(),
    status: 'pending',
    notes: 'Two large Persian carpets',
  },
  {
    id: '3',
    services: [{ type: 'car-seats', details: { 'car-seats': { seats: 4 } } }],
    location: 'Nsam',
    address: '78 Boulevard du 20 Mai',
    phone: '655443322',
    datetime: new Date(2024, 10, 7, 10, 30).toISOString(),
    endTime: new Date(2024, 10, 7, 12, 30).toISOString(),
    status: 'completed',
    notes: 'SUV vehicle seats',
  },
  {
    id: '4',
    services: [
      { type: 'mattress', details: { mattress: { size: 'large', quantity: 1 } } },
      { type: 'carpet', details: { carpet: { size: 'medium', quantity: 1 } } }
    ],
    location: 'Mvog-Mbi',
    address: '156 Rue de la Paix',
    phone: '699887766',
    datetime: new Date(2024, 10, 11, 13, 0).toISOString(),
    endTime: new Date(2024, 10, 11, 15, 0).toISOString(),
    status: 'confirmed',
    notes: 'Combined cleaning service',
  },
  {
    id: '5',
    services: [{ type: 'couch', details: { couch: { type: 'tissue', seats: 4 } } }],
    location: 'Essos',
    address: '89 Avenue des Banques',
    phone: '677665544',
    datetime: new Date(2024, 10, 14, 11, 0).toISOString(),
    endTime: new Date(2024, 10, 14, 13, 0).toISOString(),
    status: 'cancelled',
    notes: 'Rescheduling needed',
  }
];

const LOCATIONS: Location[] = [
  'Bastos', 'Mvan', 'Nsam', 'Mvog-Mbi', 'Essos', 
  'Mimboman', 'Nkoldongo', 'Ekounou', 'Emana', 
  'Nkolbisson', 'Olembe', 'Ngousso', 'Messa', 
  'Omnisport', 'Tsinga', 'Etoa-Meki', 'Nlongkak'
];

export default function App() {
  const [currentDate, setCurrentDate] = React.useState(new Date(2024, 10, 1));
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [bookings, setBookings] = React.useState<Booking[]>(SAMPLE_BOOKINGS);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedServices, setSelectedServices] = React.useState<ServiceType[]>(['couch', 'carpet', 'car-seats', 'mattress']);
  const [selectedStatuses, setSelectedStatuses] = React.useState<Booking['status'][]>(['pending', 'confirmed', 'completed', 'cancelled']);
  const [selectedLocations, setSelectedLocations] = React.useState<Location[]>(LOCATIONS);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter(booking => {
      const hasSelectedService = booking.services.some(service => selectedServices.includes(service.type));
      const hasSelectedStatus = selectedStatuses.includes(booking.status);
      const hasSelectedLocation = selectedLocations.includes(booking.location);
      return hasSelectedService && hasSelectedStatus && hasSelectedLocation;
    });
  }, [bookings, selectedServices, selectedStatuses, selectedLocations]);

  const handlePrevious = () => {
    setCurrentDate((date) =>
      viewMode === 'week' ? subWeeks(date, 1) : subMonths(date, 1)
    );
  };

  const handleNext = () => {
    setCurrentDate((date) =>
      viewMode === 'week' ? addWeeks(date, 1) : addMonths(date, 1)
    );
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(viewMode === 'week' ? startOfWeek(today, { weekStartsOn: 1 }) : startOfMonth(today));
  };

  const handleAddBooking = (newBooking: Omit<Booking, 'id'>) => {
    const booking: Booking = {
      ...newBooking,
      id: Math.random().toString(36).substr(2, 9),
    };
    setBookings((prev) => [...prev, booking]);
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
  };

  const handleAddBookingClick = (date?: Date) => {
    setSelectedDate(date);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        selectedServices={selectedServices}
        onServiceChange={setSelectedServices}
        selectedStatuses={selectedStatuses}
        onStatusChange={setSelectedStatuses}
        onLocationChange={setSelectedLocations}
        bookings={bookings}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-20">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            onViewModeChange={setViewMode}
            onAddBooking={() => handleAddBookingClick()}
          />
        </div>
        {viewMode === 'agenda' ? (
          <AgendaView
            bookings={filteredBookings}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
          />
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            viewMode={viewMode}
            bookings={filteredBookings}
            onAddBooking={handleAddBookingClick}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
          />
        )}
        {showAddModal && (
          <AddBookingModal
            onClose={() => {
              setShowAddModal(false);
              setSelectedDate(undefined);
            }}
            onAdd={handleAddBooking}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
}