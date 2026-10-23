import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { CalendarEvent } from '../../types';
import { cn } from '../../lib/utils';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, selectedDate, onDayClick, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
          {day}
        </div>
      ))}
      {days.map(day => {
        const dayEvents = events.filter(event => 
          format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        );

        return (
          <div
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              "min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg",
              "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
              !isSameMonth(day, currentDate) && "opacity-50",
              isToday(day) && "ring-2 ring-purple-500",
              format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && 
                "bg-purple-50 dark:bg-purple-900/20"
            )}
          >
            <div className="text-right text-sm">
              {format(day, 'd')}
            </div>
            <div className="mt-2 space-y-1">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  className={cn(
                    "text-xs p-1 rounded truncate",
                    event.type === 'meeting' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    event.type === 'task' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    event.type === 'break' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  )}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}