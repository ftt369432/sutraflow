import { skillBridge } from './SkillBridge';
import yaml from 'js-yaml';

export interface SkillMetadata {
    name: string;
    description: string;
    version?: string;
    author?: string;
    [key: string]: any;
}

export interface SkillDefinition {
    path: string;
    metadata: SkillMetadata;
    instructions: string;
    type: 'local' | 'external';
}

/**
 * 🗺️ SkillRegistry
 * Discover and parse Sovereign Skills (SKILL.md) for the Cortex.
 */
export class SkillRegistry {
    private static instance: SkillRegistry;
    private skills: Map<string, SkillDefinition> = new Map();
    private isInitialized: boolean = false;

    private readonly LOAD_PATHS = [
        '.agents/skills',
        'G:/.GENIEFLOW_MASTER/.agents/skills',
        'G:/My Drive/.GENIEFLOW_MASTER/.agents/skills',
        'skills_library',
        '../genieflow-moltbot/.agents/skills'
    ];

    private readonly WORKFLOW_PATHS = [
        '.agents/workflows',
        'G:/.GENIEFLOW_MASTER/.agents/workflows',
        'G:/My Drive/.GENIEFLOW_MASTER/.agents/workflows'
    ];

    public static getInstance(): SkillRegistry {
        if (!SkillRegistry.instance) {
            SkillRegistry.instance = new SkillRegistry();
        }
        return SkillRegistry.instance;
    }

    private async listDir(basePath: string): Promise<Array<{ name: string; isDir: boolean; path?: string }>> {
        try {
            const bridge = (window as any).electronBridge;
            if (bridge?.fs?.listFiles) {
                const res = await bridge.fs.listFiles({ path: basePath });
                if (res && res.success && Array.isArray(res.files)) {
                    return res.files.map((f: any) => ({
                        name: f.name,
                        isDir: !!f.isDirectory,
                        path: f.path
                    }));
                }
            }
            const result = await skillBridge.nodeInvoke('main', 'fs.list_files', { path: basePath });
            if (Array.isArray(result)) {
                return result.map((item: any) => ({
                    name: item.name,
                    isDir: item.isDir ?? item.isDirectory ?? false,
                    path: item.path
                }));
            }
            if (result && Array.isArray(result.files)) {
                return result.files.map((item: any) => ({
                    name: item.name,
                    isDir: item.isDir ?? item.isDirectory ?? false,
                    path: item.path
                }));
            }
        } catch {
            // bridge offline or path not accessible
        }
        return [];
    }

    private async readFile(filePath: string): Promise<string> {
        try {
            const bridge = (window as any).electronBridge;
            if (bridge?.fs?.readFile) {
                const res = await bridge.fs.readFile({ path: filePath });
                if (res && res.success && typeof res.content === 'string') {
                    return res.content;
                }
            }
            const content = await skillBridge.nodeInvoke('main', 'fs.read_file', { path: filePath });
            if (typeof content === 'string') return content;
            if (content && typeof content.content === 'string') return content.content;
        } catch {
            // failed
        }
        return '';
    }

