import React, { useState } from 'react';
import { Plus, Calendar, Clock, RefreshCw } from 'lucide-react';
import type { Task } from '../../types';

interface QuickTaskCreatorProps {
  date: Date;
  onCreateTask: (task: Task) => void;
}

export function QuickTaskCreator({ date, onCreateTask }: QuickTaskCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState({
    frequency: 'weekly' as const,
    interval: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      priority: 'medium',
      completed: false,
      dueDate: date,
      tags: [],
      duration,
      ...(isRecurring && { recurrence }),
    };

    onCreateTask(task);
    setTitle('');
    setDuration(60);
    setIsRecurring(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        title="Quick add task"
      >
        <Plus size={16} className="text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="absolute z-10 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString()}
            </span>
          </div>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />

          <div className="mt-3 space-y-3">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-gray-500 dark:text-gray-400" />
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                min="15"
                step="15"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">minutes</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <RefreshCw size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Recurring task</span>
            </div>

            {isRecurring && (
              <div className="flex items-center space-x-2">
                <select
                  value={recurrence.frequency}
                  onChange={(e) => setRecurrence({
                    ...recurrence,
                    frequency: e.target.value as Task['recurrence']['frequency']
                  })}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-300">every</span>
                <input
                  type="number"
                  value={recurrence.interval}
                  onChange={(e) => setRecurrence({
                    ...recurrence,
                    interval: parseInt(e.target.value, 10)
                  })}
                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                  min="1"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {recurrence.frequency === 'daily' ? 'days' :
                   recurrence.frequency === 'weekly' ? 'weeks' : 'months'}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
        </form>
      )}
    </div>
  );
}