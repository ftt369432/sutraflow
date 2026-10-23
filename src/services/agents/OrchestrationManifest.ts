/**
 * 🧠 ORCHESTRATION MANIFEST SYSTEM - SESSION-BASED
 * 
 * THE SINGLE SOURCE OF TRUTH for CURRENT SESSION orchestration state
 * Implements session-based architecture:
 * - Tasks = Active work only (cleared on refresh)
 * - Canvases = Current session documents
 * - Auto-cleanup = Completed tasks removed after 5 minutes
 * 
 * WHY SESSION-BASED:
 * - No task accumulation from previous sessions ✅
 * - Clean slate on page refresh ✅
 * - Perfect for multi-canvas generation ✅
 * - Only shows relevant active work ✅
 * 
 * GOLDEN RULE: Session-isolated, auto-cleanup, real-time coordination
 */

import { supabase } from '../../lib/supabaseClient';

// 📋 Task States
export type TaskStatus =
  | 'not-started'  // In todo queue, not begun
  | 'pending'      // Alternative for not-started
  | 'in-progress'  // AI actively working (only ONE at a time)
  | 'paused'       // User switched topics, resume later
  | 'blocked'      // Waiting on dependency or human input
  | 'completed'    // Finished successfully
  | 'plan-review'   // Strategy needs user approval
  | 'failed';      // Errored out, needs human intervention

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// 📋 Manifest Task (THE MAP - not full content)
export interface ManifestTask {
  id: string;                    // TASK-xxxxxxxx
  title: string;                 // Clear title (not raw user input)
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgent?: string;        // Agent type handling this
  canvasId?: string;             // Associated canvas (if document task)
  parentTaskId?: string;         // Parent in hierarchy
  childTaskIds?: string[];       // Subtasks
  created: Date;
  modified: Date;
  progress?: number;             // 0-100
  thoughts?: {
    step: 'think' | 'research' | 'act' | 'reflect';
    content: string;
    timestamp: Date;
  }[];
  metadata?: Record<string, any>;
}

// 🎨 Manifest Canvas (THE MAP - not full content)
export interface ManifestCanvas {
  id: string;
  title: string;
  type: string;
  created: Date;
  modified: Date;
  contentLength: number;         // Track size, not full content
  taskId?: string;               // Task that created this canvas
  metadata?: Record<string, any>;
}

// 🗺️ Implementation Plan (THE STRATEGY)
export interface ImplementationPlanStep {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedAgent?: string;
  taskId?: string; // Linked task in the manifest
}

export interface ImplementationPlan {
  goal: string;
  steps: ImplementationPlanStep[];
  risks: string[];
  progress: number;
  approved: boolean;
}

// 📖 Walkthrough (THE RESULTS)
export interface WalkthroughStep {
  title: string;
  description: string;
  type: 'action' | 'verification' | 'note';
  status: 'success' | 'failure' | 'info';
  timestamp: string;
  evidence?: { type: 'file' | 'log', label: string, url?: string }[];
  media?: string[]; // Links to images or recordings
}

export interface Walkthrough {
  title: string;
  summary: string;
  steps: WalkthroughStep[];
  completedAt: string;
}

// 👤 Client Context (Parsed from user input)
export interface ManifestClient {
  name: string;
  caseNumber?: string;
  injuryDate?: string;
  [key: string]: any;
}

// 🤖 Agent Question (Human-in-the-loop triggers)
export interface AgentQuestion {
  id: string;
  agentId: string;
  question: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
}

// 🗂️ Orchestration State (THE MANIFEST)
export interface OrchestrationState {
  // Core Identification
  manifestVersion: string;
  sessionId: string;
  userId: string;

  // Current Focus (What AI is working on RIGHT NOW)
  currentTaskId: string | null;
  activeFiles: string[];         // Files currently being edited
  todoQueue: string[];           // Task IDs in priority order

  // Task Registry (THE MAP - not full task content)
  tasks: Record<string, ManifestTask>;