    /**
     * 🔍 Discovery Engine
     * Scans the known paths for SKILL.md and workflow files.
     */
    public async discover(): Promise<void> {
        console.log('🗺️ SkillRegistry: Starting sovereign discovery...');
        this.skills.clear();

        // 1. Discover SKILL.md bundles
        for (const basePath of this.LOAD_PATHS) {
            try {
                const items = await this.listDir(basePath);
                for (const item of items) {
                    if (item.isDir) {
                        const skillPath = `${basePath}/${item.name}`;
                        const skillMdPath = `${skillPath}/SKILL.md`;

                        try {
                            const content = await this.readFile(skillMdPath);
                            if (content) {
                                this.parseAndRegister(skillPath, content, basePath.includes('moltbot') ? 'external' : 'local');
                            }
                        } catch (e) {
                            console.warn(`⚠️ SkillRegistry: Failed to read ${skillMdPath}`, e);
                        }
                    }
                }
            } catch (e) {
                // FALLBACK: Use Vite glob if bridge is offline (for local development awareness)
                if (basePath === 'skills_library') {
                    console.log('🗺️ SkillRegistry: Bridge offline. Attempting Vite glob fallback for skills_library...');
                    try {
                        const modules = import.meta.glob('../../skills_library/*/SKILL.md', { query: '?raw', import: 'default', eager: true });
                        Object.entries(modules).forEach(([path, content]) => {
                            const skillPath = path.replace('../../', '').replace('/SKILL.md', '');
                            this.parseAndRegister(skillPath, content as string, 'local');
                        });
                    } catch (globError) {
                        console.warn('⚠️ SkillRegistry: Vite glob fallback failed.', globError);
                    }
                }
            }
        }

        // 2. Discover conformed workflows
        for (const wfPath of this.WORKFLOW_PATHS) {
            try {
                const items = await this.listDir(wfPath);
                for (const item of items) {
                    if (!item.isDir && item.name.endsWith('.md')) {
                        const fullPath = `${wfPath}/${item.name}`;
                        const content = await this.readFile(fullPath);
                        if (content) {
                            this.parseAndRegisterWorkflow(fullPath, item.name, content);
                        }
                    }
                }
            } catch {
                // path unavailable
            }
        }

        this.isInitialized = true;
        console.log(`🗺️ SkillRegistry: Discovery complete. Registered ${this.skills.size} sovereign skills and workflows.`);
    }

    private parseAndRegisterWorkflow(filePath: string, fileName: string, content: string) {
        try {
            const cleanName = fileName.replace(/\.md$/, '').replace(/^[0-9]+_/, '');
            let description = `Conformed legal workflow: ${cleanName}`;
            
            // Extract first heading or summary line
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
                    description = trimmed.replace(/^#+\s*/, '');
                    break;
                }
            }

            this.skills.set(`wf-${cleanName}`, {
                path: filePath,
                metadata: {
                    name: cleanName,
                    description,
                    type: 'workflow'
                },
                instructions: content,
                type: 'local'
            });
            console.log(`✅ SkillRegistry: Registered workflow '${cleanName}'`);
        } catch (e) {
            console.warn(`⚠️ SkillRegistry: Failed to register workflow ${filePath}`, e);
        }
    }

    private parseAndRegister(path: string, content: string, type: 'local' | 'external') {
        try {
            // Split YAML frontmatter from instructions
            const parts = content.split('---');
            if (parts.length < 3) {
                console.warn(`⚠️ SkillRegistry: Invalid SKILL.md format at ${path}. Missing frontmatter.`);
                return;
            }

            const metadata = yaml.load(parts[1]) as SkillMetadata;
            const instructions = parts.slice(2).join('---').trim();

            if (metadata && metadata.name) {
                this.skills.set(metadata.name, {
                    path,
                    metadata,
                    instructions,
                    type
                });
                console.log(`✅ SkillRegistry: Registered skill '${metadata.name}' [${type}]`);
            }
        } catch (e) {
            console.error(`❌ SkillRegistry: Failed to parse SKILL.md at ${path}`, e);
        }
    }

    public getSkills(): SkillDefinition[] {
        return Array.from(this.skills.values());
    }

    public getSkill(name: string): SkillDefinition | undefined {
        return this.skills.get(name);
    }

    /**
     * 🧠 Get definitions for Soul Context
     */
    public getSoulContextDefinitions(): string {
        if (!this.isInitialized) return '';

        let context = '\n### AVAILABLE SOVEREIGN SKILLS\n';
        this.skills.forEach((skill) => {
            context += `- **${skill.metadata.name}**: ${skill.metadata.description}\n`;
        });
        context += '\nUse the EXECUTE_SKILL action to invoke these. Example: { "action": "EXECUTE_SKILL", "payload": { "skill": "skill-name", "args": { ... } } }\n';

        return context;
    }

    public async saveCustomSkill(slug: string, markdownContent: string): Promise<boolean> {
        try {
            const path = `skills_library/${slug}/SKILL.md`;
            const result = await skillBridge.nodeInvoke('main', 'fs.write_file', {
                path,
                content: markdownContent
            });
            
            // Re-trigger discovery to load the new skill immediately
            await this.discover();
            return result.success || result.status === 'success';
        } catch (e) {
            console.error('Failed to dynamically write custom skill', e);
            return false;
        }
    }
}

export const skillRegistry = SkillRegistry.getInstance();
