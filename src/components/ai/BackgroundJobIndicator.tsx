import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Play, CheckCircle, AlertTriangle, ChevronRight, Inbox, RefreshCw, Layers } from 'lucide-react';
import { backgroundAgentService, AgentJob } from '../../services/backgroundAgentService';

export const BackgroundJobIndicator: React.FC = () => {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = backgroundAgentService.subscribe((list) => {
      setJobs(list);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending');
  const runningCount = activeJobs.length;

  const triggerRefresh = () => {
    backgroundAgentService.fetchJobs();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Target Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
          runningCount > 0
            ? 'bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/5 animate-pulse'
            : 'bg-white/3 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
        }`}
        title={`${runningCount} background tasks active`}
      >
        <Layers className={`w-4.5 h-4.5 ${runningCount > 0 ? 'animate-spin-slow' : ''}`} />
        
        {/* Count Badge */}
        {runningCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-950">
            {runningCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-gradient-to-b from-[#0e0e15]/95 to-[#08080c]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">Background Agents</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Always-on cloud executions</p>
            </div>
            <button
              onClick={triggerRefresh}
              className="p-1 rounded-lg text-slate-450 hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh job list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <Inbox className="w-8 h-8 opacity-40 mb-1.5" />
                <p className="text-[10px] font-medium">No background jobs registered</p>
              </div>
            ) : (
              jobs.map((job) => {
                const isPending = job.status === 'pending';
                const isRunning = job.status === 'running';
                const isCompleted = job.status === 'completed';
                const isFailed = job.status === 'failed';

                return (
                  <div 
                    key={job.id} 
                    className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/3 hover:border-white/10 transition-all text-left flex gap-3 items-start"
                  >
                    {/* Status Icon */}
                    <div className="mt-0.5">
                      {isPending && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                      {isRunning && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                      {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {isFailed && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-slate-350 truncate">
                          {job.payload.agentName || 'Background Agent'}
                        </span>
                        <span className="text-[8px] text-slate-500">
                          {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {job.payload.prompt}
                      </p>

                      {/* Display results summary */}
                      {isCompleted && job.result?.fileId && (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-purple-400 font-bold hover:underline cursor-pointer">
                          <span>Open Output File</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
