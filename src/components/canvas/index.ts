// Canvas Components Export Index - Core Components + AI Drive Integration
export { default as UnifiedCanvasSystem } from './UnifiedCanvasSystem';
export { default as DocumentEditorLayout } from './DocumentEditorLayout';
export { default as EnhancedTabSystem } from './EnhancedTabSystem';

// 🔗 AI Drive Integration Layer (New)
export { default as CanvasAIDriveIntegration } from './CanvasAIDriveIntegration';
export { CanvasSaveStatus } from './CanvasAIDriveIntegration';
export { default as CanvasDocumentBrowser } from './CanvasDocumentBrowser';

// Hooks
export { useCanvasAIDrive } from '../../hooks/canvas/useCanvasAIDrive';
export type { CanvasDocument, CanvasAIDriveState, UseCanvasAIDriveReturn } from '../../hooks/canvas/useCanvasAIDrive';
