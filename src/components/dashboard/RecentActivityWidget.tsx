import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Calendar, Mail, Star, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { CortexWidget } from './CortexWidget';

interface GeminiStatusInfo {
  model: string;
  features?: {
    streamingEnabled?: boolean;
  };
}

interface RecentActivityWidgetProps {
  isConfigured: boolean;
  status: GeminiStatusInfo;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  isConfigured,
  status
}) => {
  const navigate = useNavigate();

  const activities = [
    { time: '2 minutes ago', action: 'Created new AI assistant', type: 'success' },
    { time: '15 minutes ago', action: 'Updated knowledge base', type: 'info' },
    { time: '1 hour ago', action: 'Completed automation workflow', type: 'success' },
    { time: '3 hours ago', action: 'Generated creative content', type: 'info' }
  ];

  const quickLinks = [
    { label: 'Calendar', icon: <Calendar className="h-4 w-4" />, route: '/calendar' },
    { label: 'Email', icon: <Mail className="h-4 w-4" />, route: '/email' },
    { label: 'Tasks', icon: <Star className="h-4 w-4" />, route: '/tasks' },
    { label: 'Drive', icon: <FileText className="h-4 w-4" />, route: '/drive' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Cols: Activity Feed */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium">{activity.action}</p>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Col: Gemini Status + Cortex + Quick Links */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gemini AI Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">Configuration</span>
              <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">Model</span>
              <span className="text-gray-900 dark:text-white font-medium">{status.model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">Features</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {status.features?.streamingEnabled ? 'Streaming' : 'Basic'}
              </span>
            </div>
          </div>
          {!isConfigured && (
            <Button className="w-full mt-4" onClick={() => navigate('/settings')}>
              Configure Gemini
            </Button>
          )}
        </div>

        <CortexWidget />

        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
          <div className="space-y-3">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.route)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left transition-colors"
              >
                <div className="text-gray-400 dark:text-slate-500">{link.icon}</div>
                <span className="text-gray-700 dark:text-slate-300">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
