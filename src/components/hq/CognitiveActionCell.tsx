import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Zap,
    CheckCircle2,
    RotateCcw,
    FileText,
    ExternalLink,
    Search,
    Brain,
    Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ProgressUpdate {
    icon: 'search' | 'think' | 'edit' | 'error' | 'success';
    text: string;
    subtext?: string;
}

interface CognitiveActionCellProps {
    message: {
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: string;
        agentName?: string;
        metadata?: {
            updates?: ProgressUpdate[];
            failedAction?: string;
            evidence?: string[];
        };
    };
    onOpenFile?: (path: string) => void;
    hideHeader?: boolean;
}

export const CognitiveActionCell: React.FC<CognitiveActionCellProps> = ({ message, onOpenFile, hideHeader }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

    // 🧠 NEURAL TRACE EXTRACTION
    const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/i);
    const internalMonologue = thinkMatch ? thinkMatch[1].trim() : null;
    const displayContent = message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const isAction = message.content.includes('⚡');
    const isSuccess = message.content.includes('✅');
    const isError = message.content.includes('❌') || message.content.includes('⚠️') || message.content.includes('🚫') || message.content.includes('Access Denied');

    const filePathMatch = message.content.match(/\[(.*?)\]/);
    const fileName = filePathMatch ? filePathMatch[1] : null;

    return (
        <div className={cn(
            "group flex flex-col max-w-full mr-auto items-start animate-in slide-in-from-left-4 duration-700 mb-6 px-1",
            isExpanded ? "w-full" : "w-auto"
        )}>
            {!hideHeader && (
                <div className="flex items-baseline gap-4 mb-2 px-6">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        {isAction ? (
                            <div className="flex gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                                <span className="text-[7px] text-blue-400">COGNITIVE PULSE</span>
                            </div>
                        ) : (
                            <div className="flex gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                                <Brain className="h-2.5 w-2.5 text-slate-500" />
                                <span className="text-[7px] text-slate-500">{message.agentName || 'Agent Strategy'}</span>
                            </div>
                        )}
                    </span>
                    <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            )}

            <div className={cn(
                "relative backdrop-blur-3xl transition-all duration-500 overflow-hidden",
                "bg-slate-50/70 dark:bg-[#0c0c14]/70 border border-slate-200/80 dark:border-white/5 rounded-xl transition-all duration-300 overflow-hidden",
                isExpanded ? "p-3.5 px-4 w-full" : "p-2 px-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5",
                hideHeader && "mt-[-0.5rem]" 
            )} onClick={() => !isExpanded && setIsExpanded(true)}>

                {/* 🛰️ SPECTRAL EDGE GLOW */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/[0.03] blur-[80px] pointer-events-none" />

                <div className="flex items-start justify-between w-full gap-6 relative z-10">
                    <div className={cn(
                        "flex items-start gap-4 text-slate-800 dark:text-slate-200 font-medium leading-relaxed transition-all",
                        isExpanded ? "text-xs font-semibold" : "text-xs font-medium truncate"
                    )}>
                        {isAction ? (
                            <div className="p-1.5 bg-blue-600/15 rounded-lg border border-blue-500/30">
                                <Zap className="h-4 w-4 text-blue-400 animate-pulse shrink-0" />
                            </div>
                        ) : isSuccess ? (
                            <div className="p-1.5 bg-emerald-500/15 rounded-lg border border-emerald-500/30">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            </div>
                        ) : (
                            <div className="p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
                                <Brain className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                            </div>
                        )}
                        <span className={cn("inline-block", isExpanded ? "mt-1" : "truncate mt-1.5")}>
                            {displayContent}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                         {internalMonologue && isExpanded && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); setIsThinkingExpanded(!isThinkingExpanded); }}
                                className={cn(
                                    "rounded-lg h-7 px-3 gap-2 font-black text-[9px] uppercase tracking-widest transition-all ring-1 ring-inset",
                                    isThinkingExpanded 
                                        ? "bg-blue-600 text-white ring-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                                        : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Activity className={cn("h-3 w-3", isThinkingExpanded ? "animate-pulse" : "opacity-50")} />
                                {isThinkingExpanded ? 'REASONING_ACTIVE' : 'EXPAND_LOGIC'}
                            </Button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">

                        {/* 🧠 NEURAL TRACE TERMINAL */}
                        {isThinkingExpanded && internalMonologue && (
                            <div className="bg-slate-950 dark:bg-[#050507] rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-blue-400 dark:text-blue-300/80 border border-slate-800 dark:border-white/5 shadow-inner relative overflow-hidden group/monologue">
                                <div className="absolute top-2 right-4 text-[8px] font-black text-slate-600 dark:text-slate-700 uppercase tracking-[0.3em] select-none">Brain_Logic_v4: {message.id.slice(0,8)}</div>
                                
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center gap-2 pt-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                                        <div className="w-px flex-1 bg-white/5" />
                                    </div>
                                    <div className="flex-1 whitespace-pre-wrap">
                                        <span className="text-blue-500/50 select-none mr-2 font-bold">[LOG]</span>
                                        {internalMonologue}
                                        <span className="ml-1 inline-block h-3 w-1.5 bg-blue-500 animate-pulse align-middle" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 📊 TIGHT THOUGHT STREAM */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                                <span className="text-[8px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">Live Forensics</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                            </div>

                            <div className="space-y-3 relative ml-2">
                                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/40 via-slate-200 dark:via-white/5 to-transparent" />

                                {(!message.metadata?.updates || message.metadata.updates.length === 0) ? (
                                    <div className="flex items-center gap-4 group/trace pl-0.5">
                                        <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-[#0a0a0f] border border-blue-500/30 flex items-center justify-center shrink-0 z-10 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                            <Activity className="h-2 w-2 text-blue-500 dark:text-blue-400 animate-pulse" />
                                        </div>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic tracking-tight">Synthesizing legal precedents and manifest records...</span>
                                    </div>
                                ) : (
                                    message.metadata.updates.map((update, idx) => (
                                        <div key={idx} className="flex items-start gap-4 group/trace">
                                            <div className={cn(
                                                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all",
                                                update.icon === 'success' ? "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-slate-100 dark:bg-[#0a0a0f] border-slate-200 dark:border-white/10"
                                            )}>
                                                {update.icon === 'search' && <Search className="h-2 w-2 text-slate-500" />}
                                                {update.icon === 'think' && <Brain className="h-2 w-2 text-blue-500" />}
                                                {update.icon === 'edit' && <FileText className="h-2 w-2 text-blue-400" />}
                                                {update.icon === 'error' && <Activity className="h-2 w-2 text-red-500" />}
                                                {update.icon === 'success' && <CheckCircle2 className="h-2 w-2 text-emerald-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-[11px] font-bold leading-none mb-0.5",
                                                    update.icon === 'success' ? "text-emerald-500 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                                                )}>{update.text}</p>
                                                {update.subtext && <p className="text-[9px] text-slate-400 dark:text-slate-650 font-medium truncate">{update.subtext}</p>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 📄 ACTIVE ARTIFACT CARD */}
                        {fileName && (
                            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between group/artifact hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:border-blue-500/30 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 dark:bg-[#0a0a0f] rounded-lg border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-600 shadow-xl group-hover/artifact:border-blue-500/50 transition-all">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Generated Intelligence</span>
                                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">{fileName}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="h-8 gap-2 bg-blue-600 hover:bg-blue-500 text-white border-none font-bold text-[10px] uppercase tracking-widest rounded-lg px-4"
                                    onClick={() => onOpenFile?.(fileName)}
                                >
                                    Review
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {/* STATUS FOOTER */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    isAction ? "bg-blue-500 animate-pulse" :
                                        isSuccess ? "bg-emerald-500" : "bg-slate-700"
                                )} />
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em]">
                                    {isAction ? 'Transmission_Live' : isSuccess ? 'Manifest_Secure' : 'Observer_Idle'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-20">
                                <div className="h-0.5 w-0.5 bg-slate-500 rounded-full" />
                                <div className="h-0.5 w-0.5 bg-slate-500 rounded-full" />
                                <div className="h-0.5 w-0.5 bg-slate-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
