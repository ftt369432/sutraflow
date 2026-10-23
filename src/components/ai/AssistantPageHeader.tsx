import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, Menu, Zap, Settings, Bot, FileText, BookOpen, 
  Mail, Globe, Folder, Target, Columns, Maximize, Target as FocusIcon,
  RotateCcw, Download, Save, ChevronDown, Layout
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/DropdownMenu';
import { Tooltip, TooltipProvider } from '../ui/Tooltip';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';
import { BackgroundJobIndicator } from './BackgroundJobIndicator';
import { useUserStore } from '../../stores/userStore';
import { ZoomControls } from '../layout/ZoomControls';
import { toast } from 'sonner';
import { heartbeat } from '../../cortex/Heartbeat';
import { ActiveContextHUD } from '../common/ActiveContextHUD';

interface AssistantPageHeaderProps {
  selectedAssistant: any;
  isTyping: boolean;
  activeWorkflowId: string | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  handleTemplateSelected: (template: any) => void;
  currentPromptTier: string;
  handlePromptTierChange: (tier: any) => void;
  setShowFineTuningPanel: (show: boolean | ((prev: boolean) => boolean)) => void;
  panelOrder: string[];
  setShowAgentTaskManager: (show: boolean) => void;
  setShowTaskOrchestration: (show: boolean) => void;
  toggleExtraPanel: (panel: string) => void;
  setShowCanvasPanel: (show: boolean) => void;
  setAutoCanvasIntegration: (auto: boolean) => void;
  setShowRightPanel: (show: boolean) => void;
  layoutMode: 'proportional' | 'split' | 'focus';
  setLayoutMode: (mode: 'proportional' | 'split' | 'focus') => void;
  isReorganizeMode: boolean;
  setIsReorganizeMode: (show: boolean | ((prev: boolean) => boolean)) => void;
  setPanelOrder: (order: string[] | ((prev: string[]) => string[])) => void;
  downloadConversation: () => void;
  saveAssistantPreset: () => void;
  assistantPresets: Set<string> | Map<string, any>;
  enableAgenticExecution?: boolean;
  setEnableAgenticExecution?: (enabled: boolean) => void;
  smartAutonomyMode: boolean;
  setSmartAutonomyMode: (enabled: boolean) => void;
}

