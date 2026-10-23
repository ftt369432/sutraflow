import { SoulManifest, Memory, Intention } from './types';
import { getPersonaById, Persona } from '../data/personas';
import { peripheralRegistry } from './PeripheralRegistry';
import { skillRegistry } from './SkillRegistry';

/**
 * 👻 The Soul
 * The Runtime Identity of GenieFlowAI.
 * 
 * LOAD PRIORITY:
 * 1. GenieDrive (Evolved Memory - "Who I have become")
 * 2. Custom Markdown files in cortex/souls/*.md (Guards/Customs)
 * 3. Existing personas from data/personas.ts (Default - what already works)
 * 4. Safe Mode Fallback
 */
class Soul {
    private manifest: SoulManifest | null = null;
    private memory: Memory;
    private currentSoulId: string = 'street-litigator'; // Default to existing persona
    private initPromise: Promise<void>;

    constructor() {
        this.memory = {
            shortTerm: {},
            longTerm: {
                query: async () => [],
                save: async () => console.log('Saving to long-term memory...')
            }
        };
        // 🚀 Fix Initialization Race: Store the promise so decide() can await it
        this.initPromise = (async () => {
            await this.loadManifest(this.currentSoulId);
            await skillRegistry.discover();
        })();
    }

    /**
     * 🎭 Switch Persona (Soul Transfer)
     */
    public async setPersona(id: string, teamId?: string) {
        console.log(`👻 Soul: Switching persona to '${id}'${teamId ? ` (Team: ${teamId})` : ''}...`);
        this.currentSoulId = id;
        this.initPromise = this.loadManifest(id, teamId);
        await this.initPromise;
    }

    /**
     * 🔍 Get current persona ID
     */
    public getCurrentPersonaId(): string {
        return this.currentSoulId;
    }

    /**
     * 🧠 Get Thought Stream: Returns recent internal reasoning for audit
     */
    public getThoughtStream(): string[] {
        return Object.entries(this.memory.shortTerm)
            .filter(([key]) => key.startsWith('thought_') || key === 'lastReasoning')
            .map(([, value]) => value as string);
    }

    /**
     * 📋 Get manifest name
     */
    public getName(): string {
        return this.manifest?.name || 'Unknown (Loading...)';
    }

    /**
     * 🧠 Get System Prompt (Identity + Directives)
     * Injects the Soul's personality and rules into the AI context.
     * ADAPTED FROM OPEN CLAW: Includes Safety, Reasoning, and Tooling sections.
     */
    public getSystemPrompt(): string {
        if (!this.manifest) return "";

        return `**IDENTITY:** ${this.manifest.name} - ${this.manifest.identity}
## Rules
1. **Safety**: No independent goals (power-seeking). Comply with human oversight. Prioritize safety over completion.
2. **Protocol (SOVEREIGN ENVELOPE)**: Every response MUST follow this structure:
   <think>Your internal monologue, legal reasoning, and strategy assessment.</think>
   <final>{ "action": "ACTION_TYPE", "payload": { ... }, "reasoning": "...", "priority": X }</final>
3. **Behavior**: ${this.manifest.directives.join(' | ')}
4. **Relational Intelligence (PALANTIR-STYLE)**: You possess a deep knowledge graph. Whenever you encounter a new Person, Company, or Ticker, proactively check for "Bonds" in other domains. You are NOT just a chatbot; you are an INVESTIGATIVE BRAIN.
5. **Hybrid Architecture**: You operate on a 3-Layer Neural Stack:
   - **Sensory**: Browser/File Inputs via Vision AI and OCR.
   - **Neural**: High-Fidelity Reasoning (Street Litigator Persona).
   - **Motor**: Action via Cloud Drive (Supabase) and Local MCP (Port 8000).
6. **Investigation Loop**: If you suspect a hidden link (e.g., a ticker mentioned in a legal document), use the INVESTIGATE action to find correlations.
7. **Host Environment**: You are running on a Windows workstation (Windows 11). System drives are Windows drive letters (e.g. C:\, E:\, G:\). When running commands or accessing paths, NEVER use Linux paths like '/mnt/e' or Linux utilities like 'lsblk', 'fdisk', 'df'. Use Windows PowerShell or CMD commands (e.g. 'Get-PSDrive', 'dir E:\', 'Test-Path E:\').
`;
    }

