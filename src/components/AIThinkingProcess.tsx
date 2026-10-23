import React from 'react';
import { Brain, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThinkingStep {
  id: string;
  text: string;
  type: 'analysis' | 'planning' | 'execution';
  status: 'in-progress' | 'completed' | 'failed';
  timestamp: Date;
}

interface AIThinkingProcessProps {
  steps: ThinkingStep[];
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export const AIThinkingProcess: React.FC<AIThinkingProcessProps> = ({
  steps,
  isExpanded,
  onToggle,
  className
}) => {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const getStepIcon = (step: ThinkingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <CheckCircle className="h-4 w-4 text-red-500" />;
      case 'in-progress':
      default:
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStepTypeColor = (type: ThinkingStep['type']) => {
    switch (type) {
      case 'analysis':
        return 'text-blue-600 dark:text-blue-400';
      case 'planning':
        return 'text-purple-600 dark:text-purple-400';
      case 'execution':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (steps.length === 0) return null;

  return (
    <div className={cn("bg-muted/50 border border-border rounded-lg p-4 space-y-3", className)}>
      {/* Header with AI thinking indicator */}
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-medium text-sm">AI Thinking Process</span>
          <span className="text-xs text-muted-foreground">
            ({completedSteps}/{totalSteps} steps)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-background rounded-full h-2 relative overflow-hidden">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out absolute top-0 left-0"
          style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
        />
      </div>

      {/* Thinking steps (expandable) */}
      {isExpanded && (
        <div className="space-y-2">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="flex items-start gap-3 p-2 rounded-md bg-background/50"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs font-medium capitalize", getStepTypeColor(step.type))}>
                    {step.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsed view shows current step */}
      {!isExpanded && steps.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {steps.find(step => step.status === 'in-progress')?.text || 
           steps[steps.length - 1]?.text || 
           'Processing...'}
        </div>
      )}
    </div>
  );
};

export default AIThinkingProcess;
