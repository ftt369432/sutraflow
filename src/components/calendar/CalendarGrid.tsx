import React from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday } from 'date-fns';
import type { CalendarEvent } from '../../types';
import { CalendarEvent as EventComponent } from './CalendarEvent';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarGrid({ currentDate, events, onEventClick }: CalendarGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-8 border-b">
        <div className="w-16" /> {/* Time column */}
        {days.map((day) => (
          <div
            key={day.toString()}
            className={`p-2 text-center border-l ${
              isToday(day) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="font-medium">{format(day, 'EEE')}</div>
            <div className={`text-sm ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 h-[1440px]"> {/* 24 hours * 60px */}
          <div className="col-span-1">
            {hours.map((hour) => (
              <div key={hour} className="h-[60px] border-b text-xs text-gray-500 text-right pr-2">
                {format(new Date().setHours(hour, 0), 'ha')}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day.toString()} className="col-span-1 border-l relative">
              {events
                .filter((event) => format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .map((event) => (
                  <EventComponent
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}