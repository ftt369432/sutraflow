import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ResizablePanelGroupProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  className?: string;
}

export function ResizablePanelGroup({
  children,
  direction,
  className,
}: ResizablePanelGroupProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full gap-0',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (index === React.Children.count(children) - 1) {
          return child;
        }

        return (
          <>
            {child}
            <ResizeHandle direction={direction} />
          </>
        );
      })}
    </div>
  );
}

interface ResizablePanelProps {
  children?: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export function ResizablePanel({
  children,
  defaultSize = 33.33,
  minSize = 10,
  maxSize = 90,
  className,
}: ResizablePanelProps) {
  // Map sizes to CSS classes to avoid inline styles
  const getSizeClass = (size: number) => {
    const rounded = Math.round(size / 5) * 5; // Round to nearest 5
    return `panel-size-${rounded}`;
  };
  
  return (
    <div
      className={cn(
        'relative h-full resizable-panel', 
        getSizeClass(defaultSize),
        className
      )}
      data-min-size={minSize}
      data-max-size={maxSize}
    >
      {children}
    </div>
  );
}

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
}

export function ResizeHandle({ direction }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<number>(0);
  const startSizesRef = useRef<number[]>([]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    setIsResizing(true);
    
    // Record initial position
    if (direction === 'horizontal') {
      startPosRef.current = e.clientX;
    } else {
      startPosRef.current = e.clientY;
    }
    
    // Record initial sizes of previous and next panels
    const handle = handleRef.current;
    if (handle) {
      const prevPanel = handle.previousElementSibling as HTMLElement;
      const nextPanel = handle.nextElementSibling as HTMLElement;
      
      if (prevPanel && nextPanel) {
        startSizesRef.current = [
          prevPanel.getBoundingClientRect().width,
          nextPanel.getBoundingClientRect().width
        ];
      }
    }
    
    // Add event listeners for mouse move and up
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const handle = handleRef.current;
    if (!handle) return;
    
    const prevPanel = handle.previousElementSibling as HTMLElement;
    const nextPanel = handle.nextElementSibling as HTMLElement;
    
    if (!prevPanel || !nextPanel) return;
    
    // Calculate how far mouse has moved
    let delta: number;
    if (direction === 'horizontal') {
      delta = e.clientX - startPosRef.current;
    } else {
      delta = e.clientY - startPosRef.current;
    }
    
    // Calculate new sizes
    const prevPanelRect = prevPanel.getBoundingClientRect();
    const nextPanelRect = nextPanel.getBoundingClientRect();
    
    const totalSize = prevPanelRect.width + nextPanelRect.width;
    const minSize = totalSize * 0.1; // 10% minimum
    
    let newPrevSize = startSizesRef.current[0] + delta;
    let newNextSize = startSizesRef.current[1] - delta;
    
    // Apply constraints
    if (newPrevSize < minSize) {
      newPrevSize = minSize;
      newNextSize = totalSize - minSize;
    } else if (newNextSize < minSize) {
      newNextSize = minSize;
      newPrevSize = totalSize - minSize;
    }
    
    // Apply new sizes as percentages
    const prevPercent = (newPrevSize / totalSize) * 100;
    const nextPercent = (newNextSize / totalSize) * 100;
    
    prevPanel.style.flexBasis = `${prevPercent}%`;
    nextPanel.style.flexBasis = `${nextPercent}%`;
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={handleRef}
      className={cn(
        'group flex items-center justify-center transition-all duration-200',
        direction === 'horizontal'
          ? 'h-full w-1 cursor-col-resize hover:w-2'
          : 'h-1 w-full cursor-row-resize hover:h-2',
        isResizing 
          ? 'bg-blue-400 shadow-md' 
          : 'bg-gray-100 dark:bg-gray-800 hover:bg-blue-200 dark:hover:bg-blue-700'
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'transition-all duration-200 opacity-0 group-hover:opacity-100',
          direction === 'horizontal' 
            ? 'h-4 w-0.5 group-hover:h-6 group-hover:w-0.5' 
            : 'h-0.5 w-4 group-hover:h-0.5 group-hover:w-6',
          isResizing 
            ? 'bg-white opacity-100' 
            : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-blue-500 dark:group-hover:bg-blue-400'
        )}
      />
    </div>
  );
} 