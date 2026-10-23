import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { GripVertical } from 'lucide-react';
import '../../styles/components/resizable-panels.css';

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number; // Percentage (0-100)
  minLeftWidth?: number; // Percentage
  maxLeftWidth?: number; // Percentage
  onResize?: (leftWidth: number) => void;
  className?: string;
  showSplitter?: boolean;
  autoHideElements?: boolean;
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 33, // Default 1/3 for chat
  minLeftWidth = 20,
  maxLeftWidth = 80,
  onResize,
  className,
  showSplitter = true,
  autoHideElements = true
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    
    e.preventDefault();
  }, [leftWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerRect.width) * 100;
    
    const newWidth = Math.min(
      maxLeftWidth,
      Math.max(minLeftWidth, startWidthRef.current + deltaPercent)
    );
    
    setLeftWidth(newWidth);
    onResize?.(newWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className={cn("resizable-panels", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left Panel - Chat */}
      <div 
        className={cn(
          "resizable-panel",
          autoHideElements && !isHovering && !isDragging && "auto-hide",
          isHovering && "hovering",
          isDragging && "dragging"
        )}
        style={{ '--panel-width': `${leftWidth}%` } as React.CSSProperties}
      >
        {leftPanel}
      </div>

      {/* Resizable Splitter */}
      {showSplitter && (
        <div 
          className={cn(
            "resizable-splitter",
            isDragging && "dragging"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="resizable-splitter-grip">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Drag indicator */}
          {isDragging && (
            <div className="resizable-drag-indicator">
              {leftWidth.toFixed(0)}% | {(100 - leftWidth).toFixed(0)}%
            </div>
          )}
        </div>
      )}

      {/* Right Panel - Canvas */}
      <div 
        className={cn(
          "resizable-panel",
          autoHideElements && !isHovering && !isDragging && "auto-hide",
          isHovering && "hovering",
          isDragging && "dragging"
        )}
        style={{ '--panel-width': `${100 - leftWidth}%` } as React.CSSProperties}
      >
        {rightPanel}
      </div>

      {/* Auto-hide overlay for better UX */}
      {autoHideElements && !isHovering && !isDragging && (
        <div className="auto-hide-overlay">
          <div className="auto-hide-hint">
            Hover to show controls
          </div>
        </div>
      )}
    </div>
  );
}
