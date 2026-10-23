import { skillBridge } from '../cortex/SkillBridge';

export interface SkillDiscovery {
    name: string;
    description: string;
    location: string;
    status: 'active' | 'inactive';
}

/**
 * 🛠️ DiscoveryService (The "Importer")
 * Imports and manages OpenClaw-compatible skills from the system.
 * Maintains the system's "Hands" registry.
 */
export class DiscoveryService {
    private static instance: DiscoveryService;
    private skills: SkillDiscovery[] = [];

    private constructor() { }

    public static getInstance(): DiscoveryService {
        if (!DiscoveryService.instance) {
            DiscoveryService.instance = new DiscoveryService();
        }
        return DiscoveryService.instance;
    }

    /**
     * 📡 Sync skills from local Earth Layer / Registry
     */
    public async syncSkills(): Promise<SkillDiscovery[]> {
        if (skillBridge.hasEarth()) {
            return this.skills;
        }

        if (!skillBridge.isConnected()) {
            return this.skills;
        }

        try {
            const response = await skillBridge.getSkills();
            if (response && response.skills) {
                this.skills = response.skills.map((s: any) => ({
                    name: s.name,
                    description: s.description,
                    location: s.location || 'local',
                    status: s.enabled ? 'active' : 'inactive'
                }));
            }
            return this.skills;
        } catch {
            return this.skills;
        }
    }

    /**
     * 🔍 Get available skills
     */
    public getAvailableSkills(): SkillDiscovery[] {
        return this.skills;
    }
}

export const discoveryService = DiscoveryService.getInstance();
