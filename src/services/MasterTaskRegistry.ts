/**
 * 🎯 MASTER TASK REGISTRY - Centralized Task Tracking for 10,000+ Tasks
 * 
 * This is the SINGLE SOURCE OF TRUTH for all tasks across all orchestrators.
 * 
 * Features:
 * ✅ Database persistence (survives page refresh)
 * ✅ Batch processing (handles 10K+ tasks efficiently)
 * ✅ Real-time sync (Supabase realtime subscriptions)
 * ✅ Master log view (see ALL tasks from ALL orchestrators)
 * ✅ Chunked operations (prevents browser freeze)
 * ✅ Memory-efficient (offloads to DB, keeps only active in memory)
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

// 🎯 Task Status (unified across all orchestrators)
export enum MasterTaskStatus {
  QUEUED = 'queued',           // In queue waiting to start
  PENDING = 'pending',         // Ready to execute
  ANALYZING = 'analyzing',     // Being analyzed by AI
  IN_PROGRESS = 'in_progress', // Currently executing
  WAITING = 'waiting',         // Waiting for dependency
  PAUSED = 'paused',           // User paused
  COMPLETED = 'completed',     // Successfully finished
  FAILED = 'failed',           // Execution failed
  CANCELLED = 'cancelled',     // User cancelled
  ARCHIVED = 'archived'        // Completed and archived
}

// 🎯 Task Priority
export enum MasterTaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

// 🎯 Orchestrator Source - which system created the task
export enum OrchestratorSource {
  AI_AGENT = 'ai_agent_orchestrator',
  CANVAS = 'canvas_orchestrator',
  MULTI_CANVAS = 'multi_canvas_orchestrator',
  WORKFLOW = 'workflow_orchestrator',
  SWARM = 'swarm_orchestrator',
  USER = 'user_created',
  SCHEDULED = 'scheduled_task',
  EXTERNAL = 'external_api'
}

// 🎯 Master Task Interface
export interface MasterTask {
  id: string;
  title: string;
  description: string;
  instruction: string;

  // Classification
  status: MasterTaskStatus;
  priority: MasterTaskPriority;
  source: OrchestratorSource;

  // Hierarchy
  parent_task_id?: string;
  root_task_id?: string;         // The top-level parent for deep hierarchies
  depth: number;                  // Nesting level (0 = root)
  child_count: number;            // Number of direct children

  // Execution
  assigned_agent?: string;
  execution_group?: string;       // For parallel execution grouping
  batch_id?: string;              // For batch operations

  // Dependencies
  depends_on: string[];           // Task IDs that must complete first
  blocks: string[];               // Task IDs blocked by this task

  // Progress
  progress: number;               // 0-100
  started_at?: Date;
  completed_at?: Date;
  estimated_duration?: number;    // Minutes
  actual_duration?: number;       // Minutes

  // Results
  result?: any;
  error_message?: string;
  retry_count: number;
  max_retries: number;

  // Context
  context: Record<string, any>;
  tags: string[];

  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
  user_id: string;

  // Performance metrics
  queue_time?: number;            // Time spent in queue (ms)
  execution_time?: number;        // Time spent executing (ms)
}

// 🎯 Batch Operation Result (for batch task operations)
export interface BatchResult {
  successful: number;
  failed: number;
  errors: { taskId: string; error: string }[];
  duration_ms: number;
}

// 🎯 Task Query Filters
export interface TaskQueryFilters {
  status?: MasterTaskStatus[];
  priority?: MasterTaskPriority[];
  source?: OrchestratorSource[];
  tags?: string[];
  user_id?: string;
  parent_task_id?: string;
  root_task_id?: string;
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
}

// 🎯 Task Statistics
export interface TaskStatistics {
  total: number;
  by_status: Record<MasterTaskStatus, number>;
  by_priority: Record<MasterTaskPriority, number>;
  by_source: Record<OrchestratorSource, number>;
  avg_completion_time: number;
  completion_rate: number;
  queue_size: number;
  active_tasks: number;
}

// 📊 Real-time subscription callback
type TaskUpdateCallback = (task: MasterTask, event: 'INSERT' | 'UPDATE' | 'DELETE') => void;

/**
 * 🎯 MASTER TASK REGISTRY CLASS
 * 
 * Handles 10,000+ tasks with:
 * - Database persistence
 * - Memory-efficient chunked processing
 * - Real-time sync
 */
