import { CortexContext } from './types';

/**
 * 💓 The Heartbeat
 * The autonomic nervous system of GenieFlowAI.
 * It pulses periodically to drive the agentic system without user input.
 * 
 * Configurable via localStorage:
 *   genieflow_heartbeat_pulse_ms       — interval between ticks (default: 60s)
 *   genieflow_soul_throttle_ms         — min time between Soul AI calls (default: 15min)
 *   genieflow_autonomy_enabled         — whether autonomous task execution is on
 */
class HeartbeatService {
    private intervalId: any = null;
    private readonly DEFAULT_PULSE_MS = 60 * 1000;        // 1 minute tick
    private readonly SLOW_PULSE_RATE_MS = 5 * 60 * 1000;  // 5 minutes (backoff)
    private readonly DEFAULT_SOUL_THROTTLE_MS = 15 * 60 * 1000; // 15 min between Soul AI calls
    private isAlive = false;
    private isAutonomous = true;
    private readonly OFFLINE_DOWNshift_RATE_MS = 10 * 60 * 1000;
    private _lastIntentionHash: string = '';
    private _lastProcessedMessageId: string | null = null;
    private _lastSoulCallTime: number = 0; // 🔢 Throttle tracker

    // 🧠 Smart resource conservation
    private _consecutiveFailures: number = 0;
    private _isPulsing: boolean = false;
    private readonly SLOW_AFTER_FAILURES = 3;
    private readonly PAUSE_AFTER_FAILURES = 5;
    private _isPaused: boolean = false;

    // 📖 Read configurable values from localStorage (with defaults)
    private get pulsRateMs(): number {
        try {
            const v = localStorage.getItem('genieflow_heartbeat_pulse_ms');
            return v ? Math.max(10000, parseInt(v)) : this.DEFAULT_PULSE_MS;
        } catch { return this.DEFAULT_PULSE_MS; }
    }

    private get soulThrottleMs(): number {
        try {
            const v = localStorage.getItem('genieflow_soul_throttle_ms');
            return v ? Math.max(60000, parseInt(v)) : this.DEFAULT_SOUL_THROTTLE_MS;
        } catch { return this.DEFAULT_SOUL_THROTTLE_MS; }
    }

    /**
     * 🎛️ Static helper — set config values from UI without touching code
     */
    public static configure(options: {
        pulseIntervalMs?: number;
        soulThrottleMs?: number;
    }) {
        try {
            if (options.pulseIntervalMs !== undefined) {
                localStorage.setItem('genieflow_heartbeat_pulse_ms', String(Math.max(10000, options.pulseIntervalMs)));
            }
            if (options.soulThrottleMs !== undefined) {
                localStorage.setItem('genieflow_soul_throttle_ms', String(Math.max(60000, options.soulThrottleMs)));
            }
            console.log('💓 Heartbeat: Config updated', options);
        } catch (e) {
            console.warn('💓 Heartbeat: Failed to save config:', e);
        }
    }

    constructor() {
        // Restore autonomy state from localStorage (defaults to false for clean reactive chat)
        try {
            const saved = localStorage.getItem('genieflow_autonomy_enabled');
            if (saved !== null) {
                this.isAutonomous = saved !== 'false';
            } else {
                this.isAutonomous = false;
                localStorage.setItem('genieflow_autonomy_enabled', 'false');
            }
        } catch (e) {
            this.isAutonomous = false;
            console.warn('💓 Heartbeat: Failed to restore autonomy state:', e);
        }
        console.log(`💓 Cortex Heartbeat initialized. Autonomy: ${this.isAutonomous ? 'ENABLED' : 'DISABLED'} | Pulse: ${this.pulsRateMs/1000}s | Soul throttle: ${this.soulThrottleMs/60000}min`);
    }

    async start() {
        if (this.isAlive) return;
        this.isAlive = true;
        this._consecutiveFailures = 0;
        this._isPaused = false;
        console.log(`💓 Cortex Heartbeat STARTED. Autonomy: ${this.isAutonomous ? 'ENABLED' : 'DISABLED'} | Pulse: ${this.pulsRateMs/1000}s`);
        await this.seedSovereignMissions();
        this.pulse();
        this.intervalId = setInterval(() => this.pulse(), this.pulsRateMs);
    }

    /**
     * 🌱 Seed Sovereign Missions
     * Ensures the core mission set is present in the HQ.
     */
    private async seedSovereignMissions() {
        // Disabled auto-seeding to ensure a clean user workspace.
        // Missions should now be created via user prompt or explicit mission initialization.
        console.log('💓 Heartbeat: Clean workspace initialization complete.');
    }