  // Canvas Registry (Documents created)
  canvases: Record<string, ManifestCanvas>;

  // Client Context (Parsed from user input)
  client: ManifestClient | null;

  // Strategic Plan (The "Top-Down" view)
  plan: ImplementationPlan | null;

  // Walkthrough (The "Review" view)
  walkthrough: Walkthrough | null;

  // File Tree (Index, not content)
  fileTree: string[];

  // Intelligence Metrics
  intelligenceLevel: number;
  predictionAccuracy: number;

  // Human-in-the-loop
  agentQuestions: AgentQuestion[];

  // Audit Trail
  createdAt: string;
  lastUpdated: string;
  lastAction: string;
}

/**
 * 🧠 ORCHESTRATION MANIFEST - THE OPERATING SYSTEM
 */
export class OrchestrationManifest {
  private state: OrchestrationState;
  private storageKey: string;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map(); // Auto-cleanup timers
  private listeners: Set<(state: OrchestrationState) => void> = new Set();

  constructor(userId: string, sessionId?: string, storageKey: string = 'orchestration_manifest') {
    this.storageKey = storageKey;
    this.state = this.initializeState(userId, sessionId);
    this.loadFromSessionStorage(); // Use sessionStorage instead of localStorage
  }

  // 🏁 Initialize empty state
  private initializeState(userId: string, sessionId?: string): OrchestrationState {
    return {
      manifestVersion: '1.0.0',
      sessionId: sessionId || `session-${Date.now()}`,
      userId,
      currentTaskId: null,
      activeFiles: [],
      todoQueue: [],
      tasks: {},
      canvases: {},
      client: null,
      plan: null,
      walkthrough: null,
      fileTree: [],
      intelligenceLevel: 50,
      predictionAccuracy: 0.0,
      agentQuestions: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastAction: 'Initialized'
    };
  }

