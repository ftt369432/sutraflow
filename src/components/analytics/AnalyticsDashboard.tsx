import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { TaskAnalyticsChart } from './TaskAnalyticsChart';
import { taskService } from '../../services/tasks';

export function AnalyticsDashboard() {
  const { data, loading, error } = useAnalytics();
  const [tasks, setTasks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadTasks = async () => {
      const taskData = await taskService.getTasks();
      setTasks(taskData);
    };
    loadTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Email Analytics */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Email Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Total Emails</p>
            <p className="text-2xl font-bold">{data.emails.total}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600">Unread</p>
            <p className="text-2xl font-bold">{data.emails.unread}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Read Rate</p>
            <p className="text-2xl font-bold">
              {Math.round(((data.emails.total - data.emails.unread) / data.emails.total) * 100)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Task Analytics */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Task Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">Total Tasks</p>
            <p className="text-2xl font-bold">{data.tasks.total}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600">Completed</p>
            <p className="text-2xl font-bold">{data.tasks.completed}</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <p className="text-sm text-pink-600">Completion Rate</p>
            <p className="text-2xl font-bold">
              {Math.round((data.tasks.completed / data.tasks.total) * 100)}%
            </p>
          </div>
        </div>
        <TaskAnalyticsChart tasks={tasks} />
      </Card>

      {/* Calendar Analytics */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Calendar Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-sm text-teal-600">Total Events</p>
            <p className="text-2xl font-bold">{data.calendar.total}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600">Upcoming</p>
            <p className="text-2xl font-bold">{data.calendar.upcoming}</p>
          </div>
          <div className="p-4 bg-cyan-50 rounded-lg">
            <p className="text-sm text-cyan-600">Event Density</p>
            <p className="text-2xl font-bold">
              {Math.round((data.calendar.upcoming / data.calendar.total) * 100)}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 