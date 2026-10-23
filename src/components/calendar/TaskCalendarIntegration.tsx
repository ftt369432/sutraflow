import React, { useState } from 'react';
import { Calendar, CheckSquare, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, CalendarEvent } from '../../types';

interface TaskCalendarIntegrationProps {
  tasks: Task[];
  onCreateEvent: (task: Task) => void;
  onCreateBulkEvents: (tasks: Task[]) => void;
  onCreateTask: (event: CalendarEvent) => void;
  onCreateBulkTasks: (events: CalendarEvent[]) => void;
}

export function TaskCalendarIntegration({
  tasks,
  onCreateEvent,
  onCreateBulkEvents,
  onCreateTask,
  onCreateBulkTasks
}: TaskCalendarIntegrationProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'due-today' | 'overdue' | 'recurring'>('all');
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [duration, setDuration] = useState(60); // Default duration in minutes

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleCreateEvents = () => {
    const selectedTaskObjects = tasks.filter(task => 
      selectedTasks.includes(task.id)
    ).map(task => ({
      ...task,
      duration: duration
    }));
    
    if (selectedTaskObjects.length === 1) {
      onCreateEvent(selectedTaskObjects[0]);
    } else {
      onCreateBulkEvents(selectedTaskObjects);
    }
    setSelectedTasks([]);
  };

  const filteredTasks = tasks.filter(task => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'due-today':
        return task.dueDate && format(task.dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      case 'overdue':
        return task.dueDate && task.dueDate < today && !task.completed;
      case 'recurring':
        return task.recurrence !== undefined;
      default:
        return true;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-full flex flex-col">
      <div className="p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Task Integration
        </h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilter('due-today')}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
              filter === 'due-today'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Clock size={14} className="mr-1" />
            Due Today
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
              filter === 'overdue'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <AlertCircle size={14} className="mr-1" />
            Overdue
          </button>
          <button
            onClick={() => setFilter('recurring')}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
              filter === 'recurring'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <RefreshCw size={14} className="mr-1" />
            Recurring
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-2">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
            >
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => handleTaskSelect(task.id)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {task.title}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Due: {format(task.dueDate, 'MMM d, yyyy')}
                  </p>
                )}
                {task.recurrence && (
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    Repeats {task.recurrence.frequency} (every {task.recurrence.interval})
                  </p>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.priority === 'high'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : task.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedTasks.length > 0 && (
        <div className="p-4 border-t dark:border-gray-700 space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              min="15"
              step="15"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">minutes per task</span>
          </div>
          
          <button
            onClick={handleCreateEvents}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <Calendar size={16} className="mr-2" />
            Add {selectedTasks.length} {selectedTasks.length === 1 ? 'Task' : 'Tasks'} to Calendar
          </button>
        </div>
      )}
    </div>
  );
}