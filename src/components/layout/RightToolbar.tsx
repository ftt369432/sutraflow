import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Workflow, ChevronRight, ChevronLeft, Plus,
  Brain, Sparkles, Settings, X, Pin, PinOff,
  FileText, Search, Scale, Calculator, BookOpen,
  HardDrive, ShieldCheck, Check, Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAssistantStore } from '../../store/assistantStore';
import { getAllWorkflows, WorkflowItem } from '../workbench/workflowData';
import { renderWorkflowIcon } from '../workbench/DynamicWorkflowCarousel';

interface RightToolbarProps {
  className?: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  category: 'agent' | 'assistant' | 'workflow' | 'tool' | 'integration';
  action: (e?: React.MouseEvent) => void;
  isPinned?: boolean;
  assistantType?: string;
  badgeColor?: string;
  isCustomWorkflow?: boolean;
}

const PINNED_STORAGE_KEY = 'sutra_pinned_specialty_agents';
const DEFAULT_PINNED = ['lc-4622', 'pdrs-cvc', 'pleading-28', 'ccr-crosswalk', 'drives-hud', 'zero-phi'];

const getCategoryStyles = (category?: string) => {
  switch (category) {
    case 'petition':
      return {
        cardColor: 'bg-gradient-to-r from-slate-900 via-purple-950/25 to-slate-900 border-purple-500/40 hover:border-purple-400 text-slate-100 hover:shadow-[0_0_15px_rgba(168,85,247,0.18)]',
        badgeColor: 'bg-purple-500/10 border-purple-500/30 text-purple-300'
      };
    case 'audit':
      return {
        cardColor: 'bg-gradient-to-r from-slate-900 via-amber-950/25 to-slate-900 border-amber-500/40 hover:border-amber-400 text-slate-100 hover:shadow-[0_0_15px_rgba(245,158,11,0.18)]',
        badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      };
    case 'qme':
      return {
        cardColor: 'bg-gradient-to-r from-slate-900 via-teal-950/25 to-slate-900 border-teal-500/40 hover:border-teal-400 text-slate-100 hover:shadow-[0_0_15px_rgba(20,184,166,0.18)]',
        badgeColor: 'bg-teal-500/10 border-teal-500/30 text-teal-300'
      };
    case 'trial':
      return {
        cardColor: 'bg-gradient-to-r from-slate-900 via-blue-950/25 to-slate-900 border-blue-500/40 hover:border-blue-400 text-slate-100 hover:shadow-[0_0_15px_rgba(59,130,246,0.18)]',
        badgeColor: 'bg-blue-500/10 border-blue-500/30 text-blue-300'
      };
    case 'lien':
      return {
        cardColor: 'bg-gradient-to-r from-slate-900 via-emerald-950/25 to-slate-900 border-emerald-500/40 hover:border-emerald-400 text-slate-100 hover:shadow-[0_0_15px_rgba(16,185,129,0.18)]',
        badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      };
    default:
      return {
        cardColor: 'bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 border-indigo-500/40 hover:border-indigo-400 text-slate-100 hover:shadow-[0_0_15px_rgba(99,102,241,0.18)]',
        badgeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
      };
  }
};

