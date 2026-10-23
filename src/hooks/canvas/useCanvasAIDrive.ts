/**
 * 🎨 Canvas AI Drive Integration Hook
 * 
 * Clean layered architecture for Canvas document persistence
 * Follows constant prompt principles: clean, beautiful, extensible
 * 
 * Features:
 * - Auto-save Canvas documents to AI Drive
 * - Load existing documents for surgical editing
 * - Version management and backup
 * - Non-intrusive integration (doesn't disturb existing Canvas flow)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAiDriveService } from '../useAiDriveService';
import { AIDriveFile } from '../../services/drive/aiDriveService';
import { useToast } from '../useToast';
import { useAuth } from '../../contexts/AuthContext';

import { CanvasDocument } from '../../types/canvas';

export interface CanvasAIDriveState {
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving' | 'error' | 'pending';
  error: string | null;
}

export interface UseCanvasAIDriveReturn {
  // State
  saveState: CanvasAIDriveState;

  // Actions
  saveCanvasToAIDrive: (canvas: CanvasDocument, folderId?: string) => Promise<string | null>;
  loadCanvasFromAIDrive: (fileId: string) => Promise<CanvasDocument | null>;
  autoSaveCanvas: (canvas: CanvasDocument, folderId?: string) => void;
  searchCanvasDocuments: (query: string) => Promise<CanvasDocument[]>;
  deleteCanvasFromAIDrive: (fileId: string) => Promise<boolean>;

  // Utilities
  enableAutoSave: (canvas: CanvasDocument, intervalMs?: number, folderId?: string) => void;
  disableAutoSave: () => void;
  getCanvasMetadata: (canvas: CanvasDocument) => any;
}

/**
 * 🔗 Canvas AI Drive Integration Hook
 * 
 * Provides clean layer for Canvas document persistence without disrupting
 * existing Canvas system. Designed for easy expansion and clean integration.
 */