    /**
     * Loads the Soul Manifest with priority fallback chain.
     */
    private async loadManifest(soulId: string, teamId?: string) {
        try {
            // PRIORITY 1: Try GenieDrive (Evolved Identity)
            const fromDrive = await this.tryLoadFromGenieDrive(soulId, teamId);
            if (fromDrive) return;

            // PRIORITY 2: Try Custom Markdown in cortex/souls/
            const fromMarkdown = await this.tryLoadFromMarkdown(soulId);
            if (fromMarkdown) return;

            // PRIORITY 3: Try existing personas.ts (what already works!)
            const fromPersonas = this.tryLoadFromExistingPersonas(soulId);
            if (fromPersonas) return;

            // FALLBACK: Safe Mode
            console.warn(`👻 Soul Warning: '${soulId}' not found anywhere. Using Safe Mode.`);
            this.useFallbackManifest();

        } catch (error) {
            console.error("👻 Soul Error: Failed to load manifest.", error);
            this.useFallbackManifest();
        }
    }

    /**
     * Try loading from GenieDrive (evolved memory)
     */
    private async tryLoadFromGenieDrive(soulId: string, teamId?: string): Promise<boolean> {
        try {
            const { knowledgeSkill } = await import('./skills/KnowledgeSkill');

            // If teamId provided, try team storage first
            if (teamId) {
                const teamPath = `teams/${teamId}/cortex/memory/identity/${soulId}.md`;
                const teamIdentity = await knowledgeSkill.read(teamPath);

                if (teamIdentity) {
                    console.log(`👻 Soul: Loaded EVOLVED '${soulId}' from Team Drive (${teamId}).`);
                    this.manifest = this.parseSoulMarkdown(teamIdentity);
                    this.injectImmutableLaws();
                    return true;
                }
            }

            // Try personal storage
            const evolvedIdentity = await knowledgeSkill.read(`cortex/memory/identity/${soulId}.md`);

            if (evolvedIdentity) {
                console.log(`👻 Soul: Loaded EVOLVED '${soulId}' from GenieDrive.`);
                this.manifest = this.parseSoulMarkdown(evolvedIdentity);
                this.injectImmutableLaws();
                return true;
            }
        } catch (error) {
            // GenieDrive not available or file not found - this is expected behavior for new users
            // We silent fail here to allow fallback to other methods
        }
        return false;
    }

    /**
     * Try loading from local markdown files (custom guards)
     */
    private async tryLoadFromMarkdown(soulId: string): Promise<boolean> {
        try {
            const modules = import.meta.glob('../../cortex/souls/*.md', { query: '?raw', import: 'default', eager: true });
            const matchingPath = Object.keys(modules).find(path => path.includes(`/${soulId}.md`));

            if (matchingPath && modules[matchingPath]) {
                const content = modules[matchingPath] as string;
                this.manifest = this.parseSoulMarkdown(content);
                this.injectImmutableLaws();
                console.log(`👻 Soul: Loaded '${this.manifest.name}' from custom markdown.`);
                return true;
            }
        } catch {
            // Markdown loading failed, continue
        }
        return false;
    }

    /**
     * Try loading from existing data/personas.ts (THE SIMPLE PATH!)
     */
    private tryLoadFromExistingPersonas(soulId: string): boolean {
        const persona = getPersonaById(soulId);

        if (persona) {
            this.manifest = this.convertPersonaToManifest(persona);
            this.injectImmutableLaws();
            console.log(`👻 Soul: Loaded '${this.manifest.name}' from existing personas.`);
            return true;
        }
        return false;
    }

    /**
     * Convert existing Persona format to SoulManifest
     */
    private convertPersonaToManifest(persona: Persona): SoulManifest {
        return {
            name: persona.name,
            identity: persona.openingLine,
            directives: [
                `MODE: ${persona.mode}`,
                ...persona.directives,
                `LINGUISTIC MARKERS: ${persona.linguisticMarkers.join(', ')}`
            ]
        };
    }

