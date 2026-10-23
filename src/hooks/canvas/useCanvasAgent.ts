/**
 * useCanvasAgent - AI Agent Management Hook
 * 
 * Manages AI agents within the canvas system, including creation,
 * task assignment, and agent interactions.
 */

import { useCallback, useMemo } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { AgentSpecialization } from '../../types/canvas';
import { toast } from 'sonner';

export function useCanvasAgent(agentId?: string) {
  const {
    agents,
    createAgent,
    removeAgent,
    updateAgent,
    getAgent,
    tasks,
    createTask,
    updateTask,
    getAgentTasks,
  } = useCanvasStore();

  // Get agent data
  const agent = useMemo(() => {
    return agentId ? getAgent(agentId) : null;
  }, [agentId, getAgent, agents]);

  // Get agent tasks
  const agentTasks = useMemo(() => {
    return agentId ? getAgentTasks(agentId) : [];
  }, [agentId, getAgentTasks, tasks]);

  // Create new agent
  const createNewAgent = useCallback((
    documentId: string,
    specialization: AgentSpecialization,
    name?: string
  ) => {
    try {
      const newAgentId = createAgent(documentId, specialization);
      
      if (name && newAgentId) {
        updateAgent(newAgentId, { name });
      }
      
      toast.success(`Created ${specialization} agent`);
      return newAgentId;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
      return null;
    }
  }, [createAgent, updateAgent]);

  // Remove agent
  const deleteAgent = useCallback(() => {
    if (!agentId) return false;

    try {
      removeAgent(agentId);
      toast.success('Agent removed');
      return true;
    } catch (error) {
      console.error('Error removing agent:', error);
      toast.error('Failed to remove agent');
      return false;
    }
  }, [agentId, removeAgent]);

  // Update agent configuration
  const updateConfiguration = useCallback((updates: any) => {
    if (!agentId) return;

    updateAgent(agentId, updates);
  }, [agentId, updateAgent]);

  // Assign task to agent
  const assignTask = useCallback((
    type: string,
    description: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!agentId) return null;

    try {
      const taskId = createTask(agentId, type, description);
      
      if (taskId) {
        updateTask(taskId, { priority });
        toast.success('Task assigned to agent');
      }
      
      return taskId;
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
      return null;
    }
  }, [agentId, createTask, updateTask]);

  // Get agent specialization info
  const getSpecializationInfo = useCallback((spec: AgentSpecialization) => {
    const specializations = {
      research: {
        name: 'Research Agent',
        description: 'Conducts research and gathers information',
        capabilities: ['web search', 'fact checking', 'source validation'],
        icon: 'search',
      },
      writing: {
        name: 'Writing Agent',
        description: 'Assists with content creation and editing',
        capabilities: ['content generation', 'grammar check', 'style improvement'],
        icon: 'edit',
      },
      formatting: {
        name: 'Formatting Agent',
        description: 'Handles document structure and formatting',
        capabilities: ['layout design', 'style consistency', 'typography'],
        icon: 'layout',
      },
      legal_review: {
        name: 'Legal Review Agent',
        description: 'Reviews content for legal compliance',
        capabilities: ['contract review', 'compliance check', 'risk assessment'],
        icon: 'shield',
      },
      fact_check: {
        name: 'Fact Check Agent',
        description: 'Verifies facts and claims',
        capabilities: ['source verification', 'accuracy check', 'cross-referencing'],
        icon: 'check-circle',
      },
      citation: {
        name: 'Citation Agent',
        description: 'Manages references and citations',
        capabilities: ['bibliography generation', 'citation formatting', 'source tracking'],
        icon: 'quote',
      },
      compliance: {
        name: 'Compliance Agent',
        description: 'Ensures regulatory compliance',
        capabilities: ['regulation check', 'policy validation', 'audit preparation'],
        icon: 'clipboard-check',
      },
      financial_analysis: {
        name: 'Financial Analysis Agent',
        description: 'Analyzes financial data and projections',
        capabilities: ['data analysis', 'forecasting', 'report generation'],
        icon: 'trending-up',
      },
    };

    return specializations[spec] || null;
  }, []);

  // Get agent status
  const getAgentStatus = useCallback(() => {
    if (!agent) return 'inactive';

    const activeTasks = agentTasks.filter(task => task.status === 'in_progress').length;
    const completedTasks = agentTasks.filter(task => task.status === 'completed').length;

    if (activeTasks > 0) return 'working';
    if (completedTasks > 0) return 'available';
    return 'idle';
  }, [agent, agentTasks]);

  // Get agent performance metrics
  const getPerformanceMetrics = useCallback(() => {
    if (!agent) return null;

    const totalTasks = agentTasks.length;
    const completedTasks = agentTasks.filter(task => task.status === 'completed').length;
    const failedTasks = agentTasks.filter(task => task.status === 'failed').length;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      successRate,
      averageCompletionTime: 0, // Would need to calculate from task data
    };
  }, [agent, agentTasks]);

  return {
    // Agent data
    agent,
    agentTasks,
    
    // Actions
    createAgent: createNewAgent,
    deleteAgent,
    updateConfiguration,
    assignTask,
    
    // Utilities
    getSpecializationInfo,
    getAgentStatus,
    getPerformanceMetrics,
    
    // Computed
    exists: !!agent,
    isActive: getAgentStatus() === 'working',
    hasActiveTasks: agentTasks.some(task => task.status === 'in_progress'),
    taskCount: agentTasks.length,
  };
}
