import { Swarm, SwarmMember, useSwarmStore } from '../../stores/swarmStore';

// Types for real-time swarm execution
export interface SwarmTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: number; // 1-10 scale
  requiredCapabilities: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAgents: string[]; // Member IDs
  createdAt: Date;
  deadline?: Date;
  dependencies?: string[]; // Other task IDs this depends on
  progress?: number; // 0-100
  result?: any;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // If undefined, broadcast to all
  swarmId: string;
  type: 'task_assignment' | 'progress_update' | 'result_share' | 'help_request' | 'coordination';
  content: any;
  timestamp: Date;
}

export interface SwarmExecutionContext {
  swarmId: string;
  currentTasks: SwarmTask[];
  activeMessages: AgentMessage[];
  performance: {
    tasksCompleted: number;
    averageCompletionTime: number;
    successRate: number;
    efficiency: number;
  };
}

/**
 * SwarmOrchestrator - Core service for real-time swarm coordination
 * Handles task distribution, agent communication, and performance monitoring
 */
export class SwarmOrchestrator {
  private swarmContexts: Map<string, SwarmExecutionContext> = new Map();
  private messageQueue: AgentMessage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * Initialize a swarm for real-time execution
   */
  async initializeSwarm(swarmId: string): Promise<SwarmExecutionContext> {
    console.warn('🚀 Initializing swarm for real-time execution:', swarmId);
    
    try {
      // Get swarm data from store
      const { swarms } = useSwarmStore.getState();
      const swarm = swarms.find(s => s.id === swarmId);
      
      if (!swarm) {
        throw new Error(`Swarm ${swarmId} not found`);
      }

      // Create execution context
      const context: SwarmExecutionContext = {
        swarmId,
        currentTasks: [],
        activeMessages: [],
        performance: {
          tasksCompleted: 0,
          averageCompletionTime: 0,
          successRate: 100,
          efficiency: 0
        }
      };

      this.swarmContexts.set(swarmId, context);
      
      // Initialize agents
      await this.activateSwarmMembers(swarm);
      
      // Set up real-time communication
      this.setupRealtimeListeners(swarmId);

      this.emit('swarm_initialized', { swarmId, context });
      
      return context;
    } catch (error) {
      console.error('Failed to initialize swarm:', error);
      throw error;
    }
  }

  /**
   * Distribute a complex task to appropriate agents
   */
  async distributeTask(swarmId: string, task: Omit<SwarmTask, 'id' | 'createdAt' | 'status'>): Promise<SwarmTask> {
    console.warn('📋 Distributing task to swarm:', { swarmId, task: task.title });
    
    const context = this.swarmContexts.get(swarmId);
    if (!context) {
      throw new Error(`Swarm ${swarmId} not initialized`);
    }

    // Create full task object
    const fullTask: SwarmTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      status: 'pending',
      assignedAgents: [],
      progress: 0
    };

    // Find optimal agents for this task
    const optimalAgents = await this.findOptimalAgents(swarmId, fullTask);
    fullTask.assignedAgents = optimalAgents.map(agent => agent.id);
    fullTask.status = 'assigned';

    // Add to context
    context.currentTasks.push(fullTask);

    // Send assignment messages to agents
    for (const agent of optimalAgents) {
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fromAgentId: 'orchestrator',
        toAgentId: agent.id,
        swarmId,
        type: 'task_assignment',
        content: {
          taskId: fullTask.id,
          task: fullTask,
          role: agent.role,
          expectedDuration: this.estimateTaskDuration(fullTask, agent)
        },
        timestamp: new Date()
      };
      