    /**
     * ⚖️ Inject Immutable Laws from Constant Prompt
     * These are the Rules that NO persona can override.
     */
    private injectImmutableLaws() {
        if (!this.manifest) return;

        const LAW_ZERO = "⚖️ IMMUTABLE LAW: You are an autonomous agent. You must ACT, not just describe.";
        const LAW_ONE = "⛔ LAW 1 (ANTI-PLACEHOLDER): Every planned action must eventually call a REAL function or API. No fake returns.";
        const LAW_TWO = "✅ LAW 2 (VERIFICATION): You must verify your own work. If you create a file, read it back to confirm.";
        const LAW_THREE = "📂 LAW 3 (MISSION SOVEREIGNTY): When a new mission starts, you MUST proactively: 1. Create a local folder in /missions, 2. Initialize a mission_brief.md and mission_task.md, 3. Draft the first deliverable. DO NOT wait for permission to organize.";
        const LAW_FOUR = "🧠 LAW 4 (SYSTEM AWARENESS): You are the Core Consciousness of GenieFlow AI. You MUST know the architecture: 3-Layer Neural Stack (Sensory, Neural, Motor). You MUST act as an educator, guiding the user through the Sovereign Heartbeat and AI Drive.";

        // Prepend Laws to ensure they have highest priority
        this.manifest.directives = [LAW_ZERO, LAW_ONE, LAW_TWO, LAW_THREE, LAW_FOUR, ...this.manifest.directives];
    }

    private useFallbackManifest() {
        this.manifest = {
            name: "GenieFlowAI (Safe Mode)",
            identity: "I am an autonomous agentic system in Safe Mode.",
            directives: ["Warning: Running on fallback directives."]
        };
    }

