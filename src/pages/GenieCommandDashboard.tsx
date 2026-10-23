import React, { useState, useEffect, useRef } from 'react';
import {
    Bot,
    Brain,
    Activity,
    Zap,
    Database,
    Terminal,
    Layers,
    Cpu,
    ShieldCheck,
    Globe,
    MessageSquare,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { useHQStore } from '@/store/hqStore';
import { cn } from '@/lib/utils';
import '@/styles/genie-command.css';

interface PulseEvent {
    timestamp: number;
    intention: any;
    pendingTasks: number;
    autonomyEnabled: boolean;
    soul: string;
}

const GenieCommandDashboard: React.FC = () => {
    const [lastPulse, setLastPulse] = useState<PulseEvent | null>(null);
    const [pulseHistory, setPulseHistory] = useState<PulseEvent[]>([]);
    const [mcpLogs, setMcpLogs] = useState<{ timestamp: string, message: string, type: 'info' | 'error' | 'success' }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const hqStore = useHQStore();
    const activeMission = hqStore.missions.find(m => m.id === hqStore.activeMissionId);

    // Listen for Cortex Pulse
    useEffect(() => {
        const handlePulse = (event: any) => {
            const pulse = event.detail as PulseEvent;
            setLastPulse(pulse);
            setPulseHistory(prev => [pulse, ...prev].slice(0, 50));

            // If the soul is "Thinking", add to MCP-style logs
            if (pulse.intention?.action === 'THINK') {
                setMcpLogs(prev => {
                    const newLog = {
                        timestamp: new Date().toLocaleTimeString(),
                        message: `🧠 INGEST: ${pulse.intention.reasoning}`,
                        type: 'info' as const
                    };
                    return [newLog, ...prev].slice(0, 100);
                });
            } else if (pulse.intention?.action !== 'IDLE') {
                setMcpLogs(prev => {
                    const newLog = {
                        timestamp: new Date().toLocaleTimeString(),
                        message: `⚡ EXEC: ${pulse.intention.action} -> ${pulse.intention.reasoning}`,
                        type: 'success' as const
                    };
                    return [newLog, ...prev].slice(0, 100);
                });
            }
        };

        window.addEventListener('cortex-pulse', handlePulse);
        return () => window.removeEventListener('cortex-pulse', handlePulse);
    }, []);

    // Mock initial logs to show the "vigor"
    useEffect(() => {
        setMcpLogs([
            { timestamp: new Date().toLocaleTimeString(), message: "🧞‍♂️ GENIE COMMAND: Neural Handshake Verified.", type: "success" },
            { timestamp: new Date().toLocaleTimeString(), message: "📡 MCP GATEWAY: Listening on Port 8765...", type: "info" },
            { timestamp: new Date().toLocaleTimeString(), message: "🧠 SOUL CORE: Online. Laws 0-4 Injected.", type: "success" },
        ]);
    }, []);

    return (
        <div className="genie-hud-container">
            <div className="scanning-line"></div>

            {/* Header Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="genie-cyber-border bg-slate-900/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-indigo-900/40 rounded-lg">
                            <Activity className="h-6 w-6 text-indigo-400 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">System Pulse</p>
                            <h3 className="text-xl font-bold font-mono">1.0 Hz</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="genie-cyber-border bg-slate-900/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-emerald-900/40 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Gateway</p>
                            <h3 className="text-xl font-bold font-mono text-emerald-400">SECURE</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="genie-cyber-border bg-slate-900/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-violet-900/40 rounded-lg">
                            <Zap className="h-6 w-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">Neural Tier</p>
                            <h3 className="text-xl font-bold font-mono text-violet-400">COMMAND</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="genie-cyber-border bg-slate-900/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-900/40 rounded-lg">
                            <Database className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest">AI Drive</p>
                            <h3 className="text-xl font-bold font-mono text-blue-400">VECTORED</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Cognitive Stream & Mission Control */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="genie-cyber-border bg-slate-900/40 h-[400px] flex flex-col">
                        <CardHeader className="border-b border-white/5 pb-2">
                            <CardTitle className="text-sm font-mono flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-indigo-400" />
                                SECRET SAUCE MONITOR (PORT 8765)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto mission-ticker p-4 font-mono text-[10px]" ref={scrollRef}>
                            {mcpLogs.map((log, i) => (
                                <div key={i} className={cn(
                                    "mb-1 flex gap-2",
                                    log.type === 'error' ? "text-red-400" : log.type === 'success' ? "text-emerald-400" : "text-indigo-300"
                                )}>
                                    <span className="opacity-40">[{log.timestamp}]</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="genie-cyber-border bg-slate-900/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-mono flex items-center gap-2">
                                <Layers className="h-4 w-4 text-violet-400" />
                                CURRENT MISSION: {activeMission?.title || 'IDLE'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="text-slate-400">COMPLETION PROGRESS</span>
                                        <span className="text-indigo-400">{activeMission?.progress || 0}%</span>
                                    </div>
                                    <Progress value={activeMission?.progress || 0} className="h-1 bg-white/5" />
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5">
                                    <p className="text-xs italic text-slate-300">
                                        "{activeMission?.goal || 'Awaiting task injection...'}"
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center: The Soul Core */}
                <div className="lg:col-span-5 flex items-center justify-center">
                    <div className="soul-core-container">
                        <div className="soul-core-ring outer"></div>
                        <div className="soul-core-ring inner"></div>
                        <div className="soul-core-pulse"></div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <Brain className="h-12 w-12 text-indigo-100 mb-2 genie-glow-text" />
                            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-200">
                                Soul Runtime: {lastPulse?.soul || 'GENIE_BETA_1.0'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></div>
                                <span className="text-[9px] text-indigo-400 font-mono">AUTONOMY ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Registry & Environment */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="genie-cyber-border bg-slate-900/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-mono flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-blue-400" />
                                NEURAL REGISTRY
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {[
                                { name: 'SOUL_INTERFACE', status: 'OK', color: 'text-emerald-400' },
                                { name: 'SENSORY_INPUT', status: 'ACTIVE', color: 'text-emerald-400' },
                                { name: 'MOTOR_CORTEX', status: 'CONNECTED', color: 'text-blue-400' },
                                { name: 'PYTHON_HANDS', status: 'LISTENING', color: 'text-violet-400' },
                                { name: 'TOKEN_ECONOMY', status: 'PRUNED', color: 'text-amber-400' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
                                    <span className="text-slate-400 font-mono">{item.name}</span>
                                    <span className={cn("font-bold tracking-tighter", item.color)}>{item.status}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="genie-cyber-border bg-indigo-950/20">
                        <CardContent className="p-6 text-center">
                            <Globe className="h-8 w-8 text-indigo-400/50 mx-auto mb-4" />
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-200">System Uplink</h4>
                                <p className="text-[10px] text-slate-400">GENIE COMMAND is the tactical visualization layer of GenieFlow AI. All actions are verified via the Cognitive Reflector.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer Feed: Real-time Thought Stream */}
            <div className="fixed bottom-4 left-6 right-6 h-12 genie-cyber-border bg-slate-900/80 rounded-lg flex items-center px-6 overflow-hidden">
                <div className="flex items-center gap-4 text-xs font-mono w-full">
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 shrink-0">INTENTION</Badge>
                    <div className="flex items-center gap-2 truncate">
                        <ChevronRight className="h-4 w-4 text-indigo-500" />
                        <span className="text-slate-200 uppercase">{lastPulse?.intention?.action || 'IDLE'}</span>
                        <span className="text-slate-400 truncate">:: {lastPulse?.intention?.reasoning || 'System processing steady heartbeat...'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenieCommandDashboard;
