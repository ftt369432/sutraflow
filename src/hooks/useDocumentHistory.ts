import { useState, useCallback, useRef } from 'react';
import { DocumentHistoryEntry } from '../components/canvas/DocumentHistory';

export function useDocumentHistory(initialContent: string, maxHistorySize: number = 50) {
  const [history, setHistory] = useState<DocumentHistoryEntry[]>([
    {
      id: 'initial',
      content: initialContent,
      timestamp: new Date(),
      changeDescription: 'Initial document'
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastSaveTime = useRef<number>(Date.now());

  const addToHistory = useCallback((content: string, changeDescription?: string) => {
    const now = Date.now();
    
    // Skip if content is the same as current entry
    if (history[currentIndex] && history[currentIndex].content === content) {
      return;
    }
    
    // Debounce rapid changes - only save if 1+ seconds have passed or content changed significantly
    const timeDiff = now - lastSaveTime.current;
    const contentDiff = Math.abs(content.length - (history[currentIndex]?.content.length || 0));
    
    if (timeDiff < 1000 && contentDiff < 50) {
      return;
    }
    
    lastSaveTime.current = now;
    
    const newEntry: DocumentHistoryEntry = {
      id: `${now}`,
      content,
      timestamp: new Date(),
      changeDescription: changeDescription || `Edit ${new Date().toLocaleTimeString()}`
    };

    setHistory(prev => {
      // Remove any history after current index (when undoing then making new changes)
      const truncatedHistory = prev.slice(0, currentIndex + 1);
      
      // Add new entry
      const newHistory = [...truncatedHistory, newEntry];
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        const trimmed = newHistory.slice(-maxHistorySize);
        setCurrentIndex(trimmed.length - 1);
        return trimmed;
      }
      
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [history, currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1].content;
    }
    return history[currentIndex].content;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1].content;
    }
    return history[currentIndex].content;
  }, [currentIndex, history]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    return history[0].content;
  }, [history]);

  const getCurrentContent = useCallback(() => {
    return history[currentIndex]?.content || initialContent;
  }, [history, currentIndex, initialContent]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    history,
    currentIndex,
    addToHistory,
    undo,
    redo,
    reset,
    getCurrentContent,
    canUndo,
    canRedo
  };
}
