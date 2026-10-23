import { skillBridge } from './SkillBridge';

/**
 * 📚 PeripheralRegistry
 * Manages the discovery and metadata of the 53+ OpenClaw skills.
 */
export class PeripheralRegistry {
    private static instance: PeripheralRegistry;
    private skillCache: any[] = [];

    public static getInstance() {
        if (!PeripheralRegistry.instance) {
            PeripheralRegistry.instance = new PeripheralRegistry();
        }
        return PeripheralRegistry.instance;
    }

    /**
     * Syncs the latest peripheral status from the Gateway.
     */
    public async sync() {
        try {
            // 1. Try to get skills from Gateway
            const report = await skillBridge.getSkills();
            this.skillCache = report?.skills || [];
            
            // 2. Add Hybrid/Cloud/Elite Law Fallbacks if missing
            if (this.skillCache.length === 0) {
                console.log('📚 PeripheralRegistry: Gateway offline. Injecting Cloud/Elite Law/MCP Core Skills...');
                this.skillCache = [
                    { name: 'fs.read_file', description: 'Read a file from the Cloud AI Drive', emoji: '📂', eligible: true },
                    { name: 'fs.write_file', description: 'Save a work product to the AI Drive', emoji: '💾', eligible: true },
                    { name: 'browser.fetch', description: 'Search and crawl the web for legal research', emoji: '🌐', eligible: true },
                    { name: 'system.exec', description: 'Run local python scripts via MCP', emoji: '🐍', eligible: true },
                    { name: 'law.list_cases', description: 'Retrieve a list of legal cases from Elite Law', emoji: '⚖️', eligible: true },
                    { name: 'law.get_case_details', description: 'Fetch full case details and documents from Elite Law', emoji: '📄', eligible: true },
                    { name: 'law.search_legal_docs', description: 'Search legal knowledge base for precedents', emoji: '🔍', eligible: true }
                ];
            }

            console.log(`📚 PeripheralRegistry: Synced ${this.skillCache.length} peripherals.`);
            return this.skillCache;
        } catch (err) {
            // Even on error, provide basic skills
            this.skillCache = [
                { name: 'fs.read_file', description: 'Read file', eligible: true },
                { name: 'fs.write_file', description: 'Write file', eligible: true }
            ];
            return this.skillCache;
        }
    }

    /**
     * Returns a condensed manifest for the Soul's Prompt.
     */
    public getPromptManifest(): string {
        if (this.skillCache.length === 0) return "No peripherals detected.";

        return this.skillCache
            .filter(s => s.eligible)
            .map(s => `- ${s.emoji || '🛠️'} ${s.name}: ${s.description}`)
            .join('\n');
    }

    public getSkills() {
        return this.skillCache;
    }
}

export const peripheralRegistry = PeripheralRegistry.getInstance();
