import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings } from 'lucide-react';
import { Button } from '../ui/Button';

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  gradient: string;
}

interface QuickActionsGridProps {
  actions: QuickActionItem[];
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
  const navigate = useNavigate();

  const handleActionClick = (route: string) => {
    if (route.startsWith('http://') || route.startsWith('https://')) {
      window.open(route, '_blank', 'noopener,noreferrer');
    } else {
      navigate(route);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quick Actions</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
              Sutra Suite
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            1-click launchpads for your core legal appliances and neural services
          </p>
        </div>
        <Button
          variant="shimmer-glass"
          onClick={() => navigate('/settings')}
          className="text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border-slate-300 dark:border-slate-700/70 hover:border-emerald-500/40 shadow-sm shimmer-button-energy"
        >
          <Settings className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action) => (
          <div
            key={action.id}
            onClick={() => handleActionClick(action.route)}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 shadow-md hover:shadow-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
          >
            {/* Subtle top shimmer glow on card hover */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-md shadow-slate-900/20`}>
              {action.icon}
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center justify-between">
              <span>{action.title}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold">
                LAUNCH →
              </span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs mb-4 leading-relaxed line-clamp-2">
              {action.description}
            </p>

            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span>Launch appliance</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
