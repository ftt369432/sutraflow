import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThinkingStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

interface AIThinkingProcessProps {
  isThinking: boolean;
  steps: ThinkingStep[];
  expandable?: boolean;
  className?: string;
}

export function AIThinkingProcess({
  isThinking,
  steps,
  expandable = true,
  className = ""
}: AIThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no steps or not thinking
  if (!isThinking && steps.length === 0) return null;

  const currentStep = steps.find(step => step.status === 'processing');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const hasError = steps.some(step => step.status === 'error');

  const getStatusIcon = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'processing':
        return <Clock className="h-3 w-3 text-blue-500 animate-spin" />;
      default:
        return <div className="h-3 w-3 rounded-full border border-gray-300" />;
    }
  };

  return (
    <div className={cn(
      "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className={cn(
            "h-4 w-4 text-blue-600 dark:text-blue-400",
            isThinking ? "animate-pulse" : ""
          )} />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {isThinking ? (
              currentStep ? `${currentStep.title}...` : 'AI is thinking...'
            ) : (
              `Analysis complete (${completedSteps}/${steps.length} steps)`
            )}
          </span>
          {hasError && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>

        {expandable && steps.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            <span>{isExpanded ? 'Hide' : 'Show'} process</span>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {steps.length > 0 && (
        <div className="mt-2 mb-3">
          <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
            <span>Progress</span>
            <span>{completedSteps}/{steps.length}</span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-800 rounded-full h-1.5">
            <div 
              className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
              style={{ '--progress': `${Math.min((completedSteps / steps.length) * 100, 100)}%`, width: 'var(--progress)' } as React.CSSProperties}
            />
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-2 text-sm">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    step.status === 'completed' ? "text-green-700 dark:text-green-300" :
                    step.status === 'error' ? "text-red-700 dark:text-red-300" :
                    step.status === 'processing' ? "text-blue-700 dark:text-blue-300" :
                    "text-gray-600 dark:text-gray-400"
                  )}>
                    {step.title}
                  </span>
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">
                      {step.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {step.details && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {step.details}
                  </div>
                )}
                {step.metadata && Object.keys(step.metadata).length > 0 && isExpanded && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {Object.entries(step.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Step Quick Summary */}
      {!isExpanded && currentStep && (
        <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
          {currentStep.details || currentStep.title}
        </div>
      )}
    </div>
  );
}

export default AIThinkingProcess;
