/**
 * 🎯 useMasterTaskRegistry Hook
 * 
 * React hook for interacting with the Master Task Registry.
 * Provides real-time task tracking across all orchestrators.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MasterTaskRegistry, 
  MasterTask, 
  MasterTaskStatus, 
  MasterTaskPriority,
  OrchestratorSource,
  TaskStatistics,
  TaskQueryFilters,
  BatchResult
} from '../services/MasterTaskRegistry';

interface UseMasterTaskRegistryOptions {
  userId?: string;
  autoFetch?: boolean;
  pageSize?: number;
  filters?: TaskQueryFilters;
  realTimeUpdates?: boolean;
}

interface UseMasterTaskRegistryReturn {
  // Data
  tasks: MasterTask[];
  stats: TaskStatistics | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  page: number;
  totalPages: number;
  totalTasks: number;
  setPage: (page: number) => void;
  
  // Actions
  createTask: (task: Partial<MasterTask>) => Promise<MasterTask | null>;
  createTasksBatch: (tasks: Partial<MasterTask>[], onProgress?: (completed: number, total: number) => void) => Promise<BatchResult>;
  updateTask: (taskId: string, updates: Partial<MasterTask>) => Promise<MasterTask | null>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, result?: any) => Promise<void>;
  failTask: (taskId: string, error: string) => Promise<void>;
  updateProgress: (taskId: string, progress: number) => Promise<void>;
  
  // Queries
  refreshTasks: () => Promise<void>;
  refreshStats: () => Promise<void>;
  searchTasks: (query: string) => Promise<MasterTask[]>;
}

export function useMasterTaskRegistry(
  options: UseMasterTaskRegistryOptions = {}
): UseMasterTaskRegistryReturn {
  const {
    userId,
    autoFetch = true,
    pageSize = 50,
    filters = {},
    realTimeUpdates = true
  } = options;
  
  // State
  const [tasks, setTasks] = useState<MasterTask[]>([]);
  const [stats, setStats] = useState<TaskStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  
  // Registry instance
  const registry = useRef(MasterTaskRegistry.getInstance());
  
  // Calculate total pages
  const totalPages = Math.ceil(totalTasks / pageSize);
  
  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryFilters: TaskQueryFilters = {
        ...filters,
        user_id: userId,
        limit: pageSize,
        offset: (page - 1) * pageSize
      };
      
      const result = await registry.current.getMasterLog(pageSize, (page - 1) * pageSize);
      setTasks(result.tasks);
      setTotalTasks(result.total);
      setStats(result.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [userId, page, pageSize, filters]);
  
  // Fetch stats only
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await registry.current.getStatistics(userId);
      setStats(newStats);
    } catch (err: any) {
      console.error('Failed to refresh stats:', err);
    }
  }, [userId]);
  
  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchTasks();
    }
  }, [fetchTasks, autoFetch]);
  
  // Real-time subscription
  useEffect(() => {
    if (!realTimeUpdates) return;
    
    const unsubscribe = registry.current.subscribe('hook', (task, event) => {
      if (event === 'INSERT') {
        setTasks(prev => [task, ...prev].slice(0, pageSize));
        setTotalTasks(prev => prev + 1);
      } else if (event === 'UPDATE') {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      } else if (event === 'DELETE') {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setTotalTasks(prev => Math.max(0, prev - 1));
      }
      
      // Refresh stats on any change
      refreshStats();
    });
    
    return unsubscribe;
  }, [realTimeUpdates, pageSize, refreshStats]);
  
  // Actions
  const createTask = useCallback(async (taskData: Partial<MasterTask>): Promise<MasterTask | null> => {
    try {
      const task = await registry.current.createTask({
        ...taskData,
        user_id: userId || taskData.user_id
      });
      return task;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [userId]);
  
  const createTasksBatch = useCallback(async (
    taskDataList: Partial<MasterTask>[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchResult> => {
    const tasksWithUserId = taskDataList.map(t => ({
      ...t,
      user_id: userId || t.user_id
    }));
    
    return registry.current.createTasksBatch(tasksWithUserId, onProgress);
  }, [userId]);
  
  const updateTask = useCallback(async (
    taskId: string, 
    updates: Partial<MasterTask>
  ): Promise<MasterTask | null> => {
    try {
      return await registry.current.updateTask(taskId, updates);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);
  
  const startTask = useCallback(async (taskId: string): Promise<void> => {
    await registry.current.startTask(taskId);
  }, []);
  
  const completeTask = useCallback(async (taskId: string, result?: any): Promise<void> => {
    await registry.current.completeTask(taskId, result);
  }, []);
  
  const failTask = useCallback(async (taskId: string, errorMsg: string): Promise<void> => {
    await registry.current.failTask(taskId, errorMsg);
  }, []);
  
  const updateProgress = useCallback(async (taskId: string, progress: number): Promise<void> => {
    await registry.current.updateProgress(taskId, progress);
  }, []);
  
  const searchTasks = useCallback(async (query: string): Promise<MasterTask[]> => {
    // For now, filter locally - could be enhanced with full-text search
    const allTasks = await registry.current.queryTasks({
      user_id: userId,
      limit: 1000
    });
    
    const lowerQuery = query.toLowerCase();
    return allTasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    );
  }, [userId]);
  
  return {
    // Data
    tasks,
    stats,
    loading,
    error,
    
    // Pagination
    page,
    totalPages,
    totalTasks,
    setPage,
    
    // Actions
    createTask,
    createTasksBatch,
    updateTask,
    startTask,
    completeTask,
    failTask,
    updateProgress,
    
    // Queries
    refreshTasks: fetchTasks,
    refreshStats,
    searchTasks
  };
}

// Re-export types for convenience
export { 
  MasterTask, 
  MasterTaskStatus, 
  MasterTaskPriority,
  OrchestratorSource,
  TaskStatistics,
  BatchResult
};
