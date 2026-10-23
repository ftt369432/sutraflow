import { v4 as uuidv4 } from 'uuid';
import { OodarAgent } from './OodarAgent';
import { AgentConfig, AgentType } from '../../types/agent';
import { getAIService } from '../ai/aiService';
import { agenticToolRegistry } from './ToolRegistry';
import { WorkProductShield } from './WorkProductShield';


/**
 * LegalAgent specializes in legal document generation and analysis
 * Specifically optimized for Workers' Compensation (WCAB) in California
 */
export class LegalAgent extends OodarAgent {
    constructor(config?: Partial<AgentConfig>) {
        super({
            id: config?.id || `legal-agent-${uuidv4()}`,
            name: config?.name || 'Legal Specialist',
            description: config?.description || 'Specializes in legal documents and WCAB procedures',
            capabilities: config?.capabilities || [
                'legal-research',
                'drafting',
                'case-management',
                'risk-assessment'
            ],
            type: AgentType.LEGAL,
            version: config?.version || '1.0',
            created: config?.created || new Date(),
            lastModified: config?.lastModified || new Date(),
            status: (config?.status as any) || 'active',
            preferences: config?.preferences || {}
        });
    }

    async train(data: any[]): Promise<void> {
        console.log('⚖️ Training LegalAgent with', data.length, 'legal samples');
    }

    protected async performAction(action: AgentAction): Promise<any> {
        const { type, params } = action;

        switch (type) {
            case 'generate_penalty_petition':
                return this.generatePenaltyPetition(params);
            case 'generate_joinder_petition':
                return this.generateJoinderPetition(params);
            case 'legal_analysis':
                return this.performLegalAnalysis(params);
            case 'draft_legal_document':
                return this.draftLegalDocument(params);
            default:
                // 🧠 FALLBACK: AI-Driven Intent Inference
                const availableActions = [
                    'generate_penalty_petition',
                    'generate_joinder_petition',
                    'legal_analysis',
                    'draft_legal_document'
                ];

                const inferredType = await this.inferIntent(type || params.instruction || '', availableActions);
                if (inferredType) {
                    return this.performAction({ type: inferredType, params });
                }

                // Handle generic drafting if it matches legal keywords
                if (type.includes('draft') || type.includes('petition')) {
                    return this.draftLegalDocument({ ...params, type });
                }
                throw new Error(`LegalAgent doesn't know how to: ${type}`);
        }
    }

    private async draftLegalDocument(params: any): Promise<any> {
        console.log('⚖️ LegalAgent: Drafting legal document...', params);
        const aiService = await getAIService();

        const systemPrompt = WorkProductShield.wrapPrompt(
            `You are an Elite California Workers' Compensation Attorney. 
          Draft a ${params.type || 'legal document'} based on the following instructions.
          
          CONTEXT:
          Client: ${params.clientName || 'Unknown'}
          Case Number: ${params.caseNumber || 'Unknown'}`,
            'legal'
        );

        const rawContent = await aiService.generateText(`${systemPrompt}\n\nINSTRUCTIONS: ${params.instruction || params.text || JSON.stringify(params)}`);
        const content = WorkProductShield.cleanse(rawContent);


        if (params.createCanvas !== false) {
            await agenticToolRegistry.executeTool('create_canvas_document', {
                title: params.title || `Legal Document - ${params.clientName || 'Draft'}`,
                content: content,
                metadata: { profession: 'legal', ...params }
            });
        }

        return { content, generatedAt: new Date() };
    }

    private async generatePenaltyPetition(params: any): Promise<any> {
        return this.draftLegalDocument({ ...params, type: 'PETITION FOR PENALTY ABATEMENT' });
    }

    private async generateJoinderPetition(params: any): Promise<any> {
        return this.draftLegalDocument({ ...params, type: 'PETITION FOR JOINDER' });
    }

    private async performLegalAnalysis(params: any): Promise<any> {
        console.log('⚖️ LegalAgent: Performing legal analysis...', params);
        const aiService = await getAIService();

        const systemPrompt = WorkProductShield.wrapPrompt(
            `Analyze the following legal text or situation within the context of California Workers' Compensation Law.
            Identify:
            1. Key legal issues
            2. Relevant Labor Code sections
            3. Strategic recommendations
            4. Risk assessment`,
            'legal'
        );

        const rawAnalysis = await aiService.generateText(`${systemPrompt}\n\nINPUT: ${params.content || params.text}`);
        const analysis = WorkProductShield.cleanse(rawAnalysis);
        
        return { analysis, timestamp: new Date() };
    }
}
