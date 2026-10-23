import { useState, useCallback } from 'react';

export interface Canvas {
  id: string;
  title: string;
  content: string;
  contentType: string;
  isActive: boolean;
  lastModified: Date;
}

export interface CanvasState {
  sideBySideMode: boolean;
  canvases: Canvas[];
  activeCanvasId: string | null;
  canvasContent: string;
  selectedContentType: string;
  canvasUpdating: boolean;
  setSideBySideMode: React.Dispatch<React.SetStateAction<boolean>>;
  setCanvases: React.Dispatch<React.SetStateAction<Canvas[]>>;
  setActiveCanvasId: React.Dispatch<React.SetStateAction<string | null>>;
  setCanvasContent: React.Dispatch<React.SetStateAction<string>>;
  setSelectedContentType: React.Dispatch<React.SetStateAction<string>>;
  setCanvasUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  createNewCanvas: (title: string, contentType: string) => void;
  switchToCanvas: (canvasId: string) => void;
  updateCanvasContent: (content: string) => void;
  appendToCanvas: (content: string) => void;
}

export function useCanvasState(): CanvasState {
  const [sideBySideMode, setSideBySideMode] = useState<boolean>(false);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [canvasContent, setCanvasContent] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<string>('document');
  const [canvasUpdating, setCanvasUpdating] = useState<boolean>(false);

  const createNewCanvas = useCallback((title: string, contentType: string) => {
    const newCanvas: Canvas = {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      content: '',
      contentType,
      isActive: true,
      lastModified: new Date()
    };

    // Set all other canvases to inactive
    setCanvases(prev => {
      const updated = prev.map(canvas => ({ ...canvas, isActive: false }));
      return [...updated, newCanvas];
    });

    setActiveCanvasId(newCanvas.id);
    setCanvasContent('');
    setSelectedContentType(contentType);
    setSideBySideMode(true);

    console.log('🎨 Created new canvas:', newCanvas.title);
  }, []);

  const switchToCanvas = useCallback((canvasId: string) => {
    const canvas = canvases.find(c => c.id === canvasId);
    if (canvas) {
      // Set all canvases to inactive
      setCanvases(prev => prev.map(c => ({
        ...c,
        isActive: c.id === canvasId
      })));

      setActiveCanvasId(canvasId);
      setCanvasContent(canvas.content);
      setSelectedContentType(canvas.contentType);
      setSideBySideMode(true);

      console.log('🔄 Switched to canvas:', canvas.title);
    }
  }, [canvases]);

  const updateCanvasContent = useCallback((content: string) => {
    setCanvasContent(content);

    // Update the active canvas
    if (activeCanvasId) {
      setCanvases(prev => prev.map(canvas => 
        canvas.id === activeCanvasId
          ? { ...canvas, content, lastModified: new Date() }
          : canvas
      ));
    }
  }, [activeCanvasId]);

  const appendToCanvas = useCallback((content: string) => {
    const newContent = canvasContent + (canvasContent ? '\n\n' : '') + content;
    updateCanvasContent(newContent);
    console.log('📝 Appended to canvas:', content.substring(0, 50) + '...');
  }, [canvasContent, updateCanvasContent]);

  return {
    sideBySideMode,
    canvases,
    activeCanvasId,
    canvasContent,
    selectedContentType,
    canvasUpdating,
    setSideBySideMode,
    setCanvases,
    setActiveCanvasId,
    setCanvasContent,
    setSelectedContentType,
    setCanvasUpdating,
    createNewCanvas,
    switchToCanvas,
    updateCanvasContent,
    appendToCanvas,
  };
}
