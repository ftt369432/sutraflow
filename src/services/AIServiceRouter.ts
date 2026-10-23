/**
 * 🎯 AI Service Router
 * 
 * Smart routing for AI requests based on:
 * 1. User tier (FREE, PREMIUM, ENTERPRISE)
 * 2. Task complexity (simple vs complex)
 * 3. Provider availability (Gemini primary, Groq fallback)
 * 
 * Follows: Vertical Slice Pattern - complete flow, no placeholders
 */

import { PremiumTier } from './neural/NeuralPersonalAssistant';

export const MCP_TOOLS_BY_TIER = {
    [PremiumTier.FREE]: [], // No MCP tools for free users
    [PremiumTier.PREMIUM]: ['filesystem', 'memory', 'deadline_calculator', 'wcab_research'], 
    [PremiumTier.ENTERPRISE]: 'all' as const, // All available tools
};

// Feature specific gates (70/30 Economy)
export enum PaidFeature {
    OCR = 'OCR',
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
    PERSISTENT_MEMORY = 'PERSISTENT_MEMORY',
    ADVANCED_CANVAS = 'ADVANCED_CANVAS',
    GENIE_DRIVE_UNLIMITED = 'GENIE_DRIVE_UNLIMITED',
    SWARM_ORCHESTRATION = 'SWARM_ORCHESTRATION'
}

// Provider configurations
export interface ProviderConfig {
    name: 'gemini' | 'groq';
    model: string;
    costPer1MTokens: number;
    supportsTools: boolean;
    maxTokens: number;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
    groq_free: {
        name: 'groq',
        model: 'llama-3.1-70b-versatile',
        costPer1MTokens: 0, // Free tier
        supportsTools: true,
        maxTokens: 8000,
    },
    gemini_flash: {
        name: 'gemini',
        model: 'gemini-2.0-flash',
        costPer1MTokens: 0.075,
        supportsTools: true,
        maxTokens: 32000,
    },
    gemini_pro: {
        name: 'gemini',
        model: 'gemini-2.0-pro',
        costPer1MTokens: 1.25,
        supportsTools: true,
        maxTokens: 128000,
    },
};

// Complexity detection
export interface ComplexityResult {
    level: 'simple' | 'medium' | 'complex';
    score: number;
    reasons: string[];
    recommendedProvider: string;
    toolsNeeded: string[];
}

/**
 * Analyze request complexity to determine optimal routing
 */
export function analyzeComplexity(request: string): ComplexityResult {
    const lower = request.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    // Legal terms increase complexity
    const legalTerms = ['petition', 'motion', 'settlement', 'discovery', 'penalty', 'wcab', 'labor code'];
    const legalMatches = legalTerms.filter(term => lower.includes(term));
    if (legalMatches.length > 0) {
        score += legalMatches.length * 15;
        reasons.push(`Legal terms detected: ${legalMatches.join(', ')}`);
    }

    // Medical terms increase complexity
    const medicalTerms = ['qme', 'ame', 'icd-10', 'cpt', 'impairment', 'medical report', 'diagnosis'];
    const medicalMatches = medicalTerms.filter(term => lower.includes(term));
    if (medicalMatches.length > 0) {
        score += medicalMatches.length * 15;
        reasons.push(`Medical terms detected: ${medicalMatches.join(', ')}`);
    }

    // Multi-document requests are complex
    if (lower.includes(' and ') || lower.includes('multiple') || lower.includes('canvases')) {
        score += 20;
        reasons.push('Multi-document request detected');
    }

    // Long requests are likely complex
    if (request.length > 200) {
        score += 10;
        reasons.push('Detailed request (200+ chars)');
    }

    // Research/analysis requests are complex
    if (lower.includes('research') || lower.includes('analyze') || lower.includes('summarize')) {
        score += 15;
        reasons.push('Research/analysis required');
    }

    // Determine tools needed
    const toolsNeeded: string[] = [];
    if (legalMatches.length > 0) {
        toolsNeeded.push('legal_document_draft', 'wcab_research', 'deadline_calculator');
    }
    if (medicalMatches.length > 0) {
        toolsNeeded.push('medical_report_analyze', 'icd10_lookup');
    }
    if (lower.includes('file') || lower.includes('document') || lower.includes('canvas')) {
        toolsNeeded.push('filesystem');
    }

    // Determine level and provider
    let level: 'simple' | 'medium' | 'complex';
    let recommendedProvider: string;

    if (score < 20) {
        level = 'simple';
        recommendedProvider = 'groq_free';
    } else if (score < 50) {
        level = 'medium';
        recommendedProvider = 'gemini_flash';
    } else {
        level = 'complex';
        recommendedProvider = 'gemini_pro';
    }

    return { level, score, reasons, recommendedProvider, toolsNeeded };
}

/**
 * Route request to appropriate provider based on tier and complexity
 */
export interface RouteResult {
    provider: ProviderConfig;
    mcpTools: string[] | 'all';
    reason: string;
    estimatedCost: number;
}

