import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, Tag, Clock } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../../types/tasks';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DateRangePicker } from '../ui/DateRangePicker';

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFilters) => void;
}

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  dateRange?: { from: Date; to: Date };
  tags?: string[];
  assignedTo?: string;
}

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
] as const;

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
] as const;

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilters>({});

  const handleFilterChange = (updates: Partial<TaskFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value as TaskStatus })}
          options={statusOptions}
        />

        <Select
          label="Priority"
          value={filters.priority}
          onChange={(e) => handleFilterChange({ priority: e.target.value as TaskPriority })}
          options={priorityOptions}
        />

        <DateRangePicker
          label="Date Range"
          value={filters.dateRange}
          onChange={(range) => handleFilterChange({ dateRange: range })}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-2">
            {filters.tags?.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
              >
                <Tag className="h-3 w-3" />
                {tag}
                <button
                  onClick={() => handleFilterChange({
                    tags: filters.tags?.filter((t) => t !== tag)
                  })}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setFilters({});
            onFilterChange({});
          }}
        >
          Reset Filters
        </Button>
      </div>
    </motion.div>
  );
} 