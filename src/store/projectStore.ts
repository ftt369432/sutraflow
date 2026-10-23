import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Task, TeamMember } from '../components/projects/ProjectTypes';

const defaultTeamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Lead Attorney', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', role: 'admin', status: 'online' },
  { id: 'tm2', name: 'Hearing Representative', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor', role: 'member', status: 'online' },
  { id: 'tm3', name: 'Medical Records Specialist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', role: 'member', status: 'online' }
];

const initialDefaultProject: Project = {
  id: 'proj-default-1',
  name: 'Sovereign Case Operations',
  description: 'Primary legal and claims workflow workspace for case tracking, medical-legal ratings, and WCAB filings.',
  progress: 25,
  teamMembers: defaultTeamMembers,
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  tasks: [
    {
      id: 'task-init-1',
      title: 'Audit Medical Records & Formulate QME Chronology',
      description: 'Review primary treating physician PR-4 reports and verify statutory rating grounds.',
      status: 'in-progress',
      priority: 'high',
      assignees: [defaultTeamMembers[0]],
      tags: ['medical', 'qme'],
      attachments: 2,
      comments: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-init-2',
      title: 'Draft LC § 5814 Penalty Petition',
      description: 'Calculate statutory 25% penalties on delayed medical mileage vouchers.',
      status: 'todo',
      priority: 'urgent',
      assignees: [defaultTeamMembers[1]],
      tags: ['penalties', 'wcab'],
      createdAt: new Date().toISOString()
    }
  ],
  tags: ['operations', 'litigation'],
  status: 'active',
  lastModified: new Date().toISOString()
};

export interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  teamMembers: TeamMember[];
  
  // Actions
  addProject: (project: Omit<Project, 'id' | 'lastModified'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  addTask: (projectId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  moveTask: (projectId: string, taskId: string, newStatus: Task['status']) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [initialDefaultProject],
      selectedProjectId: initialDefaultProject.id,
      teamMembers: defaultTeamMembers,

      addProject: (projectData) => {
        const id = `proj-${Date.now()}`;
        const newProject: Project = {
          ...projectData,
          id,
          lastModified: new Date().toISOString()
        };
        set((state) => ({
          projects: [newProject, ...state.projects],
          selectedProjectId: id
        }));
        return newProject;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, lastModified: new Date().toISOString() } : p
          )
        }));
      },

      deleteProject: (id) => {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id);
          return {
            projects: remaining,
            selectedProjectId: state.selectedProjectId === id ? (remaining[0]?.id || null) : state.selectedProjectId
          };
        });
      },

      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      addTask: (projectId, taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: [...p.tasks, newTask],
              lastModified: new Date().toISOString()
            };
          })
        }));
      },

      updateTask: (projectId, taskId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
              lastModified: new Date().toISOString()
            };
          })
        }));
      },

      deleteTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
              lastModified: new Date().toISOString()
            };
          })
        }));
      },

      moveTask: (projectId, taskId, newStatus) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
              lastModified: new Date().toISOString()
            };
          })
        }));
      }
    }),
    {
      name: 'genieflow_projects'
    }
  )
);
