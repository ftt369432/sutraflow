import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play } from 'lucide-react';
import { autoSeedDemoData } from '../../services/demo/autoSeedDemoData';
import { useUserStore } from '../../stores/userStore';

interface DemoLaunchButtonProps {
  variant?: 'primary' | 'header' | 'banner';
  className?: string;
}

export const DemoLaunchButton: React.FC<DemoLaunchButtonProps> = ({ variant = 'primary', className = '' }) => {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const handleLaunchDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Set active demo user in store
    setUser({
      id: 'demo-user-id',
      email: 'demo-judge@xprize.org',
      name: 'XPRIZE Demo Administrator',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });

    // 2. Seed comprehensive test data across all stores
    autoSeedDemoData();

    // 3. Store demo flags
    localStorage.setItem('sutra_demo_mode_active', 'true');
    localStorage.setItem('sutra_authenticated', 'true');
    localStorage.setItem('genieflow_demo_mode_active', 'true');
    localStorage.setItem('genieflow_authenticated', 'true');

    // 4. Redirect to Dashboard immediately
    navigate('/dashboard');
  };

  if (variant === 'header') {
    return (
      <button
        onClick={handleLaunchDemo}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 shadow-md hover:shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95 border border-cyan-400/30 ${className}`}
        title="Launch Instant Demo Mode with pre-populated tasks, calendar, agents, and docs"
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
        <span>Instant Demo</span>
      </button>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="w-full bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-cyan-500/30 px-4 py-2.5 text-center text-sm text-white flex items-center justify-center gap-3">
        <span className="font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          Evaluating SutraFlow AI for XPRIZE / Devpost?
        </span>
        <button
          onClick={handleLaunchDemo}
          className="px-3.5 py-1 text-xs font-bold bg-cyan-500 text-slate-950 rounded-md hover:bg-cyan-400 hover:text-black transition-colors shadow-sm"
        >
          ⚡ 1-Click Instant Demo
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLaunchDemo}
      className={`w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 border border-cyan-400/30 ${className}`}
    >
      <Play className="w-4 h-4 fill-white" />
      <span>⚡ Launch Instant Demo Mode (1-Click)</span>
    </button>
  );
};
