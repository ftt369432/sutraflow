import React from 'react';
import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import type { CalendarEvent as CalendarEventType } from '../../types';
import { EventTaskCreator } from './EventTaskCreator';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick: () => void;
  onCreateTask: (event: CalendarEventType) => void;
}

export function CalendarEvent({ event, onClick, onCreateTask }: CalendarEventProps) {
  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
  const duration = endMinutes - startMinutes;

  const style = {
    top: `${startMinutes}px`,
    height: `${duration}px`,
  };

  const typeColors = {
    meeting: 'bg-blue-100 border-blue-300 text-blue-700',
    task: 'bg-green-100 border-green-300 text-green-700',
    break: 'bg-orange-100 border-orange-300 text-orange-700',
  };

  const typeIcons = {
    meeting: Users,
    task: Calendar,
    break: null,
  };

  const Icon = typeIcons[event.type];

  return (
    <div
      className={`absolute left-0 right-0 mx-1 p-2 border rounded cursor-pointer hover:opacity-90 ${
        typeColors[event.type]
      }`}
      style={style}
      onClick={onClick}
    >
      <EventTaskCreator event={event} onCreateTask={onCreateTask} />
      <div className="flex items-center gap-1">
        {Icon && <Icon size={12} />}
        <div className="text-xs font-medium truncate">{event.title}</div>
      </div>
      <div className="text-xs truncate">
        {format(event.start, 'h:mma')} - {format(event.end, 'h:mma')}
      </div>
      {event.description && (
        <div className="text-xs truncate mt-1 opacity-75">
          {event.description}
        </div>
      )}
    </div>
  );
}