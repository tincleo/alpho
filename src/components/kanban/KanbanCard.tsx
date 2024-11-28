import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Prospect } from '../../types/calendar';

interface Props {
  prospect: Prospect;
  isDragging?: boolean;
}

export default function KanbanCard({ prospect, isDragging }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: prospect.id,
    data: prospect,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group
        p-3 bg-white rounded-lg shadow-sm
        border border-gray-200
        cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow
        ${isCurrentlyDragging ? 'opacity-50 shadow-md rotate-2' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute -left-1 top-0 bottom-0 w-1 group-hover:bg-blue-400 rounded-l transition-colors" />

      {/* Card Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900 truncate">
            {prospect.name || 'Unnamed Prospect'}
          </h4>
        </div>

        <div className="flex flex-col gap-1 text-sm text-gray-500">
          {prospect.phone && (
            <div className="truncate">
              {prospect.phone}
            </div>
          )}
          {prospect.datetime && (
            <div>
              {format(new Date(prospect.datetime), 'MMM d, yyyy h:mm a')}
            </div>
          )}
          {prospect.location && (
            <div className="truncate">
              📍 {prospect.location}
            </div>
          )}
        </div>

        {prospect.services && prospect.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prospect.services.map((service: any, index: number) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700"
              >
                {service.type}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}