import React from 'react';
import { Dialog, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import type { Task } from '../../types/tasks';
import { format, parseISO } from 'date-fns';

interface TaskConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onConvert: (task: Task) => void;
}

export function TaskConversionModal({
  isOpen,
  onClose,
  tasks,
  onConvert
}: TaskConversionModalProps) {
  const convertibleTasks = tasks.filter(task => 
    task.status !== 'completed' && task.dueDate
  );

  // Helper function to safely format dates
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'No date';
    try {
      // If it's a string, parse it first
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Convert Task to Calendar Event</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a task to convert into a calendar event. Only tasks with due dates can be converted.
          </p>

          <div className="space-y-2">
            {convertibleTasks.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No tasks available for conversion. Add due dates to your tasks to convert them to calendar events.
              </p>
            ) : (
              convertibleTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        {task.estimatedTime && (
                          <span>• {task.estimatedTime} min</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        onConvert(task);
                        onClose();
                      }}
                      size="sm"
                    >
                      Convert
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 