export class MasterTaskRegistry {
  private static instance: MasterTaskRegistry;

  // 🧠 In-memory cache for ACTIVE tasks only (not all 10K)
  private activeTasksCache: Map<string, MasterTask> = new Map();

  // 📡 Real-time subscription
  private subscription: any = null;
  private subscribers: Map<string, TaskUpdateCallback> = new Map();

  // 📊 Statistics cache
  private statsCache: TaskStatistics | null = null;
  private statsCacheExpiry: Date | null = null;

  // 🔧 Configuration
  private readonly BATCH_SIZE = 100;           // Tasks per batch
  private readonly MAX_ACTIVE_CACHE = 500;     // Max tasks in memory
  private readonly STATS_CACHE_TTL = 30000;    // 30 seconds

  private constructor() {
    console.log('🎯 MASTER TASK REGISTRY: Initializing...');
    this.initializeRealtimeSubscription();
  }

  public static getInstance(): MasterTaskRegistry {
    if (!MasterTaskRegistry.instance) {
      MasterTaskRegistry.instance = new MasterTaskRegistry();
    }
    return MasterTaskRegistry.instance;
  }

  // ============================================================
  // 📝 CRUD OPERATIONS
  // ============================================================

  /**
   * Create a single task
   */
  public async createTask(taskData: Partial<MasterTask>): Promise<MasterTask> {
    const task: MasterTask = {
      id: taskData.id || uuidv4(),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      instruction: taskData.instruction || '',
      status: taskData.status || MasterTaskStatus.QUEUED,
      priority: taskData.priority || MasterTaskPriority.MEDIUM,
      source: taskData.source || OrchestratorSource.USER,
      depth: taskData.depth || 0,
      child_count: 0,
      depends_on: taskData.depends_on || [],
      blocks: taskData.blocks || [],
      progress: 0,
      retry_count: 0,
      max_retries: taskData.max_retries || 3,
      context: taskData.context || {},
      tags: taskData.tags || [],
      created_at: new Date(),
      updated_at: new Date(),
      created_by: taskData.created_by || 'system',
      user_id: taskData.user_id || 'anonymous',
      ...taskData
    };

    // Persist to database
    const { error } = await supabase
      .from('master_tasks')
      .insert(this.taskToDbRow(task));

    if (error) {
      console.error('❌ Failed to create task:', error);
      throw error;
    }

    // Add to active cache if currently executing
    if (task.status === MasterTaskStatus.IN_PROGRESS ||
      task.status === MasterTaskStatus.ANALYZING) {
      this.addToActiveCache(task);
    }

    console.log(`✅ Task created: ${task.id} (${task.title})`);
    return task;
  }

