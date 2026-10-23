import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Tag, MoreVertical, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskStatus } from '../../types/tasks';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { cn } from '../../lib/utils';

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEnhance: () => void;
}

export function TaskCard({ task, onToggle, onEnhance }: TaskCardProps) {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <motion.div
      layout
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow p-4",
        task.status === 'completed' && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <button
            onClick={onToggle}
            className="mt-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {task.status === 'completed' ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>
          <div>
            <h3 className={cn(
              "font-medium text-gray-900 dark:text-white",
              task.status === 'completed' && "line-through"
            )}>
              {task.title}
            </h3>
            {task.description && (
              <p className={cn(
                "mt-1 text-sm text-gray-500 dark:text-gray-400",
                task.status === 'completed' && "line-through"
              )}>
                {task.description}
              </p>
            )}
          </div>
        </div>
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          items={[
            {
              label: 'AI Enhance',
              onClick: onEnhance,
            },
            {
              label: 'Toggle Status',
              onClick: onToggle,
            },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}

        {task.estimatedTime && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {task.estimatedTime}m
          </span>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
} 