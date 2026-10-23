import { useState, useEffect, useCallback } from 'react';
import { useSwarmStore } from '../stores/swarmStore';
import { 
  swarmOrchestrator, 
  SwarmExecutionContext, 
  SwarmTask, 
  AgentMessage 
} from '../services/swarm/SwarmOrchestrator';

export interface UseSwarmExecutionOptions {
  autoInitialize?: boolean;
  pollingInterval?: number;
}

export interface SwarmExecutionState {
  executionContext: SwarmExecutionContext | null;
  isInitializing: boolean;
  isExecuting: boolean;
  realtimeMessages: AgentMessage[];
  taskProgress: Record<string, number>;
  error: string | null;
}

export interface SwarmExecutionActions {
  initializeSwarm: (swarmId: string) => Promise<void>;
  distributeTask: (swarmId: string, task: Omit<SwarmTask, 'id' | 'createdAt' | 'status'>) => Promise<SwarmTask | null>;
  pauseSwarm: (swarmId: string) => Promise<void>;
  resumeSwarm: (swarmId: string) => Promise<void>;
  shutdownSwarm: (swarmId: string) => Promise<void>;
  clearError: () => void;
  getPerformanceMetrics: (swarmId: string) => Promise<SwarmExecutionContext['performance'] | null>;
}

/**
 * Custom hook for managing swarm execution operations
 * Provides real-time updates and simplified swarm control
 */
