/**
 * 🎨 Multi-Agent Canvas Orchestrator
 * 
 * Coordinates multiple Canvas creation tasks using the existing Canvas system
 * and SwarmOrchestrator. Integrates with AutomationPage for autonomous execution.
 */

import { v4 as uuidv4 } from 'uuid';
import { ParsedTask, NotesParsingResult } from './NotesParserService';
import { swarmOrchestrator } from '../swarm/SwarmOrchestrator';
import { useSwarmStore, SwarmMember } from '../../stores/swarmStore';
import { useCanvasStore } from '../../stores/canvasStore';

export interface CanvasOrchestrationRequest {
  id: string;
  tasks: ParsedTask[];
  executionMode: 'sequential' | 'parallel' | 'optimal';
  prioritizeByUrgency: boolean;
  notifyOnCompletion: boolean;
  userId: string;
}

export interface CanvasOrchestrationResult {
  success: boolean;
  orchestrationId: string;
  canvasesCreated: number;
  swarmId?: string;
  createdCanvases: CanvasCreationResult[];
  executionTime: number;
  error?: string;
}

export interface CanvasCreationResult {
  taskId: string;
  canvasId: string;
  title: string;
  documentType: string;
  status: 'created' | 'failed' | 'in_progress';
  agentsAssigned: string[];
  estimatedCompletion?: Date;
  error?: string;
}

export class MultiAgentCanvasOrchestrator {
  private static instance: MultiAgentCanvasOrchestrator;
  private activeOrchestrations: Map<string, CanvasOrchestrationRequest> = new Map();
  private progressCallbacks: Map<string, Function[]> = new Map();

  static getInstance(): MultiAgentCanvasOrchestrator {
    if (!MultiAgentCanvasOrchestrator.instance) {
      MultiAgentCanvasOrchestrator.instance = new MultiAgentCanvasOrchestrator();
    }
    return MultiAgentCanvasOrchestrator.instance;
  }

