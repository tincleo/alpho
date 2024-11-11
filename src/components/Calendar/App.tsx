import React, { useState, useCallback } from 'react';
import { Prospect } from '../../types/calendar';
import { fetchProspects, updateProspect, deleteProspect, updateReminder } from '../../lib/api';
import { AgendaView } from './AgendaView';

export default function App() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadProspects = useCallback(async () => {
    try {
      const updatedProspects = await fetchProspects();
      setProspects(updatedProspects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
    }
  }, []);

  // Load prospects on mount
  React.useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const handleUpdateProspect = async (updatedProspect: Prospect) => {
    try {
      setIsSaving(true);
      await updateProspect(updatedProspect);
      await loadProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prospect');
      console.error('Error updating prospect:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProspect = async (prospectId: string) => {
    try {
      setIsSaving(true);
      await deleteProspect(prospectId);
      await loadProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prospect');
      console.error('Error deleting prospect:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateReminder = async (prospectId: string, reminderId: string, completed: boolean) => {
    try {
      setIsSaving(true);
      await updateReminder(prospectId, reminderId, completed);
      await loadProspects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
      console.error('Error updating reminder:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AgendaView
        prospects={prospects}
        onUpdateProspect={handleUpdateProspect}
        onDeleteProspect={handleDeleteProspect}
        onProspectsChange={loadProspects}
        onUpdateReminder={handleUpdateReminder}
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