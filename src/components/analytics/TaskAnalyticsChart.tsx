import React from 'react';
import { priorityChartColors } from '../../styles/semanticColors';
import { Task } from '../../types/task';

interface TaskAnalyticsChartProps {
  tasks: Task[];
}

export function TaskAnalyticsChart({ tasks }: TaskAnalyticsChartProps) {
  // Calculate task statistics
  const stats = {
    byPriority: tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byTag: tasks.reduce((acc, task) => {
      task.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="space-y-6">
      {/* Priority Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tasks by Priority</h4>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.byPriority).map(([priority, count]) => (
            <div
              key={priority}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {priority}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {count}
                </span>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(count / tasks.length) * 100}%`,
                      backgroundColor: priorityChartColors[priority as keyof typeof priorityChartColors] ?? priorityChartColors.low
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tasks by Status</h4>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {status.replace('_', ' ')}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {count}
                </span>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(count / tasks.length) * 100}%`,
                      backgroundColor: status === 'done' ? '#10B981' :
                                    status === 'in_progress' ? '#F59E0B' :
                                    '#6B7280'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tasks by Tag</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byTag)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([tag, count]) => (
              <div
                key={tag}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {tag}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {count}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(count / tasks.length) * 100}%`,
                        backgroundColor: '#6366F1'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 