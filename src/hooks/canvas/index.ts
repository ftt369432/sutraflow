/**
 * Canvas System Hooks - Centralized Entry Point
 * 
 * This file exports all canvas-related hooks in a centralized manner
 * following the prompt guidelines for clean architecture.
 */

// Core Canvas Hooks
export { useCanvas } from './useCanvas';
export { useCanvasDocument } from './useCanvasDocument';
export { useCanvasTemplates } from './useCanvasTemplates';
export { useCanvasAgent } from './useCanvasAgent';

// Integration Hooks
export { useCanvasChatIntegration } from './useCanvasChatIntegration';
export { useCanvasWorkflow } from './useCanvasWorkflow';

// 🔗 AI Drive Integration Hook (New)
export { useCanvasAIDrive } from './useCanvasAIDrive';
export type { 
  CanvasDocument, 
  CanvasAIDriveState, 
  UseCanvasAIDriveReturn 
} from './useCanvasAIDrive';

// UI State Hooks
export { useCanvasUI } from './useCanvasUI';
export { useDocumentEditor } from './useDocumentEditor';

// Types
export type {
  CanvasHookOptions,
  DocumentEditorState,
  CanvasTemplateData,
  WorkflowState
} from './types';
