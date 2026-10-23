export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  deadline?: Date;
  assignee?: string;
  tags?: string[];
  estimatedEffort?: number;
  actualEffort?: number;
  dependencies?: string[];
  subtasks?: Task[];
  progress?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export function prioritizeTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // Priority score calculation
    const getScore = (task: Task): number => {
      let score = 0;
      
      // Priority weight
      switch (task.priority) {
        case 'high': score += 100; break;
        case 'medium': score += 50; break;
        case 'low': score += 25; break;
      }
      
      // Deadline weight
      if (task.deadline) {
        const daysUntilDeadline = Math.ceil(
          (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        score += Math.max(0, 100 - daysUntilDeadline);
      }
      
      // Dependencies weight
      if (task.dependencies?.length) {
        score += task.dependencies.length * 10;
      }
      
      // Progress weight
      if (task.progress) {
        score -= task.progress;
      }
      
      return score;
    };
    
    return getScore(b) - getScore(a);
  });
}

export function calculateTaskMetrics(tasks: Task[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
  
  const totalEstimatedEffort = tasks.reduce((sum, t) => sum + (t.estimatedEffort || 0), 0);
  const totalActualEffort = tasks.reduce((sum, t) => sum + (t.actualEffort || 0), 0);
  
  const averageProgress = tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks;
  
  return {
    totalTasks,
    completedTasks,
    blockedTasks,
    highPriorityTasks,
    completionRate: (completedTasks / totalTasks) * 100,
    totalEstimatedEffort,
    totalActualEffort,
    averageProgress,
    efficiencyRate: totalEstimatedEffort ? (totalEstimatedEffort / totalActualEffort) * 100 : 100
  };
}