import React from 'react';
import { Calendar as CalendarIcon, Clock, List } from 'lucide-react';

interface ViewSelectorProps {
  currentView: 'month' | 'week' | 'day';
  onViewChange: (view: 'month' | 'week' | 'day') => void;
}

export function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onViewChange('month')}
        className={`px-3 py-1.5 rounded-lg flex items-center ${
          currentView === 'month'
            ? 'bg-blue-100 text-blue-600'
            : 'hover:bg-gray-100'
        }`}
      >
        <CalendarIcon size={16} className="mr-1" />
        Month
      </button>
      <button
        onClick={() => onViewChange('week')}
        className={`px-3 py-1.5 rounded-lg flex items-center ${
          currentView === 'week'
            ? 'bg-blue-100 text-blue-600'
            : 'hover:bg-gray-100'
        }`}
      >
        <List size={16} className="mr-1" />
        Week
      </button>
      <button
        onClick={() => onViewChange('day')}
        className={`px-3 py-1.5 rounded-lg flex items-center ${
          currentView === 'day'
            ? 'bg-blue-100 text-blue-600'
            : 'hover:bg-gray-100'
        }`}
      >
        <Clock size={16} className="mr-1" />
        Day
      </button>
    </div>
  );
}