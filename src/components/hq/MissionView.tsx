import React, { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, ChevronUp, Activity, Terminal, Brain, Copy, Check, Pin, Maximize2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { Mission, useHQStore } from '../../store/hqStore';
import { HQStrategyStatus } from './HQStrategyStatus';
import { MissionTimeline } from './MissionTimeline';
import { CognitiveActionCell } from './CognitiveActionCell';
import { HQWalkthroughPanel } from './HQWalkthroughPanel';
import { MarkdownMessage } from '../ai/MarkdownMessage';
import { ExecutionTraceCard } from './ExecutionTraceCard';
import { unwrapModelDeliverable } from '../../utils/deliverableUnwrapper';

export const MissionView = React.memo(({ mission, onTaskClick }: {
    mission: Mission,
    onTaskClick: (id: string) => void
}) => {
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [viewMode, setViewMode] = useState<'chronological' | 'swarm'>('chronological');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [pinnedId, setPinnedId] = useState<string | null>(null);
    const pinItem = useHQStore(s => s.pinItem);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleCopy = (text: string, id: string) => {
        if (!text) return;
        const unwrapped = unwrapModelDeliverable(text);
        const textToCopy = unwrapped.content || text;
        navigator.clipboard.writeText(textToCopy);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handlePin = (msg: any) => {
        const raw = msg.content ? msg.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : '';
        const unwrapped = unwrapModelDeliverable(raw);
        const contentToSave = unwrapped.content || raw;

        let title = unwrapped.suggestedFileName;
        if (!title) {
            const firstLineMatch = contentToSave.match(/^#+\s*(.+)$/m) || contentToSave.match(/^([^\n]{5,60})/);
            title = firstLineMatch ? firstLineMatch[1].replace(/[#*`_]/g, '').trim() : `Output_${msg.id.slice(0, 8)}`;
        }
        if (!title.endsWith('.md')) title = `${title}.md`;

        const docId = `msg_${msg.id}`;

        pinItem(mission.id, {
            id: docId,
            type: 'file',
            name: title
        });

        // Broadcast to create canvas & register in Viewport tabs
        window.dispatchEvent(new CustomEvent('genieflow:create-canvas', {
            detail: {
                id: docId,
                title: title.replace(/\.md$/, ''),
                type: 'document',
                content: contentToSave
            }
        }));

        setPinnedId(msg.id);
        setTimeout(() => setPinnedId(null), 2500);
    };

    const handlePopOut = (msg: any) => {
        const raw = msg.content ? msg.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : '';
        const unwrapped = unwrapModelDeliverable(raw);
        const contentToPop = unwrapped.content || raw;

        let title = unwrapped.suggestedFileName;
        if (!title) {
            const firstLineMatch = contentToPop.match(/^#+\s*(.+)$/m) || contentToPop.match(/^([^\n]{5,60})/);
            title = firstLineMatch ? firstLineMatch[1].replace(/[#*`_]/g, '').trim() : `Deliverable_${msg.id.slice(0, 8)}`;
        }
        const cleanTitle = title.replace(/\.md$/, '');
        const docId = `msg_${msg.id}`;

        window.dispatchEvent(new CustomEvent('genieflow:create-canvas', {
            detail: {
                id: docId,
                title: cleanTitle,
                type: 'document',
                content: contentToPop
            }
        }));
        onTaskClick(docId);
    };

    // Auto-scroll to bottom on new messages or updates
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mission.history?.length, mission.history, mission.progress, mission.manifestState?.walkthrough]);

    // 🚀 SWARM GROUPING LOGIC (The Palantir Unpacker)
    const swarmGroups = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        mission.history?.forEach(msg => {
            // Include system messages and assistant messages with an agentName in the swarm view
            if (msg.role === 'system' || (msg.role === 'assistant' && msg.agentName)) {
                const agent = msg.agentName || 'General Intelligence';
                if (!groups[agent]) groups[agent] = [];
                groups[agent].push(msg);
            }
        });
        return groups;
    }, [mission.history]);

    return (
        <div className="flex-1 flex flex-col min-h-0 h-full w-full bg-transparent transition-all duration-500 overflow-hidden">
            {/* 🛸 STRATEGIC CONTROL TOWER */}
            <div className="px-8 py-4 bg-slate-50/50 dark:bg-[#050507]/40 border-b border-slate-200/50 dark:border-white/[0.03] backdrop-blur-xl shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10 dark:shadow-blue-600/10">
                            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 dark:text-blue-500 uppercase">Sector: {mission.workspace || 'INTERNAL'}</span>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[8px] h-4">LIVE MISSION</Badge>
                            </div>
                            <h2 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase mt-1 italic leading-none truncate max-w-xl">
                                {mission.goal || "INITIALIZED"}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                            className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full ring-1 ring-slate-200 dark:ring-white/10"
                        >
                            {isHeaderCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {!isHeaderCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-500 pb-2">
                        <div className="col-span-1 flex items-center gap-3 bg-white/40 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Synchronized</span>
                            </div>
                        </div>
                        <div className="col-span-2 flex flex-col justify-center bg-white/40 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/5 px-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Progress</span>
                                <span className="text-[10px] font-black text-blue-500">{mission.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                                    style={{ width: `${mission.progress}%` }} 
                                />
                            </div>
                        </div>
                        <div className="col-span-1 flex items-center gap-3 bg-white/40 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-white/5 flex items-center justify-center">
                                <Terminal className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session</span>
                                <span className="text-[10px] font-mono text-slate-500 truncate">{mission.manifestState?.sessionId || 'INIT_MODE'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🌊 MAIN VIEWPORT CONTENT */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-8 custom-scrollbar scroll-smooth space-y-6"
            >
                {mission.manifestState?.plan && (
                    <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/[0.05] p-2.5 px-5 rounded-2xl shadow-lg max-w-max mx-auto mb-6 transition-all duration-300 hover:shadow-xl hover:border-blue-500/20">
                        <HQStrategyStatus missionId={mission.id} plan={mission.manifestState.plan} />
                    </div>
                )}
                {viewMode === 'swarm' ? (
                    /* 🛰️ PARALLEL SWARM GRID */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                        {Object.entries(swarmGroups).map(([agent, messages]) => (
                            <div key={agent} className="flex flex-col space-y-4 bg-white/50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.03] rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                                            <Bot className="h-3.5 w-3.5 text-blue-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{agent} SQUAD</span>
                                    </div>
                                    <Badge className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-none text-[8px] h-4">{messages.length} OPS</Badge>
                                </div>
                                <div className="space-y-4 border-l border-slate-200 dark:border-white/5 ml-3 pl-5 py-1">
                                    {messages.map((msg: any) => (
                                        <CognitiveActionCell 
                                            key={msg.id} 
                                            message={msg} 
                                            onOpenFile={(name: string) => onTaskClick(name)}
                                            hideHeader
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {Object.keys(swarmGroups).length === 0 && (
                            <div className="col-span-full py-24 text-center">
                                <Bot className="h-16 w-16 text-slate-100 dark:text-white/[0.02] mx-auto mb-4" />
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Awaiting_Neural_Dispatch...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* 📜 CHRONOLOGICAL FEED (TIMELINE CONNECTED WORKING TREE) */
                    <div className="relative max-w-4xl mx-auto pl-10 space-y-6 pb-20">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[9px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500/40 via-slate-200 dark:via-white/10 to-blue-500/40" />
                        
                         {mission.history?.map((msg: any, idx: number) => {
                             if (msg.metadata?.trace) {
                                 return (
                                     <div key={msg.id} className="relative">
                                         <div className="absolute left-[-35px] top-6 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0f0f15] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] z-10" />
                                         <ExecutionTraceCard
                                             steps={msg.metadata.trace}
                                             status={msg.metadata.traceStatus || 'complete'}
                                             agentName={msg.agentName}
                                         />
                                     </div>
                                 );
                             }
                             const prevMsg = idx > 0 ? mission.history[idx - 1] : null;
                             const isActionCell = msg.role === 'system' || 
                                                  (msg.role === 'assistant' && (msg.content.includes('⚡') || msg.metadata?.updates || msg.agentName === 'Cognitive Reflector' || msg.agentName === 'Cognitive Process'));

                             const isGrouped = isActionCell && (prevMsg?.role === 'system' || (prevMsg?.role === 'assistant' && prevMsg?.agentName === 'Cognitive Process'));

                             // Small dot indicator on the vertical line for each message block
                             const indicatorDot = (
                                 <div className="absolute left-[-35px] top-6.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0f0f15] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] z-10" />
                             );

                             if (isActionCell) {
                                  return (
                                      <div key={msg.id} className="relative">
                                          {!isGrouped && indicatorDot}
                                          <CognitiveActionCell 
                                              message={msg} 
                                              onOpenFile={(name: string) => onTaskClick(name)} 
                                              hideHeader={isGrouped}
                                          />
                                      </div>
                                  );
                             }

                             // Regular Chat Bubble (Commander user message or Primary Assistant response)
                             const thinkMatch = msg.content?.match(/<think>([\s\S]*?)<\/think>/i);
                             const internalMonologue = thinkMatch ? thinkMatch[1].trim() : null;
                             const cleanContent = msg.content ? msg.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() : '';

                             return (
                                <div key={msg.id} className="relative">
                                    {indicatorDot}
                                    <div className="group flex flex-col w-full animate-in slide-in-from-bottom-2 duration-300 mb-6">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                                                    msg.role === 'user' 
                                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                                                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                                                )}>
                                                    {msg.role === 'user' ? 'COMMANDER' : (msg.agentName || 'GenieFlow Sovereign AI')}
                                                </span>
                                                {msg.timestamp && (
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quick Action Toolbar: Copy, Pin, Pop Out into Viewport */}
                                            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCopy(cleanContent || msg.content, msg.id)}
                                                    title="Quick Copy output to clipboard"
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border shadow-sm",
                                                        copiedId === msg.id
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                            : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                                                    )}
                                                >
                                                    {copiedId === msg.id ? (
                                                        <>
                                                            <Check className="h-3 w-3 text-emerald-500" />
                                                            <span>Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3 w-3" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handlePin(msg)}
                                                    title="Pin output to Workspace"
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border shadow-sm",
                                                        pinnedId === msg.id
                                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                            : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/20"
                                                    )}
                                                >
                                                    <Pin className={cn("h-3 w-3", pinnedId === msg.id ? "fill-amber-500 text-amber-500" : "")} />
                                                    <span>{pinnedId === msg.id ? 'Pinned' : 'Pin'}</span>
                                                </button>

                                                <button
                                                    onClick={() => handlePopOut(msg)}
                                                    title="Pop out into Viewport (Side-by-side 28-Line Document Viewer)"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm"
                                                >
                                                    <Maximize2 className="h-3 w-3" />
                                                    <span>Pop Out</span>
                                                </button>
                                            </div>
                                        </div>

                                        {msg.role === 'user' ? (
                                            <div className="w-full rounded-xl bg-blue-500/5 dark:bg-blue-500/[0.04] border border-blue-500/20 dark:border-blue-500/20 p-4 text-sm leading-relaxed text-slate-900 dark:text-slate-100 font-medium whitespace-pre-wrap">
                                                {msg.content}
                                            </div>
                                        ) : (
                                            <div className="w-full text-sm leading-relaxed text-slate-800 dark:text-slate-200 pl-1">
                                                {internalMonologue && (
                                                    <details className="mb-3 text-xs bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                                                        <summary className="cursor-pointer select-none font-mono text-[10px] font-bold text-slate-500 hover:text-blue-500 transition-colors flex items-center gap-1.5">
                                                            <Brain className="h-3 w-3 text-blue-500 inline" />
                                                            <span>Reasoning Process ({internalMonologue.split(/\s+/).length} words)</span>
                                                        </summary>
                                                        <div className="mt-2.5 p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                                                            {internalMonologue}
                                                        </div>
                                                    </details>
                                                )}
                                                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                                    <MarkdownMessage content={cleanContent || msg.content} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )
                        })}

                        {/* Bottom scroll target anchor */}
                        <div ref={messagesEndRef} className="h-8 shrink-0" />
                    </div>
                )}

                {/* 🎯 MISSION COMPLETION WALKTHROUGH */}
                {mission.manifestState?.walkthrough && (
                    <div className="max-w-xl mx-auto py-12">
                        <HQWalkthroughPanel walkthrough={mission.manifestState.walkthrough} />
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return JSON.stringify(prevProps.mission) === JSON.stringify(nextProps.mission);
});