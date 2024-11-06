import React from 'react';
import { addWeeks, addMonths, subWeeks, subMonths, startOfWeek, startOfMonth } from 'date-fns';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { CalendarGrid } from './components/Calendar/CalendarGrid';
import { AgendaView } from './components/Calendar/AgendaView';
import { AddBookingModal } from './components/Calendar/AddBookingModal';
import { Booking, ViewMode, ServiceType, Location } from './types/calendar';
import { Sidebar } from './components/Calendar/Sidebar';
import { ProspectsSidebar } from './components/Calendar/ProspectsSidebar';
import { RemindersPane } from './components/Calendar/RemindersPane';
import { BookingModal } from './components/Calendar/BookingModal';

const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: '1',
    services: [
      { type: 'couch', details: { couch: { type: 'leather', seats: 3 } } }
    ],
    location: 'Bastos',
    address: '123 Avenue Kennedy',
    phone: '677 88 99 00',
    datetime: new Date(2024, 10, 5, 9, 0).toISOString(),
    endTime: new Date(2024, 10, 5, 11, 0).toISOString(),
    status: 'confirmed',
    priority: 'high',
    name: 'Jean Michel',
    notes: 'Premium leather couch cleaning - Customer prefers morning appointments',
    isAllDay: false,
    reminders: [
      {
        id: 'r1',
        datetime: new Date(2024, 10, 3).toISOString(),
      }
    ]
  },
  {
    id: '2',
    services: [
      { type: 'carpet', details: { carpet: { size: 'large', quantity: 2 } } }
    ],
    location: 'Mvan',
    address: '45 Rue des Manguiers',
    phone: '699 00 11 22',
    datetime: new Date(2024, 10, 8).toISOString(),
    status: 'pending',
    priority: 'medium',
    name: 'Marie Claire',
    notes: 'Interested in carpet cleaning service, needs price quote',
    reminders: [
      {
        id: 'r2',
        datetime: new Date(2024, 10, 6).toISOString(),
      },
      {
        id: 'r3',
        datetime: new Date(2024, 10, 7).toISOString(),
      }
    ]
  },
  {
    id: '3',
    services: [
      { type: 'car-seats', details: { 'car-seats': { seats: 4 } } },
      { type: 'couch', details: { couch: { type: 'tissue', seats: 2 } } }
    ],
    location: 'Nsam',
    address: '78 Boulevard du 20 Mai',
    phone: '655 44 33 22',
    datetime: new Date(2024, 10, 12).toISOString(),
    status: 'confirmed',
    priority: 'medium',
    name: 'Robert Fouda',
    isAllDay: true,
    notes: 'Combined service - SUV seats and living room couch'
  },
  {
    id: '4',
    services: [
      { type: 'mattress', details: { mattress: { size: 'large', quantity: 1 } } }
    ],
    location: 'Mvog-Mbi',
    address: '',
    phone: '699 88 77 66',
    datetime: new Date(2024, 10, 15).toISOString(),
    status: 'pending',
    priority: 'low',
    name: 'Alice Mengue',
  },
  {
    id: '5',
    services: [
      { type: 'couch', details: { couch: { type: 'leather', seats: 6 } } }
    ],
    location: 'Essos',
    address: '89 Avenue des Banques',
    phone: '677 66 55 44',
    datetime: new Date(2024, 10, 18, 14, 0).toISOString(),
    endTime: new Date(2024, 10, 18, 16, 0).toISOString(),
    status: 'cancelled',
    priority: 'high',
    name: 'Paul Biya',
    notes: 'Cancelled due to schedule conflict, to be rescheduled',
    isAllDay: false
  },
  {
    id: '6',
    services: [
      { type: 'carpet', details: { carpet: { size: 'medium', quantity: 3 } } }
    ],
    location: 'Mimboman',
    address: '',
    phone: '655 11 22 33',
    datetime: new Date(2024, 10, 20).toISOString(),
    status: 'pending',
    priority: 'medium',
    name: 'Sophie Ndongo',
  },
  {
    id: '7',
    services: [
      { type: 'mattress', details: { mattress: { size: 'small', quantity: 2 } } },
      { type: 'carpet', details: { carpet: { size: 'small', quantity: 1 } } }
    ],
    location: 'Nkolbisson',
    address: '123 Rue de la Paix',
    phone: '699 33 44 55',
    datetime: new Date(2024, 10, 22, 10, 0).toISOString(),
    endTime: new Date(2024, 10, 22, 12, 0).toISOString(),
    status: 'confirmed',
    priority: 'high',
    name: 'Emmanuel Eto\'o',
    notes: 'Student residence cleaning',
    isAllDay: false
  },
  {
    id: '8',
    services: [
      { type: 'car-seats', details: { 'car-seats': { seats: 7 } } }
    ],
    location: 'Ngousso',
    address: '',
    phone: '677 99 88 77',
    datetime: new Date(2024, 10, 25).toISOString(),
    status: 'pending',
    priority: 'low',
    name: 'Jacques Songo',
  },
  {
    id: '9',
    services: [
      { type: 'couch', details: { couch: { type: 'tissue', seats: 4 } } }
    ],
    location: 'Omnisport',
    address: '45 Avenue du Stade',
    phone: '699 55 66 77',
    datetime: new Date(2024, 10, 27).toISOString(),
    status: 'confirmed',
    priority: 'medium',
    name: 'Catherine Mbock',
    isAllDay: true,
    notes: 'Office reception area cleaning'
  },
  {
    id: '10',
    services: [
      { type: 'carpet', details: { carpet: { size: 'large', quantity: 1 } } },
      { type: 'couch', details: { couch: { type: 'leather', seats: 3 } } }
    ],
    location: 'Tsinga',
    address: '67 Rue des Écoles',
    phone: '655 77 88 99',
    datetime: new Date(2024, 10, 29, 13, 0).toISOString(),
    endTime: new Date(2024, 10, 29, 15, 0).toISOString(),
    status: 'confirmed',
    priority: 'high',
    name: 'Pierre Kamto',
    notes: 'VIP client - Premium service package',
    isAllDay: false
  }
  // ... Add 10 more similar entries with varied configurations
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
  const [showProspects, setShowProspects] = React.useState(false);
  const [showReminders, setShowReminders] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

  const filteredBookings = React.useMemo(() => {
    const filtered = bookings.filter(booking => {
      const hasSelectedService = booking.services.some(service => selectedServices.includes(service.type));
      const hasSelectedStatus = selectedStatuses.includes(booking.status);
      const hasSelectedLocation = selectedLocations.includes(booking.location);
      return hasSelectedService && hasSelectedStatus && hasSelectedLocation;
    });

    if (viewMode !== 'agenda') {
      return filtered.filter(booking => {
        const bookingDate = new Date(booking.datetime);
        return !isNaN(bookingDate.getTime());
      });
    }

    return filtered;
  }, [bookings, selectedServices, selectedStatuses, selectedLocations, viewMode]);

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

  const totalReminders = React.useMemo(() => {
    return bookings.reduce((count, booking) => 
      count + (booking.reminders?.length || 0), 0
    );
  }, [bookings]);

  const handleUpdateReminder = (bookingId: string, reminderId: string, completed: boolean) => {
    setBookings(prev => prev.map(booking => {
      if (booking.id !== bookingId) return booking;
      
      return {
        ...booking,
        reminders: (booking.reminders || []).map(reminder => 
          reminder.id === reminderId 
            ? { ...reminder, completed }
            : reminder
        )
      };
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        selectedServices={selectedServices}
        onServiceChange={setSelectedServices}
        selectedStatuses={selectedStatuses}
        onStatusChange={(statuses) => setSelectedStatuses(statuses as Booking['status'][])}
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
            onToggleProspects={() => setShowProspects(!showProspects)}
            onOpenReminders={() => setShowReminders(true)}
            remindersCount={totalReminders}
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
      
      <ProspectsSidebar
        bookings={bookings}
        onUpdateBooking={handleUpdateBooking}
        onDeleteBooking={handleDeleteBooking}
        isExpanded={showProspects}
        onToggle={() => setShowProspects(!showProspects)}
      />

      <RemindersPane
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        bookings={bookings}
        onBookingClick={(booking) => {
          setSelectedBooking(booking);
        }}
        onUpdateReminder={handleUpdateReminder}
      />

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={handleUpdateBooking}
          onDelete={handleDeleteBooking}
        />
      )}
    </div>
  );
}