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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';
import { v4 as uuidv4 } from 'uuid';

const LOCATIONS: Location[] = [
  'Bastos', 'Mvan', 'Nsam', 'Mvog-Mbi', 'Essos', 
  'Mimboman', 'Nkoldongo', 'Ekounou', 'Emana', 
  'Nkolbisson', 'Olembe', 'Ngousso', 'Messa', 
  'Omnisport', 'Tsinga', 'Etoa-Meki', 'Nlongkak'
];

export default function App() {
  const [currentDate, setCurrentDate] = React.useState(new Date(2024, 10, 1));
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [prospects, setProspects] = React.useState<Prospect[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [selectedServices, setSelectedServices] = React.useState<ServiceType[]>(['couch', 'carpet', 'auto-detailing', 'mattress']);
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
    // Create temporary ID for optimistic update
    const tempId = uuidv4();
    
    // Create optimistic prospect with proper structure
    const optimisticProspect: Prospect = {
      ...newProspect,
      id: tempId,
      saveStatus: 'saving',
      originalData: newProspect,
      // Ensure services array is properly structured
      services: newProspect.services.map(service => ({
        id: service.id || uuidv4(),
        type: service.type,
        details: service.details || {}
      })),
      // Ensure other required fields have default values
      status: newProspect.status || 'pending',
      priority: newProspect.priority || 'medium',
      isAllDay: newProspect.isAllDay || false,
      reminders: newProspect.reminders || []
    };

    // Add to UI immediately
    setProspects(prev => [...prev, optimisticProspect]);

    try {
      // createProspect should return the newly created prospect, not an array
      const createdProspect = await createProspect(newProspect);

      if (!createdProspect) {
        throw new Error('No response from server');
      }

      // Update the prospects list with the created prospect
      setProspects(prev => 
        prev.map(p => {
          if (p.id === tempId) {
            return {
              ...createdProspect,
              saveStatus: undefined, // Remove save status to enable interactions
              services: createdProspect.services.map(service => ({
                id: service.id,
                type: service.type,
                details: service.details || {}
              })),
              reminders: createdProspect.reminders || []
            };
          }
          return p;
        })
      );

      return createdProspect; // Return for toast.promise
    } catch (err) {
      // Keep prospect but mark as error
      setProspects(prev => 
        prev.map(p => p.id === tempId ? 
          { ...p, saveStatus: 'error' } 
          : p
        )
      );
      throw err; // Let the toast handler catch this
    }
  };

  const handleRetryProspectCreation = (prospect: Prospect) => {
    if (prospect.originalData) {
      setShowAddModal(true);
      setInitialProspectData(prospect.originalData);
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
      if (!prospect || !Array.isArray(prospect.services)) {
        return false;
      }

      const hasSelectedService = prospect.services.some(service => 
        service && service.type && selectedServices.includes(service.type)
      );
      const hasSelectedStatus = selectedStatuses.includes(prospect.status);
      const hasSelectedLocation = prospect.location ? selectedLocations.includes(prospect.location as Location) : false;
      
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
            onUpdateReminder={handleUpdateReminder}
          />
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            viewMode={viewMode}
            prospects={filteredProspects}
            onAddProspect={handleAddProspectClick}
            onUpdateProspect={handleUpdateProspect}
            onDeleteProspect={handleDeleteProspect}
            onUpdateReminder={handleUpdateReminder}
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

      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="toast-container"
        toastClassName="dark-toast"
      />
    </div>
  );
}