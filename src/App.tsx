import React from 'react';
import { addWeeks, addMonths, subWeeks, subMonths, startOfWeek, startOfMonth } from 'date-fns';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { CalendarGrid } from './components/Calendar/CalendarGrid';
import { AgendaView } from './components/Calendar/AgendaView';
import { AddProspectModal } from './components/Calendar/AddProspectModal';
import { Prospect, ViewMode, ServiceType, Location } from './types/calendar';
import { Sidebar } from './components/Calendar/Sidebar';
import { ProspectsSidebar } from './components/Calendar/ProspectsSidebar';
import { RemindersPane } from './components/Calendar/RemindersPane';
import { ProspectModal } from './components/Calendar/ProspectModal';
import { fetchProspects, createProspect, deleteProspect, updateReminder, updateProspect } from './lib/api';

const SAMPLE_BOOKINGS: Prospect[] = [
  {
    id: '1',
    services: [
      { type: 'couch', details: { couch: { type: 'leather', seats: 3 } } }
    ],
    location: 'Bastos',
    address: '123 Avenue Kennedy',
    phone: '677 88 99 00',
    datetime: new Date(2024, 10, 15, 9, 0).toISOString(),
    endTime: new Date(2024, 10, 15, 11, 0).toISOString(),
    status: 'confirmed',
    priority: 'high',
    name: 'Jean Michel',
    notes: 'Premium leather couch cleaning - Customer prefers morning appointments',
    isAllDay: false,
    reminders: [
      {
        id: 'r1',
        datetime: new Date(2024, 10, 13).toISOString(),
        note: 'Call to confirm appointment time',
        completed: false
      },
      {
        id: 'r2',
        datetime: new Date(2024, 10, 14).toISOString(),
        note: 'Send location details',
        completed: false
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
    datetime: new Date(2024, 10, 20).toISOString(),
    status: 'pending',
    priority: 'medium',
    name: 'Marie Claire',
    notes: 'Interested in carpet cleaning service, needs price quote',
    reminders: [
      {
        id: 'r3',
        datetime: new Date(2024, 10, 18).toISOString(),
        note: 'Send price quotation',
        completed: false
      },
      {
        id: 'r4',
        datetime: new Date(2024, 10, 19).toISOString(),
        note: 'Follow up on quotation',
        completed: false
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
  const [prospects, setProspects] = React.useState<Prospect[]>(SAMPLE_BOOKINGS);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedServices, setSelectedServices] = React.useState<ServiceType[]>(['couch', 'carpet', 'car-seats', 'mattress']);
  const [selectedStatuses, setSelectedStatuses] = React.useState<Prospect['status'][]>(['pending', 'confirmed', 'completed', 'cancelled']);
  const [selectedLocations, setSelectedLocations] = React.useState<Location[]>(LOCATIONS);
  const [showProspects, setShowProspects] = React.useState(false);
  const [showReminders, setShowReminders] = React.useState(false);
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch prospects on component mount
  React.useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setIsInitialLoading(true);
      setError(null);
      const data = await fetchProspects();
      setProspects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleAddProspect = async (newProspect: Omit<Prospect, 'id'>) => {
    try {
      setIsLoading(true);
      const updatedProspects = await createProspect(newProspect);
      setProspects(updatedProspects);
      setShowAddModal(false);
      setSelectedDate(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prospect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProspect = async (prospectId: string) => {
    try {
      setIsLoading(true);
      const updatedProspects = await deleteProspect(prospectId);
      setProspects(updatedProspects);
      setSelectedProspect(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prospect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReminder = async (prospectId: string, reminderId: string, completed: boolean) => {
    try {
      setIsLoading(true);
      const updatedProspects = await updateReminder(prospectId, reminderId, completed);
      setProspects(updatedProspects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProspects = React.useMemo(() => {
    const filtered = prospects.filter(prospect => {
      const hasSelectedService = prospect.services.some(service => selectedServices.includes(service.type));
      const hasSelectedStatus = selectedStatuses.includes(prospect.status);
      const hasSelectedLocation = selectedLocations.includes(prospect.location);
      return hasSelectedService && hasSelectedStatus && hasSelectedLocation;
    });

    if (viewMode !== 'agenda') {
      return filtered.filter(prospect => {
        const prospectDate = new Date(prospect.datetime);
        return !isNaN(prospectDate.getTime());
      });
    }

    return filtered;
  }, [prospects, selectedServices, selectedStatuses, selectedLocations, viewMode]);

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

  const handleAddProspectClick = (date?: Date) => {
    setSelectedDate(date);
    setShowAddModal(true);
  };

  const totalReminders = React.useMemo(() => {
    return prospects.reduce((count, prospect) => 
      count + (prospect.reminders?.length || 0), 0
    );
  }, [prospects]);

  const handleUpdateProspect = async (updatedProspect: Prospect) => {
    try {
      setIsLoading(true);
      const updatedProspects = await updateProspect(updatedProspect);
      setProspects(updatedProspects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prospect');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-red-600 font-medium mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadProspects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        selectedServices={selectedServices}
        onServiceChange={setSelectedServices}
        selectedStatuses={selectedStatuses}
        onStatusChange={(statuses) => setSelectedStatuses(statuses as Prospect['status'][])}
        onLocationChange={setSelectedLocations}
        prospects={prospects}
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
            onAddProspect={() => handleAddProspectClick()}
            onToggleProspects={() => setShowProspects(!showProspects)}
            onOpenReminders={() => setShowReminders(true)}
            remindersCount={totalReminders}
          />
        </div>
        {viewMode === 'agenda' ? (
          <AgendaView
            prospects={filteredProspects}
            onUpdateProspect={handleUpdateProspect}
            onDeleteProspect={handleDeleteProspect}
          />
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            viewMode={viewMode}
            prospects={filteredProspects}
            onAddProspect={handleAddProspectClick}
            onUpdateProspect={handleUpdateProspect}
            onDeleteProspect={handleDeleteProspect}
          />
        )}
        {showAddModal && (
          <AddProspectModal
            onClose={() => {
              setShowAddModal(false);
              setSelectedDate(undefined);
            }}
            onAdd={handleAddProspect}
            selectedDate={selectedDate}
          />
        )}
      </div>
      
      <ProspectsSidebar
        prospects={prospects}
        onUpdateProspect={handleUpdateProspect}
        onDeleteProspect={handleDeleteProspect}
        isExpanded={showProspects}
        onToggle={() => setShowProspects(!showProspects)}
      />

      <RemindersPane
        isOpen={showReminders}
        onClose={() => setShowReminders(false)}
        prospects={prospects}
        onProspectClick={(prospect) => {
          setSelectedProspect(prospect);
        }}
        onUpdateReminder={handleUpdateReminder}
      />

      {selectedProspect && (
        <ProspectModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onEdit={handleUpdateProspect}
          onDelete={handleDeleteProspect}
          onUpdateReminder={handleUpdateReminder}
        />
      )}

      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm text-gray-600">Saving changes...</div>
        </div>
      )}
    </div>
  );
}