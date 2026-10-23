/**
 * 🧠 AGENTIC THINKING PANEL
 * 
 * Displays real-time Think→Research→Act→Reflect phases during autonomous execution.
 * Shows tool usage badges, confidence scores, and self-correction indicators.
 * 
 * This is the visual bridge between AgenticLoopExecutor and the user.
 */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import {
  Brain,
  Search,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Wrench,
  Target,
  Loader2,
  Sparkles
} from 'lucide-react';

// Phase definition for the agentic loop
export type AgenticPhase = 'idle' | 'thinking' | 'researching' | 'acting' | 'reflecting' | 'complete' | 'error';

export interface AgenticStep {
  phase: AgenticPhase;
  message: string;
  details?: string;
  toolName?: string;
  timestamp: Date;
  confidence?: number;
}

export interface AgenticThinkingState {
  active: boolean;
  currentPhase: AgenticPhase;
  iteration: number;
  maxIterations: number;
  steps: AgenticStep[];
  toolsUsed: string[];
  confidence: number;
  selfCorrectionCount: number;
  isComplete: boolean;
  error?: string;
}

interface AgenticThinkingPanelProps {
  state: AgenticThinkingState;
  isDark?: boolean;
  compact?: boolean;
  className?: string;
}

// Phase metadata for display
const PHASE_CONFIG: Record<AgenticPhase, {
  icon: React.ComponentType<any>;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulseColor: string;
}> = {
  idle: {
    icon: Brain,
    label: 'Preparing',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    pulseColor: 'bg-gray-400'
  },
  thinking: {
    icon: Brain,
    label: 'Thinking',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    pulseColor: 'bg-violet-400'
  },
  researching: {
    icon: Search,
    label: 'Researching',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    pulseColor: 'bg-blue-400'
  },
  acting: {
    icon: Zap,
    label: 'Executing',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    pulseColor: 'bg-amber-400'
  },
  reflecting: {
    icon: RefreshCw,
    label: 'Reflecting',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    pulseColor: 'bg-emerald-400'
  },
  complete: {
    icon: CheckCircle2,
    label: 'Complete',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    pulseColor: 'bg-green-400'
  },
  error: {
    icon: AlertTriangle,
    label: 'Error',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    pulseColor: 'bg-red-400'
  }
};

// Confidence indicator component
function ConfidenceIndicator({ confidence, isDark }: { confidence: number; isDark?: boolean }) {
  const percentage = Math.round(confidence * 100);
  let colorClass = 'text-red-400';
  let barColor = 'bg-red-500';

  if (percentage >= 80) {
    colorClass = 'text-green-400';
    barColor = 'bg-green-500';
  } else if (percentage >= 60) {
    colorClass = 'text-yellow-400';
    barColor = 'bg-yellow-500';
  } else if (percentage >= 40) {
    colorClass = 'text-orange-400';
    barColor = 'bg-orange-500';
  }

  return (
    <div className="flex items-center gap-2">
      <Target className={cn('h-3.5 w-3.5', colorClass)} />
      <div className="flex items-center gap-1.5">
        <div className={cn(
          'w-16 h-1.5 rounded-full overflow-hidden',
          isDark ? 'bg-white/10' : 'bg-gray-200'
        )}>
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn('text-[11px] font-mono font-semibold tabular-nums', colorClass)}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

// Tool badge component
function ToolBadge({ toolName, isDark }: { toolName: string; isDark?: boolean }) {
  // Clean up tool name for display
  const displayName = toolName
    .replace(/_/g, ' ')
    .replace(/^(search|get|create|find|fetch|run|analyze)/, (m) => m.charAt(0).toUpperCase() + m.slice(1));

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
      'border transition-all duration-200',
      isDark
        ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
    )}>
      <Wrench className="h-2.5 w-2.5" />
      {displayName}
    </span>
  );
}

/**
 * 🧠 AgenticThinkingPanel
 * 
 * Renders a live visualization of the AI's autonomous execution phases.
 * Designed to be embedded inline in the chat message stream.
 */
