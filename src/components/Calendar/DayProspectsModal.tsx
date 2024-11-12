import React from 'react';
import { X } from 'lucide-react';
import { Prospect } from '../../types/calendar';
import { format } from 'date-fns';
import { ProspectPreview } from './ProspectPreview';
import { ProspectModal } from './ProspectModal';

interface DayProspectsModalProps {
  date: Date;
  prospects: Prospect[];
  onClose: () => void;
  onEdit?: (prospect: Prospect) => void;
  onDelete?: (prospectId: string) => void;
}

export function DayProspectsModal({ date, prospects, onClose, onEdit, onDelete }: DayProspectsModalProps) {
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(
    null
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {prospects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No prospects for this day
              </p>
            ) : (
              prospects.map((prospect) => (
                <ProspectPreview
                  key={prospect.id}
                  prospect={prospect}
                  onClick={() => setSelectedProspect(prospect)}
                  view="agenda"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedProspect && (
        <ProspectModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onEdit={onEdit!}
          onDelete={onDelete!}
          onUpdateReminder={handleUpdateReminder}
        />
      )}
    </div>
  );
}