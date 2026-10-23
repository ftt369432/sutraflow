/**
 * useDocumentEditor - Document Editor State Management Hook
 * 
 * Manages the document editor UI state, including toolbar, content editing,
 * auto-save, and document statistics.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { DocumentEditorState, CanvasHookOptions } from './types';
import { useCanvas } from './useCanvas';
import { debounce } from 'lodash';

export function useDocumentEditor(windowId?: string, options: CanvasHookOptions = {}) {
  const { autoSave = true } = options;
  const { activeWindow, executeAction, getDocumentStats } = useCanvas();
  
  // Determine target window
  const targetWindow = windowId 
    ? null // Would need to get by ID
    : activeWindow;

  // Editor state
  const [editorState, setEditorState] = useState<DocumentEditorState>({
    content: targetWindow?.document?.content || '',
    title: targetWindow?.document?.title || 'Untitled',
    isDirty: false,
    isEditing: false,
    wordCount: 0,
    characterCount: 0,
    toolbar: {
      isCollapsed: false,
      isVisible: true,
    },
    rightPanel: {
      isOpen: false,
      activeTab: 'outline',
    },
  });

  // Auto-save debounced function
  const debouncedSave = useCallback(
    debounce((content: string) => {
      if (autoSave && targetWindow) {
        executeAction({
          type: 'save',
          payload: { windowId: targetWindow.id, content },
          timestamp: new Date(),
        });
        
        setEditorState(prev => ({
          ...prev,
          isDirty: false,
          lastSaved: new Date(),
        }));
      }
    }, 2000),
    [autoSave, targetWindow, executeAction]
  );

  // Update content
  const updateContent = useCallback((newContent: string) => {
    setEditorState(prev => ({
      ...prev,
      content: newContent,
      isDirty: true,
    }));

    // Trigger auto-save
    debouncedSave(newContent);

    // Update document in store immediately for real-time editing
    if (targetWindow) {
      executeAction({
        type: 'edit',
        payload: { windowId: targetWindow.id, content: newContent },
        timestamp: new Date(),
      });
    }
  }, [targetWindow, executeAction, debouncedSave]);

  // Update title
  const updateTitle = useCallback((newTitle: string) => {
    setEditorState(prev => ({
      ...prev,
      title: newTitle,
      isDirty: true,
    }));
  }, []);

  // Toggle toolbar
  const toggleToolbar = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      toolbar: {
        ...prev.toolbar,
        isCollapsed: !prev.toolbar.isCollapsed,
      },
    }));
  }, []);

  // Toggle right panel - DISABLED: Keep right panel closed at all times
  const toggleRightPanel = useCallback((tab?: string) => {
    // RIGHT PANEL DISABLED - Do nothing, keep it closed always
    // setEditorState(prev => ({
    //   ...prev,
    //   rightPanel: {
    //     isOpen: tab ? true : !prev.rightPanel.isOpen,
    //     activeTab: tab || prev.rightPanel.activeTab,
    //   },
    // }));
  }, []);

  // Set editing mode
  const setEditingMode = useCallback((isEditing: boolean) => {
    setEditorState(prev => ({
      ...prev,
      isEditing,
    }));
  }, []);

  // Save document manually
  const saveDocument = useCallback(() => {
    if (targetWindow) {
      executeAction({
        type: 'save',
        payload: { windowId: targetWindow.id, content: editorState.content },
        timestamp: new Date(),
      });
      
      setEditorState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date(),
      }));
    }
  }, [targetWindow, editorState.content, executeAction]);

  // Calculate document statistics
  const documentStats = useMemo(() => {
    if (!targetWindow) return null;
    return getDocumentStats(targetWindow.id);
  }, [targetWindow, getDocumentStats, editorState.content]);

  // Update word/character counts when content changes
  useEffect(() => {
    const stats = documentStats || { wordCount: 0, characterCount: 0 };
    setEditorState(prev => ({
      ...prev,
      wordCount: stats.wordCount,
      characterCount: stats.characterCount,
    }));
  }, [documentStats]);

  // Sync with target window changes
  useEffect(() => {
    if (targetWindow) {
      setEditorState(prev => ({
        ...prev,
        content: targetWindow.document?.content || '',
        title: targetWindow.document?.title || 'Untitled',
      }));
    }
  }, [targetWindow]);

  return {
    // State
    ...editorState,
    documentStats,
    hasTargetWindow: !!targetWindow,
    
    // Actions
    updateContent,
    updateTitle,
    saveDocument,
    setEditingMode,
    
    // UI Controls
    toggleToolbar,
    toggleRightPanel,
    
    // Utilities
    canSave: editorState.isDirty,
    isAutoSaveEnabled: autoSave,
  };
}
