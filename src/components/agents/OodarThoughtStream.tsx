import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Eye, Compass, Brain, Zap, RefreshCw, CheckCircle2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export type OodarPhase = 'observe' | 'orient' | 'decide' | 'act' | 'reflect' | 'idle' | 'failed';

export interface AgentThoughtState {
  missionId: string;
  agentName: string;
  currentPhase: OodarPhase;
  logs: {
    timestamp: Date;
    phase: OodarPhase;
    message: string;
    details?: string;
  }[];
  isComplete: boolean;
  error?: string;
}

interface OodarThoughtStreamProps {
  state: AgentThoughtState;
  className?: string;
  compact?: boolean;
}

const PHASE_CONFIG = {
  idle: { icon: Loader2, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Idle' },
  observe: { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40', label: 'Observing' },
  orient: { icon: Compass, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/40', label: 'Orienting' },
  decide: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/40', label: 'Deciding' },
  act: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/40', label: 'Acting' },
  reflect: { icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Reflecting' },
  failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/40', label: 'Failed' },
};

export function OodarThoughtStream({ state, className, compact = false }: OodarThoughtStreamProps) {
  const currentConfig = PHASE_CONFIG[state.currentPhase === 'failed' ? 'failed' : state.isComplete ? 'idle' : state.currentPhase];
  const CurrentIcon = state.isComplete ? CheckCircle2 : currentConfig.icon;

  const phaseSequence: OodarPhase[] = ['observe', 'orient', 'decide', 'act', 'reflect'];
  const currentIndex = phaseSequence.indexOf(state.currentPhase === 'idle' || state.currentPhase === 'failed' ? 'observe' : state.currentPhase);

  // Auto-scroll logs to bottom
  const logsEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  return (
    <Card className={cn("flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-hidden", className)}>
      
      {/* ── HEADER: Agent Identity & Mission ── */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center space-x-2">
          <div className={cn("p-1.5 rounded-md", currentConfig.bg, currentConfig.color)}>
            <CurrentIcon className={cn("w-4 h-4", state.currentPhase !== 'idle' && !state.isComplete && state.currentPhase !== 'failed' && "animate-pulse")} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {state.agentName}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono">
              Mission: {state.missionId.split('-')[0]}
            </div>
          </div>
        </div>
        <div>
          {state.isComplete ? (
            <Badge variant="default" className="text-[10px] bg-emerald-500 hover:bg-emerald-600">Mission Complete</Badge>
          ) : state.error ? (
            <Badge variant="destructive" className="text-[10px]">Failed</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-white dark:bg-gray-950 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse inline-block" />
              Live Stream
            </Badge>
          )}
        </div>
      </div>

      {/* ── PHASE TRACKER (O.O.D.A.R) ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950/30 border-b border-gray-100 dark:border-gray-800">
        {phaseSequence.map((phase, idx) => {
          const config = PHASE_CONFIG[phase];
          const Icon = config.icon;
          const isActive = idx === currentIndex && !state.isComplete && state.currentPhase !== 'failed';
          const isPast = idx < currentIndex || state.isComplete;
          
          return (
            <React.Fragment key={phase}>
              <div className="flex flex-col items-center space-y-1 relative group">
                <div 
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? cn(config.bg, config.color, "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 shadow-sm") 
                    : isPast ? "bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900" 
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800/50 dark:text-gray-600"
                  )}
                >
                  {isPast && !isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className={cn("w-3.5 h-3.5", isActive && "animate-pulse")} />}
                </div>
                {!compact && (
                  <span className={cn(
                    "text-[10px] font-semibold tracking-wider uppercase",
                    isActive ? config.color : isPast ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                  )}>
                    {phase}
                  </span>
                )}
              </div>
              {idx < phaseSequence.length - 1 && (
                <div className="flex-1 h-px mx-1 relative">
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800" />
                  <div 
                    className="absolute inset-y-0 left-0 bg-gray-800 dark:bg-gray-200 transition-all duration-500 ease-in-out" 
                    style={{ width: isPast ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── THOUGHT LOGS ── */}
      <div className="flex-1 bg-gray-950 p-3 overflow-y-auto max-h-64 font-mono text-xs">
        {state.logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 italic">
            Waiting for sensory input...
          </div>
        ) : (
          <div className="space-y-2.5">
            {state.logs.map((log, i) => {
              const phaseInfo = PHASE_CONFIG[log.phase];
              return (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start space-x-2">
                    {/* Timestamp & Phase Tag */}
                    <div className="flex-shrink-0 mt-0.5 w-16 text-right">
                      <span className="text-[10px] text-gray-600">
                        {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded mr-2", phaseInfo.bg, phaseInfo.color)}>
                        {log.phase.toUpperCase()}
                      </span>
                      <span className="text-gray-300 leading-relaxed">
                        {log.message}
                      </span>
                      {log.details && (
                        <div className="mt-1 pl-2 border-l-2 border-gray-800 text-gray-500 text-[10px]">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {state.error && (
              <div className="mt-2 p-2 rounded bg-red-950/50 border border-red-900/50 text-red-400">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
                CRITICAL FAILURE: {state.error}
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function DemoOodarStream() {
  const [state, setState] = useState<AgentThoughtState>({
    missionId: 'case-prep-001-' + Date.now(),
    agentName: 'Legal Agent Core',
    currentPhase: 'idle',
    logs: [],
    isComplete: false
  });

  useEffect(() => {
    const runSimulation = async () => {
      // Idle -> Observe
      await new Promise(r => setTimeout(r, 1000));
      setState(s => ({ 
        ...s, currentPhase: 'observe', 
        logs: [...s.logs, {
          timestamp: new Date(), phase: 'observe', 
          message: 'Searching KB for recent WCAB filings', 
          details: 'Found 3 documents matching case #993-LAX'
        }] 
      }));

      // Observe -> Orient
      await new Promise(r => setTimeout(r, 2000));
      setState(s => ({ 
        ...s, currentPhase: 'orient', 
        logs: [...s.logs, {
          timestamp: new Date(), phase: 'orient', 
          message: 'Extracting key medical findings',
          details: 'Identifying contradictory QME statements across records'
        }] 
      }));

      // Orient -> Decide
      await new Promise(r => setTimeout(r, 3000));
      setState(s => ({ 
        ...s, currentPhase: 'decide', 
        logs: [...s.logs, {
          timestamp: new Date(), phase: 'decide', 
          message: 'Drafting objection strategy',
          details: 'Selected template: Generic MTUS Objection'
        }] 
      }));

      // Decide -> Act
      await new Promise(r => setTimeout(r, 2500));
      setState(s => ({ 
        ...s, currentPhase: 'act', 
        logs: [...s.logs, {
          timestamp: new Date(), phase: 'act', 
          message: 'Calling Sentinel to verify drafting safety',
          details: 'Safety ok. Invoking text-generation model (Claude).' 
        }] 
      }));

      // Act -> Reflect
      await new Promise(r => setTimeout(r, 4000));
      setState(s => ({ 
        ...s, currentPhase: 'reflect', 
        logs: [...s.logs, {
          timestamp: new Date(), phase: 'reflect',
          message: 'Reviewing generated draft against Guardrails.',
          details: 'Draft conforms to MTUS guidelines. No hallucinations detected.'
        }]
      }));

      // Complete
      await new Promise(r => setTimeout(r, 2000));
      setState(s => ({ 
        ...s, currentPhase: 'idle', isComplete: true,
        logs: [...s.logs, {
          timestamp: new Date(), phase: 'reflect',
          message: 'Mission accomplished. Returning artifact to user.'
        }]
      }));
    };

    runSimulation();
  }, []);

  return <OodarThoughtStream state={state} className="h-full border-0 shadow-none" />;
}

export function LiveOodarStream({ agentId }: { agentId: string }) {
  const [state, setState] = useState<AgentThoughtState | null>(null);

  useEffect(() => {
    // 1. Initial fetch
    const fetchState = async () => {
      const { data, error } = await supabase
        .from('agent_state')
        .select('*')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        setState({
          missionId: data.mission_id || 'unknown',
          agentName: data.agent_id,
          currentPhase: data.current_phase,
          logs: data.context_window || [],
          isComplete: data.status === 'completed',
          error: data.last_error
        });
      }
    };

    fetchState();

    // 2. Realtime Subscription (Zero API Credits)
    const channel = supabase.channel(`agent_state_${agentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_state', filter: `agent_id=eq.${agentId}` },
        (payload) => {
          const data = payload.new as any;
          setState({
            missionId: data.mission_id || 'unknown',
            agentName: data.agent_id,
            currentPhase: data.current_phase,
            logs: data.context_window || [],
            isComplete: data.status === 'completed',
            error: data.last_error
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  if (!state) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500 font-mono text-xs">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Awaiting database connection for {agentId}...
      </div>
    );
  }

  return <OodarThoughtStream state={state} className="h-full border-0 shadow-none" />;
}