export const AssistantPageHeader: React.FC<AssistantPageHeaderProps> = ({
  selectedAssistant,
  isTyping,
  activeWorkflowId,
  showSidebar,
  setShowSidebar,
  handleTemplateSelected,
  currentPromptTier,
  handlePromptTierChange,
  setShowFineTuningPanel,
  panelOrder,
  setShowAgentTaskManager,
  setShowTaskOrchestration,
  toggleExtraPanel,
  setShowCanvasPanel,
  setAutoCanvasIntegration,
  setShowRightPanel,
  layoutMode,
  setLayoutMode,
  isReorganizeMode,
  setIsReorganizeMode,
  setPanelOrder,
  downloadConversation,
  saveAssistantPreset,
  assistantPresets,
  enableAgenticExecution,
  setEnableAgenticExecution,
  smartAutonomyMode,
  setSmartAutonomyMode
}) => {
  const activePanelsCount = panelOrder.filter(p => p !== 'chat').length;
  const setSettingsModalOpen = useUIStore(state => state.setSettingsModalOpen);
  const hasProAccess = useUserStore(state => state.hasProAccess);
  const isPro = hasProAccess();
  const [isAutonomyActive, setIsAutonomyActive] = React.useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('genieflow_autonomy_enabled') !== 'false'
  );

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.03] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl z-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => setShowSidebar(!showSidebar)}
          title="Toggle Sidebar"
        >
          {showSidebar ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {selectedAssistant?.name || 'AI Assistant'}
            </h2>
            {isTyping && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
          </div>
          {activeWorkflowId && (
            <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-medium uppercase tracking-wider animate-pulse ml-1">
              <Zap className="h-2.5 w-2.5" />
              <span>Active Workflow</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">

        <div className="flex items-center bg-muted/30 rounded-full px-3 py-1 border border-border/40">
          <select
            value={currentPromptTier}
            onChange={(e) => handlePromptTierChange(e.target.value as any)}
            className="text-xs bg-transparent border-none outline-none cursor-pointer font-medium"
          >
            <option value="basic">Basic</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
            <option value="neuroBrain">Neuro Brain</option>
            <option value="collectiveBrain">Collective Brain</option>
            <option value="master">Master</option>
          </select>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 rounded-full hover:bg-background/50" onClick={() => setShowFineTuningPanel(prev => !prev)}>
            <Settings className="h-3 w-3" />
          </Button>
        </div>

        {/* ⚖️ Dedicated Viewer / Document Canvas Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowCanvasPanel(true);
            setAutoCanvasIntegration(true);
            if (!panelOrder.includes('canvas')) {
              toggleExtraPanel('canvas');
            }
          }}
          className={cn(
            "h-8 rounded-full px-3.5 gap-1.5 transition-all text-xs font-bold border",
            panelOrder.includes('canvas')
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
              : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40"
          )}
          title="Open Document Viewer & Canvas Editor"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Viewer</span>
        </Button>

        {/* 🤖 Full Autonomy (Cortex Heartbeat + Sentinel Full Execution) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const nextState = !isAutonomyActive;
            setIsAutonomyActive(nextState);
            heartbeat.setAutonomy(nextState);
            localStorage.setItem('genieflow_autonomy_enabled', String(nextState));
            localStorage.setItem('genieflow_agent_trust_level', nextState ? 'full' : 'standard');
            setSmartAutonomyMode?.(nextState);
            if (nextState) {
              setEnableAgenticExecution?.(true);
              toast.success('🤖 Full Autonomy Activated: Heartbeat & Sentinel Trust Level set to FULL');
            } else {
              toast.info('🎯 Reactive Mode: Heartbeat gated & permissions set to Supervised');
            }
          }}
          className={cn(
            "h-8 rounded-full px-3.5 gap-1.5 transition-all text-xs font-bold shadow-sm border",
            isAutonomyActive
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-500 shadow-emerald-500/20"
              : "bg-muted hover:bg-muted/80 text-muted-foreground border-border/40"
          )}
          title={isAutonomyActive ? "Click to disable Full Autonomy (switch to Supervised)" : "Click to enable Full Autonomy (activates Heartbeat & Full Execution)"}
        >
          <span className={cn("h-2 w-2 rounded-full", isAutonomyActive ? "bg-emerald-300 animate-pulse" : "bg-muted-foreground/40")} />
          <span>{isAutonomyActive ? "Autonomy: FULL" : "Autonomy: OFF"}</span>
        </Button>

        <div className="h-4 w-px bg-border/40 mx-1" />

        <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-1">

          <Link to="/hq">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-md hover:opacity-90 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 text-white border-none shadow-sm"
              title="Open Swarm HQ (Mission Control)"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-bold">HQ</span>
            </Button>
          </Link>

          <div className="h-4 w-px bg-border/40 mx-1" />

          {/* 🔗 CONSOLIDATED WORKSPACE PANELS DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-2 rounded-md transition-all duration-300 border border-border/10",
                  activePanelsCount > 0 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border-none"
                    : "bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
                title="Workspace Panels & Tools"
              >
                <Layout className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Panels</span>
                {activePanelsCount > 0 && (
                  <span className={cn(
                    "flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black rounded-full select-none shadow-sm min-w-4 h-4",
                    activePanelsCount > 0 
                      ? "bg-white text-indigo-600" 
                      : "bg-primary text-primary-foreground"
                  )}>
                    {activePanelsCount}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3 rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-[#0a0a0f]/95 border-slate-100 dark:border-white/[0.03] shadow-2xl space-y-1.5 z-50">
              <div className="px-2 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.03] pb-2 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Panels</span>
                <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md select-none">
                  Press ESC to close
                </span>
              </div>

              {/* 🤖 AI Tasks Toggle */}
              <div 
                onClick={() => {
                  if (!isPro) {
                    toast.info('Sovereign HQ & Background Tasks are premium features.', {
                      description: 'Upgrade to a Pro or Enterprise plan to unlock.',
                      action: {
                        label: 'Upgrade',
                        onClick: () => setSettingsModalOpen(true)
                      }
                    });
                    return;
                  }
                  const isActive = panelOrder.includes('tasks');
                  setShowAgentTaskManager(!isActive);
                  setShowTaskOrchestration(!isActive);
                  toggleExtraPanel('tasks');
                }}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                  panelOrder.includes('tasks') 
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" 
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                  !isPro && "opacity-75 hover:opacity-100"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", panelOrder.includes('tasks') ? "bg-blue-500/20" : "bg-muted")}>
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      AI Tasks / HQ
                      {!isPro && (
                        <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 uppercase tracking-wide">
                          Pro
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] opacity-70">Plan & automate executions</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  panelOrder.includes('tasks') ? "bg-blue-500 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>

              {/* 📝 Canvas / Editor Toggle */}
              <div 
                onClick={() => {
                  const isActive = panelOrder.includes('canvas');
                  setShowCanvasPanel(!isActive);
                  if (!isActive) setAutoCanvasIntegration(true);
                  toggleExtraPanel('canvas');
                }}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                  panelOrder.includes('canvas') 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", panelOrder.includes('canvas') ? "bg-emerald-500/20" : "bg-muted")}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Canvas / Editor</span>
                    <span className="text-[9px] opacity-70">Draft & review documents</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  panelOrder.includes('canvas') ? "bg-emerald-500 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>

              {/* 📚 Knowledge Base Toggle */}
              <div 
                onClick={() => {
                  const isActive = panelOrder.includes('knowledge');
                  setShowRightPanel(!isActive);
                  toggleExtraPanel('knowledge');
                }}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                  panelOrder.includes('knowledge') 
                    ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400" 
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", panelOrder.includes('knowledge') ? "bg-orange-500/20" : "bg-muted")}>
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Knowledge Base</span>
                    <span className="text-[9px] opacity-70">Reference files & context</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  panelOrder.includes('knowledge') ? "bg-orange-500 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>

              {/* 📂 AI Drive Toggle */}
              <div 
                onClick={() => toggleExtraPanel('ai-drive')}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                  panelOrder.includes('ai-drive') 
                    ? "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400" 
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", panelOrder.includes('ai-drive') ? "bg-teal-500/20" : "bg-muted")}>
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">AI Drive</span>
                    <span className="text-[9px] opacity-70">Access files & folders</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  panelOrder.includes('ai-drive') ? "bg-teal-500 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>

              {/* 📧 Email Assistant Toggle */}
              <div 
                onClick={() => toggleExtraPanel('email')}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                  panelOrder.includes('email') 
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" 
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", panelOrder.includes('email') ? "bg-blue-500/20" : "bg-muted")}>
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Email Assistant</span>
                    <span className="text-[9px] opacity-70">Sync & manage emails</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  panelOrder.includes('email') ? "bg-blue-500 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>

              {/* 🌐 Web Browser Toggle */}
              <div 
                onClick={() => toggleExtraPanel('browser')}
                className={cn(
                  "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent",
                  panelOrder.includes('browser') 
                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400" 
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", panelOrder.includes('browser') ? "bg-indigo-500/20" : "bg-muted")}>
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Web Browser</span>
                    <span className="text-[9px] opacity-70">Search & surf real-time</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  panelOrder.includes('browser') ? "bg-indigo-500 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>

              <div className="h-px bg-border/40 my-1" />

              {/* 🤖 Smart Autonomous Mode Toggle */}
              <div 
                onClick={() => setSmartAutonomyMode(!smartAutonomyMode)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
                  smartAutonomyMode 
                    ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5 animate-pulse" 
                    : "hover:bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", smartAutonomyMode ? "bg-indigo-500/20 text-indigo-500" : "bg-muted")}>
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      Smart Autonomy
                      {smartAutonomyMode && <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />}
                    </span>
                    <span className="text-[9px] opacity-70 leading-normal">AI self-opens tools and executes</span>
                  </div>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full p-0.5 transition-all duration-300",
                  smartAutonomyMode ? "bg-indigo-600 flex justify-end" : "bg-slate-300 dark:bg-slate-700 flex justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-md" />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-4 w-px bg-border/40 mx-1" />

        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 rounded-md bg-muted/20 border border-border/10"
                title="Change Layout Mode"
              >
                <Layout className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold capitalize">{layoutMode === 'proportional' ? 'Standard' : layoutMode === 'split' ? '50/50' : 'Focus'}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl backdrop-blur-xl bg-background/95 border-border/40 shadow-2xl">
              <DropdownMenuItem
                onClick={() => setLayoutMode('proportional')}
                className={cn("flex flex-col items-start gap-0.5 p-3 rounded-lg transition-all", layoutMode === 'proportional' ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Maximize className="h-3 w-3" />
                  Standard
                </div>
                <span className="text-[10px] opacity-70">Flexible proportional split</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLayoutMode('split')}
                className={cn("flex flex-col items-start gap-0.5 p-3 rounded-lg transition-all mt-1", layoutMode === 'split' ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Columns className="h-3 w-3" />
                  50/50 Dual Pane
                </div>
                <span className="text-[10px] opacity-70">Equal width sidebar & chat</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLayoutMode('focus')}
                className={cn("flex flex-col items-start gap-0.5 p-3 rounded-lg transition-all mt-1", layoutMode === 'focus' ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <FocusIcon className="h-3 w-3" />
                  Focus Mode
                </div>
                <span className="text-[10px] opacity-70">1/3 Chat, 2/3 Content</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ActiveContextHUD className="hidden xl:flex mr-2" />
        <div className="h-4 w-px bg-border/40 mx-1" />

        <div className="flex gap-1">
          <Button
            variant={isReorganizeMode ? "default" : "ghost"}
            size="sm"
            className={cn("h-8 gap-2 rounded-md", isReorganizeMode && "bg-blue-600 text-white shadow-lg animate-pulse")}
            onClick={() => setIsReorganizeMode(prev => !prev)}
            title={isReorganizeMode ? "Exit Reorganize Mode" : "Reorganize Layout: Drag and drop panels to your preference"}
          >
            <Maximize className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{isReorganizeMode ? "Exit Layout" : "Layout"}</span>
          </Button>

          {isReorganizeMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                setPanelOrder(['chat', 'canvas']);
                setIsReorganizeMode(false);
              }}
              title="Reset panels to original default layout"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Reset</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={downloadConversation}><Download className="h-3.5 w-3.5" /></Button>
          {selectedAssistant && (
            <Button variant={assistantPresets.has(selectedAssistant.id) ? "default" : "ghost"} size="icon" className="h-8 w-8 relative mr-1" onClick={saveAssistantPreset}>
              <Save className="h-3.5 w-3.5" />
              {assistantPresets.has(selectedAssistant.id) && <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-primary" />}
            </Button>
          )}
          <BackgroundJobIndicator />
          <ZoomControls className="ml-1" />
        </div>
      </div>
    </div>
  );
};
