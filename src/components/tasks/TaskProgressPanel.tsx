import React, { useState, useEffect } from 'react';
import { CollapsibleTaskList, CalendarEventTaskList, AgentWorkflowTaskList } from './CollapsibleTaskList';
import { Button } from '../ui/Button';
import { X, Minimize2, Maximize2, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskProgressPanelProps {
  className?: string;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function TaskProgressPanel({
  className,
  onClose,
  isMinimized = false,
  onToggleMinimize
}: TaskProgressPanelProps) {
  const [activeWorkflows, setActiveWorkflows] = useState<{
    id: string;
    type: 'calendar' | 'agent' | 'email';
    title: string;
    startTime: Date;
    status: 'active' | 'completed' | 'paused';
  }[]>([]);

  // Mock active workflows - in production this would be from your workflow service
  useEffect(() => {
    setActiveWorkflows([
      {
        id: 'workflow-1',
        type: 'agent',
        title: 'Auto-Calendar Processing',
        startTime: new Date(),
        status: 'active'
      },
      {
        id: 'workflow-2',
        type: 'calendar',
        title: 'WCAB Hearing Prep',
        startTime: new Date(Date.now() - 300000),
        status: 'active'
      }
    ]);
  }, []);

  if (isMinimized) {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50",
        className
      )}>
        <div className="flex items-center gap-2 p-3 bg-blue-50 border-b">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {activeWorkflows.filter(w => w.status === 'active').length} active workflows
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="p-1 h-6 w-6"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed right-4 top-20 bottom-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-40 flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-900">Task Progress</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Refresh workflows
              console.log('Refreshing workflows...');
            }}
            className="p-1 h-6 w-6"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="p-1 h-6 w-6"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Workflows */}
        {activeWorkflows.filter(w => w.status === 'active').map((workflow) => (
          <div key={workflow.id}>
            {workflow.type === 'agent' && (
              <AgentWorkflowTaskList workflowId={workflow.id} />
            )}
            {workflow.type === 'calendar' && (
              <CalendarEventTaskList 
                eventId={workflow.id}
                onTaskUpdate={(taskId, status) => {
                  console.log('Task updated:', taskId, status);
                }}
              />
            )}
          </div>
        ))}

        {/* Manual Tasks */}
        <CollapsibleTaskList
          title="Manual Actions Required"
          tasks={[
            {
              id: 'manual-1',
              title: 'Review auto-created calendar event',
              description: 'Verify WCAB hearing details are correct',
              status: 'pending',
              type: 'calendar',
              timestamp: new Date(),
            },
            {
              id: 'manual-2',
              title: 'Approve email template',
              description: 'Client notification email needs approval',
              status: 'pending',
              type: 'email',
              timestamp: new Date(),
            }
          ]}
          defaultExpanded={false}
          showProgress={true}
          onTaskClick={(task) => {
            console.log('Manual task clicked:', task);
            // Handle manual task interaction
          }}
        />

        {/* Completed Workflows */}
        <CollapsibleTaskList
          title="Recently Completed"
          tasks={[
            {
              id: 'completed-1',
              title: 'Email batch processing',
              description: 'Processed 25 emails, created 4 calendar events',
              status: 'completed',
              type: 'agent',
              duration: '3 min',
              timestamp: new Date(Date.now() - 600000),
            },
            {
              id: 'completed-2',
              title: 'Document classification',
              description: 'Categorized 12 legal documents',
              status: 'completed',
              type: 'automation',
              duration: '1 min',
              timestamp: new Date(Date.now() - 900000),
            }
          ]}
          defaultExpanded={false}
          showProgress={false}
          className="border-green-200 bg-green-50"
        />
      </div>

      {/* Footer */}
      <div className="border-t p-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {activeWorkflows.filter(w => w.status === 'active').length} active workflows
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook for managing task progress panel state
export function useTaskProgressPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const show = () => {
    setIsVisible(true);
    setIsMinimized(false);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return {
    isVisible,
    isMinimized,
    show,
    hide,
    toggleMinimize
  };
}
