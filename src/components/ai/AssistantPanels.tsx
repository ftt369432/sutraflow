import React from 'react';
import { Bot, Mail, Sidebar, ExternalLink, Globe, Folder, Pin, X } from 'lucide-react';

import { Button } from '../ui/Button';
import { UnifiedTaskOrchestrator } from './UnifiedTaskOrchestrator';
import UnifiedCanvasSystem from '../canvas/UnifiedCanvasSystem';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';

interface AssistantPanelsProps {
  panelOrder: string[];
  showTaskOrchestration: boolean;
  showAgentTaskManager: boolean;
  showCanvasPanel: boolean;
  showRightPanel: boolean;
  currentConversation: any;
  lastProcessedMessage: any;
  aiAgentTasks: any[];
  activeWorkflowId: string | null;
  intelligenceDisplay: any;
  manifestSummary: string;
  autoTaskOrchestration: boolean;
  canvasProps: any;
  relevantDocuments: any[];
  pinnedDriveFiles: any[];
  setPinnedDriveFiles: React.Dispatch<React.SetStateAction<any[]>>;
  handleDetachPanel: (id: string) => void;
  setShowAgentTaskManager: (val: boolean) => void;
  setShowTaskOrchestration: (val: boolean) => void;
  setShowRightPanel: (val: boolean) => void;
  setPanelOrder: (fn: (prev: string[]) => string[]) => void;
  setActiveWorkflowId: (id: string | null) => void;
  setAiAgentTasks: React.Dispatch<React.SetStateAction<any[]>>;
  setAutoTaskOrchestration: (val: boolean) => void;
  handleTaskCanvasAction: (action: any) => void;
  selectedAssistant: any;
}

export const AssistantPanels: React.FC<AssistantPanelsProps> = ({
  panelOrder,
  showTaskOrchestration,
  showAgentTaskManager,
  showCanvasPanel,
  showRightPanel,
  currentConversation,
  lastProcessedMessage,
  aiAgentTasks,
  activeWorkflowId,
  intelligenceDisplay,
  manifestSummary,
  autoTaskOrchestration,
  canvasProps,
  relevantDocuments,
  pinnedDriveFiles,
  setPinnedDriveFiles,
  handleDetachPanel,
  setShowAgentTaskManager,
  setShowTaskOrchestration,
  setShowRightPanel,
  setPanelOrder,
  setActiveWorkflowId,
  setAiAgentTasks,
  setAutoTaskOrchestration,
  handleTaskCanvasAction,
  selectedAssistant
}) => {
  return (
    <>
      {panelOrder.map((panelId) => (
        <React.Fragment key={panelId}>
          {panelId === 'tasks' && (showTaskOrchestration || showAgentTaskManager) && (
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
          )}

          {panelId === 'canvas' && showCanvasPanel && (
            <div
              className="flex-1 bg-white border-l flex flex-col min-w-0 h-full overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-4', 'ring-blue-400', 'ring-inset');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('ring-4', 'ring-blue-400', 'ring-inset');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-4', 'ring-blue-400', 'ring-inset');
                const data = e.dataTransfer.getData('text/plain');
                if (data) {
                  console.log('📂 Dropped item into Canvas:', data);
                }
              }}
            >
              <UnifiedCanvasSystem
                {...canvasProps}
                onDetach={() => handleDetachPanel('canvas')}
              />
            </div>
          )}

          {panelId === 'knowledge' && showRightPanel && (
            <div className="flex-1 h-full overflow-hidden flex flex-col border-l bg-muted/10">
              <div className="p-2 border-b bg-muted/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider px-2">Knowledge Base</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                  setShowRightPanel(false);
                  setPanelOrder(prev => prev.filter(p => p !== 'knowledge'));
                }}>
                  <Sidebar className="h-3 w-3" />
                </Button>
              </div>
              <KnowledgeBasePanel
                relevantDocuments={relevantDocuments || []}
                onPin={(doc) => {
                  setPinnedDriveFiles((prev: any[]) => {
                    if (prev.find(f => f.id === doc.id)) return prev;
                    return [...prev, { id: doc.id, name: doc.metadata?.title || doc.title || 'Untitled Document' }];
                  });
                }}
              />
            </div>
          )}

          {panelId === 'email' && (
            <div className="flex-1 border-l bg-background h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Assistant
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDetachPanel('email')}>
                  <Sidebar className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="h-20 w-20 bg-blue-50 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-100">
                  <Mail className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Mission Control: Email</h3>
                <p className="text-xs text-slate-500 mt-4 max-w-xs leading-relaxed font-bold italic">
                  "Connected to the Neural Communication Array. Orchestrating {selectedAssistant?.name || 'AI Assistant'}'s inbox synchronization..."
                </p>
                <div className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200">
                  System Online
                </div>
              </div>
            </div>
          )}

          {panelId === 'browser' && (
            <div className="flex-1 border-l bg-background h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Neural Web Search
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDetachPanel('browser')}>
                  <Sidebar className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#f8f9ff_0%,_transparent_100%)] opacity-50" />
                <div className="h-24 w-24 bg-indigo-50 rounded-[3.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-100 relative group">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping opacity-20" />
                  <Globe className="h-12 w-12 text-indigo-600 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-indigo-950 tracking-tight">Cortex Search Engine</h3>
                <p className="text-[11px] text-slate-500 mt-5 max-w-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">
                  Web Synthesis In Progress...
                </p>
                <div className="mt-12 flex gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-1.5 w-1.5 bg-indigo-200 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {panelId === 'ai-drive' && (
            <div className="flex-1 border-l bg-background h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent">
                <h3 className="font-bold flex items-center gap-2 text-blue-700">
                  <Folder className="h-4 w-4" />
                  GenieDrive Repository
                  {pinnedDriveFiles.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                      {pinnedDriveFiles.length} pinned
                    </span>
                  )}
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600" onClick={() => handleDetachPanel('ai-drive')}>
                  <Sidebar className="h-4 w-4" />
                </Button>
              </div>
              {/* Pinned files strip */}
              {pinnedDriveFiles.length > 0 && (
                <div className="px-3 py-2 border-b bg-blue-50/50 dark:bg-blue-950/20 flex flex-wrap gap-1.5">
                  {pinnedDriveFiles.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700">
                      <Pin className="h-2.5 w-2.5" />
                      {f.name}
                      <button
                        onClick={() => setPinnedDriveFiles(prev => prev.filter(p => p.id !== f.id))}
                        className="ml-0.5 hover:text-red-500 transition-colors"
                        title="Unpin"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex-1 overflow-hidden flex flex-col">
                <GenieDriveTree
                  onSelect={(file: any) => {
                    // Pin on single click — injects file into active chat context
                    setPinnedDriveFiles((prev: any[]) => {
                      if (prev.find((f) => f.id === file.id)) return prev; // already pinned
                      return [...prev, { id: file.id, name: file.name, content: file.content, file }];
                    });
                  }}
                  onPin={(file: any) => {
                    setPinnedDriveFiles((prev: any[]) => {
                      if (prev.find((f) => f.id === file.id)) return prev;
                      return [...prev, { id: file.id, name: file.name, content: file.content, file }];
                    });
                  }}
                />
              </div>
            </div>
          )}

        </React.Fragment>
      ))}
    </>
  );
};
