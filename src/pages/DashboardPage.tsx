/**
 * Dashboard Page - Modular Sovereign Command Center
 * Clean orchestrator strictly compliant with the 500-line modularity protocol.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  Brain,
  Palette,
  FileText,
  MessageSquare,
  Zap,
  TrendingUp,
  Users,
  Calendar,
  Server,
  FolderOpen,
  Database,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGemini } from '../hooks/useGemini';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { NebiusEngineStatus } from '../components/dashboard/NebiusEngineStatus';
import { QuickActionsGrid, QuickActionItem } from '../components/dashboard/QuickActionsGrid';
import { PerformanceMetrics, DashboardMetricItem } from '../components/dashboard/PerformanceMetrics';
import { RecentActivityWidget } from '../components/dashboard/RecentActivityWidget';
import {
  LifeInActionSchedule,
  ScheduleEventItem,
  ConflictItem,
  ProactiveLogItem
} from '../components/dashboard/LifeInActionSchedule';

import { useCalendarStore } from '../store/calendarStore';

const LOGS_STORAGE_KEY = 'genieflow_proactive_logs';
const CONFLICTS_STORAGE_KEY = 'genieflow_pending_conflicts';

export function DashboardPage() {
  const { user } = useAuth();
  const { isConfigured, status } = useGemini();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeDashboard, setActiveDashboard] = useState<'standard' | 'schedule'>('standard');
  const { events: calendarEvents } = useCalendarStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Dynamically map real calendar events to the LifeInAction schedule timeline
  const scheduleEvents: ScheduleEventItem[] = calendarEvents.map((evt) => {
    const start = new Date(evt.start);
    const end = new Date(evt.end);
    const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    let type = evt.eventType || 'focus';
    let color = 'border-l-4 border-indigo-500 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400';
    if (type === 'hearing' || evt.title.toLowerCase().includes('court') || evt.title.toLowerCase().includes('hearing')) {
      type = 'hearing';
      color = 'border-l-4 border-rose-500 bg-rose-500/5 text-rose-700 dark:text-rose-400';
    } else if (type === 'transit' || evt.title.toLowerCase().includes('transit') || evt.title.toLowerCase().includes('travel')) {
      type = 'transit';
      color = 'border-l-4 border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-400';
    } else if (type === 'prep') {
      color = 'border-l-4 border-sky-500 bg-sky-500/5 text-sky-700 dark:text-sky-400';
    }

    return {
      id: evt.id,
      time: timeStr,
      title: evt.title,
      description: evt.description || 'Scheduled calendar commitment.',
      location: evt.location || 'Local Workspace',
      type,
      badge: evt.allDay ? 'All Day' : 'Confirmed',
      color
    };
  });

  const [proactiveLogs, setProactiveLogs] = useState<ProactiveLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'log-init',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Genie Motor Cortex initialized. Monitoring agenda, travel buffers, and calendar syncing.'
      }
    ];
  });

  const [pendingConflicts, setPendingConflicts] = useState<ConflictItem[]>(() => {
    try {
      const saved = localStorage.getItem(CONFLICTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(proactiveLogs));
    } catch (e) {
      console.error(e);
    }
  }, [proactiveLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFLICTS_STORAGE_KEY, JSON.stringify(pendingConflicts));
    } catch (e) {
      console.error(e);
    }
  }, [pendingConflicts]);

  const handleResolveConflict = (id: string, resolution: string) => {
    setPendingConflicts((prev) => prev.filter((c) => c.id !== id));
    setProactiveLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Resolved conflict: Applied "${resolution}" update.`
      },
      ...prev
    ]);
  };

  const handleAddLog = (text: string) => {
    setProactiveLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text
      },
      ...prev
    ]);
  };

  const quickActions: QuickActionItem[] = [
    {
      id: 'sutraflow-studios',
      title: 'SutraFlow Studios',
      description: '28-Line Pleading Appliance, Multi-Domain Forge & Forensic Auditor',
      icon: <Sparkles className="h-6 w-6 text-emerald-400" />,
      route: '/workbench',
      color: 'text-emerald-500',
      gradient: 'from-slate-800 via-slate-900 to-emerald-950 border border-emerald-500/30'
    },
    {
      id: 'sutradrive-vault',
      title: 'SutraDrive (Vault)',
      description: 'Zero-PHI Evidence, Medical Exhibits & PDF Chronology Storage',
      icon: <FolderOpen className="h-6 w-6 text-teal-400" />,
      route: '/drive',
      color: 'text-teal-500',
      gradient: 'from-slate-800 via-slate-900 to-teal-950 border border-teal-500/30'
    },
    {
      id: 'sutraknowledge-base',
      title: 'SutraKnowledge',
      description: 'WCAB En Banc Precedents, Grounding Briefs & Strategic Playbooks',
      icon: <Database className="h-6 w-6 text-cyan-400" />,
      route: '/knowledge',
      color: 'text-cyan-500',
      gradient: 'from-slate-800 via-slate-900 to-cyan-950 border border-cyan-500/30'
    },
    {
      id: 'rtx4090-local-cluster',
      title: 'Local RTX 4090 GPU',
      description: '24GB VRAM Private Serving, Unsloth QLoRA & Air-Gap Inference',
      icon: <Cpu className="h-6 w-6 text-emerald-400" />,
      route: 'http://192.168.1.115:8080',
      color: 'text-emerald-500',
      gradient: 'from-slate-900 via-slate-950 to-emerald-950 border border-emerald-500/40'
    }
  ];

  const metrics: DashboardMetricItem[] = [
    {
      label: 'AI Conversations',
      value: '47',
      change: '+12%',
      trend: 'up',
      icon: <MessageSquare className="h-5 w-5 text-emerald-500" />
    },
    {
      label: 'Tasks Completed',
      value: '23',
      change: '+8%',
      trend: 'up',
      icon: <Zap className="h-5 w-5 text-teal-500" />
    },
    {
      label: 'Knowledge Items',
      value: '156',
      change: '+15%',
      trend: 'up',
      icon: <FileText className="h-5 w-5 text-cyan-500" />
    },
    {
      label: 'Productivity Score',
      value: '94%',
      change: '+5%',
      trend: 'up',
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />
    }
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Dashboard Switcher Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-emerald-500 dark:text-emerald-400 animate-pulse" />
              <span>Command Center</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure, monitor, and execute your agent operations.
            </p>
          </div>
          <div className="flex bg-slate-200/60 dark:bg-slate-900/90 p-1.5 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setActiveDashboard('standard')}
              className={`px-5 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all duration-300 flex items-center space-x-2 relative overflow-hidden ${
                activeDashboard === 'standard'
                  ? 'bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 text-emerald-400 shadow-md border border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Standard Overview</span>
            </button>
            <button
              onClick={() => setActiveDashboard('schedule')}
              className={`px-5 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all duration-300 flex items-center space-x-2 relative overflow-hidden ${
                activeDashboard === 'schedule'
                  ? 'bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 text-emerald-400 shadow-md border border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-emerald-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              <span>Life In Action Schedule</span>
            </button>
          </div>
        </div>

        {activeDashboard === 'standard' ? (
          <>
            <DashboardHero greeting={getGreeting()} userName={userName} isConfigured={isConfigured} />
            <NebiusEngineStatus />
            <QuickActionsGrid actions={quickActions} />
            <PerformanceMetrics metrics={metrics} />
            <RecentActivityWidget isConfigured={isConfigured} status={status} />
          </>
        ) : (
          <LifeInActionSchedule
            scheduleEvents={scheduleEvents}
            pendingConflicts={pendingConflicts}
            proactiveLogs={proactiveLogs}
            onResolveConflict={handleResolveConflict}
            onAddLog={handleAddLog}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;