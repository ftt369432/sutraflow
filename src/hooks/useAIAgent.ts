import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'productivity' | 'learning' | 'research' | 'automation';
  status: 'active' | 'paused' | 'completed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: AgentTask[];
  insights: AgentInsight[];
  settings: {
    autoStart: boolean;
    priority: 'low' | 'medium' | 'high';
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time?: string;
      days?: string[];
    };
  };
}

interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface AgentInsight {
  id: string;
  type: 'improvement' | 'warning' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  metrics?: {
    before: number;
    after: number;
    unit: string;
  };
}

interface UseAIAgentProps {
  onError?: (error: Error) => void;
  onTaskComplete?: (task: AgentTask) => void;
  onInsightGenerated?: (insight: AgentInsight) => void;
}

export function useAIAgent({
  onError,
  onTaskComplete,
  onInsightGenerated
}: UseAIAgentProps = {}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load agents from local storage on mount
    const savedAgents = localStorage.getItem('ai_agents');
    if (savedAgents) {
      try {
        const parsed = JSON.parse(savedAgents);
        setAgents(parsed.map((agent: any) => ({
          ...agent,
          createdAt: new Date(agent.createdAt),
          updatedAt: new Date(agent.updatedAt),
          tasks: agent.tasks.map((task: any) => ({
            ...task,
            startTime: task.startTime ? new Date(task.startTime) : undefined,
            endTime: task.endTime ? new Date(task.endTime) : undefined
          })),
          insights: agent.insights.map((insight: any) => ({
            ...insight,
            timestamp: new Date(insight.timestamp)
          }))
        })));
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save agents to local storage when they change
    localStorage.setItem('ai_agents', JSON.stringify(agents));
  }, [agents]);

  const createAgent = (name: string, type: Agent['type'], description?: string) => {
    const newAgent: Agent = {
      id: uuidv4(),
      name,
      description: description || `AI agent for ${type} optimization`,
      type,
      status: 'paused',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
      insights: [],
      settings: {
        autoStart: true,
        priority: 'medium'
      }
    };

    setAgents(prev => [newAgent, ...prev]);
    return newAgent;
  };

  const updateAgent = (agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          ...updates,
          updatedAt: new Date()
        };
      }
      return agent;
    }));
  };

  const deleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const addTask = async (agentId: string, task: Omit<AgentTask, 'id' | 'status' | 'progress' | 'startTime' | 'endTime'>) => {
    const newTask: AgentTask = {
      id: uuidv4(),
      ...task,
      status: 'pending',
      progress: 0
    };

    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          tasks: [...agent.tasks, newTask],
          updatedAt: new Date()
        };
      }
      return agent;
    }));

    return newTask;
  };

  const updateTask = (agentId: string, taskId: string, updates: Partial<AgentTask>) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          tasks: agent.tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                ...updates,
                endTime: updates.status === 'completed' || updates.status === 'failed' ? new Date() : task.endTime
              };
            }
            return task;
          }),
          updatedAt: new Date()
        };
      }
      return agent;
    }));
  };

  const addInsight = (agentId: string, insight: Omit<AgentInsight, 'id' | 'timestamp'>) => {
    const newInsight: AgentInsight = {
      id: uuidv4(),
      ...insight,
      timestamp: new Date()
    };

    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          insights: [...agent.insights, newInsight],
          updatedAt: new Date()
        };
      }
      return agent;
    }));

    onInsightGenerated?.(newInsight);
    return newInsight;
  };

  const startAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setIsProcessing(true);
    updateAgent(agentId, { status: 'active' });

    try {
      // Process pending tasks
      for (const task of agent.tasks.filter(t => t.status === 'pending')) {
        updateTask(agentId, task.id, { status: 'in_progress', startTime: new Date() });

        try {
          // Simulate task processing
          await new Promise(resolve => setTimeout(resolve, 2000));

          updateTask(agentId, task.id, { status: 'completed', progress: 100 });
          onTaskComplete?.(task);

          // Generate insight based on completed task
          addInsight(agentId, {
            type: 'improvement',
            title: `Completed: ${task.title}`,
            description: 'Task completed successfully',
            impact: 'medium'
          });
        } catch (error) {
          updateTask(agentId, task.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          onError?.(error instanceof Error ? error : new Error('Unknown error'));
        }
      }

      // Update agent progress
      const completedTasks = agent.tasks.filter(t => t.status === 'completed').length;
      const totalTasks = agent.tasks.length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      updateAgent(agentId, {
        progress,
        status: progress === 100 ? 'completed' : 'active'
      });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
      updateAgent(agentId, { status: 'paused' });
    } finally {
      setIsProcessing(false);
    }
  };

  const pauseAgent = (agentId: string) => {
    updateAgent(agentId, { status: 'paused' });
  };

  const updateAgentSettings = (agentId: string, settings: Partial<Agent['settings']>) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return {
          ...agent,
          settings: { ...agent.settings, ...settings },
          updatedAt: new Date()
        };
      }
      return agent;
    }));
  };

  return {
    agents,
    isProcessing,
    createAgent,
    updateAgent,
    deleteAgent,
    addTask,
    updateTask,
    addInsight,
    startAgent,
    pauseAgent,
    updateAgentSettings
  };
} 