import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ResizableDividerProps {
  onResize?: (leftWidth: number, rightWidth: number) => void;
  minLeftWidth?: number;
  minRightWidth?: number;
  className?: string;
}

export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  minLeftWidth = 300,
  minRightWidth = 400,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const dividerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(e.clientX);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = dividerRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // Calculate new widths
    const leftWidth = Math.max(minLeftWidth, Math.min(containerWidth - minRightWidth, mouseX));
    const rightWidth = containerWidth - leftWidth;
    
    // Notify parent of size change
    onResize?.(leftWidth, rightWidth);
  }, [isDragging, minLeftWidth, minRightWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={dividerRef}
      className={cn(
        "w-1 bg-border hover:bg-border/80 cursor-col-resize transition-colors duration-200 group relative",
        isDragging && "bg-primary",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-8 bg-primary/50 rounded-full" />
      </div>
      
      {/* Hover area for easier grabbing */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  );
};
