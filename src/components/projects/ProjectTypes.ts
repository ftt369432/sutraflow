export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'online' | 'away' | 'offline';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignees: TeamMember[];
  dueDate?: string;
  tags: string[];
  attachments?: number;
  comments?: number;
  createdAt: string;
  hasAIRecommendations?: boolean;
}

export interface StickyNote {
  id: string;
  content: string;
  timestamp: number;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  teamMembers: TeamMember[];
  dueDate?: string;
  tasks: Task[];
  tags: string[];
  status: 'active' | 'completed' | 'on-hold' | 'archived';
  lastModified: string;
}
