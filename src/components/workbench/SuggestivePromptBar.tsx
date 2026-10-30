import React from 'react';
import { Sparkles, Brain, Zap, Target, ArrowRight, FolderPlus, Scale, ShieldCheck } from 'lucide-react';

export interface SuggestivePrompt {
  id: string;
  label: string;
  prompt: string;
  icon?: 'brain' | 'zap' | 'target' | 'folder' | 'scale' | 'shield';
  category?: 'genesis' | 'workflow' | 'audit' | 'action';
}

interface SuggestivePromptBarProps {
  suggestions: SuggestivePrompt[];
  onSelectPrompt: (prompt: string) => void;
  isLoading?: boolean;
}

export const SuggestivePromptBar: React.FC<SuggestivePromptBarProps> = ({
  suggestions,
  onSelectPrompt,
  isLoading = false
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  const renderIcon = (icon?: string) => {
    switch (icon) {
      case 'brain': return <Brain className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />;
      case 'zap': return <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'target': return <Target className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />;
      case 'folder': return <FolderPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'scale': return <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />;
      case 'shield': return <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="px-3 py-1.5 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-200/70 dark:border-slate-800/80 backdrop-blur-md flex items-center gap-2 overflow-x-auto transition" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
        <span className="hidden sm:inline">Next Actions:</span>
      </div>

      <div 
        className="flex items-center gap-1.5 overflow-x-auto py-0.5" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white hover:bg-blue-50/90 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-700 dark:text-slate-200 dark:hover:text-white border border-slate-200/90 hover:border-blue-300 dark:border-slate-700/70 dark:hover:border-blue-500/50 shadow-xs hover:shadow-sm transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-40 group"
          >
            {renderIcon(item.icon)}
            <span className="truncate max-w-[240px] sm:max-w-[340px]">{item.label}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};
