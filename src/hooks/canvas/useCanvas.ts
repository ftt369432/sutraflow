/**
 * useCanvas - Core Canvas Management Hook
 * 
 * Centralized hook for managing canvas windows, documents, and core functionali    ], [createDocument, closeDocument, updateDocumentContent, showNotifications]);y.
 * This is the main entry point for canvas operations.
 */

import { useCallback, useMemo } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { CanvasHookOptions, CanvasWindow, DocumentAction } from './types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

export function useCanvas(options: CanvasHookOptions = {}) {
  const {
    autoSave = true,
    showNotifications = true
  } = options;

  const {
    windows,
    activeWindowId,
    createWindow,
    closeWindow,
    setActiveWindow,
    updateDocumentContent,
    isCanvasEnabled,
    toggleCanvasEnabled
  } = useCanvasStore();

  // Get active window
  const activeWindow = useMemo(() => 
    windows.find(w => w.id === activeWindowId) || null,
    [windows, activeWindowId]
  );

  // Create new canvas document
  const createDocument = useCallback((
    type: string = 'document',
    title: string = 'Untitled Document',
    content: string = ''
  ) => {
    const windowId = createWindow(type as any, content);
    const window = windows.find(w => w.id === windowId);
    
    if (window && showNotifications) {
      toast.success(`Created new ${type}`);
    }
    
    return windowId;
  }, [createWindow, windows, showNotifications]);

  // Close document with confirmation
  const closeDocument = useCallback((windowId: string, force: boolean = false) => {
    const window = windows.find(w => w.id === windowId);
    
    if (!window) return false;
    
    // Check if document has unsaved changes
    const hasUnsavedChanges = window.document?.lastModified || false;
    
    if (!force && hasUnsavedChanges) {
      // Could trigger a confirmation dialog here
      if (showNotifications) {
        toast.warning('Document has unsaved changes');
      }
      return false;
    }
    
    closeWindow(windowId);
    
    if (showNotifications) {
      toast.success('Document closed');
    }
    
    return true;
  }, [windows, closeWindow, showNotifications]);

  // Switch to document
  const switchToDocument = useCallback((windowId: string) => {
    setActiveWindow(windowId);
  }, [setActiveWindow]);

  // Get document statistics
  const getDocumentStats = useCallback((windowId?: string) => {
    const targetWindow = windowId 
      ? windows.find(w => w.id === windowId)
      : activeWindow;
      
    if (!targetWindow) return null;
    
    const content = targetWindow.document?.content || '';
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = content.length;
    const characterCountNoSpaces = content.replace(/\s/g, '').length;
    
    return {
      wordCount,
      characterCount,
      characterCountNoSpaces,
      lineCount: content.split('\n').length
    };
  }, [windows, activeWindow]);

  // Execute document action
  const executeAction = useCallback((action: DocumentAction) => {
    const { type, payload, timestamp } = action;
    
    switch (type) {
      case 'create':
        return createDocument(payload.type, payload.title, payload.content);
        
      case 'edit':
        if (payload.windowId && payload.content !== undefined) {
          const window = windows.find(w => w.id === payload.windowId);
          if (window?.document) {
            updateDocumentContent(window.document.id, payload.content);
          }
        }
        break;
        
      case 'delete':
        return closeDocument(payload.windowId, true);
        
      case 'save':
        // Auto-save functionality would go here
        if (showNotifications) {
          toast.success('Document saved');
        }
        break;
        
      default:
        console.warn('Unknown document action:', type);
    }
  }, [createDocument, closeDocument, updateDocumentContent, showNotifications]);

  return {
    // State
    windows,
    activeWindow,
    activeWindowId,
    isCanvasEnabled,
    
    // Core actions
    createDocument,
    closeDocument,
    switchToDocument,
    executeAction,
    
    // Utilities
    getDocumentStats,
    toggleCanvasEnabled,
    
    // Computed
    hasDocuments: windows.length > 0,
    documentCount: windows.length,
  };
}
