/**
 * useCanvasDocument - Document-specific Canvas Management Hook
 * 
 * Provides document-specific operations and state management
 * for individual canvas documents.
 */

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { DocumentAction } from './types';
import { toast } from 'sonner';

export function useCanvasDocument(documentId?: string) {
  const {
    documents,
    getDocument,
    updateDocument,
    updateDocumentContent,
    deleteDocument,
    windows,
  } = useCanvasStore();

  const [localContent, setLocalContent] = useState<string>('');
  const [isModified, setIsModified] = useState(false);

  // Get document data
  const document = useMemo(() => {
    return documentId ? getDocument(documentId) : null;
  }, [documentId, getDocument, documents]);

  // Get associated window
  const associatedWindow = useMemo(() => {
    if (!document) return null;
    return windows.find(w => w.document.id === document.id) || null;
  }, [document, windows]);

  // Update local content when document changes
  useEffect(() => {
    if (document) {
      setLocalContent(document.content);
      setIsModified(false);
    }
  }, [document]);

  // Update document content
  const updateContent = useCallback((content: string) => {
    setLocalContent(content);
    setIsModified(true);
    
    if (documentId) {
      updateDocumentContent(documentId, content);
    }
  }, [documentId, updateDocumentContent]);

  // Save document changes
  const saveDocument = useCallback(() => {
    if (!documentId || !isModified) return false;

    try {
      updateDocumentContent(documentId, localContent);
      setIsModified(false);
      toast.success('Document saved');
      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
      return false;
    }
  }, [documentId, localContent, isModified, updateDocumentContent]);

  // Update document metadata
  const updateMetadata = useCallback((updates: any) => {
    if (!documentId) return;

    updateDocument(documentId, updates);
  }, [documentId, updateDocument]);

  // Delete document
  const deleteDoc = useCallback(() => {
    if (!documentId) return false;

    try {
      deleteDocument(documentId);
      toast.success('Document deleted');
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      return false;
    }
  }, [documentId, deleteDocument]);

  // Execute document action
  const executeAction = useCallback((action: DocumentAction) => {
    const { type, payload } = action;

    switch (type) {
      case 'save':
        return saveDocument();
        
      case 'delete':
        return deleteDoc();
        
      case 'edit':
        if (payload.content !== undefined) {
          updateContent(payload.content);
        }
        return true;
        
      default:
        console.warn('Unknown document action:', type);
        return false;
    }
  }, [saveDocument, deleteDoc, updateContent]);

  // Get document statistics
  const getStats = useCallback(() => {
    const content = localContent || '';
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    
    return {
      wordCount: words.length,
      characterCount: content.length,
      characterCountNoSpaces: content.replace(/\s/g, '').length,
      lineCount: content.split('\n').length,
      paragraphCount: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
    };
  }, [localContent]);

  // Undo/Redo functionality (simplified)
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((content: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(content);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousContent = history[historyIndex - 1];
      setLocalContent(previousContent);
      setHistoryIndex(prev => prev - 1);
      setIsModified(true);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextContent = history[historyIndex + 1];
      setLocalContent(nextContent);
      setHistoryIndex(prev => prev + 1);
      setIsModified(true);
    }
  }, [history, historyIndex]);

  return {
    // Document data
    document,
    associatedWindow,
    
    // Content state
    content: localContent,
    isModified,
    
    // Actions
    updateContent,
    saveDocument,
    updateMetadata,
    deleteDocument: deleteDoc,
    executeAction,
    
    // History
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    
    // Utilities
    getStats,
    addToHistory,
    
    // Computed
    exists: !!document,
    isEmpty: !localContent.trim(),
    hasUnsavedChanges: isModified,
  };
}
