import { sovereignWorkspace } from './sovereign/sovereignWorkspace';
import { sovereignFs } from './fs/sovereignFsBridge';
/**
 * 🏛️ GenieFlow Sovereign Mission Persistence Service
 * 
 * Implements Google Antigravity-grade folder hierarchy and session transcripts:
 * 
 * E:\.genieflowai.brain\missions\<mission_id>\
 * ├── .system_generated\
 * │   └── logs\
 * │       └── transcript.jsonl    <-- Immutable JSONL log of every step
 * ├── artifacts\                  <-- Output python scripts, html dashboards, pleadings
 * └── scratch\                    <-- Temporary calculations and scratchpads
 */

export interface MissionStep {
    step_index: number;
    timestamp: string;
    role: 'user' | 'assistant' | 'system';
    type: 'USER_INPUT' | 'PLANNER_RESPONSE' | 'SYSTEM_EVENT';
    content: string;
    agentName?: string;
    tool_calls?: any[];
    metadata?: Record<string, any>;
}

export class MissionPersistenceService {
    private static instance: MissionPersistenceService;
    private primaryRoot = 'E:\\.genieflowai.brain\\missions';
    private fallbackRoot = 'AI_GENERATED_DOCS\\missions';
    private resolvedRoot: string | null = null;
    private stepCounters: Map<string, number> = new Map();

    private constructor() {}

    public static getInstance(): MissionPersistenceService {
        if (!MissionPersistenceService.instance) {
            MissionPersistenceService.instance = new MissionPersistenceService();
        }
        return MissionPersistenceService.instance;
    }

    /**
     * Resolves active base root for missions (E:\ if available, else local AI_GENERATED_DOCS)
     */
    public async getMissionRoot(): Promise<string> {
        if (this.resolvedRoot) return this.resolvedRoot;

        try {
            const check = await sovereignFs.listFiles({ path: this.primaryRoot });
            if (check.success) {
                this.resolvedRoot = this.primaryRoot;
                return this.resolvedRoot;
            }
        } catch {}

        try {
            this.resolvedRoot = await sovereignWorkspace.getMissionsDir();
            return this.resolvedRoot;
        } catch {
            this.resolvedRoot = this.fallbackRoot;
            return this.resolvedRoot;
        }
    }

