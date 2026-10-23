import { create } from 'zustand';

// Core stores
export * from './agentStore';
export * from './userStore';
export * from './themeStore';
export * from './sidebarStore';
export * from './aiStore';
export * from './taskStore';
export * from './calendarStore';
export * from './knowledgeBaseStore';
export * from './assistantStore';
export * from './notebookStore';
export * from './workflowStore';
export * from './legalStore';
export * from './auditStore';
export * from './uiStore';
export * from './projectStore';
export * from './attachedDriveStore';

interface Notification {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface GlobalStore {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

type SetState = (partial: Partial<GlobalStore> | ((state: GlobalStore) => Partial<GlobalStore>), replace?: boolean) => void;

export const useGlobalStore = create<GlobalStore>((set: SetState) => ({
  loading: false,
  setLoading: (loading: boolean) => set({ loading }),
  error: null,
  setError: (error: string | null) => set({ error }),
  notifications: [],
  addNotification: (notification: Omit<Notification, 'id'>) =>
    set((state: GlobalStore) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString() },
      ],
    })),
  removeNotification: (id: string) =>
    set((state: GlobalStore) => ({
      notifications: state.notifications.filter((n: Notification) => n.id !== id),
    })),
  theme: 'light',
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  isAuthenticated: false,
  setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
  isSidebarOpen: true,
  setSidebarOpen: (value: boolean) => set({ isSidebarOpen: value }),
}));