export function RightToolbar({ className }: RightToolbarProps) {
  const navigate = useNavigate();
  const { assistants } = useAssistantStore();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [showWorkflowPicker, setShowWorkflowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PINNED_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_e) {}
    return DEFAULT_PINNED;
  });

  const togglePin = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch (_e) {}
      return next;
    });
  }, []);

  const triggerWorkbenchWorkflow = useCallback((promptText: string, e?: React.MouseEvent) => {
    navigate('/workbench');
    const autoSubmit = Boolean(e?.shiftKey);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('genieflow:set-prompt', {
          detail: { prompt: promptText, autoSubmit }
        })
      );
    }, 150);
  }, [navigate]);

  const handleCoreBrainClick = () => {
    navigate('/workbench');
  };

  const allWorkflows = useMemo(() => getAllWorkflows(), []);

  const allQuickActions: QuickAction[] = useMemo(() => {
    // 1. Core Native Fast Hammers
    const baseHammers: QuickAction[] = [
      {
        id: 'conscious-assistant',
        title: 'Nebius Ultra 550B',
        icon: (
          <div className="relative">
            <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
        ),
        color: 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 hover:from-slate-800 hover:to-emerald-900 border border-emerald-500/50 shadow-lg text-emerald-400',
        category: 'assistant',
        action: handleCoreBrainClick,
        isPinned: true
      },
      {
        id: 'lc-4622',
        title: 'LC § 4622 Penalty Calc',
        icon: <Scale className="w-4 h-4 text-amber-400 shrink-0" />,
        color: 'bg-gradient-to-r from-slate-900 via-amber-950/25 to-slate-900 border border-amber-500/40 hover:border-amber-400 text-slate-100 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        category: 'tool',
        action: (e) => triggerWorkbenchWorkflow('Execute California Labor Code § 4622 audit: verify 60-day deadline, calculate 10% statutory penalty, and calculate 7% annual interest on delayed medical-legal reimbursement under 8 CCR § 10786.', e),
        isPinned: pinnedIds.includes('lc-4622'),
        assistantType: '10% Penalty + 7% Interest',
        badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      },
      {
        id: 'pdrs-cvc',
        title: 'PDRS CVC Rating Calc',
        icon: <Calculator className="w-4 h-4 text-sky-400 shrink-0" />,
        color: 'bg-gradient-to-r from-slate-900 via-sky-950/25 to-slate-900 border border-sky-500/40 hover:border-sky-400 text-slate-100 hover:shadow-[0_0_15px_rgba(14,165,233,0.2)]',
        category: 'tool',
        action: (e) => triggerWorkbenchWorkflow('Calculate California permanent disability rating using the 2005 PDRS Combined Values Chart (CVC) formula.', e),
        isPinned: pinnedIds.includes('pdrs-cvc'),
        assistantType: 'Combined Values Arithmetic',
        badgeColor: 'bg-sky-500/10 border-sky-500/30 text-sky-300'
      },
      {
        id: 'pleading-28',
        title: '28-Line Pleading Engine',
        icon: <FileText className="w-4 h-4 text-purple-400 shrink-0" />,
        color: 'bg-gradient-to-r from-slate-900 via-purple-950/25 to-slate-900 border border-purple-500/40 hover:border-purple-400 text-slate-100 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]',
        category: 'tool',
        action: (e) => triggerWorkbenchWorkflow('Format the active case analysis and draft into strict California 28-line numbered pleading legal paper format.', e),
        isPinned: pinnedIds.includes('pleading-28'),
        assistantType: 'California Court Standard',
        badgeColor: 'bg-purple-500/10 border-purple-500/30 text-purple-300'
      },
      {
        id: 'ccr-crosswalk',
        title: '8 CCR Rule Crosswalk',
        icon: <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />,
        color: 'bg-gradient-to-r from-slate-900 via-emerald-950/25 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-slate-100 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        category: 'tool',
        action: (e) => triggerWorkbenchWorkflow('Crosswalk 8 CCR legacy regulations to active 2026 rules (e.g. 8 CCR § 10451.1 -> § 10786) and verify procedural default waivers.', e),
        isPinned: pinnedIds.includes('ccr-crosswalk'),
        assistantType: 'Regulatory Practice Hammers',
        badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      },
      {
        id: 'drives-hud',
        title: 'Sovereign Vaults HUD',
        icon: <HardDrive className="w-4 h-4 text-teal-400 shrink-0" />,
        color: 'bg-gradient-to-r from-slate-900 via-teal-950/25 to-slate-900 border border-teal-500/40 hover:border-teal-400 text-slate-100 hover:shadow-[0_0_15px_rgba(20,184,166,0.2)]',
        category: 'integration',
        action: () => navigate('/geniedrive'),
        isPinned: pinnedIds.includes('drives-hud'),
        assistantType: 'E:\\ Travel • G:\\ Master',
        badgeColor: 'bg-teal-500/10 border-teal-500/30 text-teal-300'
      },
      {
        id: 'zero-phi',
        title: 'Zero-PHI Egress Shield',
        icon: <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />,
        color: 'bg-gradient-to-r from-slate-900 via-rose-950/25 to-slate-900 border border-rose-500/40 hover:border-rose-400 text-slate-100 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]',
        category: 'tool',
        action: (e) => triggerWorkbenchWorkflow('Run Zero-PHI audit to ensure all claimant direct identifiers are scrubbed and de-identified under Cal Bar CMIA rules.', e),
        isPinned: pinnedIds.includes('zero-phi'),
        assistantType: '100% De-identified',
        badgeColor: 'bg-rose-500/10 border-rose-500/30 text-rose-300'
      }
    ];

    // 2. Dynamic Pinned Workflows from Library
    const pinnedWorkflows: QuickAction[] = allWorkflows
      .filter((w) => pinnedIds.includes(w.id))
      .map((w) => {
        const styles = getCategoryStyles(w.category);
        return {
          id: w.id,
          title: w.title,
          icon: renderWorkflowIcon(w.icon, 'w-4 h-4 shrink-0 text-slate-200'),
          color: styles.cardColor,
          category: 'workflow',
          action: (e) => triggerWorkbenchWorkflow(w.prompt, e),
          isPinned: true,
          assistantType: w.category ? `${w.category.toUpperCase()} WORKFLOW` : 'SPECIALTY WORKFLOW',
          badgeColor: styles.badgeColor,
          isCustomWorkflow: true
        };
      });

    return [...baseHammers, ...pinnedWorkflows];
  }, [pinnedIds, allWorkflows, triggerWorkbenchWorkflow, navigate]);

  const filteredPickerWorkflows = useMemo(() => {
    if (!pickerSearch.trim()) return allWorkflows;
    const s = pickerSearch.toLowerCase();
    return allWorkflows.filter(
      (w) => w.title.toLowerCase().includes(s) || w.description.toLowerCase().includes(s) || (w.category && w.category.toLowerCase().includes(s))
    );
  }, [allWorkflows, pickerSearch]);

  const pinnedCount = allQuickActions.filter((a) => a.isPinned && a.id !== 'conscious-assistant').length;

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
      <div className="p-2 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Quick Tools</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={isCollapsed ? "Expand Quick Tools" : "Collapse Quick Tools"}
          >
            {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Content - Fully scrollable down to bottom */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-20 scrollbar-thin">
        {/* Pinned Actions */}
        <div className="p-3">
          <div className="grid gap-2">
            {!isCollapsed && (
              <div className="px-1 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Brain className="w-3 h-3 text-emerald-400" /> Core Brain
              </div>
            )}
            {allQuickActions
              .filter((action) => action.id === 'conscious-assistant')
              .map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={cn(
                    "w-full p-3.5 rounded-xl text-left transition-all duration-300",
                    "flex items-center gap-3 group hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]",
                    action.color,
                    "text-white font-bold text-sm shadow-xl cursor-pointer"
                  )}
                  title={action.title}
                >
                  <div className="flex-shrink-0">{action.icon}</div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-base tracking-tight font-bold">{action.title}</div>
                      <div className="text-[10px] text-emerald-300/80 uppercase tracking-widest font-mono font-semibold">
                        Sovereign Intelligence
                      </div>
                    </div>
                  )}
                </button>
              ))}

            {!isCollapsed && (
              <div className="px-1 mt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Specialty Agents</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {pinnedCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkflowPicker(!showWorkflowPicker)}
                  className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-400 font-semibold transition cursor-pointer"
                  title="Pin workflows from the library"
                >
                  <Plus className="w-3 h-3" />
                  <span>Pin</span>
                </button>
              </div>
            )}

            {/* Inline Workflow Pinning Drawer */}
            {!isCollapsed && showWorkflowPicker && (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-2 mb-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                    Workflow Library (35+)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWorkflowPicker(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search workflows..."
                    className="w-full pl-6 pr-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredPickerWorkflows.slice(0, 20).map((wf) => {
                    const isPinned = pinnedIds.includes(wf.id);
                    return (
                      <div
                        key={wf.id}
                        onClick={() => togglePin(wf.id)}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                          isPinned
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {renderWorkflowIcon(wf.icon, 'w-3 h-3 shrink-0')}
                          <span className="truncate text-[11px] font-medium">{wf.title}</span>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 p-1 text-slate-400 hover:text-blue-500"
                        >
                          {isPinned ? <Check className="w-3 h-3 text-blue-500" /> : <Pin className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pinned Specialty Agent Cards */}
            {allQuickActions
              .filter((action) => action.isPinned && action.id !== 'conscious-assistant')
              .map((action) => (
                <div
                  key={action.id}
                  onClick={(e) => action.action?.(e)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all duration-200 cursor-pointer select-none",
                    "flex items-center gap-3 group relative border",
                    action.color
                  )}
                  title={`${action.title} (Click to load • Shift+Click to run instantly)`}
                >
                  <div className="flex-shrink-0">{action.icon}</div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold tracking-tight">{action.title}</div>
                      {action.assistantType && (
                        <div className="mt-1">
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider border font-bold uppercase",
                              action.badgeColor || "text-slate-400 border-slate-700 bg-slate-800/50"
                            )}
                          >
                            {action.assistantType}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={(e) => togglePin(action.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800/60 text-slate-400 hover:text-rose-400 transition cursor-pointer shrink-0"
                      title="Unpin from Quick Tools"
                    >
                      <PinOff className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Expandable Sections */}
        {!isCollapsed && (
          <div className="px-3 pb-3 space-y-2">
            {/* Workflows Section */}
            <button
              onClick={() => setShowWorkflows(!showWorkflows)}
              className="w-full p-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Workflow className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">All Workflows ({allWorkflows.length})</span>
              <ChevronRight
                className={cn(
                  "w-3 h-3 text-slate-400 ml-auto transition-transform",
                  showWorkflows && "rotate-90"
                )}
              />
            </button>

            {showWorkflows && (
              <div className="ml-4 space-y-1 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                {allWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => triggerWorkbenchWorkflow(wf.prompt)}
                    className="w-full p-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-left flex items-center justify-between group transition cursor-pointer"
                    title={wf.description}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderWorkflowIcon(wf.icon, 'w-3 h-3 shrink-0 text-slate-400 group-hover:text-purple-400')}
                      <span className="truncate text-[11px] font-medium">{wf.title}</span>
                    </div>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 uppercase font-mono shrink-0 ml-1">
                      {wf.category || 'tool'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}