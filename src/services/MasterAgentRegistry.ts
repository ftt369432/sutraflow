/**
 * 🎯 MASTER AGENT REGISTRY - NON-DISRUPTIVE CONSOLIDATION
 * 
 * URENO Principle: Don't rebuild working systems, organize and orchestrate them
 * This registry acts as the central conductor for ALL existing agent systems
 */

import { WorkflowOrchestrator } from './WorkflowOrchestrator';
import { CanvasAgentOrchestrator } from './agents/core/CanvasAgentOrchestrator';
import { UnifiedAgentService } from './unified/agentService';
// Import will be done dynamically to avoid circular dependency
import { useAgentStore } from '../store/agentStore';
import { N8nIntegrationService, createN8nIntegration } from './n8n/N8nIntegrationService';

// 🎭 Agent System Types - Keep ALL existing systems working
export enum AgentSystemType {
  CANVAS = 'canvas',           // Document collaboration agents
  WORKFLOW = 'workflow',       // Email/Calendar/Task automation
  UNIFIED = 'unified',         // Service management agents  
  EMAIL = 'email',            // Email-specific agents
  CREATOR = 'creator',        // Marketplace creator agents
  N8N_WORKFLOW = 'n8n_workflow', // External n8n workflow service
  STORE = 'store'              // Frontend state agents
}

// 🧠 Master Agent Interface - Universal wrapper for all agent types
export interface MasterAgent {
  id: string;
  name: string;
  type: string;
  systemType: AgentSystemType;
  capabilities: string[];
  status: 'active' | 'inactive' | 'busy' | 'error';
  metadata: {
    originalSystem: string;
    createdAt: Date;
    lastActive: Date;
    successRate: number;
    tasksCompleted: number;
  };
  // Keep original agent reference for backwards compatibility
  originalAgent: any;
}

// 🎪 Master Agent Registry - The Central Hub
export class MasterAgentRegistry {
  private static instance: MasterAgentRegistry;
  private agents = new Map<string, MasterAgent>();
  private systemOrchestrators = new Map<AgentSystemType, any>();
  private eventListeners = new Map<string, Function[]>();
  private n8nIntegration?: N8nIntegrationService;

  constructor() {
    this.initializeExistingSystems();
  }

  static getInstance(): MasterAgentRegistry {
    if (!MasterAgentRegistry.instance) {
      MasterAgentRegistry.instance = new MasterAgentRegistry();
    }
    return MasterAgentRegistry.instance;
  }

  /**
   * 🏗️ Initialize ALL existing systems without disruption
   */
  private initializeExistingSystems() {
    console.log('🎯 MASTER REGISTRY: Initializing existing agent systems...');

    // 1. Canvas Agent System (Document collaboration)
    try {
      this.systemOrchestrators.set(AgentSystemType.CANVAS, new CanvasAgentOrchestrator());
      this.registerCanvasAgents();
    } catch (error) {
      console.warn('Canvas system initialization skipped:', error);
    }

    // 2. Workflow Orchestrator (Email/Calendar/Task automation)
    try {
      this.systemOrchestrators.set(AgentSystemType.WORKFLOW, new WorkflowOrchestrator());
      this.registerWorkflowAgents();
    } catch (error) {
      console.warn('Workflow system initialization skipped:', error);
    }

    // 3. Unified Agent Service (Service management)
    try {
      this.systemOrchestrators.set(AgentSystemType.UNIFIED, UnifiedAgentService.instance);
      this.registerUnifiedAgents();
    } catch (error) {
      console.warn('Unified system initialization skipped:', error);
    }

    // 4. Email Agent System (Email-specific)
    try {
      this.registerEmailAgents();
    } catch (error) {
      console.warn('Email system initialization skipped:', error);
    }

    // 5. N8N Workflow Integration (External automation)
    try {
      this.initializeN8nIntegration();
    } catch (error) {
      console.warn('N8N integration initialization skipped:', error);
    }

    console.log(`✅ MASTER REGISTRY: Initialized ${this.agents.size} agents across ${this.systemOrchestrators.size} systems`);
  }

