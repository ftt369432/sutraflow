import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Bot, Infinity, Workflow,
  ChevronRight, ChevronLeft, Plus,
  Zap, Brain, Sparkles, Settings,
  X, Minimize2, Pin, PinOff,
  MessageSquare, Copy, FileText, Search,
  Calendar, BarChart, Mail, Code, Database,
  Globe, Share, Target, Mic, Shield,
  Scale, Calculator, BookOpen, HardDrive, ShieldCheck, Cpu, Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAssistantStore } from '../../store/assistantStore';

interface RightToolbarProps {
  className?: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  category: 'agent' | 'assistant' | 'workflow' | 'tool' | 'integration';
  action: () => void;
  isPinned?: boolean;
  assistantType?: string;
}

export function RightToolbar({ className }: RightToolbarProps) {
  const navigate = useNavigate();
  const { assistants } = useAssistantStore();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [pinnedActions] = useState<string[]>([
    'lc-4622', 'pdrs-cvc', 'pleading-28', 'ccr-crosswalk', 'drives-hud', 'zero-phi'
  ]);

  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const triggerWorkbenchWorkflow = React.useCallback((promptText: string) => {
    navigate('/workbench');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('genieflow:set-prompt', {
        detail: { prompt: promptText }
      }));
    }, 150);
  }, [navigate]);

  const handleCoreBrainClick = () => {
    navigate('/workbench');
  };

  const allQuickActions: QuickAction[] = React.useMemo(() => [
    // CORE BRAIN (Nebius Nemotron Ultra 550B)
    {
      id: 'conscious-assistant',
      title: 'Nebius Ultra 550B',
      icon: (
        <div className="relative">
          <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
          {(notificationCount > 0 || hasNewMessage) && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-3 w-3 p-0 text-xs"
            >
              {notificationCount > 0 ? notificationCount : ''}
            </Badge>
          )}
        </div>
      ),
      color: 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 hover:from-slate-800 hover:to-emerald-900 border border-emerald-500/40 shadow-lg text-emerald-400',
      category: 'assistant',
      action: handleCoreBrainClick,
      isPinned: true
    },

    // LITIGATION FAST HAMMERS
    {
      id: 'lc-4622',
      title: 'LC § 4622 Penalty Calc',
      icon: <Scale className="w-4 h-4 text-amber-400" />,
      color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-200 hover:text-amber-300',
      category: 'tool',
      action: () => triggerWorkbenchWorkflow('Execute California Labor Code § 4622 audit: verify 60-day deadline, calculate 10% statutory penalty, and calculate 7% annual interest on delayed medical-legal reimbursement under 8 CCR § 10786.'),
      isPinned: true,
      assistantType: '10% Penalty + 7% Interest'
    },
    {
      id: 'pdrs-cvc',
      title: 'PDRS CVC Rating Calc',
      icon: <Calculator className="w-4 h-4 text-blue-400" />,
      color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 text-slate-200 hover:text-blue-300',
      category: 'tool',
      action: () => triggerWorkbenchWorkflow('Calculate California permanent disability rating using the 2005 PDRS Combined Values Chart (CVC) formula.'),
      isPinned: true,
      assistantType: 'Combined Values Arithmetic'
    },
    {
      id: 'pleading-28',
      title: '28-Line Pleading Engine',
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/40 text-slate-200 hover:text-purple-300',
      category: 'tool',
      action: () => triggerWorkbenchWorkflow('Format the active case analysis and draft into strict California 28-line numbered pleading legal paper format.'),
      isPinned: true,
      assistantType: 'California Court Standard'
    },
    {
      id: 'ccr-crosswalk',
      title: '8 CCR Rule Crosswalk',
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300',
      category: 'tool',
      action: () => triggerWorkbenchWorkflow('Crosswalk 8 CCR legacy regulations to active 2026 rules (e.g. 8 CCR § 10451.1 -> § 10786) and verify procedural default waivers.'),
      isPinned: true,
      assistantType: 'Regulatory Practice Hammers'
    },
    {
      id: 'drives-hud',
      title: 'Sovereign Vaults HUD',
      icon: <HardDrive className="w-4 h-4 text-teal-400" />,
      color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/40 text-slate-200 hover:text-teal-300',
      category: 'integration',
      action: () => navigate('/geniedrive'),
      isPinned: true,
      assistantType: 'E:\\ Travel • G:\\ Master'
    },
    {
      id: 'zero-phi',
      title: 'Zero-PHI Egress Shield',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
      color: 'bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 text-slate-200 hover:text-indigo-300',
      category: 'tool',
      action: () => triggerWorkbenchWorkflow('Run Zero-PHI audit to ensure all claimant direct identifiers are scrubbed and de-identified under Cal Bar CMIA rules.'),
      isPinned: true,
      assistantType: '100% De-identified'
    }
  ], [notificationCount, hasNewMessage, triggerWorkbenchWorkflow, navigate]);

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50",
        "transition-all duration-200 ease-out",
        isCollapsed ? "w-16" : "w-80",
        "overflow-hidden",
        className
      )}
    >
      {/* Header Controls */}
      <div className="p-2 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">Quick Tools</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 h-auto hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ?
              <ChevronLeft className="w-3 h-3" /> :
              <ChevronRight className="w-3 h-3" />
            }
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
        {/* Pinned Actions */}
        <div className="p-3">
          <div className="grid gap-2">
            {!isCollapsed && (
              <div className="px-1 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Brain className="w-3 h-3" /> Core Brain
              </div>
            )}
            {allQuickActions
              .filter(action => action.id === 'conscious-assistant')
              .map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all duration-300",
                    "flex items-center gap-3 group hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]",
                    action.color,
                    "text-white font-bold text-sm shadow-xl"
                  )}
                  title={action.title}
                >
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-lg tracking-tight">{action.title}</div>
                      <div className="text-[10px] text-blue-200/60 uppercase tracking-widest font-bold">
                        Sovereign Intelligence
                      </div>
                    </div>
                  )}
                </button>
              ))
            }

            {!isCollapsed && (
              <div className="px-1 mt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                <Sparkles className="w-3 h-3" /> Specialty Agents
              </div>
            )}
            {allQuickActions
              .filter(action => action.isPinned && action.id !== 'conscious-assistant')
              .map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all duration-200",
                    "flex items-center gap-3 group hover:shadow-md border border-transparent hover:border-slate-600/50",
                    action.color,
                    "text-white font-medium text-sm"
                  )}
                  title={action.title}
                >
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{action.title}</div>
                      {action.assistantType && (
                        <div className="text-[10px] opacity-60 uppercase tracking-wider font-bold truncate">
                          {action.assistantType}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))
            }
          </div>
        </div>

        {/* Expandable Sections */}
        {!isCollapsed && (
          <div className="px-3 pb-3 space-y-2">
            {/* Workflows Section */}
            <button
              onClick={() => setShowWorkflows(!showWorkflows)}
              className="w-full p-2 text-left flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Workflow className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Workflows</span>
              <ChevronRight className={cn(
                "w-3 h-3 text-slate-400 ml-auto transition-transform",
                showWorkflows && "rotate-90"
              )} />
            </button>

            {showWorkflows && (
              <div className="ml-6 space-y-1">
                <button className="w-full p-2 text-sm text-slate-600 hover:bg-slate-50 rounded text-left">
                  Document Analysis
                </button>
                <button className="w-full p-2 text-sm text-slate-600 hover:bg-slate-50 rounded text-left">
                  Team Collaboration
                </button>
                <button className="w-full p-2 text-sm text-slate-600 hover:bg-slate-50 rounded text-left">
                  AI Orchestration
                </button>
              </div>
            )}

            {/* All Tools Section */}
            <button
              onClick={() => setShowAllTools(!showAllTools)}
              className="w-full p-2 text-left flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">All Tools</span>
              <ChevronRight className={cn(
                "w-3 h-3 text-slate-400 ml-auto transition-transform",
                showAllTools && "rotate-90"
              )} />
            </button>

            {showAllTools && (
              <div className="ml-6 space-y-1">
                {allQuickActions
                  .filter(action => !action.isPinned)
                  .slice(0, 8)
                  .map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="w-full p-2 text-sm text-slate-600 hover:bg-slate-50 rounded text-left flex items-center gap-2"
                    >
                      <div className="w-4 h-4 flex-shrink-0">
                        {action.icon}
                      </div>
                      <span className="truncate">{action.title}</span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}