import { Agent } from '../types/agents';
import { agentContext } from './agentContextService';

type CapabilityHandler = (agent: Agent, input: any) => Promise<any>;

class AgentCapabilityService {
  private capabilities: Map<string, CapabilityHandler> = new Map();

  registerCapability(name: string, handler: CapabilityHandler) {
    this.capabilities.set(name, handler);
  }

  async executeCapability(agent: Agent, capabilityName: string, input: any) {
    const handler = this.capabilities.get(capabilityName);
    if (!handler) {
      throw new Error(`Capability ${capabilityName} not found`);
    }

    if (!agent.capabilities.includes(capabilityName)) {
      throw new Error(`Agent ${agent.id} does not have capability ${capabilityName}`);
    }

    const context = agentContext.getContext(agent.id);
    if (!context) {
      throw new Error(`No context found for agent ${agent.id}`);
    }

    return handler(agent, input);
  }

  // Register default capabilities
  initialize() {
    this.registerCapability('email-processing', async (agent, input) => {
      // Email processing logic
      return { processed: true, result: 'Email processed' };
    });

    this.registerCapability('document-analysis', async (agent, input) => {
      // Document analysis logic
      return { analyzed: true, insights: [] };
    });

    this.registerCapability('calendar-scheduling', async (agent, input) => {
      // Calendar scheduling logic
      return { scheduled: true, event: {} };
    });
  }

  hasCapability(name: string): boolean {
    return this.capabilities.has(name);
  }

  validateCapabilities(capabilities: string[]): string[] {
    return capabilities.filter(cap => !this.hasCapability(cap));
  }
}

export const agentCapabilities = new AgentCapabilityService(); 