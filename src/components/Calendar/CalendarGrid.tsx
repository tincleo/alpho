import React from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isToday,
  setHours,
  setMinutes,
} from 'date-fns';
import { ProspectPreview } from './ProspectPreview';
import { ProspectModal } from './ProspectModal';
import { DayProspectsModal } from './DayProspectsModal';
import { Prospect, ViewMode, CalendarCell } from '../../types/calendar';

interface CalendarGridProps {
  currentDate: Date;
  viewMode: ViewMode;
  prospects: Prospect[];
  onAddProspect: (date: Date) => void;
  onUpdateProspect: (prospect: Prospect) => Promise<void>;
  onDeleteProspect: (prospectId: string) => Promise<void>;
  onUpdateReminder: (prospectId: string, reminderId: string, completed: boolean) => Promise<void>;
}

export function CalendarGrid({
  currentDate,
  viewMode,
  prospects,
  onAddProspect,
  onUpdateProspect,
  onDeleteProspect,
  onUpdateReminder,
}: CalendarGridProps) {
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  const [draggedProspect, setDraggedProspect] = React.useState<Prospect | null>(null);
  const [dropHighlight, setDropHighlight] = React.useState<string | null>(null);

  const getDaysToDisplay = () => {
    if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      });
    } else {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
      });
    }
  };

  const days = getDaysToDisplay();
  const cells: CalendarCell[] = days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate),
    prospects: prospects.filter((prospect) =>
      isSameDay(new Date(prospect.datetime), date)
    ),
  }));

  const handleDayClick = (date: Date, prospects: Prospect[]) => {
    if (prospects.length > 0 && viewMode === 'month') {
      setSelectedDay(date);
    } else {
      onAddProspect(date);
    }
  };

  const handleDragStart = (prospect: Prospect) => {
    setDraggedProspect(prospect);
  };

  const handleDragEnd = () => {
    setDraggedProspect(null);
    setDropHighlight(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const dateStr = date.toISOString();
    setDropHighlight(dateStr);
  };

  const handleDragLeave = () => {
    setDropHighlight(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedProspect) {
      const originalDate = new Date(draggedProspect.datetime);
      const newDate = setMinutes(
        setHours(date, originalDate.getHours()),
        originalDate.getMinutes()
      );

      onUpdateProspect({
        ...draggedProspect,
        datetime: newDate.toISOString(),
      });
    }
    setDropHighlight(null);
    setDraggedProspect(null);
  };

  const handleUpdateReminder = async (prospectId: string, reminderId: string, completed: boolean) => {
    await onUpdateReminder(prospectId, reminderId, completed);
  };

  return (
    <div className="flex-1 overflow-hidden grid grid-rows-[auto_1fr]">
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-xs md:text-sm font-semibold text-gray-600 text-center"
          >
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y h-full">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            onClick={() => handleDayClick(cell.date, cell.prospects)}
            onDragOver={(e) => handleDragOver(e, cell.date)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, cell.date)}
            className={`relative p-1 md:p-2 ${
              cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${isToday(cell.date) ? 'bg-blue-50' : ''} ${
              dropHighlight === cell.date.toISOString() ? 'bg-blue-100' : ''
            } overflow-y-auto cursor-pointer hover:bg-gray-50 transition-colors`}
          >
            <div className="sticky top-0 bg-inherit z-10 mb-1 flex items-center justify-between">
              <span
                className={`text-xs md:text-sm ${
                  cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday(cell.date) ? 'font-bold text-blue-600' : ''}`}
              >
                {format(cell.date, viewMode === 'week' ? 'EEE d' : 'd')}
              </span>
              {cell.prospects.length > 2 && viewMode === 'month' && (
                <span className="text-xs text-gray-500 md:hidden">
                  +{cell.prospects.length - 2}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {cell.prospects
                .slice(0, viewMode === 'month' ? (window.innerWidth < 768 ? 2 : undefined) : undefined)
                .map((prospect) => (
                  <ProspectPreview
                    key={prospect.id}
                    prospect={prospect}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProspect(prospect);
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    view={viewMode}
                    compact={viewMode === 'month'}
                  />
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
          onDelete={onDeleteProspect}
          onUpdateReminder={handleUpdateReminder}
        />
      )}

      {selectedDay && (
        <DayProspectsModal
          date={selectedDay}
          prospects={prospects.filter((prospect) =>
            isSameDay(new Date(prospect.datetime), selectedDay)
          )}
          onClose={() => setSelectedDay(null)}
          onEdit={onUpdateProspect}
          onDelete={onDeleteProspect}
        />
      )}
    </div>
  );
}