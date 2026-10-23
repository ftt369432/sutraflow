import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Task } from '../../types';

interface TaskCompletionChartProps {
  tasks: Task[];
}

export function TaskCompletionChart({ tasks }: TaskCompletionChartProps) {
  const data = [
    { name: 'High', completed: 0, total: 0 },
    { name: 'Medium', completed: 0, total: 0 },
    { name: 'Low', completed: 0, total: 0 },
  ];

  tasks.forEach((task) => {
    const priority = task.priority;
    const priorityData = data.find((d) => d.name.toLowerCase() === priority);
    if (priorityData) {
      priorityData.total++;
      if (task.status === 'completed') {
        priorityData.completed++;
      }
    }
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="completed" name="Completed" fill="#4ade80" />
          <Bar dataKey="total" name="Total" fill="#93c5fd" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}