  /**
   * 🚀 BATCH CREATE - Create up to 10,000 tasks efficiently
   */
  public async createTasksBatch(
    tasks: Partial<MasterTask>[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const result: BatchResult = {
      successful: 0,
      failed: 0,
      errors: [],
      duration_ms: 0
    };

    const batchId = uuidv4();
    console.log(`🚀 BATCH CREATE: Starting batch ${batchId} with ${tasks.length} tasks`);

    // Process in chunks to avoid overwhelming the database
    for (let i = 0; i < tasks.length; i += this.BATCH_SIZE) {
      const chunk = tasks.slice(i, i + this.BATCH_SIZE);
      const preparedTasks = chunk.map(t => this.taskToDbRow({
        ...this.createDefaultTask(),
        ...t,
        batch_id: batchId
      } as MasterTask));

      try {
        const { error } = await supabase
          .from('master_tasks')
          .insert(preparedTasks);

        if (error) {
          result.failed += chunk.length;
          result.errors.push({ taskId: batchId, error: error.message });
        } else {
          result.successful += chunk.length;
        }
      } catch (err: any) {
        result.failed += chunk.length;
        result.errors.push({ taskId: batchId, error: err.message });
      }

      // Report progress
      onProgress?.(i + chunk.length, tasks.length);

      // Small delay to prevent rate limiting
      if (i + this.BATCH_SIZE < tasks.length) {
        await this.delay(50);
      }
    }

    result.duration_ms = Date.now() - startTime;
    console.log(`✅ BATCH CREATE COMPLETE:`, result);
    return result;
  }

  /**
   * Get a single task by ID
   */
  public async getTask(taskId: string): Promise<MasterTask | null> {
    // Check active cache first
    if (this.activeTasksCache.has(taskId)) {
      return this.activeTasksCache.get(taskId)!;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('master_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.dbRowToTask(data);
  }

  /**
   * Query tasks with filters (paginated)
   */
  public async queryTasks(filters: TaskQueryFilters = {}): Promise<MasterTask[]> {
    let query = supabase
      .from('master_tasks')
      .select('*');

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.source?.length) {
      query = query.in('source', filters.source);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.parent_task_id) {
      query = query.eq('parent_task_id', filters.parent_task_id);
    }
    if (filters.root_task_id) {
      query = query.eq('root_task_id', filters.root_task_id);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString());
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString());
    }

    // Pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by priority and created_at
    query = query.order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Failed to query tasks:', error);
      return [];
    }

