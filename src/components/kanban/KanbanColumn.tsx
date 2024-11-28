import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Prospect } from '../../types/calendar';
import KanbanCard from './KanbanCard';

interface Props {
  status: string;
  prospects: Prospect[];
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700' },
};

export default function KanbanColumn({ status, prospects }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col w-80 shrink-0">
      {/* Column Header */}
      <div className={`p-3 rounded-t-lg ${statusColors[status].bg} ${statusColors[status].text}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{statusLabels[status]}</h3>
          <span className="px-2 py-1 text-sm bg-white bg-opacity-50 rounded-full">
            {prospects.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-2 space-y-2 bg-gray-50 rounded-b-lg min-h-[200px]
          ${isOver ? 'bg-blue-50 ring-2 ring-blue-200 ring-inset' : ''}
        `}
      >
        <SortableContext
          items={prospects.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {prospects.map((prospect) => (
            <KanbanCard
              key={prospect.id}
              prospect={prospect}
            />
          ))}
          {prospects.length === 0 && (
            <div className="h-full min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
              Drop cards here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}