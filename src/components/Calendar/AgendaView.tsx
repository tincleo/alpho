import React from 'react';
import { format, isToday } from 'date-fns';
import { Prospect } from '../../types/calendar';
import { ProspectPreview } from './ProspectPreview';
import { ProspectModal } from './ProspectModal';
import { updateReminder } from '../../lib/api';
import { X } from 'lucide-react';

interface AgendaViewProps {
  prospects: Prospect[];
  onUpdateProspect: (prospect: Prospect) => Promise<void>;
  onDeleteProspect: (prospectId: string) => Promise<void>;
  onProspectsChange?: () => void;
  onUpdateReminder: (prospectId: string, reminderId: string, completed: boolean) => Promise<void>;
}

export function AgendaView({ 
  prospects, 
  onUpdateProspect, 
  onDeleteProspect, 
  onProspectsChange,
  onUpdateReminder 
}: AgendaViewProps) {
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const groupedProspects = React.useMemo(() => {
    const sorted = [...prospects]
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    const groups = new Map<string, Prospect[]>();
    sorted.forEach(prospect => {
      const date = new Date(prospect.datetime);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(prospect);
    });

    return Array.from(groups.entries()).map(([dateStr, dayProspects]) => ({
      date: new Date(dateStr),
      prospects: dayProspects.sort((a, b) => 
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      ),
    }));
  }, [prospects]);

  const handleUpdateReminder = async (prospectId: string, reminderId: string, completed: boolean) => {
    try {
      await updateReminder(prospectId, reminderId, completed);
      onProspectsChange?.();
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  };

  const handleDeleteProspect = async (prospectId: string) => {
    try {
      await onDeleteProspect(prospectId);
      setSelectedProspect(null);
      onProspectsChange?.();
    } catch (error) {
      console.error('Failed to delete prospect:', error);
      throw error;
    }
  };

  if (groupedProspects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No upcoming prospects
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto py-2 px-4 space-y-2">
        {groupedProspects.map(({ date, prospects }) => (
          <div key={date.toISOString()} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <h2 className={`text-sm font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            <div className="space-y-2 p-2">
              {prospects.map((prospect) => (
                <div key={prospect.id} className="cursor-pointer">
                  <ProspectPreview
                    prospect={prospect}
                    onClick={() => setSelectedProspect(prospect)}
                    view="agenda"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedProspect && (
        <ProspectModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onEdit={onUpdateProspect}
          onDelete={handleDeleteProspect}
          onUpdateReminder={onUpdateReminder}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}