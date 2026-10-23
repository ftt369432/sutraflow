import React from 'react';
import { Bot, ExternalLink, Sidebar } from 'lucide-react';
import { Button } from '../ui/Button';
import { UnifiedTaskOrchestrator } from './UnifiedTaskOrchestrator';

interface AssistantTaskOrchestratorPanelProps {
  currentConversation: any;
  lastProcessedMessage: any;
  aiAgentTasks: any[];
  activeWorkflowId: string | null;
  intelligenceDisplay: any;
  manifestSummary: string;
  autoTaskOrchestration: boolean;
  handleDetachPanel: (id: string) => void;
  setShowAgentTaskManager: (val: boolean) => void;
  setShowTaskOrchestration: (val: boolean) => void;
  setPanelOrder: (fn: (prev: string[]) => string[]) => void;
  setAiAgentTasks: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveWorkflowId: (id: string | null) => void;
  setAutoTaskOrchestration: (val: boolean) => void;
  handleTaskCanvasAction: (action: any) => void;
}

export const AssistantTaskOrchestratorPanel: React.FC<AssistantTaskOrchestratorPanelProps> = ({
  currentConversation,
  lastProcessedMessage,
  aiAgentTasks,
  activeWorkflowId,
  intelligenceDisplay,
  manifestSummary,
  autoTaskOrchestration,
  handleDetachPanel,
  setShowAgentTaskManager,
  setShowTaskOrchestration,
  setPanelOrder,
  setAiAgentTasks,
  setActiveWorkflowId,
  setAutoTaskOrchestration,
  handleTaskCanvasAction
}) => {
  return (
    <div className="flex-1 border-l bg-background h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Task Orchestrator
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDetachPanel('tasks')}>
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
            setShowAgentTaskManager(false);
            setShowTaskOrchestration(false);
            setPanelOrder(prev => prev.filter(p => p !== 'tasks'));
          }}>
            <Sidebar className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <UnifiedTaskOrchestrator
          isVisible={true}
          onToggle={() => { }}
          currentConversation={currentConversation}
          lastMessage={lastProcessedMessage}
          tasks={aiAgentTasks}
          workflowId={activeWorkflowId || undefined}
          intelligenceDisplay={intelligenceDisplay}
          manifestSummary={manifestSummary}
          onTaskUpdate={(task) => setAiAgentTasks((prev: any[]) => prev.map(t => t.id === task.id ? task : t))}
          onWorkflowComplete={(wid: string | null) => setActiveWorkflowId(wid)}
          autoMode={autoTaskOrchestration}
          onAutoModeChange={setAutoTaskOrchestration}
          onCanvasAction={handleTaskCanvasAction}
        />
      </div>
    </div>
  );
};
