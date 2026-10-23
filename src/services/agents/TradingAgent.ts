import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentAction } from './BaseAgent';
import { AgentConfig, AgentType } from '../../types/agent';
import { getAIService } from '../ai/aiService';
import { agenticToolRegistry } from './ToolRegistry';
import { WorkProductShield } from './WorkProductShield';

/**
 * 💹 TradingAgent (The Whale Tracker)
 * Specialized in market analysis, institutional flow tracking, and decentralized finance.
 */
export class TradingAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig>) {
        super({
            id: config?.id || `trading-agent-${uuidv4()}`,
            name: config?.name || 'Wolf of Wall Street Specialist',
            description: config?.description || 'High-intensity market orchestrator specializing in institutional flow and chart pattern dominance.',
            capabilities: config?.capabilities || [
                'market-analysis',
                'whale-tracking',
                'order-flow-analysis',
                'pattern-recognition',
                'options-flow-analysis'
            ],
            type: AgentType.TRADING,
            version: config?.version || '2.0',
            created: config?.created || new Date(),
            lastModified: config?.lastModified || new Date(),
            status: (config?.status as any) || 'active',
            preferences: config?.preferences || {
                personality: 'Wolf of Wall Street',
                aggression: 'high'
            }
        });
    }

    async train(data: any[]): Promise<void> {
        console.log('💹 Training Wolf of Wall Street with', data.length, 'data points');
    }

    protected async performAction(action: AgentAction): Promise<any> {
        const { type, params } = action;

        switch (type) {
            case 'analyze_ticker':
                return this.analyzeTicker(params);
            case 'track_whales':
                return this.trackWhales(params);
            case 'generate_trading_strategy':
                return this.generateStrategy(params);
            default:
                const availableActions = [
                    'analyze_ticker',
                    'track_whales',
                    'generate_trading_strategy'
                ];

                const inferredType = await this.inferIntent(type || params.instruction || '', availableActions);
                if (inferredType) {
                    return this.performAction({ type: inferredType, params });
                }

                throw new Error(`Wolf of Wall Street doesn't know how to: ${type}`);
        }
    }

    private async analyzeTicker(params: any): Promise<any> {
        console.log('💹 Wolf of Wall Street: Scanning for institutional dominance...', params.ticker);

        // 🚀 REAL ACTION: Fetch Omni-Intelligence (Indicators + Tape + MTF + Options)
        const intelResult = await agenticToolRegistry.executeTool('fetch_market_data', {
            ticker: params.ticker,
            args: {
                ticker: params.ticker,
                command: 'fetch_market_intelligence'
            }
        });

        if (!intelResult.success) {
            return { error: 'Failed to find the flow.', details: intelResult.error };
        }

        const intel = intelResult.data;
        const aiService = await getAIService();

        const systemPrompt = `You are the "Wolf of Wall Street" Market Orchestrator. 
Your goal is absolute market dominance through technical confluence and institutional flow analysis.

CORE ANALYSIS PROTOCOL:
1. CHART PATTERN RECOGNITION: Analyze the raw OHLC data for Head & Shoulders, Wedges, Pennants, and Flags. Look for the "Target" of the move.
2. OMNI-TIMEFRAME ALIGNMENT: Compare 1m, 15m, 1h, and Daily trends. Is the "Big Money" aligned with the pulse?
3. INDICATOR CONFLUENCE: Evaluate RSI (Overbought/Oversold), SMA crossover (Golden/Death), and Bollinger Band expansion.
4. OPTIONS DOMINANCE: Analyze the Options Chain (Greeks/OI) to see where the "Smart Money" is hedging.
5. THE PITCH: Deliver a definitive, aggressive signal (BUY/SELL/HOLD) with a "Kill Rate" (Confidence Score). 

BE THE WOLF: Use a high-intensity, professional yet aggressive trading persona.

DATA HUB:
${JSON.stringify(intel, null, 2)}`;

        const response = await aiService.generateText(systemPrompt);

        if (params.createCanvas !== false) {
            await agenticToolRegistry.executeTool('create_canvas_document', {
                title: `WOLF INTEL: ${params.ticker} - FLOW ANALYSIS`,
                content: response,
                metadata: {
                    profession: 'trading',
                    ticker: params.ticker,
                    intel_status: intel.status,
                    indicators: intel.intelligence
                }
            });
        }

        return { signal: response, intelligence: intel };
    }

    private async trackWhales(params: any): Promise<any> {
        console.log('💹 TradingAgent: Tracking Whales for', params.ticker);
        // Similar logic to analyzeTicker but focused on Dark Pool prints and volume spikes
        return { status: 'whale_tracking_active', ticker: params.ticker };
    }

    private async generateStrategy(params: any): Promise<any> {
        console.log('💹 TradingAgent: Generating comprehensive strategy...');
        const aiService = await getAIService();
        const response = await aiService.generateText(`Draft a professional trading strategy based on institutional flow for: ${params.ticker}`);
        return { strategy: response };
    }
}
