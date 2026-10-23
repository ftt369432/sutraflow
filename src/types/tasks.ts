export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  assignee?: string;
  tags: string[];
  assignedAssistants?: string[];
  source?: {
    type: 'notebook' | 'email' | 'chat' | 'manual';
    id: string;
    blockId?: string;
  };
}

export interface TaskList {
  id: string;
  title: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  sharedWith?: string[];
  isDefault?: boolean;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  assignee?: string[];
  tags?: string[];
  search?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  dueSoon: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface TaskProject {
  id: string;
  title: string;
  description: string;
  taskLists: TaskList[];
  members: string[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  status: 'active' | 'archived' | 'completed';
  dueDate?: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface TaskActivity {
  id: string;
  taskId: string;
  type: 'status_change' | 'priority_change' | 'assignee_change' | 'comment' | 'due_date_change' | 'description_change';
  author: string;
  createdAt: Date;
  before?: unknown;
  after?: unknown;
}

export interface TaskIntegration {
  source: 'calendar' | 'email' | 'chat' | 'notebook' | 'project';
  sourceId: string;
  taskId: string;
  bidirectional: boolean;
  lastSynced: Date;
}

export interface TaskTemplateItem {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueInDays?: number;
  assigneePlaceholder?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  tasks: TaskTemplateItem[];
  createdAt: Date;
  updatedAt: Date;
  creator: string;
  category: 'business' | 'personal' | 'education' | 'project' | 'custom';
}