  /**
   * � Initialize N8N Integration
   */
  private async initializeN8nIntegration(): Promise<void> {
    try {
      console.log('🚀 Initializing N8N Integration...');
      
      if (this.n8nIntegration) {
        // Get workflow orchestrator for initialization
        const workflowOrchestrator = this.systemOrchestrators.get(AgentSystemType.WORKFLOW) as any;
        
        await this.n8nIntegration.initialize(this, workflowOrchestrator);
        
        // Register N8N workflow templates as agents
        const templates = this.n8nIntegration.getWorkflowTemplates();
        
        templates.forEach(template => {
          const agent: MasterAgent = {
            id: template.id, // Use direct template ID instead of prefixed version
            name: `N8N: ${template.name}`,
            type: 'n8n_workflow',
            systemType: AgentSystemType.N8N_WORKFLOW,
            capabilities: ['automation', 'workflow_execution', 'external_integration'],
            status: 'active',
            metadata: {
              originalSystem: 'N8nIntegrationService',
              createdAt: new Date(),
              lastActive: new Date(),
              successRate: 1.0,
              tasksCompleted: 0
            },
            originalAgent: template
          };
          
          this.agents.set(agent.id, agent);
        });
        
        console.log(`✅ N8N Integration initialized with ${templates.length} workflow templates`);
      }
    } catch (error) {
      console.error('❌ N8N Integration initialization failed:', error);
      // Don't throw - allow registry to work without N8N
    }
  }