  /**
   * 🚀 Main orchestration entry point
   */
  async orchestrateCanvasTasks(request: CanvasOrchestrationRequest): Promise<CanvasOrchestrationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 CANVAS ORCHESTRATOR: Starting multi-agent Canvas creation...', {
        totalTasks: request.tasks.length,
        mode: request.executionMode
      });

      // Store orchestration request
      this.activeOrchestrations.set(request.id, request);

      // Filter Canvas-related tasks
      const canvasTasks = request.tasks.filter(task => 
        task.type === 'canvas' || task.type === 'document'
      );

      if (canvasTasks.length === 0) {
        return {
          success: true,
          orchestrationId: request.id,
          canvasesCreated: 0,
          createdCanvases: [],
          executionTime: Date.now() - startTime,
          error: 'No Canvas tasks found in request'
        };
      }

      // Create swarm for coordinated execution
      const swarmId = await this.createCanvasSwarm(canvasTasks, request.executionMode);

      // Execute Canvas creation based on mode
      const results = await this.executeCanvasCreation(canvasTasks, request.executionMode, swarmId);

      const orchestrationResult: CanvasOrchestrationResult = {
        success: results.every(r => r.status === 'created'),
        orchestrationId: request.id,
        canvasesCreated: results.filter(r => r.status === 'created').length,
        swarmId,
        createdCanvases: results,
        executionTime: Date.now() - startTime
      };

      console.log('✅ CANVAS ORCHESTRATOR: Orchestration complete', {
        created: orchestrationResult.canvasesCreated,
        total: canvasTasks.length,
        timeMs: orchestrationResult.executionTime
      });

      // Notify completion if requested
      if (request.notifyOnCompletion) {
        this.notifyOrchestrationComplete(orchestrationResult);
      }

      return orchestrationResult;

    } catch (error) {
      console.error('❌ CANVAS ORCHESTRATOR: Orchestration failed:', error);
      
      return {
        success: false,
        orchestrationId: request.id,
        canvasesCreated: 0,
        createdCanvases: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown orchestration error'
      };
    } finally {
      // Cleanup
      this.activeOrchestrations.delete(request.id);
    }
  }

  /**
   * 🤖 Create a specialized swarm for Canvas creation tasks
   */
  private async createCanvasSwarm(tasks: ParsedTask[], executionMode: string): Promise<string> {
    const { createSwarm } = useSwarmStore.getState();

    // Determine required agents based on task types
    const requiredAgents = this.determineSwarmAgents(tasks);

    const swarmConfig = {
      id: uuidv4(),
      name: `Canvas Creation Swarm - ${new Date().toLocaleString()}`,
      description: `Autonomous Canvas creation for ${tasks.length} documents`,
      type: 'canvas_creation' as const,
      members: requiredAgents,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      configuration: {
        maxConcurrentTasks: executionMode === 'parallel' ? tasks.length : 1,
        prioritizeByUrgency: true,
        autoScaling: true,
        retryFailedTasks: true
      },
      metrics: {
        tasksCompleted: 0,
        tasksInProgress: 0,
        tasksFailed: 0,
        averageCompletionTime: 0,
        successRate: 100
      }
    };

    await createSwarm(swarmConfig);

    // Initialize swarm with orchestrator
    await swarmOrchestrator.initializeSwarm(swarmConfig.id);

    return swarmConfig.id;
  }

  /**
   * 📋 Execute Canvas creation based on execution mode
   */
  private async executeCanvasCreation(
    tasks: ParsedTask[], 
    mode: string, 
    swarmId: string
  ): Promise<CanvasCreationResult[]> {
    const results: CanvasCreationResult[] = [];

    if (mode === 'parallel') {
      // Execute all Canvas tasks in parallel
      const promises = tasks.map(task => this.createSingleCanvas(task, swarmId));
      const parallelResults = await Promise.allSettled(promises);
      
      parallelResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            taskId: tasks[index].id,
            canvasId: '',
            title: tasks[index].title,
            documentType: tasks[index].canvasConfig?.documentType || 'document',
            status: 'failed',
            agentsAssigned: [],
            error: result.reason?.message || 'Failed to create Canvas'
          });
        }
      });
    } else if (mode === 'sequential') {
      // Execute Canvas tasks one by one
      for (const task of tasks) {
        try {
          const result = await this.createSingleCanvas(task, swarmId);
          results.push(result);
        } catch (error) {
          results.push({
            taskId: task.id,
            canvasId: '',
            title: task.title,
            documentType: task.canvasConfig?.documentType || 'document',
            status: 'failed',
            agentsAssigned: [],
            error: error instanceof Error ? error.message : 'Failed to create Canvas'
          });
        }
      }
    } else {
      // Optimal mode - intelligent scheduling
      const scheduledTasks = this.optimizeTaskScheduling(tasks);
      results.push(...await this.executeOptimizedSchedule(scheduledTasks, swarmId));
    }

    return results;
  }

  /**
   * 🎯 Create a single Canvas document with agent coordination
   */
  private async createSingleCanvas(task: ParsedTask, swarmId: string): Promise<CanvasCreationResult> {
    const { createWindow } = useCanvasStore.getState();

    try {
      console.log(`🎨 Creating Canvas for task: ${task.title}`);

      // Distribute task to swarm
      const swarmTask = await swarmOrchestrator.distributeTask(swarmId, {
        title: `Create Canvas: ${task.title}`,
        description: task.description,
        priority: task.priority,
        complexity: 5, // Default complexity
        requiredCapabilities: task.requiredAgents || ['general_agent'],
        assignedAgents: [], // Will be assigned by swarm orchestrator
        progress: 0
      });

      // Create Canvas document
      const canvasId = createWindow(
        task.canvasConfig?.contentType || 'custom_document' as any,
        this.generateInitialContent(task)
      );

      // Assign agents to Canvas
      const assignedAgents = await this.assignAgentsToCanvas(canvasId, task.requiredAgents, swarmId);

      const result: CanvasCreationResult = {
        taskId: task.id,
        canvasId,
        title: task.title,
        documentType: task.canvasConfig?.documentType || 'document',
        status: 'created',
        agentsAssigned: assignedAgents,
        estimatedCompletion: new Date(Date.now() + task.estimatedDuration * 60000)
      };

      console.log(`✅ Canvas created successfully:`, result);
      return result;

    } catch (error) {
      console.error(`❌ Failed to create Canvas for task ${task.title}:`, error);
      throw error;
    }
  }

  /**
   * 🧠 Generate initial content for Canvas based on task
   */
  private generateInitialContent(task: ParsedTask): string {
    const { title, description, metadata, canvasConfig } = task;
    
    let content = `# ${title}\n\n`;
    
    // Add task description
    content += `## Task Overview\n${description}\n\n`;
    
    // Add metadata section
    if (metadata.keywords.length > 0) {
      content += `## Keywords\n${metadata.keywords.join(', ')}\n\n`;
    }
    
    // Add template hints if available
    if (canvasConfig?.templateHints && canvasConfig.templateHints.length > 0) {
      content += `## Template Hints\n${canvasConfig.templateHints.join(', ')}\n\n`;
    }
    
    // Add placeholder sections based on document type
    if (canvasConfig?.documentType === 'legal_petition') {
      content += this.generateLegalPetitionTemplate();
    } else {
      content += this.generateGeneralDocumentTemplate();
    }
    
    return content;
  }

  /**
   * 👥 Assign appropriate agents to Canvas document
   */
  private async assignAgentsToCanvas(canvasId: string, requiredAgents: string[], swarmId: string): Promise<string[]> {
    // For now, we'll simulate agent assignment
    // In production, this would integrate with the agent system
    console.log(`👥 Assigning agents to Canvas ${canvasId}:`, requiredAgents);
    
    // This would call the actual agent assignment system
    // await agentCoordinator.assignAgentsToDocument(canvasId, requiredAgents);
    
    return requiredAgents;
  }

  /**
   * 📊 Determine required agents for swarm based on tasks
   */
  private determineSwarmAgents(tasks: ParsedTask[]): SwarmMember[] {
    const agentTypes = new Set<string>();
    
    tasks.forEach(task => {
      task.requiredAgents.forEach(agent => agentTypes.add(agent));
    });

    // Always include coordination agent for multi-task operations
    agentTypes.add('coordination_agent');

    return Array.from(agentTypes).map(type => ({
      id: uuidv4(),
      name: this.getAgentName(type),
      role: type,
      status: 'active' as const,
      capabilities: this.getAgentCapabilities(type),
      lastUpdate: new Date().toISOString()
    }));
  }

  /**
   * ⚡ Optimize task scheduling for optimal execution
   */
  private optimizeTaskScheduling(tasks: ParsedTask[]) {
    // Sort by priority and dependencies
    return tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Then by estimated duration (shorter first for quick wins)
      return a.estimatedDuration - b.estimatedDuration;
    });
  }

  /**
   * 🎯 Execute optimized task schedule
   */
  private async executeOptimizedSchedule(tasks: ParsedTask[], swarmId: string): Promise<CanvasCreationResult[]> {
    const results: CanvasCreationResult[] = [];
    const batchSize = 3; // Process 3 Canvas documents at a time
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchPromises = batch.map(task => this.createSingleCanvas(task, swarmId));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            taskId: batch[index].id,
            canvasId: '',
            title: batch[index].title,
            documentType: batch[index].canvasConfig?.documentType || 'document',
            status: 'failed',
            agentsAssigned: [],
            error: result.reason?.message || 'Failed to create Canvas'
          });
        }
      });
      
      // Brief pause between batches to prevent overwhelming the system
      if (i + batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * 📢 Notify when orchestration is complete
   */
  private notifyOrchestrationComplete(result: CanvasOrchestrationResult) {
    // This would integrate with notification system
    console.log('📢 ORCHESTRATION COMPLETE:', {
      success: result.success,
      canvasesCreated: result.canvasesCreated,
      executionTime: `${Math.round(result.executionTime / 1000)}s`
    });
    
    // Trigger callbacks
    const callbacks = this.progressCallbacks.get(result.orchestrationId);
    if (callbacks) {
      callbacks.forEach(callback => callback(result));
      this.progressCallbacks.delete(result.orchestrationId);
    }
  }

  /**
   * 👤 Get display name for agent type
   */
  private getAgentName(type: string): string {
    const nameMap: Record<string, string> = {
      'legal_researcher': 'Legal Research Agent',
      'document_drafter': 'Document Drafting Agent',
      'timeline_specialist': 'Timeline Creation Agent',
      'coordination_agent': 'Task Coordination Agent',
      'contract_reviewer': 'Contract Review Agent',
      'case_analyzer': 'Case Analysis Agent',
      'legal_agent': 'Legal Specialist Agent',
      'document_agent': 'Document Creation Agent',
      'research_agent': 'Research Specialist Agent',
      'analysis_agent': 'Data Analysis Agent',
      'general_agent': 'General Purpose Agent'
    };
    return nameMap[type] || `${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Agent`;
  }

  /**
   * 🔧 Get agent capabilities by type
   */
  private getAgentCapabilities(agentType: string): string[] {
    const capabilities: Record<string, string[]> = {
      legal_agent: ['legal_research', 'document_drafting', 'citation_formatting', 'compliance_check'],
      document_agent: ['content_creation', 'structure_optimization', 'formatting', 'editing'],
      research_agent: ['information_gathering', 'fact_verification', 'source_analysis', 'data_collection'],
      analysis_agent: ['data_analysis', 'pattern_recognition', 'insights_generation', 'reporting'],
      coordination_agent: ['task_coordination', 'workflow_management', 'agent_communication', 'progress_tracking'],
      general_agent: ['basic_tasks', 'content_assistance', 'general_support']
    };
    
    return capabilities[agentType] || capabilities.general_agent;
  }

  /**
   * 📋 Template generators
   */
  private generateLegalPetitionTemplate(): string {
    return `## Petition Structure

### 1. Caption
- Case title and number
- Court information
- Parties involved

### 2. Introduction
- Brief statement of petition purpose
- Legal authority for filing

### 3. Statement of Facts
- Relevant factual background
- Timeline of events
- Supporting evidence

### 4. Legal Arguments
- Applicable law and precedents
- Legal reasoning
- Citations and references

### 5. Prayer for Relief
- Specific relief requested
- Alternative remedies
- Justification for relief

### 6. Conclusion
- Summary of request
- Respectful closing

---
*This template will be populated by specialized legal agents with case-specific content.*`;
  }

  private generateGeneralDocumentTemplate(): string {
    return `## Document Sections

### 1. Executive Summary
- Key points and objectives
- Main findings or recommendations

### 2. Background
- Context and background information
- Relevant history or precedents

### 3. Main Content
- Detailed information
- Analysis and discussion
- Supporting data

### 4. Recommendations
- Proposed actions
- Implementation steps
- Timeline considerations

### 5. Conclusion
- Summary of key points
- Final thoughts or next steps

---
*This template will be customized by agents based on the specific task requirements.*`;
  }

  /**
   * 📊 Public methods for monitoring and control
   */
  public onProgress(orchestrationId: string, callback: Function) {
    if (!this.progressCallbacks.has(orchestrationId)) {
      this.progressCallbacks.set(orchestrationId, []);
    }
    this.progressCallbacks.get(orchestrationId)!.push(callback);
  }

  public getActiveOrchestrations(): CanvasOrchestrationRequest[] {
    return Array.from(this.activeOrchestrations.values());
  }

  public async cancelOrchestration(orchestrationId: string): Promise<boolean> {
    const orchestration = this.activeOrchestrations.get(orchestrationId);
    if (orchestration) {
      this.activeOrchestrations.delete(orchestrationId);
      console.log(`🛑 Cancelled orchestration: ${orchestrationId}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const multiAgentCanvasOrchestrator = MultiAgentCanvasOrchestrator.getInstance();
