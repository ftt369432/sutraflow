import type { Task } from '../../types/task';
import type { AgentConfig } from '../../types/agents';
import type { ExecutionResult, ExecutionPlan } from '../../types/execution';
import { TaskManager } from './capabilities/taskManagement';
import { AgentExecutor } from './AgentExecutor';

interface TaskExecutionContext {
  task: Task;
  teamCapacity?: Record<string, any>;
  preferences?: Record<string, any>;
  constraints?: Record<string, any>;
}

export class TaskExecutor {
  private taskManager: TaskManager;
  private agentExecutor: AgentExecutor;
  private store: any; // Replace with your store type

  constructor(agentConfig: AgentConfig, store: any) {
    this.taskManager = new TaskManager();
    this.agentExecutor = new AgentExecutor(agentConfig, store);
    this.store = store;
  }

  async executeTask(context: TaskExecutionContext) {
    try {
      // 1. Analyze and enhance task
      const enhancedTask = await this.enhanceTask(context.task);

      // 2. Generate execution plan
      const executionPlan = await this.generateExecutionPlan(enhancedTask, context);

      // 3. Break down into subtasks if needed
      const subtasks = await this.taskManager.generateSubtasks(enhancedTask);

      // 4. Assign resources and schedule
      const assignments = await this.assignResources(subtasks, context.teamCapacity);

      // 5. Set up monitoring and alerts
      const monitoring = await this.setupMonitoring(enhancedTask, assignments);

      return {
        task: enhancedTask,
        executionPlan,
        subtasks,
        assignments,
        monitoring,
        status: 'ready',
      };
    } catch (error) {
      console.error('Task execution setup failed:', error);
      throw error;
    }
  }

  private async enhanceTask(task: Task) {
    // Enhance task with AI-generated insights
    const enhancedTask = {
      ...task,
      estimatedEffort: await this.taskManager.estimateEffort(task),
      suggestedDeadline: await this.taskManager.suggestDeadlines(task),
      priority: task.priority || await this.calculatePriority(task),
    };

    return enhancedTask;
  }

  private async generateExecutionPlan(task: Task, context: TaskExecutionContext) {
    const prompt = `
      Create a detailed execution plan for the following task:
      ${JSON.stringify(task)}

      Consider these constraints:
      ${JSON.stringify(context.constraints)}

      Include:
      1. Step-by-step breakdown
      2. Required resources
      3. Dependencies
      4. Risk mitigation
      5. Quality checks
    `;

    // Use agent executor to generate plan
    const plan = await this.agentExecutor.execute({
      agentId: 'task-planner',
      input: prompt,
      metadata: context
    });

    return plan;
  }

  private async assignResources(subtasks: Task[], teamCapacity?: Record<string, any>) {
    const assignments = await Promise.all(
      subtasks.map(async (subtask) => {
        const suggestedAssignees = await this.taskManager.suggestDelegation(
          subtask,
          teamCapacity
        );

        return {
          taskId: subtask.id,
          suggestedAssignees,
          estimatedEffort: subtask.estimatedEffort,
          startDate: new Date(), // This should be calculated based on dependencies
          endDate: subtask.deadline,
        };
      })
    );

    return assignments;
  }

  private async setupMonitoring(task: Task, assignments: any[]) {
    // Create monitoring checkpoints and alerts
    const checkpoints = assignments.map(assignment => ({
      taskId: assignment.taskId,
      checkpoints: [
        {
          type: 'start',
          date: assignment.startDate,
          criteria: 'Task started on time',
        },
        {
          type: 'progress',
          date: new Date(assignment.startDate.getTime() + 
            (assignment.endDate.getTime() - assignment.startDate.getTime()) / 2),
          criteria: '50% completion checkpoint',
        },
        {
          type: 'completion',
          date: assignment.endDate,
          criteria: 'Task completed with all requirements met',
        },
      ],
      alerts: {
        deadline: {
          threshold: 24, // hours before deadline
          message: 'Approaching deadline',
        },
        progress: {
          threshold: 0.2, // 20% behind schedule
          message: 'Task falling behind schedule',
        },
      },
    }));

    return {
      checkpoints,
      notifications: true,
      escalation: {
        threshold: 48, // hours of delay
        notifyManager: true,
      },
    };
  }

  private async calculatePriority(task: Task): Promise<'high' | 'medium' | 'low'> {
    const prompt = `
      Analyze this task and determine its priority level:
      ${JSON.stringify(task)}

      Consider:
      1. Business impact
      2. Time sensitivity
      3. Dependencies
      4. Resource requirements
    `;

    const result = await this.agentExecutor.execute({
      agentId: 'priority-analyzer',
      input: prompt,
    }) as ExecutionResult;

    return (result.output?.priority as 'high' | 'medium' | 'low') || 'medium';
  }
} 