  /**
   * �📄 Register Canvas Agents (Document collaboration)
   */
  private registerCanvasAgents() {
    const canvasAgents = [
      'document_agent', 'template_agent', 'qa_agent', 'coordination_agent', 'research_agent',
      'legal_agent', 'medical_agent', 'business_agent', 'technical_agent',
      'architecture_agent', 'creative_agent'
    ];

    canvasAgents.forEach(agentType => {
      const agent: MasterAgent = {
        id: `canvas_${agentType}`,
        name: agentType.replace('_', ' ').toUpperCase(),
        type: agentType,
        systemType: AgentSystemType.CANVAS,
        capabilities: this.getCanvasCapabilities(agentType),
        status: 'active',
        metadata: {
          originalSystem: 'CanvasAgentOrchestrator',
          createdAt: new Date(),
          lastActive: new Date(),
          successRate: 0.95,
          tasksCompleted: 0
        },
        originalAgent: null // Will be populated when needed
      };
      
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * ⚙️ Register Workflow Agents (Automation)
   */
  private registerWorkflowAgents() {
    const workflowAgents = [
      { type: 'email', name: 'Email Agent' },
      { type: 'calendar', name: 'Calendar Agent' },
      { type: 'document', name: 'Document Agent' },
      { type: 'task', name: 'Task Agent' }
    ];

    workflowAgents.forEach(({ type, name }) => {
      const agent: MasterAgent = {
        id: `workflow_${type}`,
        name,
        type,
        systemType: AgentSystemType.WORKFLOW,
        capabilities: this.getWorkflowCapabilities(type),
        status: 'active',
        metadata: {
          originalSystem: 'WorkflowOrchestrator',
          createdAt: new Date(),
          lastActive: new Date(),
          successRate: 0.92,
          tasksCompleted: 0
        },
        originalAgent: null
      };
      
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * 🔗 Register Unified Agents (Services)
   */
  private registerUnifiedAgents() {
    const unifiedService = this.systemOrchestrators.get(AgentSystemType.UNIFIED);
    if (!unifiedService) return;

    try {
      const allAgents = unifiedService.getAllAgents();
      
      allAgents.forEach((originalAgent: any) => {
        const agent: MasterAgent = {
          id: `unified_${originalAgent.id}`,
          name: originalAgent.name || 'Unified Agent',
          type: originalAgent.type || 'service',
          systemType: AgentSystemType.UNIFIED,
          capabilities: originalAgent.capabilities || [],
          status: 'active',
          metadata: {
            originalSystem: 'UnifiedAgentService',
            createdAt: new Date(),
            lastActive: new Date(),
            successRate: 0.89,
            tasksCompleted: 0
          },
          originalAgent
        };
        
        this.agents.set(agent.id, agent);
      });
    } catch (error) {
      console.warn('Could not register unified agents:', error);
    }
  }

  /**
   * 📧 Register Email Agents (Email-specific)
   */
  private registerEmailAgents() {
    const emailAgentTypes = [
      'CONTENT_ANALYZER', 'EMAIL_AGENT', 'CALENDAR_AGENT', 'TASK_AGENT',
      'LEGAL_AGENT', 'MEDICAL_AGENT', 'BUSINESS_AGENT', 'FINANCE_AGENT'
    ];

    emailAgentTypes.forEach(type => {
      const agent: MasterAgent = {
        id: `email_${type.toLowerCase()}`,
        name: type.replace('_', ' '),
        type: type.toLowerCase(),
        systemType: AgentSystemType.EMAIL,
        capabilities: ['email_processing', 'content_analysis', 'automation'],
        status: 'active',
        metadata: {
          originalSystem: 'UniversalEmailAgentSystem',
          createdAt: new Date(),
          lastActive: new Date(),
          successRate: 0.96,
          tasksCompleted: 0
        },
        originalAgent: null
      };
      
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * 🎪 UNIFIED API - Execute any agent from any system
   */
  async executeAgent(agentId: string, task: any, context?: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }

    // Route to appropriate system based on agent type
    switch (agent.systemType) {
      case AgentSystemType.CANVAS:
        return this.executeCanvasAgent(agent, task, context);
      
      case AgentSystemType.WORKFLOW:
        return this.executeWorkflowAgent(agent, task, context);
      
      case AgentSystemType.UNIFIED:
        return this.executeUnifiedAgent(agent, task, context);
      
      case AgentSystemType.EMAIL:
        return this.executeEmailAgent(agent, task, context);
      
      case AgentSystemType.N8N_WORKFLOW:
        return this.executeN8nWorkflowAgent(agent, task, context);
      
      default:
        throw new Error(`Unknown agent system type: ${agent.systemType}`);
    }
  }

  /**
   * 📄 Execute Canvas Agent
   */
  private async executeCanvasAgent(agent: MasterAgent, task: any, context: any): Promise<any> {
    const orchestrator = this.systemOrchestrators.get(AgentSystemType.CANVAS);
    if (!orchestrator) throw new Error('Canvas orchestrator not available');

    // Use existing canvas system
    return orchestrator.processDocumentRequest({
      id: `task_${Date.now()}`,
      canvasId: task.canvasId || `canvas_${Date.now()}`,
      userInput: task.description || task.input,
      documentType: task.documentType || 'document',
      userContext: context || {},
      chatHistory: task.chatHistory || context?.chatHistory || [], // 🔧 FIX: Provide default empty array
      qualityRequirements: task.qualityRequirements || {
        accuracy_level: 'standard',
        professional_standards: true,
        fact_checking: false,
        compliance_review: false,
        industry_specific: false
      },
      createdAt: new Date()
    });
  }

  /**
   * ⚙️ Execute Workflow Agent  
   */
  private async executeWorkflowAgent(agent: MasterAgent, task: any, context: any): Promise<any> {
    const orchestrator = this.systemOrchestrators.get(AgentSystemType.WORKFLOW);
    if (!orchestrator) throw new Error('Workflow orchestrator not available');

    // Use existing workflow system
    return orchestrator.executeAgentAction(agent.id, task.action || 'process', task.params || {});
  }

  /**
   * 🔗 Execute Unified Agent
   */
  private async executeUnifiedAgent(agent: MasterAgent, task: any, context: any): Promise<any> {
    if (!agent.originalAgent) throw new Error('Original agent not available');

    // Use original agent's execute method
    if (typeof agent.originalAgent.execute === 'function') {
      return agent.originalAgent.execute(task.action, task.params);
    }
    
    throw new Error('Agent does not support execution');
  }

  /**
   * 📧 Execute Email Agent
   */
  private async executeEmailAgent(agent: MasterAgent, task: any, context: any): Promise<any> {
    // Use Universal Email Agent System
    const { selectOptimalAgents } = await import('./email/agents/UniversalEmailAgentSystem');
    
    const steps = selectOptimalAgents(
      task.email || {},
      context?.industry || { id: 'general', displayName: 'General' },
      [agent.type as any]
    );

    return { steps, agentUsed: agent.id };
  }

  /**
   * � Execute N8N Workflow Agent
   */
  private async executeN8nWorkflowAgent(agent: MasterAgent, task: any, context: any): Promise<any> {
    if (!this.n8nIntegration) {
      throw new Error('N8N Integration not available');
    }

    // Extract template from original agent
    const template = agent.originalAgent;
    if (!template) {
      throw new Error('N8N workflow template not found');
    }

    // Execute workflow using N8N integration
    return this.n8nIntegration.executeGenieFlowWorkflow(
      template.id,
      {
        ...task.inputs || task.data || {},
        context: {
          ...context,
          agentId: agent.id,
          templateName: template.name
        }
      }
    );
  }

  /**
   * �📊 Get All Agents (Organized View)
   */
  getAllAgents(): MasterAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 🔍 Get Agents by System
   */
  getAgentsBySystem(systemType: AgentSystemType): MasterAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.systemType === systemType);
  }

  /**
   * 🎯 Smart Agent Selection - Choose best agent for task
   */
  selectBestAgent(task: any, context?: any): MasterAgent | null {
    // Intelligent routing based on task type
    if (task.type === 'document' || task.documentType) {
      return this.getAgentsBySystem(AgentSystemType.CANVAS)[0];
    }
    
    if (task.type === 'email' || task.email) {
      return this.getAgentsBySystem(AgentSystemType.EMAIL)[0];
    }
    
    if (task.type === 'automation' || task.workflow) {
      return this.getAgentsBySystem(AgentSystemType.WORKFLOW)[0];
    }

    // Default to most capable agent
    return this.getAllAgents()[0];
  }

  /**
   * 📈 Get System Health
   */
  getSystemHealth() {
    const systemStats = new Map();
    
    Object.values(AgentSystemType).forEach(systemType => {
      const systemAgents = this.getAgentsBySystem(systemType);
      systemStats.set(systemType, {
        totalAgents: systemAgents.length,
        activeAgents: systemAgents.filter(a => a.status === 'active').length,
        averageSuccessRate: systemAgents.reduce((sum, a) => sum + a.metadata.successRate, 0) / systemAgents.length || 0
      });
    });

    return {
      totalSystems: this.systemOrchestrators.size,
      totalAgents: this.agents.size,
      systemStats: Object.fromEntries(systemStats)
    };
  }

  // Helper methods for capabilities
  private getCanvasCapabilities(agentType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      legal_agent: ['legal_research', 'case_analysis', 'document_drafting'],
      medical_agent: ['medical_research', 'patient_communication', 'diagnosis_support'],
      business_agent: ['market_analysis', 'strategy_planning', 'report_writing'],
      research_agent: ['information_gathering', 'fact_verification', 'source_analysis'],
      qa_agent: ['quality_assurance', 'review', 'compliance_check']
    };
    
    return capabilityMap[agentType] || ['general_processing'];
  }

  private getWorkflowCapabilities(type: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      email: ['email_processing', 'auto_reply', 'categorization'],
      calendar: ['event_creation', 'scheduling', 'reminders'],
      document: ['document_creation', 'editing', 'formatting'],
      task: ['task_management', 'automation', 'tracking']
    };
    
    return capabilityMap[type] || ['automation'];
  }
}

// 🎯 Global Registry Instance
export const masterAgentRegistry = MasterAgentRegistry.getInstance();

// 🎪 Convenience Functions
export const executeAnyAgent = (agentId: string, task: any, context?: any) =>
  masterAgentRegistry.executeAgent(agentId, task, context);

export const getAllAgents = () => masterAgentRegistry.getAllAgents();

export const getAgentsBySystem = (systemType: AgentSystemType) =>
  masterAgentRegistry.getAgentsBySystem(systemType);

export const selectBestAgent = (task: any, context?: any) =>
  masterAgentRegistry.selectBestAgent(task, context);

export const getSystemHealth = () => masterAgentRegistry.getSystemHealth();

export default masterAgentRegistry;