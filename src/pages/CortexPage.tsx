/**
 * 🧠 Cortex Dashboard Page
 * Central control panel for the AI's autonomous identity, heartbeat, and skills.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Brain,
    Heart,
    Zap,
    Activity,
    Settings,
    MessageSquare,
    Mail,
    Calendar,
    Database,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Shield,
    Sparkles,
    FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// 🧠 Component Types
interface CortexSkill {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    status: 'active' | 'inactive';
}

// 🧠 Real imports — lazy-loaded to handle graceful fallback
let soul: any = {
    getCurrentPersonaId: () => 'street-litigator',
    getThoughtStream: () => [],
    decide: async () => ({ action: 'none' }),
    setPersona: (id: string) => console.log('⚠️ Soul not loaded: setPersona', id),
    introspect: () => 'Soul loading...'
};
let heartbeat: any = {
    status: 'loading',
    pause: () => { },
    resume: () => { },
    start: () => { },
    lastPulse: null,
    forcePulse: () => console.log('⚠️ Heartbeat not loaded')
};
let peripheralRegistry: any = {
    getSkills: () => [],
    sync: async () => [],
    getPromptManifest: () => 'Discovery in progress...'
};

// Lazy-load real singletons (non-blocking)
const loadCortexModules = async () => {
    try {
        const soulModule = await import('../cortex/Soul');
        soul = soulModule.soul;
    } catch (e) { console.warn('🧠 CortexPage: Soul import failed (using fallback)', e); }
    try {
        const hbModule = await import('../cortex/Heartbeat');
        heartbeat = hbModule.heartbeat;
    } catch (e) { console.warn('💓 CortexPage: Heartbeat import failed (using fallback)', e); }
    try {
        const prModule = await import('../cortex/PeripheralRegistry');
        peripheralRegistry = prModule.peripheralRegistry;
    } catch (e) { console.warn('🔌 CortexPage: PeripheralRegistry import failed (using fallback)', e); }
};
loadCortexModules();

import { PERSONAS } from '../data/personas';

const CortexPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentSoul, setCurrentSoul] = useState(soul.getCurrentPersonaId());
    const [heartbeatStatus, setHeartbeatStatus] = useState<'online' | 'paused'>('online');
    const [isAutonomous, setIsAutonomous] = useState(heartbeat.getAutonomy?.() || true);
    const [lastPulse, setLastPulse] = useState<Date | null>(null);
    const [pulseCount, setPulseCount] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);
    const [lastThought, setLastThought] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<any | null>(null);
    const [reflectorCritique, setReflectorCritique] = useState<string | null>(null);
    const [dynamicSkills, setDynamicSkills] = useState<any[]>([]);
    const [aiStatus, setAiStatus] = useState<{
        provider: string;
        status: 'online' | 'offline' | 'error' | 'loading';
        lastSuccess?: string;
    }>({
        provider: 'Checking...',
        status: 'loading'
    });

    // Subscribe to Heartbeat Pulses
    useEffect(() => {
        const handlePulse = (event: CustomEvent) => {
            const { intention, timestamp, pendingTasks: tasks } = event.detail;
            setLastPulse(new Date(timestamp));
            setPulseCount(prev => prev + 1);
            if (typeof tasks === 'number') setPendingTasks(tasks);

            if (intention) {
                // Update thought stream
                if (intention.action === 'THINK') {
                    const thought = intention.payload?.thought || intention.reasoning || 'Thinking...';
                    setLastThought(thought);

                    // Check for reflector critique in reasoning
                    if (intention.reasoning?.includes('Reflector Critique')) {
                        setReflectorCritique(intention.reasoning);
                    } else {
                        setReflectorCritique(null);
                    }
                } else {
                    // Update action monitor
                    setLastAction(intention);
                    setLastThought(intention.reasoning || intention.action || 'Executing action...');
                    setReflectorCritique(null);
                }
            }
        };

        window.addEventListener('cortex-pulse', handlePulse as EventListener);

        // Initial Sync of Peripherals
        const syncPeripherals = async () => {
            const registrySkills = await peripheralRegistry.sync();
            setDynamicSkills(registrySkills);
        };
        syncPeripherals();

        return () => window.removeEventListener('cortex-pulse', handlePulse as EventListener);
    }, []);

    // Internal Core Skills
    const coreSkills = [
        { id: 'templates', name: 'Pattern Memory', icon: Sparkles, status: 'active', description: 'Save & reuse workflow templates' },
        { id: 'memory', name: 'Infinite Context', icon: Database, status: 'active', description: 'Cross-session memory management' },
        { id: 'factory', name: 'Skill Factory', icon: Zap, status: 'active', description: 'Create and sanitize new autonomous skills' },
    ];

    // Merge Internal + Registry Skills
    const allSkills = [
        ...coreSkills,
        ...dynamicSkills.map(s => ({
            id: s.name,
            name: s.name.charAt(0).toUpperCase() + s.name.slice(1).replace(/-/g, ' '),
            icon: s.name.includes('browser') ? Zap : (s.name.includes('discord') || s.name.includes('whatsapp') ? MessageSquare : Settings),
            status: s.eligible ? 'active' : 'inactive',
            description: s.description || 'Autonomous peripheral capability'
        }))
    ];

    // Handle soul change
    const handleSoulChange = (personaId: string) => {
        console.log('💓 Cortex: Switching soul to:', personaId);
        soul.setPersona(personaId);
        setCurrentSoul(personaId);
    };

    // Force pulse
    const handleForcePulse = () => {
        console.log('⚡ Cortex: Force pulse triggered');
        if (heartbeat.forcePulse) {
            heartbeat.forcePulse();
        }
        setLastPulse(new Date());
        setPulseCount(prev => prev + 1);
    };

    // Diagnostics re-test
    const handleRetestAI = async () => {
        console.log('🧪 Cortex: Retesting AI providers...');
        try {
            const { AIServiceFactory } = await import('../services/ai/aiServiceFactory');
            const provider = AIServiceFactory.getCurrentProvider();

            // Perform a quick heartbeat test
            const aiService = AIServiceFactory.getInstance();
            await aiService.generateText("ping", { maxTokens: 1 });

            setAiStatus({
                provider,
                status: 'online',
                lastSuccess: new Date().toLocaleTimeString()
            });
            toast.success('AI Providers refreshed. Check console for status.');
            setPulseCount(p => p + 1); // Trigger re-render
        } catch (e) {
            console.error('CortexPage: Health check failed', e);
            setAiStatus(prev => ({ ...prev, status: 'error' }));
            toast.error('Failed to refresh AI services');
        }
    };

    // Get current persona details
    const currentPersona = PERSONAS.find(p => p.id === currentSoul);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-6">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                        <Brain className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cortex</h1>
                        <p className="text-gray-500 dark:text-gray-400">AI Autonomous Identity & Control Center</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Soul & Heartbeat */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Soul Card */}
                    <Card className="border-2 border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-purple-600" />
                                    <CardTitle>Active Soul</CardTitle>
                                </div>
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    {currentPersona?.mode || 'Unknown'}
                                </Badge>
                            </div>
                            <CardDescription>The AI's current identity and behavioral directives</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl mb-4">
                                <div className="p-3 bg-purple-600 rounded-full">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                                        {currentPersona?.name || 'Unknown Soul'}
                                    </h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        {currentPersona?.openingLine || 'No identity loaded'}
                                    </p>
                                </div>
                            </div>

                            {/* Soul Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Switch Soul</label>
                                <select
                                    value={currentSoul}
                                    onChange={(e) => handleSoulChange(e.target.value)}
                                    className="w-full p-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                >
                                    {PERSONAS.map((persona) => (
                                        <option key={persona.id} value={persona.id}>
                                            {persona.name} ({persona.mode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Directives */}
                            {currentPersona && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Active Directives</h4>
                                    <div className="space-y-2">
                                        {(currentPersona.directives || []).slice(0, 3).map((directive, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                                <span>{directive}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Heartbeat & Thought Monitor */}
                    <Card className="border-2 border-red-200 dark:border-red-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Heart className={`h-5 w-5 text-red-500 ${heartbeatStatus === 'online' ? 'animate-pulse' : ''}`} />
                                    <CardTitle>Cognitive Core</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 mr-4">
                                        <Badge
                                            onClick={() => {
                                                const newState = !isAutonomous;
                                                heartbeat.setAutonomy?.(newState);
                                                setIsAutonomous(newState);
                                                toast.info(`Sovereign Autonomy: ${newState ? 'Enabled' : 'Disabled'}`);
                                            }}
                                            className={`cursor-pointer transition-all ${isAutonomous ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                        >
                                            <Zap className={`h-3 w-3 mr-1 ${isAutonomous ? 'text-yellow-300' : ''}`} />
                                            {isAutonomous ? 'SOVEREIGN' : 'RESTRICTED'}
                                        </Badge>
                                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                            <Shield className="h-3 w-3 mr-1" />
                                            REFLECTOR
                                        </Badge>
                                    </div>
                                    <Badge className={heartbeatStatus === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                        {heartbeatStatus === 'online' ? '● ONLINE' : '○ PAUSED'}
                                    </Badge>
                                </div>
                            </div>
                            <CardDescription>Real-time autonomous decision stream & sovereign override</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Live Thought Stream */}
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 h-48 overflow-y-auto font-mono text-sm relative">
                                {lastThought ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                                            <Brain className="h-3 w-3" />
                                            <span className="text-xs font-bold uppercase">Thinking Process</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 italic">"{lastThought}"</p>

                                        {reflectorCritique && (
                                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500 text-[10px] text-amber-700 dark:text-amber-300">
                                                <Shield className="h-3 w-3 inline mr-1" />
                                                <strong>Reflector Intervention:</strong> {reflectorCritique.replace('Reflector Critique:', '').trim()}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center italic mt-16">Waiting for next thought cycle...</p>
                                )}

                                <div className="absolute top-2 right-2">
                                    <Activity className={`h-3 w-3 ${heartbeatStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`} />
                                </div>
                            </div>

                            {/* Diagnostics Section */}
                            <div className="space-y-6 mb-6">
                                {/* Performance Metrics */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <CardHeader className="p-0 mb-4">
                                        <CardTitle className="text-sm flex justify-between items-center">
                                            <span>Live Diagnostics</span>
                                            <Badge
                                                variant={aiStatus.status === 'online' ? 'default' : 'destructive'}
                                                className={`text-[10px] ${aiStatus.status === 'online' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                            >
                                                {aiStatus.status.toUpperCase()}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="text-[11px]">
                                            Real-time AI provider & loop health
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 pt-0">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-400">AI Provider:</span>
                                            <span className="font-mono text-cyan-400">{aiStatus.provider}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-400">Last Success:</span>
                                            <span className="font-mono">{aiStatus.lastSuccess || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-400">Heartbeat:</span>
                                            <span className="flex items-center gap-1">
                                                <Activity className={`w-3 h-3 ${heartbeatStatus === 'paused' ? 'text-zinc-500' : 'text-green-500 animate-pulse'}`} />
                                                {heartbeatStatus === 'paused' ? 'Paused' : 'Active'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleRetestAI}
                                            className="w-full py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Zap className="h-4 w-4" />
                                            Retest AI Providers
                                        </button>
                                    </CardContent>
                                </div>
                            </div>

                            {/* Last Action Result */}
                            {lastAction && (
                                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900">
                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                                        <Zap className="h-3 w-3" />
                                        <span className="text-xs font-bold uppercase">Last Action: {lastAction.action}</span>
                                    </div>
                                    <pre className="text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
                                        {JSON.stringify(lastAction.payload, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{pulseCount}</div>
                                    <div className="text-xs text-red-500">Cycles</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">60s</div>
                                    <div className="text-xs text-blue-500">Interval</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{allSkills.filter(s => s.status === 'active').length}</div>
                                    <div className="text-xs text-green-500">Active Hands</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{pendingTasks}</div>
                                    <div className="text-xs text-indigo-500">Queued Tasks</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleForcePulse}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Force Cycle
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (heartbeatStatus === 'online') {
                                            heartbeat.pause?.();
                                            setHeartbeatStatus('paused');
                                        } else {
                                            heartbeat.resume?.();
                                            setHeartbeatStatus('online');
                                        }
                                    }}
                                    className="flex-1"
                                >
                                    {heartbeatStatus === 'online' ? 'Pause' : 'Resume'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Skills */}
                <div className="space-y-6">
                    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-indigo-600" />
                                    <CardTitle>Peripheral Catalog</CardTitle>
                                </div>
                                <Button 
                                    onClick={() => navigate('/skills/create')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                                >
                                    <Zap className="h-3.5 w-3.5" /> Creator Wizard
                                </Button>
                            </div>
                            <CardDescription>Managed "Hands" & Autonomous Capabilities ({allSkills.length})</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 h-[600px] overflow-y-auto pr-2">
                                {allSkills.map((skill) => {
                                    const Icon = skill.icon;
                                    return (
                                        <div
                                            key={skill.id}
                                            className={`p-4 rounded-xl border-2 transition-all ${skill.status === 'active'
                                                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={`h-5 w-5 ${skill.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                                                    <span className="font-medium">{skill.name}</span>
                                                </div>
                                                <Badge className={
                                                    skill.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }>
                                                    {skill.status === 'active' ? 'Active' : 'Coming Soon'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500">{skill.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-600" />
                                <CardTitle>Quick Actions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                <Mail className="h-4 w-4 mr-2" />
                                Check Inbox Now
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Database className="h-4 w-4 mr-2" />
                                Sync Knowledge
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Brain className="h-4 w-4 mr-2" />
                                Introspect Soul
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CortexPage;