export function useCanvasAIDrive(): UseCanvasAIDriveReturn {
  const aiDriveService = useAiDriveService();
  const { toast } = useToast();
  const { user } = useAuth();

  // State management
  const [saveState, setSaveState] = useState<CanvasAIDriveState>({
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    saveStatus: 'pending',
    error: null
  });

  // Auto-save management
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentCanvas, setCurrentCanvas] = useState<CanvasDocument | null>(null);

  /**
   * 💾 Save Canvas document to AI Drive
   * @param canvas - Canvas document to save
   * @param folderId - Optional folder ID to link canvas to assistant's knowledge base
   */
  const saveCanvasToAIDrive = useCallback(async (canvas: CanvasDocument, folderId?: string): Promise<string | null> => {
    if (!aiDriveService || !user) {
      console.warn('🚫 Canvas AI Drive: Service not available');
      return null;
    }

    setSaveState(prev => ({ ...prev, isSaving: true, saveStatus: 'saving', error: null }));

    try {
      console.log(`💾 Canvas AI Drive: Saving "${canvas.title}"`, { folderId });

      let file: AIDriveFile;

      if (canvas.aiDriveFileId) {
        // Update existing file 🔄
        file = await aiDriveService.updateCanvasDocument(
          canvas.aiDriveFileId,
          canvas.content,
          canvas.title,
          canvas.type
        );
      } else {
        // Create new file 📄
        file = await aiDriveService.saveCanvasDocument(
          canvas.title,
          canvas.content,
          canvas.type,
          folderId
        );
      }

      // Update state
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        saveStatus: 'saved',
        lastSaved: new Date(),
        error: null
      }));

      toast?.({
        title: "✅ Canvas Saved",
        description: `"${canvas.title}" saved to AI Drive`,
        duration: 2000
      });

      return file.id;

    } catch (error) {
      console.error('❌ Canvas AI Drive: Save error:', error);

      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to save canvas'
      }));

      toast?.({
        title: "❌ Save Failed",
        description: `Failed to save "${canvas.title}" to AI Drive`,
        duration: 3000
      });

      return null;
    }
  }, [aiDriveService, user, toast]);

  /**
   * 📂 Load Canvas document from AI Drive
   */
  const loadCanvasFromAIDrive = useCallback(async (fileId: string): Promise<CanvasDocument | null> => {
    if (!aiDriveService || !user) {
      console.warn('🚫 Canvas AI Drive: Service not available for loading');
      return null;
    }

    setSaveState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`📂 Canvas AI Drive: Loading file ${fileId}`);

      const { file, content } = await aiDriveService.loadCanvasDocument(fileId);

      // Generate preview URL if it's not a markdown file
      let previewUrl: string | undefined = undefined;
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isMarkdown = !extension || extension === 'md' || extension === 'txt';

      if (!isMarkdown && file.id) {
        try {
          previewUrl = await aiDriveService.downloadFile(file.id);
        } catch (urlError) {
          console.warn('⚠️ Could not generate preview URL:', urlError);
        }
      }

      const canvasDocument: CanvasDocument = {
        id: file.id,
        title: file.name,
        content: content,
        type: (file.ai_metadata?.document_type as any) || 'blank',
        created: new Date(file.created_at || Date.now()),
        modified: new Date(file.updated_at || Date.now()),
        aiDriveFileId: file.id,
        url: previewUrl,
        metadata: file.ai_metadata
      };

      setSaveState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));

      console.log(`✅ Canvas AI Drive: Successfully loaded "${canvasDocument.title}"`);
      return canvasDocument;

    } catch (error) {
      console.error('❌ Canvas AI Drive: Load error:', error);

      setSaveState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load canvas'
      }));

      return null;
    }
  }, [aiDriveService, user]);

  /**
   * 🔄 Auto-save Canvas (debounced)
   */
  const autoSaveCanvas = useCallback((canvas: CanvasDocument, folderId?: string) => {
    setCurrentCanvas(canvas);

    // Debounced auto-save - only save after user stops typing for 2 seconds
    if (autoSaveInterval) {
      clearTimeout(autoSaveInterval);
    }

    const newInterval = setTimeout(() => {
      saveCanvasToAIDrive(canvas, folderId);
    }, 2000);

    setAutoSaveInterval(newInterval);
  }, [saveCanvasToAIDrive, autoSaveInterval]);

  /**
   * 🔍 Search Canvas documents in AI Drive
   */
  const searchCanvasDocuments = useCallback(async (query: string): Promise<CanvasDocument[]> => {
    if (!aiDriveService || !user) return [];

    try {
      console.log(`🔍 Canvas AI Drive: Searching for "${query}"`);

      // Use listFiles with query
      const files = await aiDriveService.listFiles(null, { query });

      const canvasFiles = files.filter(file =>
        file.name?.endsWith('.canvas.json') ||
        file.tags?.includes('canvas') ||
        file.ai_metadata?.source === 'canvas'
      );

      return canvasFiles.map(file => ({
        id: file.id,
        title: file.name,
        content: file.content_preview || '',
        type: (file.ai_metadata?.document_type as any) || 'blank',
        created: new Date(file.created_at || Date.now()),
        modified: new Date(file.updated_at || Date.now()),
        aiDriveFileId: file.id,
        metadata: file.ai_metadata
      }));

    } catch (error) {
      console.error('❌ Canvas AI Drive: Search error:', error);
      return [];
    }
  }, [aiDriveService, user]);

  /**
   * 🗑️ Delete Canvas from AI Drive
   */
  const deleteCanvasFromAIDrive = useCallback(async (fileId: string): Promise<boolean> => {
    if (!aiDriveService) return false;

    try {
      await aiDriveService.deleteFile(fileId);
      console.log(`🗑️ Canvas AI Drive: Deleted file ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Canvas AI Drive: Delete error:', error);
      return false;
    }
  }, [aiDriveService]);

  /**
   * ⏰ Enable auto-save for Canvas
   */
  const enableAutoSave = useCallback((canvas: CanvasDocument, intervalMs: number = 30000, folderId?: string) => {
    console.log(`⏰ Canvas AI Drive: Enabling auto-save for "${canvas.title}" (${intervalMs}ms)`);

    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }

    const interval = setInterval(() => {
      if (currentCanvas) {
        saveCanvasToAIDrive(currentCanvas, folderId);
      }
    }, intervalMs);

    setAutoSaveInterval(interval);
  }, [saveCanvasToAIDrive, currentCanvas, autoSaveInterval]);

  /**
   * ⏹️ Disable auto-save
   */
  const disableAutoSave = useCallback(() => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      setAutoSaveInterval(null);
      console.log('⏹️ Canvas AI Drive: Auto-save disabled');
    }
  }, [autoSaveInterval]);

  /**
   * 📊 Get Canvas metadata
   */
  const getCanvasMetadata = useCallback((canvas: CanvasDocument) => {
    return {
      wordCount: canvas.content.split(' ').filter(word => word.length > 0).length,
      characterCount: canvas.content.length,
      lastModified: canvas.modified,
      type: canvas.type,
      hasAIDriveBackup: !!canvas.aiDriveFileId,
      version: canvas.metadata?.version || 1,
      assistant: canvas.metadata?.assistant
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveInterval]);

  return {
    // State
    saveState,

    // Actions
    saveCanvasToAIDrive,
    loadCanvasFromAIDrive,
    autoSaveCanvas,
    searchCanvasDocuments,
    deleteCanvasFromAIDrive,

    // Utilities
    enableAutoSave,
    disableAutoSave,
    getCanvasMetadata
  };
}
