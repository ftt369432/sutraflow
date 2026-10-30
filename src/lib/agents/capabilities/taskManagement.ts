import type { Capability, CapabilityContext } from '../../../types/capabilities';
import { prioritizeTasks, type Task } from '../../../utils/taskUtils';

export interface TaskManagementCapability extends Capability {
  prioritizeTasks: (tasks: Task[]) => Promise<Task[]>;
  suggestDeadlines: (task: Task) => Promise<Date>;
  estimateEffort: (task: Task) => Promise<number>;
  generateSubtasks: (task: Task) => Promise<Task[]>;
  suggestDelegation: (task: Task, teamCapacity: any) => Promise<string[]>;
}

export class TaskManager implements TaskManagementCapability {
  id = 'task-management';
  name = 'Task Management';
  description = 'Intelligent task organization and automation';

  async preprocess(input: any) {
    if (Array.isArray(input)) {
      return input.map(task => ({
        ...task,
        priority: task.priority || 'medium',
        status: task.status || 'pending'
      }));
    }
    return input;
  }

  async execute(input: Task[], context: CapabilityContext) {
    const prioritizedTasks = await this.prioritizeTasks(input);
    const enhancedTasks = await Promise.all(
      prioritizedTasks.map(async task => ({
        ...task,
        suggestedDeadline: await this.suggestDeadlines(task),
        estimatedEffort: await this.estimateEffort(task),
        subtasks: await this.generateSubtasks(task),
        suggestedAssignees: await this.suggestDelegation(task, context.metadata?.teamCapacity)
      }))
    );

    return {
      tasks: enhancedTasks,
      summary: await this.generateTaskSummary(enhancedTasks),
      recommendations: await this.generateRecommendations(enhancedTasks)
    };
  }

  async prioritizeTasks(tasks: Task[]): Promise<Task[]> {
    const prompt = `
      Analyze the following tasks and prioritize them based on:
      1. Urgency (deadline proximity)
      2. Importance (business impact)
      3. Dependencies
      4. Resource availability
      
      Tasks: ${JSON.stringify(tasks)}
      
      Provide a prioritized list with justification for each priority level.
    `;

    // Here we would call the LLM with the prompt
    return tasks.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  }

  async suggestDeadlines(task: Task): Promise<Date> {
    // Implement deadline suggestion logic using LLM
    const baseDate = new Date();
    return new Date(baseDate.setDate(baseDate.getDate() + 7));
  }

  async estimateEffort(task: Task): Promise<number> {
    // Implement effort estimation in hours using LLM
    return Math.floor(Math.random() * 8) + 1; // Placeholder
  }

  async generateSubtasks(task: Task): Promise<Task[]> {
    const prompt = `
      Break down the following task into smaller, manageable subtasks:
      Task: ${task.title}
      Description: ${task.description}
      
      Generate a list of subtasks that:
      1. Are specific and actionable
      2. Can be completed in 2-4 hours each
      3. Have clear completion criteria
      4. Are logically sequenced
    `;

    // Here we would call the LLM with the prompt
    return []; // Placeholder
  }

  async suggestDelegation(task: Task, teamCapacity: any): Promise<string[]> {
    const prompt = `
      Suggest team members to handle this task based on:
      1. Required skills
      2. Current workload
      3. Past performance on similar tasks
      4. Availability
      
      Task: ${JSON.stringify(task)}
      Team Capacity: ${JSON.stringify(teamCapacity)}
    `;

    // Here we would call the LLM with the prompt
    return []; // Placeholder
  }

  private async generateTaskSummary(tasks: Task[]): Promise<string> {
    const totalTasks = tasks.length;
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const totalEffort = tasks.reduce((sum, t) => sum + (t.estimatedEffort || 0), 0);

    return `
      Total Tasks: ${totalTasks}
      High Priority: ${highPriority}
      Total Estimated Effort: ${totalEffort} hours
    `;
  }

  private async generateRecommendations(tasks: Task[]): Promise<string[]> {
    const prompt = `
      Analyze the following task set and provide strategic recommendations for:
      1. Resource allocation
      2. Risk mitigation
      3. Efficiency improvements
      4. Workload balancing
      
      Tasks: ${JSON.stringify(tasks)}
    `;

    // Here we would call the LLM with the prompt
    return [
      "Consider parallel execution of non-dependent tasks",
      "Allocate additional resources to high-priority items",
      "Schedule regular check-ins for complex tasks"
    ];
  }
} 