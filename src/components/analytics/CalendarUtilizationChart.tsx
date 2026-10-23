import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CalendarEvent } from '../../types';

interface CalendarUtilizationChartProps {
  events: CalendarEvent[];
}

export function CalendarUtilizationChart({ events }: CalendarUtilizationChartProps) {
  const calculateDuration = (event: CalendarEvent) => {
    return (event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60); // hours
  };

  const totalHours = events.reduce((acc, event) => acc + calculateDuration(event), 0);
  const workingHours = 8 * 5; // 8 hours per day, 5 days per week

  const data = [
    { name: 'Scheduled', value: totalHours },
    { name: 'Available', value: Math.max(0, workingHours - totalHours) },
  ];

  const COLORS = ['#60a5fa', '#e5e7eb'];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}