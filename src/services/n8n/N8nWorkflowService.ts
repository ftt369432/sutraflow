/**
 * 🔗 N8N Workflow Service - External Automation Bridge
 * 
 * Integrates n8n workflow automation as an external service within GenieFlow AI system.
 * Follows URENO principles by enhancing existing capabilities without replacing them.
 */

import { BaseAgent } from '../agents/BaseAgent';
import type { AgentAction, AgentActionResult } from '../agents/BaseAgent';

// N8N Workflow Types
export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  tags: string[];
  active: boolean;
  nodes: N8nNode[];
  connections: N8nConnection[];
  settings: N8nWorkflowSettings;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8nWorkflowSettings {
  saveExecutions: boolean;
  saveExecutionsOnError: boolean;
  saveExecutionsOnSuccess: boolean;
  saveManualExecutions: boolean;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  mode: 'cli' | 'error' | 'integrated' | 'internal' | 'manual' | 'retry' | 'trigger' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  status: 'canceled' | 'crashed' | 'error' | 'new' | 'running' | 'success' | 'unknown' | 'waiting';
  data?: any;
}

export interface N8nExecutionRequest {
  workflowId: string;
  data?: Record<string, any>;
  mode?: 'manual' | 'trigger' | 'webhook';
}

export interface N8nApiConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

/**
 * N8N Workflow Service - Core Integration
 */
export class N8nWorkflowService {
  private config: N8nApiConfig;
  private isConnected: boolean = false;

  constructor(config: N8nApiConfig) {
    this.config = config;
  }

