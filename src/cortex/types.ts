/**
 * 🧠 Cortex Type Definitions
 * Defines the contract for the "Dual Heart" agentic system.
 */

export interface CortexContext {
    timestamp: number;
    environment: 'browser' | 'electron';
    lastUserMessage?: string;
    missionId?: string;
}

export interface DriveImpulse {
    id: string;
    source: string;
    intensity: number; // 0-100 (Priority)
    description: string;
    action: () => Promise<void>;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    execute(context: any): Promise<any>;
}

export interface Memory {
    shortTerm: Record<string, any>;
    longTerm: {
        query(text: string): Promise<any[]>;
        save(text: string, metadata: any): Promise<void>;
    };
}

export interface SoulManifest {
    name: string;
    identity: string; // "I am..."
    directives: string[]; // From constantprompt.md
}

export interface Intention {
    action: string;
    reasoning: string;
    payload: any;
    priority: number;
}