    /**
     * Returns the full directory path for a specific mission
     */
    public async getMissionDir(missionId: string): Promise<string> {
        const root = await this.getMissionRoot();
        const cleanId = missionId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${root}\\${cleanId}`;
    }

    /**
     * Appends a step to .system_generated\logs\transcript.jsonl
     */
    public async recordStep(
        missionId: string,
        step: {
            role: 'user' | 'assistant' | 'system';
            content: string;
            agentName?: string;
            tool_calls?: any[];
            metadata?: Record<string, any>;
        }
    ): Promise<boolean> {
        const bridge = (window as any).electronBridge;
        if (!bridge?.fs?.writeFile) {
            console.warn('⚠️ Electron bridge not available for transcript persistence');
            return false;
        }

        try {
            const missionDir = await this.getMissionDir(missionId);
            const logFile = `${missionDir}\\.system_generated\\logs\\transcript.jsonl`;

            // Calculate step index
            const currentCount = this.stepCounters.get(missionId) || 0;
            const nextIndex = currentCount + 1;
            this.stepCounters.set(missionId, nextIndex);

            const record: MissionStep = {
                step_index: nextIndex,
                timestamp: new Date().toISOString(),
                role: step.role,
                type: step.role === 'user' ? 'USER_INPUT' : (step.role === 'system' ? 'SYSTEM_EVENT' : 'PLANNER_RESPONSE'),
                content: step.content,
                agentName: step.agentName || (step.role === 'user' ? 'Practitioner' : 'GenieFlow Sovereign AI'),
                tool_calls: step.tool_calls,
                metadata: step.metadata
            };

            const jsonLine = JSON.stringify(record) + '\n';

            // Read existing or append
            let existing = '';
            try {
                const readRes = await bridge.fs.readFile({ path: logFile });
                if (readRes?.success && readRes.content) {
                    existing = readRes.content;
                }
            } catch {}

            await bridge.fs.writeFile({
                path: logFile,
                content: existing + jsonLine
            });

            console.log(`📝 [Transcript] Recorded step #${nextIndex} for ${missionId}`);

            // Automatically detect and save artifacts if the assistant produced code blocks
            if (step.role === 'assistant' && step.content) {
                await this.autoExtractAndSaveArtifacts(missionId, step.content);
            }

            return true;
        } catch (err) {
            console.error('❌ Failed to record transcript step:', err);
            return false;
        }
    }

    /**
     * Saves a concrete artifact file (Python, HTML, Markdown, JSON, etc.) to the mission's artifacts folder
     */
    public async saveArtifact(
        missionId: string, 
        filename: string, 
        content: string
    ): Promise<{ success: boolean; path?: string; error?: string }> {
        const bridge = (window as any).electronBridge;
        if (!bridge?.fs?.writeFile) {
            return { success: false, error: 'Bridge unavailable' };
        }

        try {
            const missionDir = await this.getMissionDir(missionId);
            const targetPath = `${missionDir}\\artifacts\\${filename}`;

            const res = await bridge.fs.writeFile({
                path: targetPath,
                content
            });

            if (res?.success) {
                console.log(`💾 [Artifact Saved] ${targetPath}`);
                return { success: true, path: targetPath };
            }
            return { success: false, error: res?.error || 'Write failed' };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Saves a temporary scratch script or calculation
     */
    public async saveScratch(
        missionId: string, 
        filename: string, 
        content: string
    ): Promise<{ success: boolean; path?: string; error?: string }> {
        const bridge = (window as any).electronBridge;
        if (!bridge?.fs?.writeFile) {
            return { success: false, error: 'Bridge unavailable' };
        }

        try {
            const missionDir = await this.getMissionDir(missionId);
            const targetPath = `${missionDir}\\scratch\\${filename}`;

            const res = await bridge.fs.writeFile({
                path: targetPath,
                content
            });

            return { success: !!res?.success, path: targetPath };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Automatically extracts code blocks (python, html, ts, json, md) and saves them as artifacts
     */
    public async autoExtractAndSaveArtifacts(missionId: string, content: string): Promise<string[]> {
        const savedPaths: string[] = [];
        const codeBlockRegex = /```(python|html|javascript|typescript|json|markdown|bash|powershell|sql|xml)\s*\n([\s\S]*?)```/gi;
        let match;
        let artifactIndex = 1;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            const lang = match[1].toLowerCase();
            const code = match[2].trim();

            if (code.length < 30) continue; // Skip trivial snippets

            let ext = 'txt';
            switch (lang) {
                case 'python': ext = 'py'; break;
                case 'html': ext = 'html'; break;
                case 'javascript': ext = 'js'; break;
                case 'typescript': ext = 'ts'; break;
                case 'json': ext = 'json'; break;
                case 'markdown': ext = 'md'; break;
                case 'powershell': ext = 'ps1'; break;
                case 'sql': ext = 'sql'; break;
            }

            // Check if there is a filename comment at the top of code (e.g. # filename.py or <!-- filename.html -->)
            const headerMatch = code.match(/^(?:#|\/\/|<!--)\s*([a-zA-Z0-9_\-.]+\.[a-zA-Z0-9]+)/m);
            const fileName = headerMatch ? headerMatch[1].trim() : `artifact_${artifactIndex}_${Date.now()}.${ext}`;

            const res = await this.saveArtifact(missionId, fileName, code);
            if (res.success && res.path) {
                savedPaths.push(res.path);
            }
            artifactIndex++;
        }

        return savedPaths;
    }
}

export const missionPersistence = MissionPersistenceService.getInstance();
