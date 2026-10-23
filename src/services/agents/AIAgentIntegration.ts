/**
 * 🎯 AI Agent System Integration
 * 
 * Main integration point that connects the AI Agent Orchestrator with the existing canvas system
 */

import { AIAgentOrchestrator } from './AIAgentOrchestrator';
import { createAgentInstances } from './SpecializedAgents';
import { getCanvasOrchestrator } from '../canvas/orchestration';

// Global orchestrator instance
let aiAgentOrchestrator: AIAgentOrchestrator | null = null;

/**
 * Initialize the AI Agent System
 */
export function initializeAIAgentSystem(): AIAgentOrchestrator {
  if (!aiAgentOrchestrator) {
    console.log('🚀 Initializing AI Agent System...');

    // Create specialized agents
    const agents = createAgentInstances();

    // Initialize orchestrator with agents
    aiAgentOrchestrator = new AIAgentOrchestrator();

    // Register all agents
    for (const [agentType, agent] of agents.entries()) {
      aiAgentOrchestrator.registerAgent(agent);
      console.log(`✅ Registered ${agent.name} (${agentType})`);
    }

    console.log('🎯 AI Agent System initialized with', agents.size, 'specialized agents');
  }

  return aiAgentOrchestrator;
}

/**
 * Get the AI Agent Orchestrator instance
 */
export function getAIAgentOrchestrator(): AIAgentOrchestrator {
  if (!aiAgentOrchestrator) {
    const orchestrator = initializeAIAgentSystem();
    if (typeof window !== 'undefined') {
      (window as any).aiAgentOrchestrator = orchestrator;
    }
    return orchestrator;
  }
  return aiAgentOrchestrator;
}

/**
 * Process user request through AI Agent system
 */
export async function processUserRequestWithAgents(
  userRequest: string,
  conversationId: string = 'default',
  context: any = {}
) {
  console.log('🎯 Processing user request with AI Agents:', userRequest);

  const orchestrator = getAIAgentOrchestrator();

  try {
    // Extract userId from context or use conversationId as fallback
    const userId = context.userId || conversationId;

    const result = await orchestrator.processUserRequest(userRequest, userId, {
      conversationId,
      ...context
    });

    console.log('✅ AI Agent processing completed:', result);
    return result;

  } catch (error) {
    console.error('❌ AI Agent processing failed:', error);
    throw error;
  }
}

/**
 * Integration with existing canvas system
 * This can be called from the chat interface to route complex requests to AI Agents
 */
export async function handleComplexRequestWithAgents(
  userInput: string,
  conversationId: string,
  context?: any
) {
  console.log('🔍 AGENT INTEGRATION: handleComplexRequestWithAgents called with:', userInput);

  // Check if request should be handled by AI Agent system
  const orchestrator = getAIAgentOrchestrator();
  const complexity = await orchestrator.analyzeWorkflowComplexity(userInput);

  console.log('🔍 AGENT INTEGRATION: Complexity analysis result:', {
    domains: complexity.domains,
    suggestedAgents: complexity.suggestedAgents,
    complexity: complexity.complexity,
    willUseAgents: complexity.suggestedAgents.length > 1 || complexity.complexity !== 'simple'
  });

  if (complexity.suggestedAgents.length > 1 || complexity.complexity !== 'simple') {
    console.log('🤖 Complex request detected, routing to AI Agent system');
    const result = await processUserRequestWithAgents(userInput, conversationId, context);
    return {
      ...result,
      systemUsed: 'agents' as const,
      involvedAgents: result.involvedAgents
    };
  } else {
    console.log('📄 Simple request, using standard canvas system');
    const canvasOrchestrator = getCanvasOrchestrator();
    const result = await canvasOrchestrator.processFromConversation(userInput, conversationId);
    return {
      ...result,
      systemUsed: 'canvas' as const
    };
  }
}

/**
 * Reset the AI Agent System (for testing)
 */
export function resetAIAgentSystem(): void {
  aiAgentOrchestrator = null;
  console.log('🔄 AI Agent System reset');
}

// Export types for external use
export type { AIAgentOrchestrator } from './AIAgentOrchestrator';
export type {
  AIAgentTask,
  AgentType,
  TaskStatus,
  AIAgent
} from './types';
