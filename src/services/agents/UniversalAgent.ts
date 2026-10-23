import { BaseAgent, AgentAction } from './BaseAgent';
import { AgentConfig, AgentType } from '../../types/agent';
import { AIAgentTask, TaskStatus } from './types';
import { getAIService } from '../ai/aiService';
import { agenticToolRegistry } from './ToolRegistry';
import { v4 as uuidv4 } from 'uuid';
import { WorkProductShield } from './WorkProductShield';


/**
 * 🌎 UNIVERSAL AGENT
 * 
 * The catch-all specialized agent for any request that doesn't fall into
 * Document, Legal, Medical, or Calendar domains. 
 * 
 * Handles:
 * - Coding & Technical Analysis
 * - Creative Writing & Content Generation
 * - General Reasoning & Problem Solving
 * - Deep Knowledge Synthesis
 */
export class UniversalAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig>) {
        super({
            id: config?.id || `universal-agent-${uuidv4()}`,
            name: config?.name || 'Universal Assistant',
            description: config?.description || 'General-purpose AI capable of handling coding, creative writing, reasoning, and any task not covered by specialists.',
            capabilities: config?.capabilities || [
                'natural-language',
                'code-generation',
                'code-review',
                'debugging',
                'autonomous-decision-making',
                'pattern-recognition'
            ],
            type: AgentType.UNIVERSAL,
            version: config?.version || '1.0',
            created: config?.created || new Date(),
            lastModified: config?.lastModified || new Date(),
            status: (config?.status as any) || 'active',
            preferences: config?.preferences || {}
        });
    }

    /**
     * 🧠 Continuous Learning
     */
    async train(data: any[]): Promise<void> {
        console.log(`🧠 Universal Agent: Processing cross-domain learning data...`);
        // Universal agent learns from all interactions to improve general reasoning
    }

    /**
     * ⚡ Internal implementation of action logic
     */
    protected async performAction(action: AgentAction): Promise<any> {
        const { type, params } = action;
        console.log(`🚀 Universal Agent: Executing universal task: ${type}`);

        try {
            const { AIServiceFactory } = await import('../ai/aiServiceFactory');
            const aiFactory = AIServiceFactory.getInstance();

            // 🎯 Use WorkProductShield to wrap instructions
            const instruction = params?.instruction || type;
            const contextStr = JSON.stringify(params || {});
            const systemPrompt = WorkProductShield.wrapPrompt(
                `You are the GenieFlow Universal Agent. You are a world-class expert in coding, writing, and logical reasoning.`,
                'universal'
            );

            // Generate response using real AI service
            const combinedPrompt = `${systemPrompt}\n\nTASK: ${instruction}\nCONTEXT: ${contextStr}`;

            const rawResponse = await aiFactory.generateText(combinedPrompt, {
                category: 'legal',
                source: 'UniversalAgent'
            });

            // 🛡️ APPLY SHIELD: Algorithmically cleanse the response
            const response = WorkProductShield.cleanse(rawResponse);



            // 🎨 AUTO-CANVAS: If response is substantial, not empty, and not a generic completion message or refusal
            const isTrivialStatus = /^(completed|done|success|task complete|completed sovereign execution cycle\.?)$/i.test(response.trim());
            const isRefusalOrDisclaimer = /(?:don'?t have access|do not have access|as an ai|cannot access private|no ability to search|i am an ai language model)/i.test(response);
            if (!isTrivialStatus && !isRefusalOrDisclaimer && response.trim().length > 100) {
                console.log('🎨 Universal Agent: Generating canvas document for result...');

                const createResult = await agenticToolRegistry.executeTool('create_canvas_document', {
                    title: params?.title || 'Universal Work Product',
                    content: response,
                    metadata: {
                        source: 'universal_agent',
                        domain: 'general',
                        ...params
                    }
                });

                return {
                    response,
                    canvasId: createResult.success ? createResult.data?.id : undefined
                };
            }

            return response;

        } catch (error) {
            console.error('❌ Universal Agent Action Failed:', error);
            throw error;
        }
    }
}
