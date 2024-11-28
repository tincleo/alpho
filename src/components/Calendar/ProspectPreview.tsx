import React from 'react';
import { Clock, MapPin, Loader2 } from 'lucide-react';
import { Prospect } from '../../types/calendar';
import { format } from 'date-fns';

interface ProspectPreviewProps {
  prospect: Prospect;
  onClick: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (prospect: Prospect) => void;
  onDragEnd?: () => void;
  view?: 'week' | 'month' | 'agenda';
  compact?: boolean;
  showReminders?: boolean;
}

const SERVICE_TYPES: Record<string, string> = {
  'couch': 'Couch Cleaning',
  'carpet': 'Carpet Cleaning',
  'auto-detailing': 'Auto Detailing',
  'mattress': 'Mattress Cleaning'
};

export function ProspectPreview({
  prospect,
  onClick,
  draggable = true,
  onDragStart,
  onDragEnd,
  view = 'month',
  showReminders = true
}: ProspectPreviewProps) {
  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-500',
  };

  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable || prospect.saveStatus === 'saving') return;
    e.stopPropagation();
    onDragStart?.(prospect);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If saving, do nothing
    if (prospect.saveStatus === 'saving') return;
    
    // If error, pass to parent for retry
    if (prospect.saveStatus === 'error') {
      onClick(e);
      return;
    }
    
    // Only allow click if not saving or saved
    if (!prospect.saveStatus || prospect.saveStatus === 'saved') {
      onClick(e);
    }
  };

  const getBaseClasses = () => {
    const common = `
      ${prospect.saveStatus === 'saving' ? 'opacity-60 cursor-progress' : ''}
      ${prospect.saveStatus === 'error' ? 'border-red-300 bg-red-50' : ''}
      ${!prospect.saveStatus || prospect.saveStatus === 'saved' ? 'hover:shadow-sm' : ''}
    `;

    if (view === 'week' || view === 'month') {
      return `px-1.5 py-1 rounded cursor-pointer transition-all text-xs 
        ${prospect.isAllDay 
          ? 'bg-yellow-50 border border-yellow-200 sticky top-6 z-10' 
          : 'bg-white border border-gray-200'}
        ${common}
      `;
    }

    if (view === 'agenda') {
      return `px-2 py-2 rounded-lg border 
        ${prospect.isAllDay ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}
        ${common}
      `;
    }

    return '';
  };

  if (view === 'week' || view === 'month') {
    return (
      <div
        onClick={handleClick}
        draggable={!prospect.saveStatus}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={getBaseClasses()}
      >
        <div className="flex flex-col gap-0.5 relative">
          {showReminders && prospect.reminders.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
              {prospect.reminders.length}
            </div>
          )}
          <div className="flex items-center gap-1">
            {prospect.saveStatus === 'saving' && (
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            )}
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[prospect.status]}`} />
            <span className="font-medium truncate">
              {SERVICE_TYPES[prospect.services[0].type]}
              {prospect.services.length > 1 && ` +${prospect.services.length - 1}`}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 pl-3 truncate">
            {prospect.location} • {!prospect.isAllDay && format(new Date(prospect.datetime), 'HH:mm')}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'agenda') {
    return (
      <div
        onClick={handleClick}
        draggable={!prospect.saveStatus}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={getBaseClasses()}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 relative">
          {showReminders && prospect.reminders.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-5 rounded-full flex items-center justify-center px-1">
              {prospect.reminders.length}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {prospect.saveStatus === 'saving' && (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                )}
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[prospect.status]}`} />
                <span className="font-medium text-sm text-gray-900 truncate">
                  {prospect.services.map(s => SERVICE_TYPES[s.type]).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusBadgeColors[prospect.status]}`}>
                  {prospect.status}
                </span>
                {!prospect.isAllDay && (
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(prospect.datetime), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-1 text-xs text-gray-600">
              {!prospect.isAllDay && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(new Date(prospect.datetime), 'HH:mm')}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{prospect.location} - {prospect.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}