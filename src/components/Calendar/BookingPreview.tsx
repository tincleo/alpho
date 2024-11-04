import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Booking } from '../../types/calendar';
import { format } from 'date-fns';

interface BookingPreviewProps {
  booking: Booking;
  onClick: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (booking: Booking) => void;
  onDragEnd?: () => void;
  view?: 'week' | 'month' | 'agenda';
}

const SERVICE_TYPES: Record<string, string> = {
  'couch': 'Couch Cleaning',
  'carpet': 'Carpet Cleaning',
  'car-seats': 'Car Seats Cleaning',
  'mattress': 'Mattress Cleaning'
};

export function BookingPreview({
  booking,
  onClick,
  draggable = true,
  onDragStart,
  onDragEnd,
  view = 'month'
}: BookingPreviewProps) {
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
    if (!draggable) return;
    e.stopPropagation();
    onDragStart?.(booking);
  };

  const getServiceSummary = () => {
    return booking.services.map(service => SERVICE_TYPES[service.type]).join(', ');
  };

  if (view === 'week') {
    return (
      <div
        onClick={onClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={`px-1.5 py-1 rounded cursor-pointer hover:shadow-sm transition-all text-xs ${
          booking.isAllDay 
            ? 'bg-yellow-50 border border-yellow-200 sticky top-6 z-10' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[booking.status]}`} />
            <span className="font-medium truncate">
              {SERVICE_TYPES[booking.services[0].type]}
              {booking.services.length > 1 && ` +${booking.services.length - 1}`}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 pl-3 truncate">
            {booking.location} • {!booking.isAllDay && format(new Date(booking.datetime), 'HH:mm')}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'month') {
    return (
      <div
        onClick={onClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={`px-1.5 py-1 rounded cursor-pointer hover:shadow-sm transition-all text-xs ${
          booking.isAllDay 
            ? 'bg-yellow-50 border border-yellow-200 sticky top-6 z-10' 
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColors[booking.status]}`} />
          <span className="font-medium truncate flex-1">
            {SERVICE_TYPES[booking.services[0].type]}
            {booking.services.length > 1 && ` +${booking.services.length - 1}`}
          </span>
          {!booking.isAllDay && (
            <span className="text-gray-500 shrink-0">
              {format(new Date(booking.datetime), 'HH:mm')}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (view === 'agenda') {
    return (
      <div
        onClick={onClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={`px-2 py-2 rounded-lg border ${
          booking.isAllDay ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[booking.status]}`} />
                <span className="font-medium text-sm text-gray-900 truncate">{getServiceSummary()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusBadgeColors[booking.status]}`}>
                  {booking.status}
                </span>
                {!booking.isAllDay && (
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(booking.datetime), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-1 text-xs text-gray-600">
              {!booking.isAllDay && booking.endTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(new Date(booking.datetime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{booking.location} - {booking.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}