    return (data || []).map(row => this.dbRowToTask(row));
  }

  /**
   * Update a task
   */
  public async updateTask(taskId: string, updates: Partial<MasterTask>): Promise<MasterTask | null> {
    const { data, error } = await supabase
      .from('master_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error || !data) {
      console.error('❌ Failed to update task:', error);
      return null;
    }

    const task = this.dbRowToTask(data);

    // Update cache if present
    if (this.activeTasksCache.has(taskId)) {
      this.activeTasksCache.set(taskId, task);
    }

    return task;
  }

  /**
   * 🚀 BATCH UPDATE - Update many tasks at once
   */
  public async updateTasksBatch(
    updates: { id: string; updates: Partial<MasterTask> }[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const result: BatchResult = {
      successful: 0,
      failed: 0,
      errors: [],
      duration_ms: 0
    };

    // Process in chunks
    for (let i = 0; i < updates.length; i += this.BATCH_SIZE) {
      const chunk = updates.slice(i, i + this.BATCH_SIZE);

      // Use Promise.all for parallel updates within chunk
      const results = await Promise.allSettled(
        chunk.map(async ({ id, updates: taskUpdates }) => {
          const { error } = await supabase
            .from('master_tasks')
            .update({ ...taskUpdates, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;
          return id;
        })
      );

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            taskId: chunk[idx].id,
            error: res.reason?.message || 'Unknown error'
          });
        }
      });

      onProgress?.(i + chunk.length, updates.length);
      await this.delay(50);
    }

    result.duration_ms = Date.now() - startTime;
    return result;
  }

  // ============================================================
  // 📊 STATUS MANAGEMENT
  // ============================================================

  /**
   * Start a task (move to IN_PROGRESS)
   */
  public async startTask(taskId: string): Promise<MasterTask | null> {
    return this.updateTask(taskId, {
      status: MasterTaskStatus.IN_PROGRESS,
      started_at: new Date()
    });
  }

  /**
   * Complete a task
   */
  public async completeTask(taskId: string, result?: any): Promise<MasterTask | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    const actualDuration = task.started_at
      ? (Date.now() - new Date(task.started_at).getTime()) / 60000
      : undefined;

    return this.updateTask(taskId, {
      status: MasterTaskStatus.COMPLETED,
      completed_at: new Date(),
      progress: 100,
      result,
      actual_duration: actualDuration
    });
  }

  /**
   * Fail a task
   */
  public async failTask(taskId: string, errorMessage: string): Promise<MasterTask | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    // Check if we should retry
    if (task.retry_count < task.max_retries) {
      return this.updateTask(taskId, {
        status: MasterTaskStatus.QUEUED,
        retry_count: task.retry_count + 1,
        error_message: errorMessage
      });
    }

    return this.updateTask(taskId, {
      status: MasterTaskStatus.FAILED,
      error_message: errorMessage
    });
  }

  /**
   * Update task progress
   */
  public async updateProgress(taskId: string, progress: number): Promise<void> {
    await this.updateTask(taskId, { progress: Math.min(100, Math.max(0, progress)) });
  }

  // ============================================================
  // 📊 STATISTICS & MONITORING
  // ============================================================

  /**
   * Get comprehensive task statistics
   */
  public async getStatistics(userId?: string): Promise<TaskStatistics> {
    // Check cache
    if (this.statsCache && this.statsCacheExpiry && new Date() < this.statsCacheExpiry) {
      return this.statsCache;
    }

    let query = supabase.from('master_tasks').select('status, priority, source');
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('❌ Failed to get statistics:', error);
      return this.getEmptyStats();
    }

    const stats: TaskStatistics = {
      total: data.length,
      by_status: {} as Record<MasterTaskStatus, number>,
      by_priority: {} as Record<MasterTaskPriority, number>,
      by_source: {} as Record<OrchestratorSource, number>,
      avg_completion_time: 0,
      completion_rate: 0,
      queue_size: 0,
      active_tasks: 0
    };

    // Initialize counters
    Object.values(MasterTaskStatus).forEach(s => stats.by_status[s] = 0);
    Object.values(MasterTaskPriority).forEach(p => stats.by_priority[p] = 0);
    Object.values(OrchestratorSource).forEach(s => stats.by_source[s] = 0);

    // Count
    data.forEach(row => {
      stats.by_status[row.status as MasterTaskStatus]++;
      stats.by_priority[row.priority as MasterTaskPriority]++;
      stats.by_source[row.source as OrchestratorSource]++;
    });

    stats.queue_size = stats.by_status[MasterTaskStatus.QUEUED] || 0;
    stats.active_tasks = (stats.by_status[MasterTaskStatus.IN_PROGRESS] || 0) +
      (stats.by_status[MasterTaskStatus.ANALYZING] || 0);

    const completed = stats.by_status[MasterTaskStatus.COMPLETED] || 0;
    const failed = stats.by_status[MasterTaskStatus.FAILED] || 0;
    stats.completion_rate = completed / (completed + failed || 1);

    // Cache
    this.statsCache = stats;
    this.statsCacheExpiry = new Date(Date.now() + this.STATS_CACHE_TTL);

    return stats;
  }

  /**
   * Get master log view (all tasks summary)
   */
  public async getMasterLog(
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    tasks: MasterTask[];
    total: number;
    stats: TaskStatistics;
  }> {
    const [tasks, stats, countResult] = await Promise.all([
      this.queryTasks({ limit, offset }),
      this.getStatistics(),
      supabase.from('master_tasks').select('id', { count: 'exact', head: true })
    ]);

    return {
      tasks,
      total: countResult.count || 0,
      stats
    };
  }

  // ============================================================
  // 📡 REAL-TIME SUBSCRIPTIONS
  // ============================================================

  private initializeRealtimeSubscription(): void {
    try {
      this.subscription = supabase
        .channel('master_tasks_changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'master_tasks' },
          (payload) => {
            const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const task = payload.new ? this.dbRowToTask(payload.new) : null;

            // Notify subscribers
            this.subscribers.forEach(callback => {
              if (task) callback(task, event);
            });

            // Update cache
            if (task && event !== 'DELETE') {
              if (task.status === MasterTaskStatus.IN_PROGRESS ||
                task.status === MasterTaskStatus.ANALYZING) {
                this.addToActiveCache(task);
              } else {
                this.activeTasksCache.delete(task.id);
              }
            }
          }
        )
        .subscribe();

      console.log('📡 Real-time subscription initialized');
    } catch (error) {
      console.warn('⚠️ Real-time subscription failed, will poll instead:', error);
    }
  }

  /**
   * Subscribe to task updates
   */
  public subscribe(id: string, callback: TaskUpdateCallback): () => void {
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }

  // ============================================================
  // 🔧 HELPER METHODS
  // ============================================================

  private createDefaultTask(): Partial<MasterTask> {
    return {
      id: uuidv4(),
      status: MasterTaskStatus.QUEUED,
      priority: MasterTaskPriority.MEDIUM,
      source: OrchestratorSource.USER,
      depth: 0,
      child_count: 0,
      depends_on: [],
      blocks: [],
      progress: 0,
      retry_count: 0,
      max_retries: 3,
      context: {},
      tags: [],
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private taskToDbRow(task: MasterTask): any {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      instruction: task.instruction,
      status: task.status,
      priority: task.priority,
      source: task.source,
      parent_task_id: task.parent_task_id,
      root_task_id: task.root_task_id,
      depth: task.depth,
      child_count: task.child_count,
      assigned_agent: task.assigned_agent,
      execution_group: task.execution_group,
      batch_id: task.batch_id,
      depends_on: task.depends_on,
      blocks: task.blocks,
      progress: task.progress,
      started_at: task.started_at?.toISOString(),
      completed_at: task.completed_at?.toISOString(),
      estimated_duration: task.estimated_duration,
      actual_duration: task.actual_duration,
      result: task.result,
      error_message: task.error_message,
      retry_count: task.retry_count,
      max_retries: task.max_retries,
      context: task.context,
      tags: task.tags,
      created_at: task.created_at?.toISOString(),
      updated_at: task.updated_at?.toISOString(),
      created_by: task.created_by,
      user_id: task.user_id,
      queue_time: task.queue_time,
      execution_time: task.execution_time
    };
  }

  private dbRowToTask(row: any): MasterTask {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      instruction: row.instruction,
      status: row.status,
      priority: row.priority,
      source: row.source,
      parent_task_id: row.parent_task_id,
      root_task_id: row.root_task_id,
      depth: row.depth,
      child_count: row.child_count,
      assigned_agent: row.assigned_agent,
      execution_group: row.execution_group,
      batch_id: row.batch_id,
      depends_on: row.depends_on || [],
      blocks: row.blocks || [],
      progress: row.progress,
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      estimated_duration: row.estimated_duration,
      actual_duration: row.actual_duration,
      result: row.result,
      error_message: row.error_message,
      retry_count: row.retry_count,
      max_retries: row.max_retries,
      context: row.context || {},
      tags: row.tags || [],
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      user_id: row.user_id,
      queue_time: row.queue_time,
      execution_time: row.execution_time
    };
  }

  private addToActiveCache(task: MasterTask): void {
    // Evict oldest if at capacity
    if (this.activeTasksCache.size >= this.MAX_ACTIVE_CACHE) {
      const firstKey = this.activeTasksCache.keys().next().value;
      if (firstKey) this.activeTasksCache.delete(firstKey);
    }
    this.activeTasksCache.set(task.id, task);
  }

  private getEmptyStats(): TaskStatistics {
    return {
      total: 0,
      by_status: {} as Record<MasterTaskStatus, number>,
      by_priority: {} as Record<MasterTaskPriority, number>,
      by_source: {} as Record<OrchestratorSource, number>,
      avg_completion_time: 0,
      completion_rate: 0,
      queue_size: 0,
      active_tasks: 0
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up subscriptions
   */
  public destroy(): void {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
    }
    this.subscribers.clear();
    this.activeTasksCache.clear();
  }
}

// 🎯 Export singleton instance
export const masterTaskRegistry = MasterTaskRegistry.getInstance();