export function routeRequest(
    request: string,
    userTier: PremiumTier
): RouteResult {
    const complexity = analyzeComplexity(request);

    // FREE tier: Always use Groq, no tools
    if (userTier === PremiumTier.FREE) {
        return {
            provider: PROVIDERS.groq_free,
            mcpTools: [],
            reason: 'Free tier uses Groq with no MCP tools',
            estimatedCost: 0,
        };
    }

    // PREMIUM tier: Use Gemini Flash for complex, Groq for simple
    if (userTier === PremiumTier.PREMIUM) {
        const useGemini = complexity.level !== 'simple';
        const provider = useGemini ? PROVIDERS.gemini_flash : PROVIDERS.groq_free;

        // Filter tools to only those available at Premium tier
        const availableTools = MCP_TOOLS_BY_TIER[PremiumTier.PREMIUM];
        const mcpTools = complexity.toolsNeeded.filter(t => availableTools.includes(t));

        return {
            provider,
            mcpTools,
            reason: `Premium: ${complexity.level} task → ${provider.name} (${complexity.reasons.join('; ')})`,
            estimatedCost: useGemini ? 0.005 : 0, // ~5000 tokens avg
        };
    }

    // ENTERPRISE tier: Use best provider, all tools
    const provider = complexity.level === 'complex'
        ? PROVIDERS.gemini_pro
        : PROVIDERS.gemini_flash;

    return {
        provider,
        mcpTools: 'all',
        reason: `Enterprise: ${complexity.level} task → ${provider.name} with full MCP access`,
        estimatedCost: complexity.level === 'complex' ? 0.05 : 0.005,
    };
}

/**
 * Validates if the user has access to a specific paid feature
 */
export function checkFeatureAccess(feature: PaidFeature, userTier: PremiumTier): { allowed: boolean; message: string } {
    if (userTier === PremiumTier.ENTERPRISE) return { allowed: true, message: 'Granted via Enterprise License' };
    
    switch (feature) {
        case PaidFeature.OCR:
            if (userTier === PremiumTier.FREE) {
                return { allowed: false, message: 'OCR is a PAID feature. Upgrade to Pro Creator to analyze scanned PDFs and images.' };
            }
            return { allowed: true, message: 'Granted via Pro Creator' };

        case PaidFeature.KNOWLEDGE_BASE:
            if (userTier === PremiumTier.FREE) {
                return { allowed: false, message: 'Knowledge Base (Vector Search) is a PAID feature. Upgrade to Pro Creator to link documents and build your brain.' };
            }
            return { allowed: true, message: 'Granted via Pro Creator' };

        case PaidFeature.PERSISTENT_MEMORY:
            if (userTier === PremiumTier.FREE) {
                return { allowed: false, message: 'Persistent Memory is a PAID feature. Upgrade to Pro Creator for context retention across sessions.' };
            }
            return { allowed: true, message: 'Granted via Pro Creator' };

        case PaidFeature.GENIE_DRIVE_UNLIMITED:
            if (userTier === PremiumTier.FREE) {
                return { allowed: false, message: 'Limited to 3 documents for free users. Upgrade to Pro Creator for unlimited Genie Drive storage.' };
            }
            return { allowed: true, message: 'Granted via Pro Creator' };

        case PaidFeature.SWARM_ORCHESTRATION:
            if (userTier === PremiumTier.FREE) {
                return { allowed: false, message: 'Multi-Agent Swarms are a PAID feature. Build specialized agencies with Pro Creator (70/30 split).' };
            }
            return { allowed: true, message: 'Granted via Pro Creator' };

        default:
            return { allowed: true, message: 'Feature enabled' };
    }
}

/**
 * AIServiceRouter Class - Main entry point
 */
export class AIServiceRouter {
    private userTier: PremiumTier;
    private usageCount: number = 0;
    private dailyLimit: number;

    constructor(userTier: PremiumTier = PremiumTier.FREE) {
        this.userTier = userTier;
        this.dailyLimit = this.getDailyLimit();
    }

    private getDailyLimit(): number {
        switch (this.userTier) {
            case PremiumTier.FREE: return 50;
            case PremiumTier.PREMIUM: return 500;
            case PremiumTier.ENTERPRISE: return Infinity;
            default: return 50;
        }
    }

    public setTier(tier: PremiumTier): void {
        this.userTier = tier;
        this.dailyLimit = this.getDailyLimit();
        console.log(`🎯 [AIServiceRouter] Tier changed to: ${tier}`);
    }

    public async routeAndLog(request: string): Promise<RouteResult> {
        // Check usage limits
        if (this.usageCount >= this.dailyLimit) {
            throw new Error(`Daily limit reached (${this.dailyLimit}). Upgrade for more.`);
        }

        const route = routeRequest(request, this.userTier);
        this.usageCount++;

        console.log(`🎯 [AIServiceRouter] Routing decision:`, {
            tier: this.userTier,
            provider: route.provider.name,
            model: route.provider.model,
            mcpTools: route.mcpTools === 'all' ? 'ALL' : route.mcpTools.length,
            reason: route.reason,
            usage: `${this.usageCount}/${this.dailyLimit}`,
        });

        return route;
    }

    public getUsageStats() {
        return {
            tier: this.userTier,
            used: this.usageCount,
            limit: this.dailyLimit,
            remaining: this.dailyLimit - this.usageCount,
        };
    }
}

// Singleton instance
let routerInstance: AIServiceRouter | null = null;

export function getAIServiceRouter(tier?: PremiumTier): AIServiceRouter {
    if (!routerInstance) {
        routerInstance = new AIServiceRouter(tier);
    } else if (tier !== undefined) {
        routerInstance.setTier(tier);
    }
    return routerInstance;
}
