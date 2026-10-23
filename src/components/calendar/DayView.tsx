import React from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import type { CalendarEvent } from '../../types';
import { CalendarEvent as EventComponent } from './CalendarEvent';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayStart = startOfDay(currentDate);
  const dayEvents = events.filter((event) =>
    format(event.start, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="relative min-h-[1440px]"> {/* 24 hours * 60px */}
        {/* Time markers */}
        <div className="absolute top-0 left-0 w-16">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b text-xs text-gray-500 text-right pr-2"
            >
              {format(addHours(dayStart, hour), 'ha')}
            </div>
          ))}
        </div>

        {/* Events container */}
        <div className="ml-16 relative">
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b border-gray-100"
            />
          ))}

          {/* Events */}
          {dayEvents.map((event) => (
            <EventComponent
              key={event.id}
              event={event}
              onClick={() => onEventClick(event)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}