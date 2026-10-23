/**
 * 📚 Canvas Document History Hook
 * 
 * Clean layered architecture for Canvas document version control.
 * Follows constant prompt principles: beautiful design, clean integration.
 * 
 * Features:
 * - Undo/Redo functionality with keyboard shortcuts
 * - Document version history tracking
 * - Auto-snapshot creation on significant changes
 * - Non-intrusive integration with existing Canvas system
 * - Beautiful visual indicators for version state
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../useToast';

export interface DocumentSnapshot {
  id: string;
  content: string;
  title: string;
  timestamp: Date;
  changeType: 'manual' | 'auto' | 'major' | 'minor';
  description: string;
  wordCount: number;
  characterCount: number;
}

export interface DocumentHistoryState {
  snapshots: DocumentSnapshot[];
  currentIndex: number;
  hasUndo: boolean;
  hasRedo: boolean;
  isRecording: boolean;
  maxSnapshots: number;
}

export interface UseDocumentHistoryReturn {
  // State
  historyState: DocumentHistoryState;
  currentSnapshot: DocumentSnapshot | null;
  
  // Actions
  createSnapshot: (content: string, title: string, changeType?: DocumentSnapshot['changeType'], description?: string) => void;
  undo: () => DocumentSnapshot | null;
  redo: () => DocumentSnapshot | null;
  jumpToSnapshot: (snapshotId: string) => DocumentSnapshot | null;
  clearHistory: () => void;
  
  // Utilities
  enableAutoSnapshots: (intervalMs?: number) => void;
  disableAutoSnapshots: () => void;
  getHistorySize: () => number;
  exportHistory: () => string;
  importHistory: (historyData: string) => boolean;
}

/**
 * 🔄 Document History Management Hook
 * 
 * Provides clean document versioning without disrupting existing Canvas flow.
 * Designed for easy integration and professional undo/redo experience.
 */
