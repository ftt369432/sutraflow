import { AIAgentOrchestrator } from './AIAgentOrchestrator';
import { AgentType } from '../../types/agent';

/**
 * 🔌 BridgeConnector
 * Acts as the "Central API Hub" entry point.
 * Transforms external platform events (Slack, Webhooks) into Genie Flow intents.
 */
export class BridgeConnector {
    private orchestrator: AIAgentOrchestrator;

    constructor() {
        this.orchestrator = new AIAgentOrchestrator();
    }

    /**
     * Handles incoming messages from the "Thin Client" (e.g., Slack Python Bridge)
     */
    async handleExternalEvent(event: {
        platform: string;
        userRequest: string;
        context?: any;
        metadata?: any;
    }) {
        console.log(`🔌 Hub: Received event from ${event.platform}...`);

        // 🧠 High-Intelligence Routing
        // We deliver the raw input + context to the Brain
        const result = await this.orchestrator.processUserRequest(
            event.userRequest,
            'external-user',
            {
                source: event.platform,
                platformContext: event.context,
                ...event.metadata
            }
        );

        return {
            status: 'processed',
            brainResponse: result,
            answer: result.rootTask?.result || 'The Genie is thinking...'
        };
    }

    /**
     * Mock method to simulate a Slack mention trigger
     */
    async simulateSlackTrigger(ticker: string) {
        return this.handleExternalEvent({
            platform: 'slack',
            userRequest: `What is the move for ${ticker}?`,
            context: { ticker },
            metadata: { ticker }
        });
    }
}

export const bridgeConnector = new BridgeConnector();
