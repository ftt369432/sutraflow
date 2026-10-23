/**
 * Agent Plugin Architecture - Foundation for Easy Agent Integration
 * 
 * This framework provides a standardized way to integrate new agents
 * into the GenieFlow AI system with minimal boilerplate code.
 */

// Base interfaces for all agents
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'productivity' | 'automation' | 'analysis' | 'integration';
  version: string;
  dependencies?: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  settings: Record<string, any>;
  enabled: boolean;
  autoStart: boolean;
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  environment: 'development' | 'staging' | 'production';
  services: ServiceRegistry;
  eventBus: EventBus;
}

// Base Agent class that all agents should extend
export abstract class BasePluginAgent {
  protected config: AgentConfig;
  protected context: AgentContext;
  protected isRunning = false;

  constructor(config: AgentConfig, context: AgentContext) {
    this.config = config;
    this.context = context;
  }

  // Lifecycle methods
  abstract initialize(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract resume(): Promise<void>;

  // Core functionality
  abstract execute(action: string, params: any): Promise<any>;
  abstract getCapabilities(): AgentCapability[];
  abstract getStatus(): AgentStatus;

  // Event handling
  protected emit(event: string, data: any): void {
    this.context.eventBus.emit(`agent:${this.config.id}:${event}`, data);
  }

  protected subscribe(event: string, handler: (data: any) => void): void {
    this.context.eventBus.subscribe(event, handler);
  }
}

// Service Registry for dependency injection
export class ServiceRegistry {
  private services = new Map<string, any>();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

// Event Bus for agent communication
export class EventBus {
  private listeners = new Map<string, ((data: any) => void)[]>();

  emit(event: string, data: any): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  subscribe(event: string, handler: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    const handlers = this.listeners.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
}

// Agent Manager for registration and lifecycle
export class AgentManager {
  private agents = new Map<string, BasePluginAgent>();
  private registry: ServiceRegistry;
  private eventBus: EventBus;

  constructor() {
    this.registry = new ServiceRegistry();
    this.eventBus = new EventBus();
    this.setupCoreServices();
  }

  private setupCoreServices(): void {
    // Register core services that agents can use
    this.registry.register('eventBus', this.eventBus);
    this.registry.register('agentManager', this);
  }

  async registerAgent(AgentClass: new (config: AgentConfig, context: AgentContext) => BasePluginAgent, config: AgentConfig): Promise<void> {
    const context: AgentContext = {
      userId: 'current-user', // TODO: Get from auth context
      sessionId: 'current-session',
      environment: process.env.NODE_ENV as any || 'development',
      services: this.registry,
      eventBus: this.eventBus
    };

    const agent = new AgentClass(config, context);
    
    try {
      await agent.initialize();
      this.agents.set(config.id, agent);
      
      if (config.autoStart) {
        await agent.start();
      }

      this.eventBus.emit('agent:registered', { agentId: config.id, config });
      console.log(`✅ Agent ${config.name} registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register agent ${config.name}:`, error);
      throw error;
    }
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    await agent.start();
    this.eventBus.emit('agent:started', { agentId });
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    await agent.stop();
    this.eventBus.emit('agent:stopped', { agentId });
  }

  getAgent(agentId: string): BasePluginAgent | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values()).map(agent => agent['config']);
  }
}

// Agent Status interface
export interface AgentStatus {
  id: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  lastActivity?: Date;
  metrics?: Record<string, any>;
  errors?: string[];
}

// Example: BlastCommunicationAgent skeleton
export class BlastCommunicationAgent extends BasePluginAgent {
  async initialize(): Promise<void> {
    // Initialize email and SMS services
    console.log('Initializing Blast Communication Agent...');
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('Blast Communication Agent started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Blast Communication Agent stopped');
  }

  async pause(): Promise<void> {
    console.log('Blast Communication Agent paused');
  }

  async resume(): Promise<void> {
    console.log('Blast Communication Agent resumed');
  }

  async execute(action: string, params: any): Promise<any> {
    switch (action) {
      case 'sendEmailBlast':
        return this.sendEmailBlast(params);
      case 'sendSMSBlast':
        return this.sendSMSBlast(params);
      case 'createCampaign':
        return this.createCampaign(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  getCapabilities(): AgentCapability[] {
    return [
      {
        id: 'email-blast',
        name: 'Email Blast',
        description: 'Send bulk emails to contact lists',
        category: 'communication',
        version: '1.0.0'
      },
      {
        id: 'sms-blast',
        name: 'SMS Blast',
        description: 'Send bulk SMS messages to contact lists',
        category: 'communication',
        version: '1.0.0'
      }
    ];
  }

  getStatus(): AgentStatus {
    return {
      id: this.config.id,
      status: this.isRunning ? 'running' : 'stopped',
      lastActivity: new Date(),
      metrics: {
        emailsSent: 0,
        smsSent: 0,
        campaignsActive: 0
      }
    };
  }

  private async sendEmailBlast(params: {
    templateId: string;
    contactListId: string;
    subject: string;
    personalizations?: Record<string, any>;
  }): Promise<{ success: boolean; messageId: string; recipientCount: number }> {
    // TODO: Implement email blast functionality
    console.log('Sending email blast:', params);
    return {
      success: true,
      messageId: `email-blast-${Date.now()}`,
      recipientCount: 0
    };
  }

  private async sendSMSBlast(params: {
    templateId: string;
    contactListId: string;
    message: string;
    personalizations?: Record<string, any>;
  }): Promise<{ success: boolean; messageId: string; recipientCount: number }> {
    // TODO: Implement SMS blast functionality
    console.log('Sending SMS blast:', params);
    return {
      success: true,
      messageId: `sms-blast-${Date.now()}`,
      recipientCount: 0
    };
  }

  private async createCampaign(params: {
    name: string;
    type: 'email' | 'sms' | 'mixed';
    schedule?: Date;
    template: string;
    contactLists: string[];
  }): Promise<{ campaignId: string; status: string }> {
    // TODO: Implement campaign creation
    console.log('Creating campaign:', params);
    return {
      campaignId: `campaign-${Date.now()}`,
      status: 'created'
    };
  }
}

// Export singleton instance for global use
export const agentManager = new AgentManager();
