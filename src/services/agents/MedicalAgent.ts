import { v4 as uuidv4 } from 'uuid';
import { OodarAgent } from './OodarAgent';
import { AgentConfig, AgentType } from '../../types/agent';
import { getAIService } from '../ai/aiService';
import { agenticToolRegistry } from './ToolRegistry';
import { WorkProductShield } from './WorkProductShield';


/**
 * MedicalAgent specializes in medical correspondence and document processing
 * Optimized for doctor-attorney communications in Workers' Compensation
 */
export class MedicalAgent extends OodarAgent {
    constructor(config?: Partial<AgentConfig>) {
        super({
            id: config?.id || `medical-agent-${uuidv4()}`,
            name: config?.name || 'Medical Specialist',
            description: config?.description || 'Manages medical correspondence and healthcare coordination',
            capabilities: config?.capabilities || [
                'document-analysis',
                'drafting',
                'scheduling',
                'client-communication'
            ],
            type: AgentType.MEDICAL,
            version: config?.version || '1.0',
            created: config?.created || new Date(),
            lastModified: config?.lastModified || new Date(),
            status: (config?.status as any) || 'active',
            preferences: config?.preferences || {}
        });
    }

    async train(data: any[]): Promise<void> {
        console.log('🏥 Training MedicalAgent with', data.length, 'medical samples');
    }

    protected async performAction(action: AgentAction): Promise<any> {
        const { type, params } = action;

        switch (type) {
            case 'generate_doctor_letter':
                return this.generateDoctorLetter(params);
            case 'medical_summary':
                return this.generateMedicalSummary(params);
            case 'healthcare_coordination':
                return this.coordinateHealthcare(params);
            default:
                // 🧠 FALLBACK: AI-Driven Intent Inference
                const availableActions = [
                    'generate_doctor_letter',
                    'medical_summary',
                    'healthcare_coordination'
                ];

                const inferredType = await this.inferIntent(type || params.instruction || '', availableActions);
                if (inferredType) {
                    return this.performAction({ type: inferredType, params });
                }

                // Handle generic medical drafting
                if (type.includes('letter') || type.includes('medical')) {
                    return this.generateDoctorLetter({ ...params, type });
                }
                throw new Error(`MedicalAgent doesn't know how to: ${type}`);
        }
    }

    private async generateDoctorLetter(params: any): Promise<any> {
        console.log('🏥 MedicalAgent: Drafting doctor letter...', params);
        const aiService = await getAIService();

        const systemPrompt = WorkProductShield.wrapPrompt(
            `You are a Professional Medical Coordinator and Legal Assistant.
          Draft a formal letter to a physician (Dr. ${params.doctorName || '[Doctor Name]'}) regarding a Workers' Compensation patient.
          
          CONTEXT:
          Patient: ${params.clientName || 'Unknown'}
          Claim Number: ${params.caseNumber || 'Unknown'}`,
            'medical'
        );

        const rawContent = await aiService.generateText(`${systemPrompt}\n\nINSTRUCTIONS: ${params.instruction || params.text || JSON.stringify(params)}`);
        const content = WorkProductShield.cleanse(rawContent);


        if (params.createCanvas !== false) {
            await agenticToolRegistry.executeTool('create_canvas_document', {
                title: params.title || `Medical Letter - ${params.doctorName || 'Doctor'}`,
                content: content,
                metadata: { profession: 'medical', ...params }
            });
        }

        return { content, generatedAt: new Date() };
    }

    private async generateMedicalSummary(params: any): Promise<any> {
        console.log('🏥 MedicalAgent: Summarizing medical records...', params);
        const aiService = await getAIService();

        const systemPrompt = WorkProductShield.wrapPrompt(
            `Provide a comprehensive medical-legal summary of the following records.
            Highlight:
            1. Diagnosis
            2. Treatment history
            3. Permanent disability indicators
            4. Apportionment issues (if mentioned)`,
            'medical'
        );

        const rawSummary = await aiService.generateText(`${systemPrompt}\n\nRECORDS: ${params.content || params.text}`);
        const summary = WorkProductShield.cleanse(rawSummary);

        return { summary, timestamp: new Date() };
    }

    private async coordinateHealthcare(params: any): Promise<any> {
        // This could involve booking appointments via Calendar tool
        console.log('🏥 MedicalAgent: Coordinating healthcare...', params);
        return { status: 'coordination_initiated', details: params };
    }
}
