import React from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/Collapsible';

interface NeuralThinkingProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

const sanitizeLegalStep = (rawStep: string): string => {
  let s = rawStep.trim().replace(/^[-*•\d.]+\s*/, '');
  if (!s) return '';
  // Translate technical/code jargon into plain practitioner English
  if (s.startsWith('```') || s.includes('import ') || s.includes('def ') || s.includes('print(') || s.includes('const ') || s.startsWith('python ') || s.includes('node ')) {
    return 'Executed deterministic legal calculation engine in background';
  }
  if (s.includes('calculate_lien_penalties_and_interest')) {
    return 'Calculated statutory penalties and 10% interest under LC § 5814';
  }
  if (s.includes('search_courtlistener') || s.includes('search_local_case_law')) {
    return 'Verified authoritative WCAB panel and appellate precedents';
  }
  if (s.includes('lookup_california_labor_code')) {
    return 'Cross-referenced statutory authority in California Labor Code';
  }
  if (s.includes('calculate_omfs_med_legal')) {
    return 'Audited Official Medical Fee Schedule (OMFS) legal-medical billing rates';
  }
  if (s.includes('lookup_icd10_code')) {
    return 'Audited ICD-10 diagnostic coding classification';
  }
  return s;
};

export const NeuralThinking: React.FC<NeuralThinkingProps> = ({
  content,
  isStreaming = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Clean the content (strip the <think> tags if they are still there)
  const displayContent = content.replace(/<\/?think>/gi, '').trim();

  if (!displayContent && !isStreaming) return null;

  // Split content into clean point-by-point steps and sanitize legal steps
  const steps = displayContent
    .split(/\n+/)
    .map(sanitizeLegalStep)
    .filter(Boolean);

  const activeStep = steps.length > 0 ? steps[steps.length - 1] : 'Analyzing legal authority...';

  return (
    <div className={cn("my-2 w-full", className)}>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full rounded-lg border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 shadow-xs overflow-hidden transition-all"
      >
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-purple-500/10 dark:hover:bg-purple-900/20 transition-all group cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <div className="relative shrink-0">
                <Brain className={cn(
                  "h-4 w-4 text-purple-600 dark:text-purple-400",
                  isStreaming && "animate-pulse"
                )} />
                {isStreaming && (
                  <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-amber-400 animate-spin-slow" />
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 shrink-0">
                  {isStreaming ? "Thinking..." : "Thought Process"}
                </span>
                <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-mono bg-purple-100/70 dark:bg-purple-900/50 px-1.5 py-0.2 rounded-full shrink-0">
                  {steps.length} step{steps.length !== 1 ? 's' : ''}
                </span>
                {isStreaming && (
                  <span className="text-[11px] text-purple-600/80 dark:text-purple-400/80 truncate italic min-w-0">
                    {activeStep}
                  </span>
                )}
              </div>
            </div>
            <div className="h-5 w-5 rounded-md hover:bg-purple-200/50 dark:hover:bg-purple-800/40 flex items-center justify-center transition-colors shrink-0">
              {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t border-purple-200/30 dark:border-purple-800/20">
            <div className="space-y-1.5 pt-2">
              {steps.length > 0 ? (
                steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="text-purple-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{step}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">
                  {displayContent || "Synthesizing legal intelligence..."}
                </div>
              )}
              {isStreaming && (
                <div className="flex items-center gap-1.5 text-xs text-purple-500 animate-pulse pt-1">
                  <Activity className="h-3 w-3 animate-spin" />
                  <span>Deterministic computation in progress...</span>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default NeuralThinking;
