import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, BookOpen, Plus, ChevronDown, ChevronUp, Sun, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import AIProviderSwitcher from '@/components/ai/AIProviderSwitcher';
import { cn } from '@/lib/utils';

export interface AssistantSidebarPanelProps {
  autoCloseSidebar: boolean;
  setAutoCloseSidebar: (val: boolean) => void;
  handleNewChat: () => void;
  isRecentAssistantsCollapsed: boolean;
  setIsRecentAssistantsCollapsed: (val: boolean) => void;
  assistants: any[];
  handleStartChatWithAssistant: (assistant: any) => void;
  isMyAssistantsCollapsed: boolean;
  setIsMyAssistantsCollapsed: (val: boolean) => void;
  assistantPresets: Set<string>;
  selectedAssistant: any | null;
  setShowSidebar: (val: boolean) => void;
}

export const AssistantSidebarPanel: React.FC<AssistantSidebarPanelProps> = ({
  autoCloseSidebar,
  setAutoCloseSidebar,
  handleNewChat,
  isRecentAssistantsCollapsed,
  setIsRecentAssistantsCollapsed,
  assistants,
  handleStartChatWithAssistant,
  isMyAssistantsCollapsed,
  setIsMyAssistantsCollapsed,
  assistantPresets,
  selectedAssistant,
  setShowSidebar
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex-shrink-0 border-b border-border/40 bg-white dark:bg-slate-900 transition-all duration-300">
      <div className="p-2.5">
        {/* Navigation Links - ULTRA COMPACT */}
        <div className="flex flex-col gap-1.5 mb-2.5">
          <div className="flex gap-1 justify-between items-center">
            <div className="flex gap-1 flex-1">
              <Link
                to="/assistants"
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                  "bg-slate-500/5 text-slate-500 hover:bg-slate-500/10",
                  "dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                )}
              >
                <Bot className="h-3 w-3" />
                Agents
              </Link>
              <Link
                to="/knowledge"
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                  "bg-slate-500/5 text-slate-500 hover:bg-slate-500/10",
                  "dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                )}
              >
                <BookOpen className="h-3 w-3" />
                V-Docs
              </Link>
            </div>
          </div>
        </div>

        {/* AI Provider Switcher - TIGHTENED */}
        <div className={cn(
          "mb-2.5 p-1.5 rounded-lg border transition-all duration-300",
          "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm"
        )}>
          <AIProviderSwitcher />
        </div>

        {/* New Chat Button */}
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 mb-4 h-9 text-xs font-bold border-dashed transition-all",
            "border-slate-300 text-slate-600 hover:bg-slate-50",
            "dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
          onClick={handleNewChat}
        >
          <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-md">
            <Plus className="h-3 w-3" />
          </div>
          New Mission
        </Button>

        {/* Recent Assistants */}
        <div className="space-y-2">
          <div
            className="flex items-center justify-between px-2 cursor-pointer group"
            onClick={() => setIsRecentAssistantsCollapsed(!isRecentAssistantsCollapsed)}
          >
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Recent Analysts</h4>
            <div className="p-0.5 rounded bg-slate-100 dark:bg-slate-800">
               {isRecentAssistantsCollapsed ? (
                <ChevronDown className="h-3 w-3 text-slate-400" />
              ) : (
                <ChevronUp className="h-3 w-3 text-slate-400" />
              )}
            </div>
          </div>
          {!isRecentAssistantsCollapsed && (
            <div className="flex space-x-2 px-2">
              {assistants.slice(0, 3).map(assistant => (
                <TooltipProvider key={assistant.id}>
                  <Tooltip content={assistant.name}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-xl p-0 overflow-hidden border transition-all duration-300",
                        "border-slate-200 hover:border-blue-500 shadow-sm",
                        "dark:border-slate-800 dark:hover:border-blue-500"
                      )}
                      onClick={() => handleStartChatWithAssistant(assistant)}
                    >
                      {assistant.avatar ? (
                        <img src={assistant.avatar} alt={assistant.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="bg-slate-100 dark:bg-slate-800 h-full w-full flex items-center justify-center">
                            <Bot className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </Button>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {assistants.length === 0 && (
                <p className="text-[10px] text-slate-400 italic px-2">Awaiting deployment...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* My Assistants */}
      <div className="shrink-0 max-h-48 overflow-y-auto custom-scrollbar border-b border-border/30">
        <div className="p-3 border-t border-border/30">
          <div
            className="flex items-center justify-between px-1 mb-2 cursor-pointer group"
            onClick={() => setIsMyAssistantsCollapsed(!isMyAssistantsCollapsed)}
          >
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Agent Library</h4>
            <div className="p-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {isMyAssistantsCollapsed ? (
                <ChevronDown className="h-3 w-3 text-slate-400" />
              ) : (
                <ChevronUp className="h-3 w-3 text-slate-400" />
              )}
            </div>
          </div>
          {!isMyAssistantsCollapsed && (
            <div className="space-y-1">
              {assistants.map((assistant) => {
                const hasPreset = assistantPresets.has(assistant.id);
                const isActive = selectedAssistant?.id === assistant.id;
                return (
                  <div
                    key={assistant.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all duration-300 relative group',
                      isActive 
                        ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100 ring-1 ring-blue-500/30' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartChatWithAssistant(assistant);
                      if (autoCloseSidebar) {
                        setShowSidebar(false);
                      }
                    }}
                  >
                    <div className="relative shrink-0">
                      {assistant.avatar && (assistant.avatar.startsWith('/') || assistant.avatar.startsWith('http') || assistant.avatar.startsWith('data:')) ? (
                        <img 
                          src={assistant.avatar} 
                          alt={assistant.name} 
                          className="h-7 w-7 rounded-lg object-cover ring-1 ring-border/50" 
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : assistant.avatar ? (
                        <div className="h-7 w-7 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center text-sm">
                          {assistant.avatar}
                        </div>
                      ) : (
                        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className="avatar-fallback hidden h-7 w-7 bg-slate-200 dark:bg-slate-700 rounded-lg items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      {isActive && (
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-none">{assistant.name}</p>
                      <p className="text-[10px] opacity-60 truncate mt-1 italic">{assistant.description || 'System Analyst'}</p>
                    </div>
                    
                    {/* 🎯 Preset Indicator */}
                    {hasPreset && (
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500 animate-pulse shrink-0" 
                           title="Workspace preset saved" />
                    )}
                  </div>
                );
              })}
              {assistants.length === 0 && (
                <p className="text-[10px] text-slate-400 px-3 py-2 italic text-center">No agents active in this sector.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
