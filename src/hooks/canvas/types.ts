/**
 * Canvas Hook Types - Centralized Type Definitions
 * 
 * All TypeScript interfaces and types for the canvas system
 */

export interface CanvasHookOptions {
  autoSave?: boolean;
  autoLaunch?: boolean;
  minConfidence?: number;
  showNotifications?: boolean;
}

export interface DocumentEditorState {
  content: string;
  title: string;
  isDirty: boolean;
  isEditing: boolean;
  wordCount: number;
  characterCount: number;
  lastSaved?: Date;
  toolbar: {
    isCollapsed: boolean;
    isVisible: boolean;
  };
  rightPanel: {
    isOpen: boolean;
    activeTab: string;
  };
}

export interface CanvasTemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'document' | 'presentation' | 'spreadsheet' | 'mind-map' | 'flowchart';
  content: string;
  variables?: Record<string, string>;
  thumbnail?: string;
}

export interface WorkflowState {
  currentStep: number;
  totalSteps: number;
  isProcessing: boolean;
  canProceed: boolean;
  errors: string[];
  completedSteps: number[];
}

export interface CanvasWindow {
  id: string;
  title: string;
  type: string;
  content: string;
  isActive: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  metadata: Record<string, any>;
}

export interface DocumentAction {
  type: 'create' | 'edit' | 'delete' | 'save' | 'export';
  payload: any;
  timestamp: Date;
}
