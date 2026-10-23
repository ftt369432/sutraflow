import React, { ReactNode } from 'react';
import { Panel } from 'react-resizable-panels';

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  className?: string;
}

export function ResizablePanel({
  children,
  defaultSize,
  minSize,
  maxSize,
  className = '',
}: ResizablePanelProps) {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      className={className}
    >
      {children}
    </Panel>
  );
} 