    /**
     * 🎛️ Set autonomy mode at runtime — called directly from the Settings toggle.
     * Reactive mode (false): Soul is gated, zero background AI calls.
     * Autonomous mode (true): Soul fires on its configured schedule.
     */
    public setAutonomy(enabled: boolean): void {
        this.isAutonomous = enabled;
        try {
            localStorage.setItem('genieflow_autonomy_enabled', String(enabled));
        } catch (e) { /* storage unavailable */ }
        console.log(`💓 Heartbeat: Mode switched to ${enabled ? '🤖 AUTONOMOUS' : '🎯 REACTIVE (idle Soul gated)'}`);
        if (!enabled) {
            this._lastSoulCallTime = 0; // fresh throttle window on re-enable
        }
    }

    /**
     * Returns current autonomy status
     */
    public getAutonomy(): boolean {
        return this.isAutonomous;
    }



    /**
     * Stops the autonomous loop (e.g. for privacy or shutdown).
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isAlive = false;
        console.log('💓 Cortex Heartbeat STOPPED.');
    }

    /**
     * Publicly accessible pulse for manual triggering/testing.
     * Also resumes the heartbeat if it was paused due to failures.
     */
    public async forcePulse() {
        console.log('⚡ Force Pulse triggered — resetting failure counter.');
        this._consecutiveFailures = 0;
        this._isPaused = false;
        this._restartInterval(this.pulsRateMs);
        await this.pulse();
    }

    /**
     * Restart the interval ONLY if the rate has changed.
     * Calling this repeatedly with the same rate is a no-op — prevents cascade stacking.
     */
    private _currentIntervalRate: number = 0;
    private _restartInterval(rateMs: number) {
        if (this._currentIntervalRate === rateMs && this.intervalId) return; // Already at this rate, skip
        if (this.intervalId) clearInterval(this.intervalId);
        this._currentIntervalRate = rateMs;
        this.intervalId = setInterval(() => this.pulse(), rateMs);
    }