  // 💾 Load from sessionStorage (session-isolated, clears on refresh)
  private loadFromSessionStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate it's for same user
        if (parsed.userId === this.state.userId) {
          this.state = { ...this.state, ...parsed };

          // 🧹 CLEANUP OLD TASKS on load (remove completed tasks older than session)
          const now = Date.now();
          const tasksToRemove: string[] = [];

          Object.entries(this.state.tasks).forEach(([id, task]) => {
            if (task.status === 'completed' || task.status === 'failed') {
              const taskAge = now - new Date(task.modified).getTime();
              if (taskAge > 300000) { // 5 minutes
                tasksToRemove.push(id);
              }
            }
          });

          // Remove old tasks
          tasksToRemove.forEach(id => {
            delete this.state.tasks[id];
            this.state.todoQueue = this.state.todoQueue.filter(tid => tid !== id);
          });

          if (tasksToRemove.length > 0) {
            console.log(`🧹 Cleaned up ${tasksToRemove.length} old tasks from session`);
          }

          console.log('📖 Manifest loaded from sessionStorage:', this.getSummary());
        }
      } else {
        console.log('🆕 Fresh session started - no previous manifest');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load manifest from sessionStorage:', error);
    }
  }

  // 💾 Save to sessionStorage (session-isolated) + Supabase (archived history)
  private saveToSessionStorage(): void {
    // Update timestamp
    this.state.lastUpdated = new Date().toISOString();

    // Save to sessionStorage (clears on page refresh)
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('❌ Failed to save manifest to sessionStorage:', error);
    }

    // Debounce database sync (for history/audit trail only)
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.syncToDatabase();
    }, 10000); // Save to DB after 10 seconds (less aggressive)

    // Notify listeners immediately for UI updates
    this.notifyListeners();
  }

  // 🔔 Listener Management
  public subscribe(listener: (state: OrchestrationState) => void): () => void {
    this.listeners.add(listener);
    // Initial notification
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('❌ Error in OrchestrationManifest listener:', error);
      }
    });
  }

  // 💾 Sync to Supabase (long-term persistence)
  private async syncToDatabase(): Promise<void> {
    try {
      await supabase
        .from('orchestration_manifests')
        .upsert({
          session_id: this.state.sessionId,
          user_id: this.state.userId,
          state: this.state,
          updated_at: new Date().toISOString()
        });
      console.log('☁️ Manifest synced to database');
    } catch (error) {
      console.error('❌ Failed to sync manifest to database:', error);
    }
  }

  // ========================================
  // TASK MANAGEMENT
  // ========================================

  /**
   * 📋 Register a new task in the manifest
   */
  public registerTask(task: Omit<ManifestTask, 'created' | 'modified'>): void {
    const fullTask: ManifestTask = {
      ...task,
      created: new Date(),
      modified: new Date()
    };

    this.state.tasks[task.id] = fullTask;
    this.state.todoQueue.push(task.id);
    this.state.lastAction = `Registered task: ${task.title}`;

    // 🔗 HIERARCHY: Link to parent task if specified
    if (task.parentTaskId) {
      const parentTask = this.state.tasks[task.parentTaskId];
      if (parentTask) {
        if (!parentTask.childTaskIds) {
          parentTask.childTaskIds = [];
        }
        // Avoid duplicates
        if (!parentTask.childTaskIds.includes(task.id)) {
          parentTask.childTaskIds.push(task.id);
          console.log(`🔗 Linked subtask ${task.id} to parent ${task.parentTaskId}`);
        }
      } else {
        console.warn(`⚠️ Parent task ${task.parentTaskId} not found for subtask ${task.id}`);
      }
    }

    console.log('📋 Task registered:', task.id, task.title);
    this.saveToSessionStorage();
  }

  /**essionStorage();
  }
  
  /**
   * ✅ Update task status (with auto-cleanup for completed tasks)
   */
  public updateTaskStatus(taskId: string, status: TaskStatus, result?: any, progress?: number): void {
    const task = this.state.tasks[taskId];
    if (!task) {
      console.error('❌ Task not found:', taskId);
      return;
    }

    task.status = status;
    task.modified = new Date();

    if (progress !== undefined) {
      task.progress = progress;
    } else if (status === 'completed') {
      task.progress = 100;
    }

    if (result) {
      task.metadata = { ...task.metadata, result };
    }

    // 🧹 AUTO-CLEANUP: Remove completed/failed tasks after 5 minutes
    if (status === 'completed' || status === 'failed') {
      this.state.todoQueue = this.state.todoQueue.filter(id => id !== taskId);

      // Schedule auto-removal
      const cleanupTimer = setTimeout(() => {
        if (this.state.tasks[taskId]) {
          delete this.state.tasks[taskId];
          console.log(`🧹 Auto-removed ${status} task: ${taskId}`);
          this.saveToSessionStorage();
        }
        this.cleanupTimers.delete(taskId);
      }, 300000); // 5 minutes

      this.cleanupTimers.set(taskId, cleanupTimer);
      console.log(`⏰ Scheduled auto-cleanup for task ${taskId} in 5 minutes`);

      // Auto-focus next task in queue
      if (this.state.currentTaskId === taskId && this.state.todoQueue.length > 0) {
        this.focusTask(this.state.todoQueue[0]);
      } else if (this.state.currentTaskId === taskId) {
        this.state.currentTaskId = null;
      }
    }

    this.state.lastAction = `Task ${status}: ${task.title}`;
    console.log(`✅ Task status updated: ${taskId} → ${status}`);
    this.saveToSessionStorage();
  }

  /**
   * 🧠 Add a thought step to a task
   */
  public addTaskThought(taskId: string, step: 'think' | 'research' | 'act' | 'reflect', content: string): void {
    const task = this.state.tasks[taskId];
    if (task) {
      if (!task.thoughts) {
        task.thoughts = [];
      }
      task.thoughts.push({
        step,
        content,
        timestamp: new Date()
      });
      task.modified = new Date();
      this.state.lastAction = `Agent ${step}: ${content.substring(0, 30)}...`;
      this.saveToSessionStorage();
    }
  }

  /**
   * 🔗 Link task to canvas
   */
  public linkTaskToCanvas(taskId: string, canvasId: string): void {
    const task = this.state.tasks[taskId];
    if (task) {
      task.canvasId = canvasId;
      task.modified = new Date();
      this.state.lastAction = `Linked task ${taskId} to canvas ${canvasId}`;
      console.log('🔗 Task linked to canvas:', taskId, '→', canvasId);
      this.saveToSessionStorage();
    }
  }

  /**
   * 🗺️ Get the strategic implementation plan
   */
  public getPlan(): ImplementationPlan | null {
    return this.state.plan;
  }

  /**
   * 🗺️ Set the strategic implementation plan
   */
  public setPlan(plan: ImplementationPlan): void {
    this.state.plan = plan;
    this.state.lastAction = `Strategy defined: ${plan.goal.substring(0, 30)}...`;
    console.log('🗺️ Strategic plan set in manifest');
    this.saveToSessionStorage();
  }

  /**
   * 🗺️ Update plan progress based on tasks
   */
  public syncPlanProgress(): void {
    if (!this.state.plan) return;

    let completed = 0;
    this.state.plan.steps.forEach(step => {
      // If linked to a task, check its status
      if (step.taskId) {
        const task = this.state.tasks[step.taskId];
        if (task && task.status === 'completed') {
          step.status = 'completed';
        }
      }
      if (step.status === 'completed') completed++;
    });

    this.state.plan.progress = Math.round((completed / this.state.plan.steps.length) * 100);
    this.saveToSessionStorage();
  }

  // ========================================
  // CANVAS MANAGEMENT
  // ========================================

  /**
   * 🎨 Register a new canvas in the manifest
   */
  public registerCanvas(canvas: {
    id: string;
    title: string;
    type: string;
    contentLength?: number;
    taskId?: string;
    metadata?: Record<string, any>;
  }): void {
    const fullCanvas: ManifestCanvas = {
      id: canvas.id,
      title: canvas.title,
      type: canvas.type,
      contentLength: canvas.contentLength || 0,
      taskId: canvas.taskId,
      metadata: canvas.metadata,
      created: new Date(),
      modified: new Date()
    };

    this.state.canvases[canvas.id] = fullCanvas;

    this.state.lastAction = `Registered canvas: ${canvas.title}`;
    console.log('🎨 Canvas registered:', canvas.id, canvas.title);
    this.saveToSessionStorage();
  }

  /**
   * 🔄 Update canvas metadata (not content - content stays in Canvas component)
   */
  public updateCanvasMetadata(canvasId: string, updates: Partial<ManifestCanvas>): void {
    const canvas = this.state.canvases[canvasId];
    if (canvas) {
      Object.assign(canvas, updates);
      canvas.modified = new Date();
      this.state.lastAction = `Updated canvas: ${canvas.title}`;
      console.log('🔄 Canvas metadata updated:', canvasId);
      this.saveToSessionStorage();
    }
  }

  /**
   * 🗑️ Remove canvas from manifest
   */
  public unregisterCanvas(canvasId: string): void {
    const canvas = this.state.canvases[canvasId];
    if (canvas) {
      delete this.state.canvases[canvasId];
      this.state.lastAction = `Removed canvas: ${canvas.title}`;
      console.log('🗑️ Canvas unregistered:', canvasId);
      this.saveToSessionStorage();
    }
  }

  // ========================================
  // QUERIES
  // ========================================

  /**
   * 📖 Get current state snapshot
   */
  public getState(): OrchestrationState {
    return { ...this.state };
  }

  /**
   * 📋 Get current focused task
   */
  public getCurrentTask(): ManifestTask | null {
    if (!this.state.currentTaskId) return null;
    return this.state.tasks[this.state.currentTaskId] || null;
  }

  /**
   * 📋 Get task by ID
   */
  public getTask(taskId: string): ManifestTask | null {
    return this.state.tasks[taskId] || null;
  }

  /**
   * 📋 Get all pending tasks
   */
  public getTodoQueue(): ManifestTask[] {
    return this.state.todoQueue
      .map(id => this.state.tasks[id])
      .filter(Boolean);
  }

  /**
   * 📋 Get all tasks (with hierarchy intact via parentTaskId/childTaskIds)
   */
  public getAllTasks(): ManifestTask[] {
    return Object.values(this.state.tasks);
  }

  /**
   * 🎨 Get canvas by ID
   */
  public getCanvas(canvasId: string): ManifestCanvas | null {
    return this.state.canvases[canvasId] || null;
  }

  /**
   * 🎨 Get canvas by task ID
   */
  public getCanvasByTaskId(taskId: string): ManifestCanvas | null {
    return Object.values(this.state.canvases).find(c => c.taskId === taskId) || null;
  }

  /**
   * 🎨 Get all canvases
   */
  public getAllCanvases(): ManifestCanvas[] {
    return Object.values(this.state.canvases);
  }

  /**
   * 📊 Get summary for debugging (object format)
   */
  public getSummary(): {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    canvasCount: number;
    currentTask: string | null;
    lastAction: string;
    formattedString: string;
  } {
    const pending = this.state.todoQueue.length;
    const completed = Object.values(this.state.tasks).filter(t => t.status === 'completed').length;
    const total = Object.keys(this.state.tasks).length;
    const currentTask = this.getCurrentTask();
    const canvasCount = Object.keys(this.state.canvases).length;

    return {
      totalTasks: total,
      pendingTasks: pending,
      completedTasks: completed,
      canvasCount: canvasCount,
      currentTask: currentTask?.title || null,
      lastAction: this.state.lastAction,
      formattedString: `📊 Manifest: ${total} tasks (${pending} pending, ${completed} completed), ${canvasCount} canvases | ${this.state.lastAction}`
    };
  }

  /**
   * 🔄 Reset manifest (clear all state + cleanup timers)
   */
  public reset(): void {
    // Clear all cleanup timers
    this.cleanupTimers.forEach(timer => clearTimeout(timer));
    this.cleanupTimers.clear();

    this.state = this.initializeState(this.state.userId);
    this.saveToSessionStorage();
    console.log('🔄 Manifest reset - session cleared');
  }

  /**
   * 🗑️ Delete an artifact from the manifest (task or canvas)
   */
  public deleteArtifact(id: string, type: 'task' | 'canvas' | 'artifact'): void {
    if (type === 'task') {
      delete this.state.tasks[id];
      this.state.todoQueue = this.state.todoQueue.filter(tid => tid !== id);
    } else if (type === 'canvas') {
      delete this.state.canvases[id];
    }

    this.state.lastAction = `Deleted ${type}: ${id}`;
    this.saveToSessionStorage();
    console.log(`🗑️ Manifest: Deleted ${type} ${id}`);
  }

  /**
   * 🧹 Manual cleanup of completed tasks (immediate)
   */
  public cleanupCompletedTasks(): number {
    const tasksToRemove = Object.entries(this.state.tasks)
      .filter(([_, task]) => task.status === 'completed' || task.status === 'failed')
      .map(([id]) => id);

    tasksToRemove.forEach(id => {
      delete this.state.tasks[id];
      this.state.todoQueue = this.state.todoQueue.filter(tid => tid !== id);

      // Clear cleanup timer if exists
      const timer = this.cleanupTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.cleanupTimers.delete(id);
      }
    });

    if (tasksToRemove.length > 0) {
      this.saveToSessionStorage();
      console.log(`🧹 Manually cleaned up ${tasksToRemove.length} completed tasks`);
    }

    return tasksToRemove.length;
  }

  /**
   * 📤 Export full manifest (for debugging)
   */
  public export(): OrchestrationState {
    return this.getState();
  }

  /**
   * 🎯 Find task by title (fuzzy matching)
   * Used to link canvases to pre-registered tasks
   */
  public findTaskByTitle(title: string): ManifestTask | null {
    const normalizedTitle = title.toLowerCase().trim();

    // Exact match first
    let found = Object.values(this.state.tasks).find(task =>
      task.title.toLowerCase() === normalizedTitle
    );

    if (found) return found;

    // Partial match (either direction)
    found = Object.values(this.state.tasks).find(task =>
      task.title.toLowerCase().includes(normalizedTitle) ||
      normalizedTitle.includes(task.title.toLowerCase())
    );

    if (found) {
      console.log('🔍 Found task by partial match:', found.title);
    }

    return found || null;
  }

  /**
   * 🎯 Get tasks that don't have canvases linked yet
   */
  public getUnlinkedTasks(): ManifestTask[] {
    return Object.values(this.state.tasks).filter(task => !task.canvasId);
  }

  /**
   * 🔗 Focus on a specific task (set as current)
   */
  public focusTask(taskId: string): void {
    const task = this.state.tasks[taskId];
    if (task) {
      this.state.currentTaskId = taskId;
      task.status = 'in-progress';
      task.modified = new Date();
      this.state.lastAction = `Focused on task: ${task.title}`;
      console.log('🎯 Focused on task:', task.title);
      this.saveToSessionStorage();
    }
  }

  /**
   * 📋 Get tasks by parent ID (for hierarchical display)
   */
  public getChildTasks(parentTaskId: string): ManifestTask[] {
    return Object.values(this.state.tasks).filter(task =>
      task.parentTaskId === parentTaskId
    );
  }

  /**
   * 📋 Get root-level tasks (no parent)
   */
  public getRootTasks(): ManifestTask[] {
    return Object.values(this.state.tasks).filter(task => !task.parentTaskId);
  }
}


