/**
 * 🤖 Specialized AI Agents
 * 
 * Each agent handles specific domain tasks and communicates with other agents
 */

import {
  AIAgent,
  AIAgentTask,
  AgentType,
  TaskStatus,
  AgentMessage
} from './types';


import { DocumentAgent } from './DocumentAgent';
import { LegalAgent } from './LegalAgent';
import { MedicalAgent } from './MedicalAgent';
import { UniversalAgent } from './UniversalAgent';
import { TradingAgent } from './TradingAgent';
import { InvestigationAgent } from './InvestigationAgent';

export { DocumentAgent, LegalAgent, MedicalAgent, UniversalAgent, TradingAgent, InvestigationAgent };
import { BaseAgent, AgentConfig, AgentAction } from './BaseAgent';


import { v4 as uuidv4 } from 'uuid';

/**
 * 📅 Calendar Agent - Handles Scheduling & Calendar Operations
 */
export class CalendarAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      id: config?.id || `calendar-agent-${uuidv4()}`,
      name: config?.name || 'Calendar Assistant',
      description: config?.description || 'Manages schedules and appointments',
      capabilities: config?.capabilities || [
        'scheduling',
        'calendar-management'
      ],
      type: AgentType.CALENDAR_AGENT,
      version: config?.version || '1.0',
      created: config?.created || new Date(),
      lastModified: config?.lastModified || new Date(),
      status: (config?.status as any) || 'active',
      preferences: config?.preferences || {}
    });
  }

  async train(data: any[]): Promise<void> {
    console.log('📅 Training CalendarAgent with', data.length, 'samples');
  }

  protected async performAction(action: AgentAction): Promise<any> {
    // Calendar operations would go here
    const { type, params } = action;
    console.log('📅 CalendarAgent: Performing action:', type, params);

    // For now, return success
    return { success: true, message: 'Calendar operation logged' };
  }
}


// Export all agents
export const createAgentInstances = (): Map<AgentType, AIAgent> => {
  const agents = new Map<AgentType, AIAgent>();

  agents.set(AgentType.DOCUMENT_AGENT, new DocumentAgent());
  agents.set(AgentType.LEGAL_AGENT, new LegalAgent());
  agents.set(AgentType.MEDICAL_AGENT, new MedicalAgent());
  agents.set(AgentType.CALENDAR_AGENT, new CalendarAgent());
  agents.set(AgentType.UNIVERSAL_AGENT, new UniversalAgent());
  agents.set(AgentType.TRADING_AGENT, new TradingAgent());
  agents.set(AgentType.INVESTIGATION, new InvestigationAgent());


  return agents;
};