      await this.sendMessage(message);
    }

    // Update swarm status
    await this.updateSwarmStatus(swarmId, 'active');
    
    this.emit('task_distributed', { swarmId, task: fullTask, agents: optimalAgents });
    
    return fullTask;
  }

  /**
   * Handle incoming agent messages and coordinate responses
   */
  async handleAgentMessage(message: AgentMessage): Promise<void> {
    console.warn('📨 Processing agent message:', { 
      type: message.type, 
      from: message.fromAgentId,
      to: message.toAgentId 
    });

    const context = this.swarmContexts.get(message.swarmId);
    if (!context) {
      console.error('Message for uninitialized swarm:', message.swarmId);
      return;
    }

    context.activeMessages.push(message);

    switch (message.type) {
      case 'progress_update':
        await this.handleProgressUpdate(message);
        break;
      case 'result_share':
        await this.handleResultShare(message);
        break;
      case 'help_request':
        await this.handleHelpRequest(message);
        break;
      case 'coordination':
        await this.handleCoordinationMessage(message);
        break;
    }

    this.emit('message_processed', { message, swarmId: message.swarmId });
  }

  /**
   * Monitor swarm performance and optimize
   */
  async monitorPerformance(swarmId: string): Promise<SwarmExecutionContext['performance']> {
    const context = this.swarmContexts.get(swarmId);
    if (!context) {
      throw new Error(`Swarm ${swarmId} not initialized`);
    }

    // Calculate performance metrics
    const completedTasks = context.currentTasks.filter(t => t.status === 'completed');
    const totalTasks = context.currentTasks.length;
    
    const averageCompletionTime = completedTasks.reduce((acc, task) => {
      const duration = new Date().getTime() - task.createdAt.getTime();
      return acc + duration;
    }, 0) / (completedTasks.length || 1);

    const successRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 100;
    
    // Calculate efficiency based on parallel vs sequential execution
    const efficiency = this.calculateSwarmEfficiency(context);

    context.performance = {
      tasksCompleted: completedTasks.length,
      averageCompletionTime: averageCompletionTime / 1000 / 60, // Convert to minutes
      successRate,
      efficiency
    };

    return context.performance;
  }

  /**
   * Get real-time swarm status
   */
  getSwarmStatus(swarmId: string): SwarmExecutionContext | null {
    return this.swarmContexts.get(swarmId) || null;
  }

  /**
   * Pause swarm execution
   */
  async pauseSwarm(swarmId: string): Promise<void> {
    console.warn('⏸️ Pausing swarm execution:', swarmId);
    
    const context = this.swarmContexts.get(swarmId);
    if (!context) return;

    // Send pause messages to all active agents
    const { swarms } = useSwarmStore.getState();
    const swarm = swarms.find(s => s.id === swarmId);
    
    if (swarm) {
      for (const member of swarm.members) {
        const pauseMessage: AgentMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          fromAgentId: 'orchestrator',
          toAgentId: member.id,
          swarmId,
          type: 'coordination',
          content: { action: 'pause' },
          timestamp: new Date()
        };
        
        await this.sendMessage(pauseMessage);
      }
    }

    await this.updateSwarmStatus(swarmId, 'paused');
    this.emit('swarm_paused', { swarmId });
  }

  /**
   * Resume swarm execution
   */
  async resumeSwarm(swarmId: string): Promise<void> {
    console.warn('▶️ Resuming swarm execution:', swarmId);
    
    const context = this.swarmContexts.get(swarmId);
    if (!context) return;

    // Send resume messages to all agents
    const { swarms } = useSwarmStore.getState();
    const swarm = swarms.find(s => s.id === swarmId);
    
    if (swarm) {
      for (const member of swarm.members) {
        const resumeMessage: AgentMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          fromAgentId: 'orchestrator',
          toAgentId: member.id,
          swarmId,
          type: 'coordination',
          content: { action: 'resume' },
          timestamp: new Date()
        };
        
        await this.sendMessage(resumeMessage);
      }
    }

    await this.updateSwarmStatus(swarmId, 'active');
    this.emit('swarm_resumed', { swarmId });
  }

  /**
   * Shutdown swarm execution
   */
  async shutdownSwarm(swarmId: string): Promise<void> {
    console.warn('🛑 Shutting down swarm:', swarmId);
    
    const context = this.swarmContexts.get(swarmId);
    if (!context) return;

    // Complete any pending tasks
    const pendingTasks = context.currentTasks.filter(t => 
      t.status === 'in_progress' || t.status === 'assigned'
    );
    
    for (const task of pendingTasks) {
      task.status = 'failed';
    }

    // Send shutdown messages to all agents
    const { swarms } = useSwarmStore.getState();
    const swarm = swarms.find(s => s.id === swarmId);
    
    if (swarm) {
      for (const member of swarm.members) {
        const shutdownMessage: AgentMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          fromAgentId: 'orchestrator',
          toAgentId: member.id,
          swarmId,
          type: 'coordination',
          content: { action: 'shutdown' },
          timestamp: new Date()
        };
        
        await this.sendMessage(shutdownMessage);
      }
    }

    // Clean up
    this.swarmContexts.delete(swarmId);
    await this.updateSwarmStatus(swarmId, 'inactive');
    
    this.emit('swarm_shutdown', { swarmId });
  }

  // Private helper methods

  private async activateSwarmMembers(swarm: Swarm): Promise<void> {
    const { updateMemberInSwarm } = useSwarmStore.getState();
    
    for (const member of swarm.members) {
      updateMemberInSwarm(swarm.id, member.id, { 
        status: 'active',
        lastUpdate: new Date().toISOString()
      });
    }
  }

  private async findOptimalAgents(swarmId: string, task: SwarmTask): Promise<SwarmMember[]> {
    const { swarms } = useSwarmStore.getState();
    const swarm = swarms.find(s => s.id === swarmId);
    
    if (!swarm) return [];

        // Find agents with required capabilities
    const suitableAgents = swarm.members.filter(member => {
      return task.requiredCapabilities.some(capability =>
        member.capabilities?.includes(capability as any)
      );
    });

    // Sort by performance and availability
    return suitableAgents
      .filter(agent => agent.status === 'active' || agent.status === 'idle')
      .sort((a, b) => (b.performance || 0) - (a.performance || 0))
      .slice(0, Math.min(3, suitableAgents.length)); // Max 3 agents per task
  }

  private estimateTaskDuration(task: SwarmTask, agent: SwarmMember): number {
    // Base duration from task complexity
    let baseDuration = task.complexity * 10; // minutes
    
    // Adjust based on agent performance
    const performanceMultiplier = 1 / Math.max(agent.performance || 1, 0.1);
    
    return Math.round(baseDuration * performanceMultiplier);
  }

  private async sendMessage(message: AgentMessage): Promise<void> {
    // In production, this would use WebSockets or Server-Sent Events
    // For now, we'll use the message queue and emit events
    this.messageQueue.push(message);
    
    // Simulate sending to agent
    setTimeout(() => {
      this.emit('message_sent', { message });
    }, 100);
  }

  private async handleProgressUpdate(message: AgentMessage): Promise<void> {
    const context = this.swarmContexts.get(message.swarmId);
    if (!context) return;

    const { taskId, progress, status } = message.content;
    const task = context.currentTasks.find(t => t.id === taskId);
    
    if (task) {
      task.progress = progress;
      if (status) task.status = status;
      
      this.emit('task_progress_updated', { 
        swarmId: message.swarmId, 
        taskId, 
        progress, 
        status 
      });
    }
  }

  private async handleResultShare(message: AgentMessage): Promise<void> {
    const context = this.swarmContexts.get(message.swarmId);
    if (!context) return;

    const { taskId, result } = message.content;
    const task = context.currentTasks.find(t => t.id === taskId);
    
    if (task) {
      task.result = result;
      task.status = 'completed';
      task.progress = 100;
      
      // Update performance metrics
      context.performance.tasksCompleted++;
      
      this.emit('task_completed', { 
        swarmId: message.swarmId, 
        taskId, 
        result 
      });
    }
  }

  private async handleHelpRequest(message: AgentMessage): Promise<void> {
    const { issue, requiredCapabilities } = message.content;
    
    // Find agents who can help
    const { swarms } = useSwarmStore.getState();
    const swarm = swarms.find(s => s.id === message.swarmId);
    
    if (swarm) {
            const helpfulAgents = swarm.members.filter(member =>
        member.id !== message.fromAgentId &&
        requiredCapabilities.some((cap: string) => member.capabilities?.includes(cap as any))
      );

      // Send help coordination message
      for (const agent of helpfulAgents) {
        const helpMessage: AgentMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          fromAgentId: 'orchestrator',
          toAgentId: agent.id,
          swarmId: message.swarmId,
          type: 'coordination',
          content: {
            action: 'provide_help',
            requestingAgent: message.fromAgentId,
            issue
          },
          timestamp: new Date()
        };
        
        await this.sendMessage(helpMessage);
      }
    }
  }

  private async handleCoordinationMessage(message: AgentMessage): Promise<void> {
    // Handle inter-agent coordination
    this.emit('coordination_message', { message });
  }

  private calculateSwarmEfficiency(context: SwarmExecutionContext): number {
    // Calculate efficiency based on parallel task execution
    const activeTasks = context.currentTasks.filter(t => 
      t.status === 'in_progress' || t.status === 'assigned'
    );
    
    const totalAgents = this.getSwarmSize(context.swarmId);
    const utilizedAgents = new Set(activeTasks.flatMap(t => t.assignedAgents)).size;
    
    return totalAgents > 0 ? (utilizedAgents / totalAgents) * 100 : 0;
  }

  private getSwarmSize(swarmId: string): number {
    const { swarms } = useSwarmStore.getState();
    const swarm = swarms.find(s => s.id === swarmId);
    return swarm?.members.length || 0;
  }

  private setupRealtimeListeners(swarmId: string): void {
    // In production, this would set up WebSocket listeners
    // For now, we'll use a polling mechanism
    console.warn('📡 Setting up real-time listeners for swarm:', swarmId);
  }

  private async updateSwarmStatus(swarmId: string, status: Swarm['status']): Promise<void> {
    const { updateSwarm } = useSwarmStore.getState();
    await updateSwarm(swarmId, { status });
  }

  // Event system for real-time updates
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const swarmOrchestrator = new SwarmOrchestrator(); 