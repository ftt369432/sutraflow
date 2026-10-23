import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentDate,
  onPrevious,
  onNext,
  onToday
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center space-x-4">
      <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
      <button
        onClick={onToday}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Today
      </button>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevious}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onNext}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <span className="text-lg font-medium">
        {format(currentDate, 'MMMM yyyy')}
      </span>
    </div>
  );
}