import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { EmailAnalytics as EmailAnalyticsType } from '../../types';

interface EmailAnalyticsProps {
  analytics: EmailAnalyticsType;
}

export function EmailAnalytics({ analytics }: EmailAnalyticsProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sent Emails</h3>
          <p className="mt-2 text-3xl font-bold">{analytics.sentCount}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Rate</h3>
          <p className="mt-2 text-3xl font-bold">{(analytics.responseRate * 100).toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response Time</h3>
          <p className="mt-2 text-3xl font-bold">{analytics.averageResponseTime}h</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Email Activity by Hour</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.byHour}>
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Top Recipients</h3>
        <div className="space-y-2">
          {analytics.topRecipients.map(({ email, count }) => (
            <div key={email} className="flex items-center justify-between">
              <span className="text-sm">{email}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{count} emails</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 