import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import type { Email } from '../../types';

interface EmailResponseChartProps {
  emails: Email[];
}

export function EmailResponseChart({ emails }: EmailResponseChartProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      date: format(date, 'MMM dd'),
      count: emails.filter((email) => 
        format(email.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      ).length,
    };
  }).reverse();

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={last7Days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            name="Emails"
            stroke="#60a5fa"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}