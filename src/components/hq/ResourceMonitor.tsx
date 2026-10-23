import React from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { Activity, Server, Zap, HardDrive, Wifi, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export const ResourceMonitor: React.FC = () => {
    const { bridgeStatus, apiTokenUsage, agentLatency, lastUpdated } = useResourceStore();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            case 'degraded': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
            case 'disconnected': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
            default: return 'bg-slate-400';
        }
    };

    const percentage = Math.round((apiTokenUsage.used / apiTokenUsage.limit) * 100);

    return (
        <div className="absolute bottom-full left-4 mb-4 w-[280px] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-4 animate-in slide-in-from-bottom flex flex-col gap-4 z-50">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Resource Monitor</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">
                    <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", getStatusColor(bridgeStatus))} />
                    <span className="text-[9px] font-bold capitalize text-slate-500">{bridgeStatus}</span>
                </div>
            </div>

            {/* Token Usage */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">API Usage ({apiTokenUsage.provider})</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-900">{percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                    <div 
                        className={cn("h-full transition-all duration-1000", percentage > 85 ? "bg-red-500" : percentage > 70 ? "bg-amber-500" : "bg-blue-500")}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                    <span>{apiTokenUsage.used.toLocaleString()} tokens</span>
                    <span>{apiTokenUsage.limit.toLocaleString()} max</span>
                </div>
            </div>

            {/* Agent Latency List */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Agent Telemetry</span>
                
                {agentLatency.map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between group p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Server className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{agent.agentName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-[10px] font-mono",
                                agent.latencyMs < 200 ? "text-emerald-500" : agent.latencyMs < 500 ? "text-amber-500" : "text-red-500"
                            )}>
                                {agent.latencyMs}ms
                            </span>
                            <div className="flex gap-0.5 items-end h-3">
                                <div className="w-1 bg-slate-200 rounded-sm h-1"></div>
                                <div className="w-1 bg-slate-300 rounded-sm h-2"></div>
                                <div className={cn("w-1 rounded-sm h-3", agent.latencyMs < 200 ? "bg-emerald-400" : "bg-slate-200")}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-mono">
                <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
        </div>
    );
};