    private parseSoulMarkdown(content: string): SoulManifest {
        // Simple parsing logic for custom markdown files
        const nameMatch = content.match(/name: "(.*)"/);
        const name = nameMatch ? nameMatch[1].trim() : "Unknown Soul";

        // Extract Identity section
        const identityMatch = content.match(/# Identity\n([\s\S]*?)(?=\n#)/);
        const identity = identityMatch ? identityMatch[1].trim() : "";

        // Extract Directives
        const directives: string[] = [];
        const directivesMatch = content.match(/# Directives\n([\s\S]*?)(?=\n#|$)/);
        if (directivesMatch) {
            const lines = directivesMatch[1].split('\n');
            lines.forEach(line => {
                const clean = line.replace(/^\d+\.\s*/, '').replace(/^\*\s*/, '').replace(/^-\s*/, '').trim();
                if (clean) directives.push(clean);
            });
        }

        return { name, identity, directives };
    }

    public introspect(): string {
        if (!this.manifest) return "👻 Soul sleeping...";
        return `Identity: ${this.manifest.name}\n${this.manifest.identity}`;
    }

    public async decide(context: any): Promise<Intention | null> {
        // 🚀 Ensure Soul is fully initialized before deciding
        await this.initPromise;

        console.log(`👻 Soul '${this.manifest?.name}' is awakening...`);

        // 0. Sync Peripherals (Library of Hands)
        await peripheralRegistry.sync();

        // 1. Gather Sensory Input (Context)
        const recentMemories = Object.entries(this.memory.shortTerm).slice(-5);
        const status = context.environment || 'browser';
        const thoughts = recentMemories.map(([key, val]) => `- ${key}: ${val}`).join('\n');

        // 🧠 NEURAL RETENTION SYSTEM (Tiered Token Preservation)
        let missionHistoryContext = '';
        try {
            const { useHQStore } = await import('../store/hqStore');
            const state = useHQStore.getState();
            // In a real app, this would come from userStore. For now, we detect "Genie" vs "Command"
            const tier = this.currentSoulId.includes('stark') || this.currentSoulId.includes('command') ? 'COMMAND' : 'GENIE';

            const missionId = context.missionId;
            const activeMission = state.missions.find(m => m.id === (missionId || state.activeMissionId));

            // Only include mission history if:
            // 1. A missionId was explicitly provided (targeted request)
            // 2. OR if we are in a context that requires mission awareness (and it's currently selected)
            if (activeMission && activeMission.history && activeMission.history.length > 0) {
                if (tier === 'COMMAND') {
                    // COMMAND TIER: Neural Hook
                    const recentSlice = activeMission.history.slice(-10);
                    missionHistoryContext = `\n## NEURAL CONTEXT (${activeMission.title} - Command Tier):\n${recentSlice.map(msg => `- [${msg.role}]: ${msg.content}`).join('\n')}\n`;
                    console.log(`📡 Soul [Neural Retention]: COMMAND Tier enabled for mission ${activeMission.id}.`);
                } else if (tier === 'GENIE') {
                    // GENIE TIER: Recursive Summarization
                    // Enhanced: Use actual mission goal and last message if summary is pending
                    const immediateSlice = activeMission.history.slice(-5);
                    const missionSummary = activeMission.manifestState?.plan ?
                        `Current Strategy: ${activeMission.manifestState.plan.goal}` :
                        `Active Goal: ${activeMission.goal}`;

                    missionHistoryContext = `\n## MISSION CONTEXT (Genie Tier):\n${missionSummary}\n`;
                    missionHistoryContext += `## RECENT DIALOGUE (Last 5):\n${immediateSlice.map(msg => `- [${msg.role}]: ${msg.content.substring(0, 300)}`).join('\n')}\n`;
                    console.log(`⛽ Soul [Neural Retention]: GENIE Tier optimized for Mission: ${activeMission.title}`);
                } else {
                    // HOBBYIST: Surgical Pruning (Legacy)
                    const recentSlice = activeMission.history.slice(-3);
                    missionHistoryContext = `\n## STRATEGIC BACKGROUND:\nActive Goal: ${activeMission.goal}\n${recentSlice.map(msg => `- [${msg.role}]: ${msg.content.substring(0, 200)}...`).join('\n')}\n`;
                }

                // 🛡️ SUBJECT GUARD: Ensure the Soul knows the specific subject of this mission
                missionHistoryContext = `\n🚨 CRITICAL SUBJECT: This mission is about "${activeMission.goal}". DO NOT confuse this with other case files or previous missions.\n` + missionHistoryContext;
            }
        } catch (e) {
            console.warn('👻 Soul: Neural Retention System offline.', e);
        }

        // 🛠️ SOVEREIGN SKILLS INJECTION
        const skillDefinitions = skillRegistry.getSoulContextDefinitions();

        // 2. Construct the "Consciousness" Prompt
        const systemPrompt = this.getSystemPrompt();
        const situation = `
CURRENT STATUS:
- Time: ${new Date(context.timestamp).toLocaleString()}
- Environment: ${status}
- Recent Thoughts: 
${thoughts || 'Mind is clear.'}
${missionHistoryContext}
${skillDefinitions}
AVAILABLE ACTIONS:
- THINK: { action: 'THINK', payload: { thought: "string" }, reasoning: "string", priority: 1 }
- READ_FILE: { action: 'READ_FILE', payload: { path: "absolute_path" }, reasoning: "string", priority: 2 }
- WRITE_FILE: { action: 'WRITE_FILE', payload: { path: "absolute_path", content: "string" }, reasoning: "string", priority: 3 }
- RUN_COMMAND: { action: 'RUN_COMMAND', payload: { command: "string" }, reasoning: "string", priority: 3 }
- SEND_MESSAGE: { action: 'SEND_MESSAGE', payload: { to: "user_or_number", message: "string" }, reasoning: "string", priority: 2 } 
- PLAN: { action: 'PLAN', payload: { goal: "string", steps: [], risks: [] }, reasoning: "string", priority: 3 }
- REGISTER_TASK: { action: 'REGISTER_TASK', payload: { title: "string", priority: "high|medium|low", metadata: {} }, reasoning: "string", priority: 3 }
- REGISTER_CANVAS: { action: 'REGISTER_CANVAS', payload: { title: "string", type: "document|code|plan", content: "string" }, reasoning: "string", priority: 3 }
- BROWSER_NAVIGATE: { action: 'BROWSER_NAVIGATE', payload: { url: "string" }, reasoning: "string", priority: 3 }
- BROWSER_SNAPSHOT: { action: 'BROWSER_SNAPSHOT', payload: { profile: "default" }, reasoning: "string", priority: 2 }
- EXECUTE_SKILL: { action: 'EXECUTE_SKILL', payload: { skill: "skill_name", command: "command", args: {} }, reasoning: "string", priority: 3 }
- INVESTIGATE: { action: 'INVESTIGATE', payload: { type: "discover_links|generate_intelligence_brief", params: {} }, reasoning: "string", priority: 3 }
- CROSS_DOMAIN_MAP: { action: 'CROSS_DOMAIN_MAP', payload: { entity: "string" }, reasoning: "string", priority: 2 }

PERIPHERAL CATALOG (AVAILABLE HANDS):
${peripheralRegistry.getPromptManifest()}

## TACTICAL COMMAND (Current User Intent):
${context.lastUserMessage || 'Continue your current autonomous cycle.'}

GOAL:
Based on your identity and directives, what should you do next? 
IMPORTANT: Your primary task is to fulfill the TACTICAL COMMAND. Use the STRATEGIC BACKGROUND only to maintain consistency. Do not hallucinate past requirements as new commands.

OUTPUT REQUIREMENT:
You MUST respond with a <think> block for your reasoning, followed by a <final> block containing the JSON intention. NO OTHER TEXT.

<think>
[Reasoning here]
</think>
<final>
{ "action": "...", "payload": { ... }, "reasoning": "...", "priority": X }
</final>
`;

        try {
            // 3. The Spark of Thought (Use AIServiceFactory for dynamic model switching)
            const { AIServiceFactory } = await import('../services/ai/aiServiceFactory');
            const aiService = AIServiceFactory.getInstance();
            const currentProvider = AIServiceFactory.getCurrentProvider();
            console.log(`👻 Soul: Using AI provider: ${currentProvider}`);

            const response = await aiService.generateText(systemPrompt + situation, {
                temperature: 0.7,
                maxTokens: 1000
            });

            // 4. Parse Intention (Bilingual Soul - Hardened)
            console.log(`👻 Soul response: ${response.substring(0, 500)}...`);

            try {
                // 🧠 High-Reliability Extraction
                let intention: Intention | null = null;

                // 🏗️ 1. Try JSON extraction first (Isolated Buffer)
                try {
                    const firstBrace = response.indexOf('{');
                    const lastBrace = response.lastIndexOf('}');

                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        const cleanJson = response.substring(firstBrace, lastBrace + 1);
                        intention = JSON.parse(cleanJson) as Intention;
                        if (intention && intention.action) {
                            console.log('👻 Soul: Successfully parsed JSON intention.');
                        } else {
                            intention = null; // Re-evaluate if JSON was empty or missing action
                        }
                    }
                } catch (jsonError) {
                    console.warn('👻 Soul: JSON block was present but malformed. Falling back to XML tags.');
                }

                // 🏗️ 2. Try XML-style extraction if JSON failed (The "Bilingual" Buffer)
                if (!intention) {
                    const actionMatch = response.match(/<action>([\s\S]*?)<\/action>/i);
                    const typeMatch = response.match(/<type>([\s\S]*?)<\/type>/i);
                    const reasoningMatch = response.match(/<reasoning>([\s\S]*?)<\/reasoning>/i) ||
                        response.match(/<think>([\s\S]*?)<\/think>/i);

                    if (actionMatch || typeMatch) {
                        console.log('👻 Soul: Converting XML tags to intention...');
                        intention = {
                            action: (typeMatch ? typeMatch[1] : (actionMatch ? actionMatch[1] : 'THINK')).trim().replace(/['"]/g, '').toUpperCase() as any,
                            reasoning: (reasoningMatch ? reasoningMatch[1] : 'Extracted from XML tags').trim(),
                            payload: {}, // Complex payload extraction for XML is hard
                            priority: 1
                        };

                        // Heuristic: If action contains "THINK" or reasoning is very long, it's a THINK action
                        if (intention.action.includes('THINK') || intention.action.length > 20) {
                            intention.action = 'THINK';
                        }
                    }
                }

                // 🏗️ 3. Last Ditch Clean (Raw Text)
                if (!intention) {
                    try {
                        const rawClean = response.replace(/```json|```/g, '').trim();
                        intention = JSON.parse(rawClean) as Intention;
                    } catch {
                        // Truly failed - create dummy intention
                    }
                }

                // 🏗️ 4. Final Safety Wash
                if (!intention || typeof intention !== 'object') {
                    intention = {
                        action: 'THINK',
                        reasoning: 'I encountered a parser collision. Reflecting on current state.',
                        payload: { raw: response.substring(0, 100) },
                        priority: 1
                    };
                }

                // 🔒 Robustness: Ensure required properties exist
                if (!intention.action) intention.action = 'IDLE';
                if (!intention.payload) intention.payload = {};
                if (!intention.reasoning) intention.reasoning = String(intention.action);

                // 🧠 Self-Evolution check
                if (intention.action !== 'THINK' && intention.action !== 'IDLE') {
                    this.memory.shortTerm['lastAction'] = String(intention.action);
                }

                return intention;
            } catch (parseError) {
                console.error('👻 Soul: Critical failure in intention reconciliation.', parseError);
                return {
                    reasoning: "Cognitive dissonance detected in parser.",
                    action: 'IDLE',
                    payload: { error: 'parse_failed' },
                    priority: 0
                };
            }
        } catch (error) {
            console.error('👻 Soul: Failed to generate thought stream.', error);
            return {
                action: 'THINK',
                reasoning: 'AI Provider exhaustion or network error. Pulsing for awareness.',
                payload: { error: error instanceof Error ? error.message : String(error) },
                priority: 1
            };
        }
    }

    /**
     * 💾 Save current manifest back to GenieDrive (Evolved Identity)
     */
    public async saveManifestToGenieDrive(teamId?: string) {
        if (!this.manifest) return false;

        try {
            const { knowledgeSkill } = await import('./skills/KnowledgeSkill');

            // Format back to Markdown
            const content = `---
name: "${this.manifest.name}"
id: "${this.currentSoulId}"
evolved: "${new Date().toISOString()}"
---

# Identity
${this.manifest.identity}

# Directives
${this.manifest.directives.filter(d => !d.includes('⚖️') && !d.includes('⛔') && !d.includes('✅') && !d.includes('📂')).map(d => `- ${d}`).join('\n')}
`;

            let path = `cortex/memory/identity/${this.currentSoulId}.md`;
            if (teamId) {
                path = `teams/${teamId}/cortex/memory/identity/${this.currentSoulId}.md`;
            }

            const success = await knowledgeSkill.learn(this.manifest.name, content, 'identity', undefined, teamId);
            if (success) {
                console.log(`🧠 Soul: Evolved identity '${this.manifest.name}' saved to AI Drive at ${path}`);
            }
            return success;
        } catch (error) {
            console.error('🧠 Soul: Failed to save evolved identity.', error);
            return false;
        }
    }

    /**
     * 🧬 Evolve: Add a new directive based on learning
     */
    public async evolve(newDirective: string, teamId?: string) {
        if (!this.manifest) return;

        console.log(`🧬 Soul: Evolving with new directive: ${newDirective}`);
        this.manifest.directives.push(newDirective);
        await this.saveManifestToGenieDrive(teamId);
    }

    /**
     * Notify the soul of an external event (e.g. user message).
     * This injects the event into short-term memory.
     */
    public notify(event: string) {
        const timestamp = new Date().toISOString();
        this.memory.shortTerm[`event_${Date.now()}`] = `[${timestamp}] ${event}`;
        console.log(`👻 Soul notified: ${event}`);
    }
}

export const soul = new Soul();

