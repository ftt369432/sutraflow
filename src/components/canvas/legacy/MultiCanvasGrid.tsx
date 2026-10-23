/**
 * 🎨 Multi-Canvas Grid View
 * 
 * Displays multiple canvases simultaneously in a grid layout
 * for true parallel task execution and monitoring
 */

import React, { useState, useEffect } from 'react';
import { FileText, X, Maximize2, Minimize2, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { cn } from '../../lib/utils';
import { PolishedCanvasOutput } from './PolishedCanvasOutput';
import { TaskCanvas, DetectedTask } from '../../services/canvas/MultiCanvasTaskOrchestrator';

interface MultiCanvasGridProps {
  canvases: TaskCanvas[];
  tasks: DetectedTask[];
  onCanvasUpdate: (canvasId: string, content: string) => void;
  onCanvasClose: (canvasId: string) => void;
  onCanvasExport: (canvasId: string) => void;
  onTaskComplete: (taskId: string) => void;
  className?: string;
}

interface CanvasGridItem {
  canvas: TaskCanvas;
  task: DetectedTask;
  isVisible: boolean;
  isMaximized: boolean;
  progress: number;
}

export function MultiCanvasGrid({
  canvases,
  tasks,
  onCanvasUpdate,
  onCanvasClose,
  onCanvasExport,
  onTaskComplete,
  className = ''
}: MultiCanvasGridProps) {
  const [gridItems, setGridItems] = useState<CanvasGridItem[]>([]);
  const [gridLayout, setGridLayout] = useState<'1x1' | '1x2' | '2x2' | '2x3' | '3x3'>('2x2');
  const [maximizedCanvas, setMaximizedCanvas] = useState<string | null>(null);

  // Initialize grid items
  useEffect(() => {
    const items: CanvasGridItem[] = canvases.map(canvas => {
      const task = tasks.find(t => t.id === canvas.taskId);
      return {
        canvas,
        task: task!,
        isVisible: true,
        isMaximized: false,
        progress: canvas.progress || 0
      };
    });

    setGridItems(items);

    // Auto-adjust grid layout based on canvas count
    if (canvases.length <= 1) setGridLayout('1x1');
    else if (canvases.length <= 2) setGridLayout('1x2');
    else if (canvases.length <= 4) setGridLayout('2x2');
    else if (canvases.length <= 6) setGridLayout('2x3');
    else setGridLayout('3x3');

  }, [canvases, tasks]);

  // Auto-update progress
  useEffect(() => {
    const interval = setInterval(() => {
      setGridItems(prev => prev.map(item => {
        const canvas = canvases.find(c => c.id === item.canvas.id);
        if (canvas) {
          const newProgress = Math.min(100, item.progress + Math.random() * 5); // Simulate progress
          canvas.progress = newProgress;
          
          // Auto-complete task when canvas reaches 100%
          if (newProgress >= 100 && item.task.status !== 'completed') {
            onTaskComplete(item.task.id);
          }
          
          return {
            ...item,
            canvas,
            progress: newProgress
          };
        }
        return item;
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [canvases, onTaskComplete]);

  const getGridClassName = () => {
    if (maximizedCanvas) return 'grid-cols-1';
    
    switch (gridLayout) {
      case '1x1': return 'grid-cols-1';
      case '1x2': return 'grid-cols-1 lg:grid-cols-2';
      case '2x2': return 'grid-cols-1 md:grid-cols-2';
      case '2x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case '3x3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };

  const toggleCanvasVisibility = (canvasId: string) => {
    setGridItems(prev => prev.map(item => 
      item.canvas.id === canvasId 
        ? { ...item, isVisible: !item.isVisible }
        : item
    ));
  };

  const toggleMaximize = (canvasId: string) => {
    if (maximizedCanvas === canvasId) {
      setMaximizedCanvas(null);
    } else {
      setMaximizedCanvas(canvasId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'medium': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'low': return 'border-gray-500 bg-gray-50 dark:bg-gray-900/10';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const getStatusIcon = (task: DetectedTask, progress: number) => {
    if (task.status === 'completed' || progress >= 100) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (progress > 0) {
      return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const visibleItems = gridItems.filter(item => item.isVisible);
  const maxVisibleItems = maximizedCanvas ? 1 : (gridLayout === '3x3' ? 9 : gridLayout === '2x3' ? 6 : 4);

  return (
    <div className={cn("multi-canvas-grid h-full flex flex-col", className)}>
      {/* Grid Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Multi-Canvas Workspace</h2>
          <Badge variant="secondary" className="text-xs">
            {visibleItems.length} Active
          </Badge>
          {gridItems.some(item => item.task.status === 'completed') && (
            <Badge variant="default" className="text-xs bg-green-500 text-white">
              {gridItems.filter(item => item.task.status === 'completed').length} Complete
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={gridLayout}
            onChange={(e) => setGridLayout(e.target.value as any)}
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700"
            disabled={maximizedCanvas !== null}
            title="Select grid layout"
            aria-label="Grid layout selector"
          >
            <option value="1x1">Single View</option>
            <option value="1x2">Side by Side</option>
            <option value="2x2">2×2 Grid</option>
            <option value="2x3">2×3 Grid</option>
            <option value="3x3">3×3 Grid</option>
          </select>
        </div>
      </div>

      {/* Canvas Grid */}
      <div className={cn(
        "flex-1 p-3 grid gap-3 overflow-hidden",
        getGridClassName()
      )}>
        {visibleItems.slice(0, maxVisibleItems).map((item) => {
          const isMaximized = maximizedCanvas === item.canvas.id;
          const isCompleted = item.task.status === 'completed' || item.progress >= 100;
          
          return (
            <Card
              key={item.canvas.id}
              className={cn(
                "canvas-grid-item flex flex-col border-2 transition-all duration-200",
                getPriorityColor(item.task.priority),
                isMaximized && "col-span-full row-span-full",
                isCompleted && "ring-2 ring-green-500"
              )}
            >
              {/* Canvas Header */}
              <CardHeader className="p-3 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getStatusIcon(item.task, item.progress)}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold truncate" title={item.canvas.title}>
                        {item.canvas.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {item.task.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {item.task.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleCanvasVisibility(item.canvas.id)}
                      title="Toggle visibility"
                    >
                      {item.isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleMaximize(item.canvas.id)}
                      title={isMaximized ? "Minimize" : "Maximize"}
                    >
                      {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                      onClick={() => onCanvasClose(item.canvas.id)}
                      title="Close canvas"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      isCompleted ? "bg-green-500" : "bg-blue-500",
                      item.progress === 0 ? "w-0.5" :
                      item.progress >= 100 ? "w-full" :
                      item.progress >= 90 ? "w-11/12" :
                      item.progress >= 75 ? "w-3/4" :
                      item.progress >= 50 ? "w-1/2" :
                      item.progress >= 25 ? "w-1/4" : "w-1/12"
                    )}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{Math.round(item.progress)}% complete</span>
                  <span>{item.task.estimatedTime}m estimated</span>
                </div>
              </CardHeader>

              {/* Canvas Content */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full">
                  <PolishedCanvasOutput
                    content={item.canvas.content}
                    title={item.canvas.title}
                    contentType={item.canvas.contentType}
                    documentId={item.canvas.id}
                    aiDriveFileId={item.canvas.aiDriveFileId}
                    isUpdating={item.progress > 0 && item.progress < 100}
                    onExport={() => onCanvasExport(item.canvas.id)}
                    onContentChange={(newContent) => {
                      onCanvasUpdate(item.canvas.id, newContent);
                      
                      // Update progress based on content length
                      const progressByContent = Math.min(95, (newContent.length / 1000) * 100);
                      item.progress = Math.max(item.progress, progressByContent);
                    }}
                    onTitleChange={(newTitle) => {
                      item.canvas.title = newTitle;
                    }}
                    onSave={() => {/* Handle save */}}
                    onAIDriveSave={(aiDriveFileId) => {
                      item.canvas.aiDriveFileId = aiDriveFileId;
                      item.canvas.savedToAIDrive = true;
                    }}
                    onToast={(message) => {
                      console.log('Canvas toast:', message);
                    }}
                    className="h-full border-0"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grid Footer */}
      {gridItems.length > 0 && (
        <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
          <div>
            Showing {visibleItems.length} of {gridItems.length} canvases
          </div>
          <div className="flex items-center gap-4">
            <span>
              Completed: {gridItems.filter(item => item.task.status === 'completed').length}/{gridItems.length}
            </span>
            <span>
              Avg Progress: {Math.round(gridItems.reduce((sum, item) => sum + item.progress, 0) / gridItems.length)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🎛️ Hook for managing multi-canvas grid state
 */
export function useMultiCanvasGrid() {
  const [canvases, setCanvases] = useState<TaskCanvas[]>([]);
  const [isGridMode, setIsGridMode] = useState(false);

  const addCanvas = (canvas: TaskCanvas) => {
    setCanvases(prev => [...prev, canvas]);
    if (!isGridMode && canvases.length >= 1) {
      setIsGridMode(true);
    }
  };

  const removeCanvas = (canvasId: string) => {
    setCanvases(prev => prev.filter(c => c.id !== canvasId));
    if (canvases.length <= 1) {
      setIsGridMode(false);
    }
  };

  const updateCanvas = (canvasId: string, updates: Partial<TaskCanvas>) => {
    setCanvases(prev => prev.map(canvas => 
      canvas.id === canvasId ? { ...canvas, ...updates } : canvas
    ));
  };

  const clearAllCanvases = () => {
    setCanvases([]);
    setIsGridMode(false);
  };

  return {
    canvases,
    isGridMode,
    addCanvas,
    removeCanvas,
    updateCanvas,
    clearAllCanvases,
    setIsGridMode
  };
}