  /**
   * Initialize connection to n8n instance
   */
  async initialize(): Promise<boolean> {
    try {
      // Test connection to n8n API
      const response = await this.makeRequest('/health');
      this.isConnected = response?.status === 'ok';
      
      if (this.isConnected) {
        console.log('✅ N8N Workflow Service connected successfully');
      } else {
        console.warn('⚠️ N8N connection test failed');
      }
      
      return this.isConnected;
    } catch (error) {
      console.error('❌ N8N initialization failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get all available workflows
   */
  async getWorkflows(): Promise<N8nWorkflow[]> {
    if (!this.isConnected) {
      console.warn('N8N service not connected');
      return [];
    }

    try {
      const workflows = await this.makeRequest('/workflows');
      return workflows || [];
    } catch (error) {
      console.error('Error fetching N8N workflows:', error);
      return [];
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    if (!this.isConnected) return null;

    try {
      const workflow = await this.makeRequest(`/workflows/${workflowId}`);
      return workflow;
    } catch (error) {
      console.error(`Error fetching N8N workflow ${workflowId}:`, error);
      return null;
    }
  }

  /**
   * Execute workflow with data
   */
  async executeWorkflow(request: N8nExecutionRequest): Promise<N8nExecution | null> {
    if (!this.isConnected) {
      console.warn('N8N service not connected, cannot execute workflow');
      return null;
    }

    try {
      const execution = await this.makeRequest(`/workflows/${request.workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          data: request.data || {},
          mode: request.mode || 'manual'
        })
      });

      console.log(`🚀 N8N workflow ${request.workflowId} executed:`, execution?.id);
      return execution;
    } catch (error) {
      console.error(`Error executing N8N workflow ${request.workflowId}:`, error);
      return null;
    }
  }

  /**
   * Get execution status and results
   */
  async getExecution(executionId: string): Promise<N8nExecution | null> {
    if (!this.isConnected) return null;

    try {
      const execution = await this.makeRequest(`/executions/${executionId}`);
      return execution;
    } catch (error) {
      console.error(`Error fetching N8N execution ${executionId}:`, error);
      return null;
    }
  }

  /**
   * Create new workflow
   */
  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow | null> {
    if (!this.isConnected) return null;

    try {
      const newWorkflow = await this.makeRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflow)
      });

      console.log(`✨ Created N8N workflow: ${newWorkflow?.name}`);
      return newWorkflow;
    } catch (error) {
      console.error('Error creating N8N workflow:', error);
      return null;
    }
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(workflowId: string, updates: Partial<N8nWorkflow>): Promise<N8nWorkflow | null> {
    if (!this.isConnected) return null;

    try {
      const updatedWorkflow = await this.makeRequest(`/workflows/${workflowId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      console.log(`📝 Updated N8N workflow: ${workflowId}`);
      return updatedWorkflow;
    } catch (error) {
      console.error(`Error updating N8N workflow ${workflowId}:`, error);
      return null;
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      await this.makeRequest(`/workflows/${workflowId}`, {
        method: 'DELETE'
      });

      console.log(`🗑️ Deleted N8N workflow: ${workflowId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting N8N workflow ${workflowId}:`, error);
      return false;
    }
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutions(workflowId: string, limit = 10): Promise<N8nExecution[]> {
    if (!this.isConnected) return [];

    try {
      const executions = await this.makeRequest(`/executions?workflowId=${workflowId}&limit=${limit}`);
      return executions?.data || [];
    } catch (error) {
      console.error(`Error fetching executions for workflow ${workflowId}:`, error);
      return [];
    }
  }

  /**
   * Test workflow connection and capabilities
   */
  async testConnection(): Promise<{ success: boolean; version?: string; capabilities?: string[] }> {
    try {
      const health = await this.makeRequest('/health');
      const info = await this.makeRequest('/');
      
      return {
        success: true,
        version: info?.version,
        capabilities: [
          'workflow_execution',
          'data_processing',
          'api_integration',
          'webhook_handling',
          'scheduled_tasks'
        ]
      };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Private method to make HTTP requests to N8N API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}/api/v1${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authentication
    if (this.config.apiKey) {
      headers['X-N8N-API-KEY'] = this.config.apiKey;
    } else if (this.config.username && this.config.password) {
      const auth = btoa(`${this.config.username}:${this.config.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`N8N API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get connection status
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get service configuration
   */
  getConfig(): N8nApiConfig {
    return { ...this.config };
  }
}

/**
 * N8N Agent - Integrates n8n workflows as an agent within GenieFlow system
 */
export class N8nWorkflowAgent extends BaseAgent {
  private n8nService: N8nWorkflowService;

  constructor(n8nService: N8nWorkflowService) {
    super();
    this.n8nService = n8nService;
  }

  protected getCapabilities(): string[] {
    return [
      'workflow_automation',
      'external_api_integration',
      'data_processing',
      'scheduled_tasks',
      'webhook_handling',
      'multi_step_workflows',
      'connector_ecosystem'
    ];
  }

  async processAction(action: AgentAction): Promise<AgentActionResult> {
    try {
      switch (action.type) {
        case 'execute_workflow':
          return await this.executeWorkflow(action);
          
        case 'list_workflows':
          return await this.listWorkflows(action);
          
        case 'get_workflow_status':
          return await this.getWorkflowStatus(action);
          
        case 'create_automation':
          return await this.createAutomation(action);
          
        default:
          return {
            success: false,
            message: `Unknown N8N action type: ${action.type}`,
            data: null
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `N8N agent error: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Execute n8n workflow
   */
  private async executeWorkflow(action: AgentAction): Promise<AgentActionResult> {
    const { workflowId, data } = action.input;
    
    if (!workflowId) {
      return {
        success: false,
        message: 'Workflow ID is required',
        data: null
      };
    }

    const execution = await this.n8nService.executeWorkflow({
      workflowId,
      data,
      mode: 'manual'
    });

    if (execution) {
      return {
        success: true,
        message: `Workflow ${workflowId} executed successfully`,
        data: {
          executionId: execution.id,
          status: execution.status,
          startedAt: execution.startedAt
        }
      };
    } else {
      return {
        success: false,
        message: `Failed to execute workflow ${workflowId}`,
        data: null
      };
    }
  }

  /**
   * List available workflows
   */
  private async listWorkflows(action: AgentAction): Promise<AgentActionResult> {
    const workflows = await this.n8nService.getWorkflows();
    
    return {
      success: true,
      message: `Found ${workflows.length} workflows`,
      data: {
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          active: w.active,
          tags: w.tags
        }))
      }
    };
  }

  /**
   * Get workflow execution status
   */
  private async getWorkflowStatus(action: AgentAction): Promise<AgentActionResult> {
    const { executionId } = action.input;
    
    if (!executionId) {
      return {
        success: false,
        message: 'Execution ID is required',
        data: null
      };
    }

    const execution = await this.n8nService.getExecution(executionId);
    
    if (execution) {
      return {
        success: true,
        message: `Execution status: ${execution.status}`,
        data: {
          id: execution.id,
          status: execution.status,
          startedAt: execution.startedAt,
          stoppedAt: execution.stoppedAt,
          workflowId: execution.workflowId
        }
      };
    } else {
      return {
        success: false,
        message: `Execution ${executionId} not found`,
        data: null
      };
    }
  }

  /**
   * Create new automation workflow
   */
  private async createAutomation(action: AgentAction): Promise<AgentActionResult> {
    const { name, description, nodes, connections } = action.input;
    
    const workflow = await this.n8nService.createWorkflow({
      name,
      description,
      nodes,
      connections,
      active: true,
      tags: ['genieflow-auto-created'],
      settings: {
        saveExecutions: true,
        saveExecutionsOnError: true,
        saveExecutionsOnSuccess: false,
        saveManualExecutions: true
      }
    });

    if (workflow) {
      return {
        success: true,
        message: `Created workflow: ${workflow.name}`,
        data: {
          workflowId: workflow.id,
          name: workflow.name,
          active: workflow.active
        }
      };
    } else {
      return {
        success: false,
        message: 'Failed to create workflow',
        data: null
      };
    }
  }
}

// Factory function for creating N8N service
export function createN8nService(config?: Partial<N8nApiConfig>): N8nWorkflowService {
  const defaultConfig: N8nApiConfig = {
    baseUrl: 'http://localhost:5678', // Default n8n port
    ...config
  };

  return new N8nWorkflowService(defaultConfig);
}

// Export singleton instance
export const n8nWorkflowService = createN8nService();