// ========================================
// GLOBAL SINGLETON REGISTRY (Namespaced)
// ========================================
const manifestInstances: Map<string, OrchestrationManifest> = new Map();

/**
 * Get or create a namespaced manifest instance
 * @param userId Required for initialization
 * @param storageKey Optional unique namespace (e.g., 'orchestration_manifest_hq')
 */
export function getOrchestrationManifest(userId?: string, storageKey: string = 'orchestration_manifest'): OrchestrationManifest {
  // 🔍 ROBUST FALLBACK: If userId is not provided, try to find any existing active instance for this storageKey
  if (!userId) {
    const keys = Array.from(manifestInstances.keys());
    const matchingKey = keys.find(k => k.endsWith(`_${storageKey}`));
    if (matchingKey) {
      const existingInstance = manifestInstances.get(matchingKey);
      if (existingInstance) return existingInstance;
    }
    
    // Also check global window object for debugging/fallback
    if (typeof window !== 'undefined' && storageKey === 'orchestration_manifest' && (window as any).orchestrationManifest) {
      return (window as any).orchestrationManifest;
    }
  }

  const finalUserId = userId || 'anon';
  const instanceKey = `${finalUserId}_${storageKey}`;
  
  if (!manifestInstances.has(instanceKey)) {
    const newInstance = new OrchestrationManifest(finalUserId, undefined, storageKey);
    manifestInstances.set(instanceKey, newInstance);

    // Expose primary one globally for debugging (default namespace)
    if (typeof window !== 'undefined' && storageKey === 'orchestration_manifest') {
      (window as any).orchestrationManifest = newInstance;
    }
  }

  const instance = manifestInstances.get(instanceKey);
  if (!instance) {
    throw new Error(`OrchestrationManifest [${storageKey}] not initialized.`);
  }

  return instance;
}

/**
 * Reset all manifest instances (for testing/clean slate)
 */
export function resetOrchestrationManifest(): void {
  manifestInstances.clear();
  if (typeof window !== 'undefined') {
    delete (window as any).orchestrationManifest;
  }
}