export const useSwarmExecution = (
  swarmId?: string, 
  options: UseSwarmExecutionOptions = {}
) => {
  const { autoInitialize = false, pollingInterval = 5000 } = options;
  const { swarms, updateSwarm } = useSwarmStore();

  // State management
  const [state, setState] = useState<SwarmExecutionState>({
    executionContext: null,
    isInitializing: false,
    isExecuting: false,
    realtimeMessages: [],
    taskProgress: {},
    error: null
  });

  // Get current swarm
  const currentSwarm = swarms.find(s => s.id === swarmId);

  // Initialize swarm for execution
  const initializeSwarm = useCallback(async (targetSwarmId: string) => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
      console.warn('🚀 Initializing swarm execution:', targetSwarmId);
      
      const context = await swarmOrchestrator.initializeSwarm(targetSwarmId);
      
      setState(prev => ({ 
        ...prev, 
        executionContext: context,
        isInitializing: false,
        isExecuting: true
      }));

      // Set up event listeners
      setupEventListeners();
      
    } catch (error) {
      console.error('Swarm initialization failed:', error);
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  }, []);

  // Distribute task to swarm
  const distributeTask = useCallback(async (
    targetSwarmId: string, 
    task: Omit<SwarmTask, 'id' | 'createdAt' | 'status'>
  ): Promise<SwarmTask | null> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      console.warn('📋 Distributing task to swarm:', { swarmId: targetSwarmId, task: task.title });
      
      const distributedTask = await swarmOrchestrator.distributeTask(targetSwarmId, task);
      
      // Update execution context
      setState(prev => ({
        ...prev,
        executionContext: prev.executionContext ? {
          ...prev.executionContext,
          currentTasks: [...prev.executionContext.currentTasks, distributedTask]
        } : null
      }));

      return distributedTask;
    } catch (error) {
      console.error('Task distribution failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Task distribution failed'
      }));
      return null;
    }
  }, []);

  // Pause swarm execution
  const pauseSwarm = useCallback(async (targetSwarmId: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await swarmOrchestrator.pauseSwarm(targetSwarmId);
      await updateSwarm(targetSwarmId, { status: 'paused' });
      
      setState(prev => ({ ...prev, isExecuting: false }));
    } catch (error) {
      console.error('Pause swarm failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Pause failed'
      }));
    }
  }, [updateSwarm]);

  // Resume swarm execution
  const resumeSwarm = useCallback(async (targetSwarmId: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await swarmOrchestrator.resumeSwarm(targetSwarmId);
      await updateSwarm(targetSwarmId, { status: 'active' });
      
      setState(prev => ({ ...prev, isExecuting: true }));
    } catch (error) {
      console.error('Resume swarm failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Resume failed'
      }));
    }
  }, [updateSwarm]);

  // Shutdown swarm execution
  const shutdownSwarm = useCallback(async (targetSwarmId: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await swarmOrchestrator.shutdownSwarm(targetSwarmId);
      await updateSwarm(targetSwarmId, { status: 'inactive' });
      
      setState(prev => ({ 
        ...prev, 
        executionContext: null,
        isExecuting: false,
        realtimeMessages: [],
        taskProgress: {}
      }));
    } catch (error) {
      console.error('Shutdown swarm failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Shutdown failed'
      }));
    }
  }, [updateSwarm]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(async (targetSwarmId: string) => {
    try {
      return await swarmOrchestrator.monitorPerformance(targetSwarmId);
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return null;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set up real-time event listeners
  const setupEventListeners = useCallback(() => {
    // Task distributed event
    swarmOrchestrator.on('task_distributed', (data: any) => {
      setState(prev => ({
        ...prev,
        executionContext: prev.executionContext ? {
          ...prev.executionContext,
          currentTasks: [...prev.executionContext.currentTasks, data.task]
        } : null
      }));
    });

    // Task progress update
    swarmOrchestrator.on('task_progress_updated', (data: any) => {
      setState(prev => ({
        ...prev,
        taskProgress: { ...prev.taskProgress, [data.taskId]: data.progress }
      }));
    });

    // Task completed
    swarmOrchestrator.on('task_completed', (data: any) => {
      setState(prev => ({
        ...prev,
        taskProgress: { ...prev.taskProgress, [data.taskId]: 100 },
        executionContext: prev.executionContext ? {
          ...prev.executionContext,
          performance: {
            ...prev.executionContext.performance,
            tasksCompleted: prev.executionContext.performance.tasksCompleted + 1
          }
        } : null
      }));
    });

    // Agent message received
    swarmOrchestrator.on('message_sent', (data: any) => {
      setState(prev => ({
        ...prev,
        realtimeMessages: [data.message, ...prev.realtimeMessages].slice(0, 100) // Keep last 100 messages
      }));
    });

    // Swarm initialized
    swarmOrchestrator.on('swarm_initialized', (data: any) => {
      setState(prev => ({
        ...prev,
        executionContext: data.context,
        isExecuting: true
      }));
    });

    // Swarm paused/resumed/shutdown
    swarmOrchestrator.on('swarm_paused', () => {
      setState(prev => ({ ...prev, isExecuting: false }));
    });

    swarmOrchestrator.on('swarm_resumed', () => {
      setState(prev => ({ ...prev, isExecuting: true }));
    });

    swarmOrchestrator.on('swarm_shutdown', () => {
      setState(prev => ({ 
        ...prev, 
        executionContext: null,
        isExecuting: false,
        realtimeMessages: [],
        taskProgress: {}
      }));
    });
  }, []);

  // Auto-initialize swarm if requested
  useEffect(() => {
    if (autoInitialize && swarmId && !state.executionContext && !state.isInitializing) {
      initializeSwarm(swarmId);
    }
  }, [autoInitialize, swarmId, state.executionContext, state.isInitializing, initializeSwarm]);

  // Polling for performance updates
  useEffect(() => {
    if (!state.isExecuting || !swarmId) return;

    const interval = setInterval(async () => {
      try {
        const metrics = await getPerformanceMetrics(swarmId);
        if (metrics) {
          setState(prev => ({
            ...prev,
            executionContext: prev.executionContext ? {
              ...prev.executionContext,
              performance: metrics
            } : null
          }));
        }
      } catch (error) {
        console.error('Failed to update performance metrics:', error);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [state.isExecuting, swarmId, pollingInterval, getPerformanceMetrics]);

  // Return hook interface
  return {
    // State
    ...state,
    currentSwarm,
    
    // Actions
    initializeSwarm,
    distributeTask,
    pauseSwarm,
    resumeSwarm,
    shutdownSwarm,
    clearError,
    getPerformanceMetrics,
    
    // Utility functions
    isSwarmActive: currentSwarm?.status === 'active',
    isSwarmPaused: currentSwarm?.status === 'paused',
    canExecute: !!state.executionContext && state.isExecuting,
    
    // Task helpers
    createDemoTask: (title: string, complexity: number = 5) => ({
      title,
      description: `Demo task: ${title}`,
      priority: 'medium' as const,
      complexity,
      requiredCapabilities: currentSwarm?.members.flatMap(m => m.capabilities || []).slice(0, 3) || [],
      assignedAgents: []
    })
  };
};

export default useSwarmExecution; 