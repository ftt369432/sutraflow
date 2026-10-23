import React from 'react';
import { 
    Zap, Inbox, Bot, BookOpen, Globe, Settings, 
    ChevronDown, ChevronRight, Folder, Sparkles, 
    X, Plus, Activity, MessageCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';
import { ChatModelSelector } from '../chat/ChatModelSelector';
import { ResourceMonitor } from './ResourceMonitor';
import { Mission } from '../../store/hqStore';

interface HQSidebarProps {
    isSidebarMinimized: boolean;
    setIsSidebarMinimized: (min: boolean) => void;
    sidebarTab: 'inbox' | 'workspaces' | 'knowledge' | 'settings';
    setSidebarTab: (tab: 'inbox' | 'workspaces' | 'knowledge' | 'settings') => void;
    missions: Mission[];
    activeMissionId: string | null;
    setActiveMission: (id: string) => void;
    deleteMission: (id: string) => void;
    handleStartNewMission: (id?: string, assistantId?: string) => void;
    selectedWorkspace: string;
    setSelectedWorkspace: (ws: string) => void;
    expandedWorkspaces: string[];
    toggleWorkspaceExpansion: (ws: string) => void;
    assistants: any[];
    setActiveViewportFile: (id: string | null) => void;
    pinItem: (missionId: string, item: any) => void;
    secureMode: boolean;
    setSecureMode: (mode: boolean) => void;
    isResourceMonitorOpen: boolean;
    setIsResourceMonitorOpen: (open: boolean) => void;
}

export function HQSidebar({
    isSidebarMinimized,
    setIsSidebarMinimized,
    sidebarTab,
    setSidebarTab,
    missions,
    activeMissionId,
    setActiveMission,
    deleteMission,
    handleStartNewMission,
    selectedWorkspace,
    setSelectedWorkspace,
    expandedWorkspaces,
    toggleWorkspaceExpansion,
    assistants,
    setActiveViewportFile,
    pinItem,
    secureMode,
    setSecureMode,
    isResourceMonitorOpen,
    setIsResourceMonitorOpen
}: HQSidebarProps) {
    const [sidebarWidth, setSidebarWidth] = React.useState<number>(() => {
        try {
            const saved = localStorage.getItem('genieflow_hq_sidebar_width');
            return saved ? parseInt(saved, 10) : 340;
        } catch {
            return 340;
        }
    });

    const [isResizing, setIsResizing] = React.useState(false);

    const startResizing = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    React.useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(260, Math.min(800, e.clientX));
            setSidebarWidth(newWidth);
            try {
                localStorage.setItem('genieflow_hq_sidebar_width', newWidth.toString());
            } catch {}
        };
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div 
            style={{ width: isSidebarMinimized ? 60 : sidebarWidth }}
            className={cn(
                "relative flex border-r border-slate-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 shrink-0",
                !isResizing && "transition-all duration-300 ease-in-out"
            )}
        >
            {/* Slim Activity Bar */}
            <div className="w-[60px] flex flex-col items-center py-4 border-r border-slate-200 bg-slate-100/30 glassy-sidebar shimmer-chi-flow h-full shrink-0">
                <div className="h-10 flex items-center justify-center mb-10">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100 cursor-pointer hover:scale-110 transition-transform active:scale-95 shimmer-button-energy" onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}>
                        <Zap className="h-4 w-4 fill-current" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center gap-4">
                    <button onClick={() => { setSidebarTab('inbox'); setIsSidebarMinimized(false); }} className={cn("p-2 rounded-lg transition-all relative group", (sidebarTab === 'inbox' && !isSidebarMinimized) ? "bg-white text-slate-800 shadow-sm border border-slate-200 shimmer-chi-flow" : "text-slate-400 hover:text-slate-600")}>
                        <Inbox className="h-5 w-5" />
                    </button>
                    <button onClick={() => { setSidebarTab('workspaces'); setIsSidebarMinimized(false); }} className={cn("p-2 rounded-lg transition-all relative group", (sidebarTab === 'workspaces' && !isSidebarMinimized) ? "bg-white text-slate-800 shadow-sm border border-slate-200 shimmer-chi-flow" : "text-slate-400 hover:text-slate-600")}>
                        <Bot className="h-5 w-5" />
                    </button>
                    <button onClick={() => { setSidebarTab('knowledge'); setIsSidebarMinimized(false); }} className={cn("p-2 rounded-lg transition-all relative group", (sidebarTab === 'knowledge' && !isSidebarMinimized) ? "bg-white text-slate-800 shadow-sm border border-slate-200 shimmer-chi-flow" : "text-slate-400 hover:text-slate-600")}>
                        <BookOpen className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-auto flex flex-col items-center gap-4 pb-4">
                    <button onClick={() => { setSidebarTab('settings'); setIsSidebarMinimized(false); }} className={cn("p-2 rounded-lg transition-all relative group", (sidebarTab === 'settings' && !isSidebarMinimized) ? "bg-white text-slate-800 shadow-sm border border-slate-200 shimmer-chi-flow" : "text-slate-400 hover:text-slate-600")} title="AI Model & Provider Switcher">
                        <Globe className="h-5 w-5 text-emerald-500" />
                    </button>
                    <button onClick={() => { setSidebarTab('settings'); setIsSidebarMinimized(false); }} className={cn("p-2 rounded-lg transition-all relative group", (sidebarTab === 'settings' && !isSidebarMinimized) ? "bg-white text-slate-800 shadow-sm border border-slate-200 shimmer-chi-flow" : "text-slate-400 hover:text-slate-600")} title="Global Policies & Settings">
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Expanded Panel */}
            {!isSidebarMinimized && (
                <div className="flex-1 overflow-hidden flex flex-col bg-white animate-in slide-in-from-left duration-300">
                    <div className="h-14 p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {sidebarTab === 'inbox' ? 'Activity' : sidebarTab === 'workspaces' ? 'Workspaces' : sidebarTab === 'knowledge' ? 'Knowledge' : 'Settings'}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {sidebarTab === 'inbox' && (
                            <div className="p-4 space-y-4">
                                <h3 className="text-xs font-bold text-slate-800">Recent Notifications</h3>
                                {missions.filter(m => m.unreadNotifications > 0).map(m => (
                                    <div key={m.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer hover:bg-white transition-all shadow-sm group" onClick={() => setActiveMission(m.id)}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{m.title}</span>
                                            <Badge className="h-4 px-1 text-[8px] bg-slate-800 shimmer-button-energy">{m.unreadNotifications}</Badge>
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-1 italic">{m.lastMessage}</p>
                                    </div>
                                ))}
                                {missions.every(m => m.unreadNotifications === 0) && (
                                    <div className="py-12 text-center">
                                        <Inbox className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inbox Empty</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {sidebarTab === 'workspaces' && (
                            <div className="p-2 space-y-1">
                                {/* 🧠 Core Intelligence: The Sovereign Soul */}
                                <div className="space-y-0.5 mb-2 group/ws-folder transition-all border-b border-slate-100 pb-2">
                                    <div className={cn(
                                        "px-2 py-1.5 flex items-center justify-between group/ws relative rounded-lg cursor-pointer transition-colors",
                                        selectedWorkspace === 'Sovereign' ? "bg-blue-50 shadow-inner" : "hover:bg-slate-50/50"
                                    )} onClick={() => { toggleWorkspaceExpansion('Sovereign'); setSelectedWorkspace('Sovereign'); }}>
                                        <div className="flex items-center gap-2">
                                            {expandedWorkspaces.includes('Sovereign') ? <ChevronDown className="h-3 w-3 text-blue-400" /> : <ChevronRight className="h-3 w-3 text-blue-400" />}
                                            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold shadow-lg shadow-blue-200 shimmer-button-energy">
                                                <Sparkles className="h-3 w-3" />
                                            </div>
                                            <span className={cn("text-[11px] font-bold tracking-tight", selectedWorkspace === 'Sovereign' ? "text-blue-700" : "text-slate-600")}>Sovereign Soul</span>
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="px-2 mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Specialized Agents</h3>
                                {assistants.map((agent) => {
                                    const isExpanded = expandedWorkspaces.includes(agent.id);
                                    const agentMissions = missions.filter(m => m.assistantId === agent.id);
                                    return (
                                        <div key={agent.id} className="space-y-0.5 mb-1 group/ws-folder transition-all">
                                            <div className={cn(
                                                "px-2 py-1.5 flex items-center justify-between group/ws relative rounded-lg cursor-pointer transition-colors",
                                                selectedWorkspace === agent.id ? "bg-slate-100 shadow-inner" : "hover:bg-slate-50/50"
                                            )} onClick={() => { toggleWorkspaceExpansion(agent.id); setSelectedWorkspace(agent.id); }}>
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                                                    <div className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-800 font-bold shadow-sm">
                                                        {agent.name.substring(0, 1)}
                                                    </div>
                                                    <span className={cn("text-[11px] font-bold tracking-tight", selectedWorkspace === agent.id ? "text-slate-900" : "text-slate-500")}>{agent.name} Workspace</span>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/ws:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleStartNewMission(undefined, agent.id)} title="Start Mission" className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                                    {agentMissions.map((mission) => (
                                                        <div key={mission.id} className="group relative ml-4 pl-3 border-l border-slate-100">
                                                            <div
                                                                onClick={() => setActiveMission(mission.id)}
                                                                className={cn(
                                                                    "w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-center gap-2 group/mission cursor-pointer",
                                                                    activeMissionId === mission.id ? "bg-slate-800 text-white shadow-lg shadow-slate-200 shimmer-button-energy" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                                                    mission.status === 'running' ? "bg-emerald-400 animate-pulse" : (activeMissionId === mission.id ? "bg-white" : "bg-slate-300")
                                                                )} />
                                                                <h4 className="text-[11px] font-medium truncate flex-1">{mission.title}</h4>
                                                                <button
                                                                    className={cn(
                                                                        "opacity-0 transition-opacity ",
                                                                        activeMissionId === mission.id ? "group-hover/mission:opacity-100 text-white/50 hover:text-white" : "group-hover/mission:opacity-100 text-slate-300 hover:text-red-500"
                                                                    )}
                                                                    onClick={(e) => { e.stopPropagation(); deleteMission(mission.id); }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {agentMissions.length === 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStartNewMission(undefined, agent.id); }}
                                                            className="ml-4 pl-3 py-1.5 text-[10px] text-slate-400 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Initialize Workflow
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* General/No-Agent Missions */}
                                {missions.filter(m => !m.assistantId).length > 0 && (
                                    <div className="space-y-0.5 mb-1 group/ws-folder transition-all">
                                        <div className={cn(
                                            "px-2 py-1.5 flex items-center justify-between group/ws relative rounded-lg cursor-pointer transition-colors",
                                            selectedWorkspace === 'General' ? "bg-slate-100 shadow-inner" : "hover:bg-slate-50/50"
                                        )} onClick={() => { toggleWorkspaceExpansion('General'); setSelectedWorkspace('General'); }}>
                                            <div className="flex items-center gap-2">
                                                {expandedWorkspaces.includes('General') ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                                                <Folder className={cn("h-3.5 w-3.5", selectedWorkspace === 'General' ? "text-slate-800" : "text-slate-400")} />
                                                <span className={cn("text-[11px] font-bold tracking-tight", selectedWorkspace === 'General' ? "text-slate-900" : "text-slate-500")}>General Missions</span>
                                            </div>
                                        </div>
                                        {expandedWorkspaces.includes('General') && (
                                            <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                                {missions.filter(m => !m.assistantId).map((mission) => (
                                                    <div key={mission.id} className="group relative ml-4 pl-3 border-l border-slate-100">
                                                        <div
                                                            onClick={() => setActiveMission(mission.id)}
                                                            className={cn(
                                                                "w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-center gap-2 group/mission cursor-pointer",
                                                                activeMissionId === mission.id ? "bg-slate-800 text-white shadow-lg shimmer-button-energy" : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "h-1.5 w-1.5 rounded-full shrink-0",
                                                                mission.status === 'running' ? "bg-emerald-400 animate-pulse" : (activeMissionId === mission.id ? "bg-white" : "bg-slate-300")
                                                            )} />
                                                            <h4 className="text-[11px] font-medium truncate flex-1">{mission.title}</h4>
                                                            <button
                                                                className={cn(
                                                                    "opacity-0 transition-opacity ",
                                                                    activeMissionId === mission.id ? "group-hover/mission:opacity-100 text-white/50 hover:text-white" : "group-hover/mission:opacity-100 text-slate-300 hover:text-red-500"
                                                                )}
                                                                onClick={(e) => { e.stopPropagation(); deleteMission(mission.id); }}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {sidebarTab === 'knowledge' && (
                            <div className="p-2">
                                <GenieDriveTree
                                    onFileSelect={(file) => {
                                        const targetPath = file.path || file.id;
                                        setActiveViewportFile(targetPath);
                                        if (activeMissionId) {
                                            pinItem(activeMissionId, { id: targetPath, type: 'file', name: file.name });
                                        }
                                    }}
                                    onPin={(item) => {
                                        if (activeMissionId) {
                                            const targetPath = item.path || item.id;
                                            pinItem(activeMissionId, {
                                                id: targetPath,
                                                type: 'file',
                                                name: item.name
                                            });
                                        }
                                    }}
                                    selectedFileId=""
                                    className="text-xs"
                                />
                            </div>
                        )}

                        {sidebarTab === 'settings' && (
                            <div className="p-4 space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model & Local GPU Control</h3>
                                    <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/[0.05] flex flex-col gap-2">
                                        <ChatModelSelector />
                                        <span className="text-[10px] text-slate-400 leading-tight">
                                            Select local GPU models (Qwen 2.5 7B, Qwen 3.8 27B NVMe) or cloud AI providers.
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Policies</h3>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">Secure Mode</span>
                                            <span className="text-[10px] text-slate-400">Restricted agency keys</span>
                                        </div>
                                        <Switch checked={secureMode} onCheckedChange={setSecureMode} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Interface</h3>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">Detailed Thoughts</span>
                                            <span className="text-[10px] text-slate-400">Show AI internal logic</span>
                                        </div>
                                        <Switch checked={true} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Bar Actions */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1 relative">
                        {isResourceMonitorOpen && <ResourceMonitor />}
                        <button 
                            onClick={() => setIsResourceMonitorOpen(!isResourceMonitorOpen)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-900 rounded-lg transition-all text-[11px] font-semibold",
                                isResourceMonitorOpen ? "bg-white shadow-sm text-slate-900" : "hover:bg-white"
                            )}
                        >
                            <Activity className="h-4 w-4" />
                            Resource Monitor
                        </button>
                        <button className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all text-[11px] font-semibold">
                            <MessageCircle className="h-4 w-4" />
                            Send Feedback
                        </button>
                    </div>
                </div>
            )}

            {/* Draggable resize handle on the right edge */}
            {!isSidebarMinimized && (
                <div
                    onMouseDown={startResizing}
                    className={cn(
                        "absolute top-0 right-[-3px] w-2 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-40 group select-none flex items-center justify-center",
                        isResizing && "bg-blue-600/80 w-2"
                    )}
                    title="Drag to resize side panel"
                >
                    <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 rounded-full transition-colors" />
                </div>
            )}
        </div>
    );
}