    /**
     * The "Tick" of the system.
     * Checks sensors, wakes the Soul, drives autonomy.
     * Now also checks the Orchestrator's task queue for pending work.
     */
    private async pulse() {
        if (!this.isAlive || this._isPaused || this._isPulsing) return;
        this._isPulsing = true;

        let context: CortexContext = {
            timestamp: Date.now(),
            environment: 'browser'
        };

        // 📡 Sync Skills (The Hands)
        try {
            const { skillBridge } = await import('./SkillBridge');
            const { useHQStore } = await import('../store/hqStore');
            const hqState = useHQStore.getState();
            const activeMission = hqState.missions.find(m => m.id === hqState.activeMissionId);

            context.missionId = activeMission?.id;

            // 🧠 RESPONSIVE HEARTBEAT: If gateway is offline, adjust rate if needed (rate-change only, no cascade)
            if (skillBridge.isOffline()) {
                const hasActiveMission = !!activeMission;
                const recentHistory = (activeMission?.history || []).length > 0;

                if (hasActiveMission && recentHistory) {
                    // Only log once per rate state, not every pulse
                    if (this._currentIntervalRate !== this.pulsRateMs) {
                        console.log('💓 Heartbeat: Gateway offline, mission active. Maintaining standard pulse rate.');
                    }
                    this._restartInterval(this.pulsRateMs); // uses configured rate, not hardcoded
                } else {
                    if (this._currentIntervalRate !== this.OFFLINE_DOWNshift_RATE_MS) {
                        console.log('💓 Heartbeat: Gateway offline and idle. Downshifting pulse rate.');
                    }
                    this._restartInterval(this.OFFLINE_DOWNshift_RATE_MS);
                }
            } else {
                const { discoveryService } = await import('../services/discoveryService');
                await discoveryService.syncSkills();
            }
        } catch (e) {
            console.warn('💓 Heartbeat: Failed to sync skills.', e);
        }

        try {
            // 🧠 1. Wake the Soul (decision-making identity)
            const { soul } = await import('./Soul');
            const { skillExecutor } = await import('./SkillExecutor');
            const { getOrchestrationManifest } = await import('../services/agents/OrchestrationManifest');
            // 📋 2. Check Orchestrator for pending tasks (The "To-Do" List)
            const { supabase } = await import('../lib/supabaseClient');
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || 'current-user';

            const manifest = getOrchestrationManifest(userId);
            const { useHQStore } = await import('../store/hqStore');
            const hqStore = useHQStore.getState();
            const activeMission = hqStore.missions.find(m => m.id === hqStore.activeMissionId);

            // 📋 3. Enhance Context with latest User Intent
            let lastMessageId: string | null = null;
            if (activeMission && activeMission.history) {
                const userMessages = activeMission.history.filter(m => m.role === 'user');
                if (userMessages.length > 0) {
                    const latest = userMessages[userMessages.length - 1];
                    context.lastUserMessage = latest.content;
                    lastMessageId = latest.id;
                }
            }

            // Sync manifest from HQ only if the manifest is truly empty (no tasks at all)
            if (activeMission && Object.keys(manifest.getAllTasks()).length === 0 && (activeMission.manifestState.todoQueue || []).length > 0) {
                console.log(`💓 Heartbeat: Re-hydrating manifest from active mission: ${activeMission.title}`);
                Object.values(activeMission.manifestState.tasks).forEach(task => {
                    if (!manifest.getTask(task.id)) {
                        manifest.registerTask(task);
                    }
                });
                if (activeMission.manifestState.plan) {
                    manifest.setPlan(activeMission.manifestState.plan);
                }
            }

            const todoQueue = manifest.getTodoQueue();
            const pendingTaskCount = todoQueue.length;

            console.log(`💓 Heartbeat Pulse [${new Date().toLocaleTimeString()}]: Tasks in queue: ${pendingTaskCount} | Active Mission: ${activeMission?.title || 'None'}`);

            let intention = null;

            // 🛑 SAFETY GATE: If not autonomous, check for user continuation triggers
            if (!this.isAutonomous) {
                const isNewMessage = lastMessageId && lastMessageId !== this._lastProcessedMessageId;

                // 🚀 Dynamic Autonomy Activation: If user messages "continue", "proceed", "start", etc., immediately unlock autonomy
                if (isNewMessage && context.lastUserMessage) {
                    const cleanMsg = context.lastUserMessage.trim().toLowerCase();
                    if (/^(continue|proceed|run|go|yes|execute|do it|start|begin|ok|next)$/i.test(cleanMsg)) {
                        console.log('💓 Heartbeat: User prompted continuation — auto-enabling Autonomy.');
                        this.setAutonomy(true);
                    }
                }

                if (!this.isAutonomous && !isNewMessage && pendingTaskCount === 0) {
                    return;
                }

                if (isNewMessage) {
                    console.log(`💓 Heartbeat: Reactive Mode - Responding to new user message: ${lastMessageId}`);
                    this._lastProcessedMessageId = lastMessageId;
                } else if (!this.isAutonomous && pendingTaskCount > 0) {
                    // Autonomy explicitly off and waiting
                    return;
                }
            }

            // 🤖 3. SOVEREIGN EXECUTION: If autonomous and tasks exist, pick one and execute
            if (this.isAutonomous && pendingTaskCount > 0) {
                // 🔍 Filter for executable tasks (not started or pending)
                const nextTask = todoQueue.find(t => t.status === 'not-started' || t.status === 'pending');

                if (nextTask) {
                    console.log(`🤖 Sovereign Execution: Automatically picking up task: ${nextTask.title}`);
                    // 🎯 Mark as in-progress immediately to prevent other components/pulses from picking it up
                    manifest.updateTaskStatus(nextTask.id, 'in-progress');

                    // Construct intention from task
                    intention = {
                        action: 'EXECUTE_TASK',
                        payload: {
                            taskId: nextTask.id,
                            title: nextTask.title,
                            description: nextTask.metadata?.userRequest || nextTask.title
                        },
                        reasoning: `Autonomous execution of pending task: ${nextTask.title}`,
                        priority: 3
                    };
                }
            } else if (!this.isAutonomous && pendingTaskCount > 0) {
                // 🔊 FEEDBACK: If tasks are pending but Autonomy is explicitly OFF, notify the user
                const nextTask = todoQueue.find(t => t.status === 'not-started' || t.status === 'pending');
                if (nextTask && nextTask.id !== this._lastProcessedMessageId) {
                    console.log(`💓 Heartbeat: Tasks pending but Autonomy is OFF. Notifying user of next step: ${nextTask.title}`);
                    
                    const mId = useHQStore.getState().activeMissionId;
                    if (mId) {
                         const lastAction = useHQStore.getState().missions.find(m => m.id === mId)?.manifestState.lastAction;
                         if (!lastAction?.includes('Permission required')) {
                             useHQStore.getState().addMissionMessage(mId, {
                                 role: 'system',
                                 content: `📍 Plan Ready: I have ${pendingTaskCount} tasks prepared. Say "Continue" or enable Autonomy to proceed with: **${nextTask.title}**`,
                                 agentName: 'Sovereign Heartbeat'
                             });
                             
                             useHQStore.getState().syncMissionWithManifest(mId, {
                                 ...activeMission!.manifestState,
                                 lastAction: `Permission required to execute: ${nextTask.title}`
                             } as any);
                         }
                    }
                    this._lastProcessedMessageId = nextTask.id;
                }
                return;
            } else {
                // 🛑 SOUL THROTTLE & IDLE CONSERVATION:
                // Only call Soul AI if there are actual pending tasks or a brand new user message.
                // Do not hallucinate unsolicited background missions when the system is completely idle.
                const isNewMessage = lastMessageId && lastMessageId !== this._lastProcessedMessageId;
                const hasRealActiveMission = activeMission && activeMission.title !== 'New Autonomous Mission' && pendingTaskCount > 0;
                if (!isNewMessage && !hasRealActiveMission && pendingTaskCount === 0) {
                    return;
                }

                const timeSinceLastSoulCall = Date.now() - this._lastSoulCallTime;
                const throttle = this.soulThrottleMs;

                if (!isNewMessage && timeSinceLastSoulCall < throttle) {
                    return;
                }

                if (isNewMessage) {
                    this._lastProcessedMessageId = lastMessageId;
                }

                // Otherwise, let the Soul decide based on genuine mission context
                this._lastSoulCallTime = Date.now();
                intention = await soul.decide(context);

                // 💡 COGNITIVE REFLECTION: Verify Soul's intention
                if (intention && intention.action !== 'THINK' && intention.action !== 'IDLE') {
                    const { cognitiveReflector } = await import('./CognitiveReflector');
                    const reflection = await cognitiveReflector.reflect(intention, soul.getThoughtStream?.() || []);

                    if (!reflection.valid) {
                        console.warn('💓 Heartbeat: Intention REJECTED by Cognitive Reflector. Switching to THINK.');
                        intention = {
                            action: 'THINK',
                            reasoning: `Reflector Critique: ${reflection.critique || 'Action deemed non-optimal.'}`,
                            payload: { originalAction: intention.action },
                            priority: 1
                        };
                    }
                }
            }

            if (intention || pendingTaskCount > 0) {
                // 🧠 Smart Hash Check to prevent redundant UI broadcasts
                const currentHash = JSON.stringify({ intention, pendingTaskCount });
                if (currentHash === this._lastIntentionHash) {
                    return; // Skip redundant broadcast (finally will still run)
                }
                this._lastIntentionHash = currentHash;

                // 📢 4. Broadcast for UI monitoring
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('cortex-pulse', {
                        detail: {
                            timestamp: context.timestamp,
                            intention: intention,
                            pendingTasks: pendingTaskCount,
                            autonomyEnabled: this.isAutonomous,
                            soul: soul.introspect().split('\n')[0]
                        }
                    }));
                }

                // 🛠️ 5. Execute the Hands
                if (intention && intention.action !== 'THINK') {
                    await skillExecutor.execute(intention);

                    // ⚡ Cognitive Chain: Trigger follow-up pulse immediately for momentum ONLY if tasks remain in queue
                    const remainingTasks = manifest.getTodoQueue().length;
                    if (this.isAutonomous && remainingTasks > 0) {
                        console.log(`⚡ Cognitive Chain: ${remainingTasks} tasks remaining — scheduling immediate follow-up pulse...`);
                        setTimeout(() => this.forcePulse(), 2000); // 2s delay gives UI time to catch up
                    } else {
                        console.log('💓 Heartbeat: Action complete. Resting until next scheduled pulse.');
                    }
                }
            }

            // ✅ Success — reset failure counter and restore normal rate
            if (this._consecutiveFailures > 0) {
                console.log('💓 Heartbeat: AI recovered — restoring normal pulse rate.');
                this._restartInterval(this.pulsRateMs);
            }
            this._consecutiveFailures = 0;
            this._isPaused = false;
        } catch (error) {
            this._consecutiveFailures++;

            if (this._consecutiveFailures >= this.PAUSE_AFTER_FAILURES) {
                console.warn(`⏸️ Heartbeat: ${this._consecutiveFailures} consecutive failures. PAUSING pulse to save resources. Call heartbeat.forcePulse() to resume.`);
                this._isPaused = true;
                if (this.intervalId) clearInterval(this.intervalId);
            } else if (this._consecutiveFailures >= this.SLOW_AFTER_FAILURES) {
                console.warn(`💓 Heartbeat: ${this._consecutiveFailures} consecutive failures. Slowing pulse to ${this.SLOW_PULSE_RATE_MS / 1000}s.`);
                this._restartInterval(this.SLOW_PULSE_RATE_MS);
            } else {
                console.error('💓 Heartbeat Outer Error:', error);
            }
        } finally {
            this._isPulsing = false;
        }
    }
}

export const heartbeat = new HeartbeatService();
