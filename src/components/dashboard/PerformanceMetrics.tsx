import React from 'react';

export interface DashboardMetricItem {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

interface PerformanceMetricsProps {
  metrics: DashboardMetricItem[];
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Performance Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-slate-300">
                {metric.icon}
              </div>
              <div
                className={`text-sm font-medium ${
                  metric.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : metric.trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {metric.change}
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</div>
            <div className="text-gray-600 dark:text-slate-400 text-sm">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
