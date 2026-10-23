import React, { ReactNode } from 'react';
import { Panel } from 'react-resizable-panels';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsiblePanelProps {
  children: ReactNode;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  side: 'left' | 'right';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollapsiblePanel({
  children,
  defaultSize,
  minSize,
  maxSize,
  side,
  isOpen,
  onOpenChange,
}: CollapsiblePanelProps) {
  return (
    <Collapsible.Root open={isOpen} onOpenChange={onOpenChange}>
      <div className="flex h-full">
        {side === 'left' ? (
          <>
            <Collapsible.Content className="h-full">
              <Panel defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
                {children}
              </Panel>
            </Collapsible.Content>
            <Collapsible.Trigger asChild>
              <button
                className="p-2 bg-gray-100 dark:bg-gray-800 border-r dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-sm"
                aria-label={`Toggle ${side} panel`}
              >
                {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </Collapsible.Trigger>
          </>
        ) : (
          <>
            <Collapsible.Trigger asChild>
              <button
                className="p-2 bg-gray-100 dark:bg-gray-800 border-l dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center shadow-sm"
                aria-label={`Toggle ${side} panel`}
              >
                {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </Collapsible.Trigger>
            <Collapsible.Content className="h-full">
              <Panel defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
                {children}
              </Panel>
            </Collapsible.Content>
          </>
        )}
      </div>
    </Collapsible.Root>
  );
} 