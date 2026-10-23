/**
 * Task Service Module - Mock Implementation
 */

import { TaskService } from './taskService';
import type { Task, TaskFilter } from './taskService';

// Create and export the service instance
export const taskService = new TaskService();

// Re-export types
export type { Task, TaskFilter }; 