export function useDocumentHistory(
  initialContent: string = '',
  initialTitle: string = 'Untitled',
  maxSnapshots: number = 100
): UseDocumentHistoryReturn {
  const { toast } = useToast();
  
  // Core state
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(true);
  
  // Auto-snapshot management
  const [autoSnapshotInterval, setAutoSnapshotInterval] = useState<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef(initialContent);
  const lastSnapshotTimeRef = useRef(Date.now());

  // Initialize with first snapshot
  useEffect(() => {
    if (snapshots.length === 0 && initialContent) {
      createSnapshot(initialContent, initialTitle, 'manual', 'Initial document');
    }
  }, [initialContent, initialTitle]);

  /**
   * 📸 Create document snapshot
   */
  const createSnapshot = useCallback((
    content: string, 
    title: string, 
    changeType: DocumentSnapshot['changeType'] = 'manual',
    description: string = 'Document updated'
  ) => {
    if (!isRecording) return;

    // Avoid duplicate snapshots
    if (content === lastContentRef.current && snapshots.length > 0) {
      return;
    }

    const snapshot: DocumentSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      title,
      timestamp: new Date(),
      changeType,
      description,
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      characterCount: content.length
    };

    setSnapshots(prev => {
      // Remove any snapshots after current index (when creating new snapshot after undo)
      const newSnapshots = prev.slice(0, currentIndex + 1);
      
      // Add new snapshot
      newSnapshots.push(snapshot);
      
      // Maintain max snapshots limit
      if (newSnapshots.length > maxSnapshots) {
        newSnapshots.shift();
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else {
        setCurrentIndex(newSnapshots.length - 1);
      }
      
      return newSnapshots;
    });

    lastContentRef.current = content;
    lastSnapshotTimeRef.current = Date.now();

    // Visual feedback for manual snapshots
    if (changeType === 'manual') {
      toast?.({
        title: "📸 Snapshot Created",
        description: description,
        duration: 1500
      });
    }

    console.log(`📸 Document History: Created ${changeType} snapshot - "${description}"`);
  }, [isRecording, currentIndex, maxSnapshots, toast]);

  /**
   * ⏪ Undo last change
   */
  const undo = useCallback((): DocumentSnapshot | null => {
    if (currentIndex <= 0) {
      toast?.({
        title: "⏪ Nothing to Undo",
        description: "You're at the beginning of document history",
        duration: 2000
      });
      return null;
    }

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    
    const previousSnapshot = snapshots[newIndex];
    
    toast?.({
      title: "⏪ Undo",
      description: `Restored: ${previousSnapshot.description}`,
      duration: 1500
    });

    console.log(`⏪ Document History: Undo to snapshot "${previousSnapshot.description}"`);
    return previousSnapshot;
  }, [currentIndex, snapshots, toast]);

  /**
   * ⏩ Redo next change
   */
  const redo = useCallback((): DocumentSnapshot | null => {
    if (currentIndex >= snapshots.length - 1) {
      toast?.({
        title: "⏩ Nothing to Redo",
        description: "You're at the latest version",
        duration: 2000
      });
      return null;
    }

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    const nextSnapshot = snapshots[newIndex];
    
    toast?.({
      title: "⏩ Redo",
      description: `Restored: ${nextSnapshot.description}`,
      duration: 1500
    });

    console.log(`⏩ Document History: Redo to snapshot "${nextSnapshot.description}"`);
    return nextSnapshot;
  }, [currentIndex, snapshots, toast]);

  /**
   * 🎯 Jump to specific snapshot
   */
  const jumpToSnapshot = useCallback((snapshotId: string): DocumentSnapshot | null => {
    const snapshotIndex = snapshots.findIndex(s => s.id === snapshotId);
    
    if (snapshotIndex === -1) {
      toast?.({
        title: "❌ Snapshot Not Found",
        description: "The requested version could not be found",
        duration: 2000
      });
      return null;
    }

    setCurrentIndex(snapshotIndex);
    const targetSnapshot = snapshots[snapshotIndex];
    
    toast?.({
      title: "🎯 Version Restored",
      description: `Jumped to: ${targetSnapshot.description}`,
      duration: 2000
    });

    console.log(`🎯 Document History: Jumped to snapshot "${targetSnapshot.description}"`);
    return targetSnapshot;
  }, [snapshots, toast]);

  /**
   * 🗑️ Clear all history
   */
  const clearHistory = useCallback(() => {
    setSnapshots([]);
    setCurrentIndex(-1);
    lastContentRef.current = '';
    
    toast?.({
      title: "🗑️ History Cleared",
      description: "All document versions have been removed",
      duration: 2000
    });

    console.log('🗑️ Document History: All snapshots cleared');
  }, [toast]);

  /**
   * ⏰ Enable auto-snapshots
   */
  const enableAutoSnapshots = useCallback((intervalMs: number = 60000) => {
    if (autoSnapshotInterval) {
      clearInterval(autoSnapshotInterval);
    }

    const interval = setInterval(() => {
      const currentContent = lastContentRef.current;
      const timeSinceLastSnapshot = Date.now() - lastSnapshotTimeRef.current;
      
      // Only create auto-snapshot if content changed and enough time passed
      if (timeSinceLastSnapshot > intervalMs && currentContent) {
        createSnapshot(
          currentContent, 
          'Auto-saved version', 
          'auto', 
          'Automatic snapshot'
        );
      }
    }, intervalMs);

    setAutoSnapshotInterval(interval);
    console.log(`⏰ Document History: Auto-snapshots enabled (${intervalMs}ms interval)`);
  }, [createSnapshot, autoSnapshotInterval]);

  /**
   * ⏹️ Disable auto-snapshots
   */
  const disableAutoSnapshots = useCallback(() => {
    if (autoSnapshotInterval) {
      clearInterval(autoSnapshotInterval);
      setAutoSnapshotInterval(null);
      console.log('⏹️ Document History: Auto-snapshots disabled');
    }
  }, [autoSnapshotInterval]);

  /**
   * 📊 Get history size info
   */
  const getHistorySize = useCallback(() => {
    const totalSize = snapshots.reduce((size, snapshot) => {
      return size + snapshot.content.length + snapshot.title.length;
    }, 0);
    
    return {
      snapshotCount: snapshots.length,
      totalSize,
      averageSize: snapshots.length > 0 ? Math.round(totalSize / snapshots.length) : 0,
      currentIndex,
      maxSnapshots
    };
  }, [snapshots, currentIndex, maxSnapshots]);

  /**
   * 📤 Export history as JSON
   */
  const exportHistory = useCallback(() => {
    const historyData = {
      snapshots,
      currentIndex,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(historyData, null, 2);
  }, [snapshots, currentIndex]);

  /**
   * 📥 Import history from JSON
   */
  const importHistory = useCallback((historyData: string): boolean => {
    try {
      const parsed = JSON.parse(historyData);
      
      if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
        setSnapshots(parsed.snapshots.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })));
        setCurrentIndex(parsed.currentIndex || 0);
        
        toast?.({
          title: "📥 History Imported",
          description: `Restored ${parsed.snapshots.length} versions`,
          duration: 2000
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Document History: Import failed:', error);
      
      toast?.({
        title: "❌ Import Failed",
        description: "Could not import document history",
        duration: 3000
      });
      
      return false;
    }
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSnapshotInterval) {
        clearInterval(autoSnapshotInterval);
      }
    };
  }, [autoSnapshotInterval]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        undo();
      } else if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
                 ((event.ctrlKey || event.metaKey) && event.key === 'y')) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo]);

  // Computed state
  const historyState: DocumentHistoryState = {
    snapshots,
    currentIndex,
    hasUndo: currentIndex > 0,
    hasRedo: currentIndex < snapshots.length - 1,
    isRecording,
    maxSnapshots
  };

  const currentSnapshot = snapshots[currentIndex] || null;

  return {
    // State
    historyState,
    currentSnapshot,
    
    // Actions
    createSnapshot,
    undo,
    redo,
    jumpToSnapshot,
    clearHistory,
    
    // Utilities
    enableAutoSnapshots,
    disableAutoSnapshots,
    getHistorySize,
    exportHistory,
    importHistory
  };
}
