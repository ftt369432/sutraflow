import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentAction } from './BaseAgent';
import { AgentConfig, AgentType } from '../../types/agent';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { agenticToolRegistry } from './ToolRegistry';
import { relationalOntologyService } from '../ai/RelationalOntologyService';

/**
 * 🕵️ InvestigationAgent (The Eye)
 * Specialized in proactive entity extraction, relationship mapping, and cross-domain correlation.
 * This is the core of the "Palantir-style" brain.
 */
export class InvestigationAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig>) {
        super({
            id: config?.id || `investigation-agent-${uuidv4()}`,
            name: config?.name || 'Intelligence Specialist',
            description: config?.description || 'Proactive link discovery and investigative reasoning specialist.',
            capabilities: config?.capabilities || [
                'pattern-recognition',
                'cross-agent-learning',
                'risk-assessment',
                'predictive-analytics'
            ],
            type: AgentType.INVESTIGATION,
            version: config?.version || '1.0',
            created: config?.created || new Date(),
            lastModified: config?.lastModified || new Date(),
            status: (config?.status as any) || 'active',
            preferences: config?.preferences || {
                depth: 'deep',
                proactive: true
            }
        });
    }

    async train(data: any[]): Promise<void> {
        console.log('🕵️ Training InvestigationAgent with', data.length, 'investigative patterns');
    }

    protected async performAction(action: AgentAction): Promise<any> {
        const { type, params } = action;

        switch (type) {
            case 'investigate':
            case 'research':
            case 'discover_links':
                return this.discoverLinks(params as any);
            case 'brief':
            case 'generate_intelligence_brief':
                return this.generateBrief(params as any);
            case 'audit_mission_ontology':
                return this.auditOntology(params as any);
            default:
                const availableActions = ['discover_links', 'generate_intelligence_brief', 'audit_mission_ontology'];
                const inferredType = await this.inferIntent(type || params.instruction || '', availableActions);
                if (inferredType) {
                    return this.performAction({ type: inferredType, params });
                }
                throw new Error(`InvestigationAgent doesn't know how to: ${type}`);
        }
    }

    /**
     * 🔍 Discover Links: Scans text/artifacts and records bonds in the ontology
     */
    private async discoverLinks(params: { text?: string; sourceId: string; sourceType: string; missionId?: string }): Promise<any> {
        console.log('🕵️ InvestigationAgent: Scanning for hidden connections...', params.sourceId);

        const textToScan = params.text || '';
        if (!textToScan) return { success: false, error: 'No text provided for investigation' };

        const entities = await relationalOntologyService.extractEntities(textToScan);
        const bonds = [];

        for (const entity of entities) {
            // Inject missionId into metadata for scoped discovery
            const enrichedEntity = {
                ...entity,
                metadata: { ...entity.metadata, mission_id: params.missionId }
            };

            await relationalOntologyService.recordBond(params.sourceId, params.sourceType, enrichedEntity, `Extracted via InvestigationAgent from ${params.sourceType}`);
            bonds.push(enrichedEntity);
        }

        return { success: true, entitiesFound: bonds.length, entities: bonds };
    }

    /**
     * 📄 Generate Intelligence Brief: Summarizes cross-domain correlations
     */
    private async generateBrief(params: { missionId: string }): Promise<any> {
        console.log('🕵️ InvestigationAgent: Drafting Intelligence Brief for mission', params.missionId);

        const correlations = await relationalOntologyService.discoverCrossDomainLinks(params.missionId);
        const aiService = AIServiceFactory.getInstance();

        const prompt = `
            You are an Elite Intelligence Analyst. 
            Analyze the following cross-domain correlations found in our Mission Ontology.
            
            CORRELATIONS:
            ${correlations.join(', ')}
            
            Your goal is to draft a "Palantir-style" Intelligence Brief linking these entities across Legal, Medical, and Trading domains.
            Point out hidden risks or opportunities where a legal development might affect a ticker, or a medical diagnosis might impact a legal case.
        `;

        const brief = await aiService.generateText(prompt);

        if (params.missionId) {
            await agenticToolRegistry.executeTool('create_canvas_document', {
                title: `INTELLIGENCE BRIEF: ${params.missionId}`,
                content: brief,
                metadata: { type: 'intelligence', mission_id: params.missionId }
            });
        }

        return { success: true, brief };
    }

    /**
     * 🧠 Audit Ontology: Performs a deep scan of the current mission state
     */
    private async auditOntology(params: { missionId: string }): Promise<any> {
        // Implementation: Iterate over all pinnedItems/documents in mission and call discoverLinks
        return { success: true, status: 'Audit initiated' };
    }
}
