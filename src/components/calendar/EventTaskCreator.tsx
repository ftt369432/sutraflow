import React, { useState } from 'react';
import { CheckSquare, Plus, Clock } from 'lucide-react';
import type { CalendarEvent, Task } from '../../types';

interface EventTaskCreatorProps {
  event: CalendarEvent;
  onCreateTask: (event: CalendarEvent) => void;
}

export function EventTaskCreator({ event, onCreateTask }: EventTaskCreatorProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="absolute right-0 top-0 p-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowOptions(!showOptions);
        }}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full bg-white dark:bg-gray-800 shadow-sm"
        title="Create task from event"
      >
        <Plus size={12} className="text-gray-600 dark:text-gray-300" />
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateTask(event);
              setShowOptions(false);
            }}
            className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
          >
            <CheckSquare size={14} className="mr-2" />
            Create Task
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement recurring task creation
              setShowOptions(false);
            }}
            className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
          >
            <Clock size={14} className="mr-2" />
            Create Recurring Task
          </button>
        </div>
      )}
    </div>
  );
}