export function AgenticThinkingPanel({
  state,
  isDark = true,
  compact = false,
  className
}: AgenticThinkingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest step
  useEffect(() => {
    if (isExpanded && stepsEndRef.current) {
      stepsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.steps.length, isExpanded]);

  if (!state.active && !state.isComplete) return null;

  const currentConfig = PHASE_CONFIG[state.currentPhase] || PHASE_CONFIG.idle;
  const PhaseIcon = currentConfig.icon;
  const isRunning = state.active && !state.isComplete;

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-300',
      isDark
        ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-white/10 shadow-lg shadow-black/20'
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md',
      className
    )}>
      {/* Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'hover:bg-white/5 transition-colors cursor-pointer',
          'focus:outline-none focus:ring-1 focus:ring-indigo-500/50'
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Animated phase icon */}
          <div className="relative">
            <PhaseIcon className={cn('h-4 w-4', currentConfig.color)} />
            {isRunning && (
              <span className={cn(
                'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full',
                currentConfig.pulseColor,
                'animate-ping'
              )} />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-xs font-semibold',
              isDark ? 'text-white/90' : 'text-gray-800'
            )}>
              {isRunning ? 'Autonomous Execution' : state.isComplete ? 'Execution Complete' : 'Execution Failed'}
            </span>

            {/* Phase badge */}
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-md',
              currentConfig.bgColor,
              currentConfig.color
            )}>
              {currentConfig.label}
            </span>

            {/* Iteration counter */}
            {state.iteration > 0 && (
              <span className={cn(
                'text-[10px] font-mono transition-all duration-300',
                state.currentPhase === 'reflecting'
                  ? 'animate-pulse text-emerald-400 font-bold scale-105'
                  : isDark ? 'text-white/40' : 'text-gray-400'
              )}>
                Loop {state.iteration}/{state.maxIterations}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence indicator */}
          {state.confidence > 0 && (
            <ConfidenceIndicator confidence={state.confidence} isDark={isDark} />
          )}

          {/* Self-correction badge */}
          {state.selfCorrectionCount > 0 && (
            <span className={cn(
              'flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
              'bg-orange-500/15 text-orange-400'
            )}>
              <RefreshCw className={cn("h-2.5 w-2.5", state.currentPhase === 'reflecting' && "animate-spin")} />
              {state.selfCorrectionCount}x corrected
            </span>
          )}

          {/* Loading spinner */}
          {isRunning && (
            <Loader2 className={cn('h-3.5 w-3.5 animate-spin', currentConfig.color)} />
          )}

          {/* Expand/collapse */}
          {isExpanded
            ? <ChevronUp className={cn('h-3.5 w-3.5', isDark ? 'text-white/40' : 'text-gray-400')} />
            : <ChevronDown className={cn('h-3.5 w-3.5', isDark ? 'text-white/40' : 'text-gray-400')} />
          }
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={cn(
          'px-3 pb-3 pt-1 space-y-2',
          'border-t',
          isDark ? 'border-white/5' : 'border-gray-100'
        )}>
          {/* Step Timeline */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {state.steps.map((step, index) => {
              const stepConfig = PHASE_CONFIG[step.phase] || PHASE_CONFIG.idle;
              const StepIcon = stepConfig.icon;
              const isLatest = index === state.steps.length - 1;

              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-2 py-1 px-2 rounded-lg text-xs transition-all',
                    isLatest && isRunning
                      ? cn(stepConfig.bgColor, 'ring-1', stepConfig.borderColor)
                      : 'opacity-70'
                  )}
                >
                  <StepIcon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', stepConfig.color)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      isDark ? 'text-white/80' : 'text-gray-700'
                    )}>
                      {step.message}
                    </p>
                    {step.details && (
                      <p className={cn(
                        'text-[10px] mt-0.5 line-clamp-2',
                        isDark ? 'text-white/40' : 'text-gray-400'
                      )}>
                        {step.details}
                      </p>
                    )}
                  </div>
                  {step.toolName && (
                    <ToolBadge toolName={step.toolName} isDark={isDark} />
                  )}
                </div>
              );
            })}
            <div ref={stepsEndRef} />
          </div>

          {/* Tools Used Summary */}
          {state.toolsUsed.length > 0 && (
            <div className={cn(
              'flex flex-wrap gap-1.5 pt-1.5 border-t',
              isDark ? 'border-white/5' : 'border-gray-100'
            )}>
              <Sparkles className={cn('h-3 w-3 mt-0.5', isDark ? 'text-white/30' : 'text-gray-400')} />
              {state.toolsUsed.map((tool, index) => (
                <ToolBadge key={index} toolName={tool} isDark={isDark} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ HELPER: Create an initial empty state ============

export function createInitialAgenticState(): AgenticThinkingState {
  return {
    active: false,
    currentPhase: 'idle',
    iteration: 0,
    maxIterations: 10,
    steps: [],
    toolsUsed: [],
    confidence: 0,
    selfCorrectionCount: 0,
    isComplete: false
  };
}

export default AgenticThinkingPanel;
