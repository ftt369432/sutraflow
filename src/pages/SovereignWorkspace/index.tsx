import { sovereignWorkspace } from '../../services/sovereign/sovereignWorkspace';
/**
 * 👑 SovereignWorkspace
 * 
 * Modular layout container for the GenieFlow Sovereign Workspace.
 * Implements a flexible grid layout holding:
 * - Collapsible navigation sidebar
 * - Chat stream panel (WorkspaceChatPanel)
 * - Flexible canvas and task panels
 */
import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { Bot, PanelLeftClose, PanelLeftOpen, FileText, Folder, X, Sidebar, ExternalLink, Brain, Sparkles, ListTodo, Mail, Globe } from 'lucide-react';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import { useChatOrchestrator } from './hooks/useChatOrchestrator';
import { WorkspaceChatPanel } from './components/WorkspaceChatPanel';
import { AssistantSidebarPanel } from '../../components/ai/AssistantSidebarPanel';
import { FlexibleConversationSidebar } from '../../components/ai/FlexibleConversationSidebar';
import UnifiedCanvasSystem from '../../components/canvas/UnifiedCanvasSystem';
import SovereignDocViewer from '../../components/canvas/SovereignDocViewer';
import UnifiedTaskOrchestrator from '../../components/ai/UnifiedTaskOrchestrator';
import { AssistantPageHeader } from '../../components/ai/AssistantPageHeader';
import { NeuralControlPanel } from '../../components/NeuralControlPanel';
import { AIErrorBoundary } from '../../components/error/AIErrorBoundary';
import { TooltipProvider } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { AgentObserverInbox } from '../../components/ai/AgentObserverInbox';
import type { ViewerDocument, DriveFileNode } from '../../components/canvas/SovereignDocViewer';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { KnowledgeBasePanel } from '../../components/ai/KnowledgeBasePanel';
import { GenieDriveTree } from '../../components/geniedrive/GenieDriveTree';
import { BrowserPanel } from '../../components/browser/BrowserPanel';

export function SovereignWorkspace() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();

  // 🧠 State Hook
  const state = useWorkspaceState();

  // 📚 Knowledge Base / Drive Integration
  const { folders: kbFolders, documents: kbDocs } = useKnowledgeBaseStore();

  // Convert KB folders/files into the Tree representation expected by SovereignDocViewer
  const driveFileTree = useMemo(() => {
    const folderMap = new Map<string, DriveFileNode>();
    
    kbFolders.forEach((f) => {
      folderMap.set(f.id, {
        id: f.id,
        name: f.name,
        isFolder: true,
        children: [],
      });
    });

    const rootNodes: DriveFileNode[] = [];

    kbFolders.forEach((f) => {
      const node = folderMap.get(f.id)!;
      if (f.parentId && folderMap.has(f.parentId)) {
        folderMap.get(f.parentId)!.children!.push(node);
      } else if (f.parent_folder_id && folderMap.has(f.parent_folder_id)) {
        folderMap.get(f.parent_folder_id)!.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    kbDocs.forEach((d) => {
      const fileNode: DriveFileNode = {
        id: d.id,
        name: d.title,
        mimeType: d.metadata?.mime_type || (d.title.endsWith('.pdf') ? 'application/pdf' : 'text/markdown'),
        isFolder: false,
      };

      if (d.folderId && folderMap.has(d.folderId)) {
        folderMap.get(d.folderId)!.children!.push(fileNode);
      } else {
        rootNodes.push(fileNode);
      }
    });

    return rootNodes;
  }, [kbFolders, kbDocs]);

  // Merge active canvases, local uploaded files, and pinned drive files for the document viewer
  const viewerDocuments = useMemo(() => {
    const list: ViewerDocument[] = (state.currentCanvases || []).map((c) => ({
      id: c.id,
      title: c.title || 'Untitled',
      content: c.content || '',
      modified: c.modified ? new Date(c.modified) : undefined,
      metadata: c.metadata,
      mimeType: c.mimeType || 'text/markdown',
      fileId: c.fileId,
    }));

    // Add local uploaded files (e.g. PDFs, images, text files)
    state.uploadedFiles.forEach((file) => {
      const id = `local-${file.name}`;
      if (list.some(d => d.id === id)) return;

      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.png')) mimeType = 'image/png';
        else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) mimeType = 'text/markdown';
      }

      list.push({
        id,
        title: `📎 Exhibit: ${file.name}`,
        content: '',
        metadata: { localFile: file },
        mimeType,
      });
    });

    // Add pinned drive files
    state.pinnedDriveFiles.forEach((file) => {
      const id = `drive-${file.id}`;
      if (list.some(d => d.id === id)) return;

      let mimeType = 'application/octet-stream';
      if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (file.name.endsWith('.png')) mimeType = 'image/png';
      else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) mimeType = 'text/markdown';

      list.push({
        id,
        title: `🗂️ Pinned: ${file.name}`,
        content: '',
        fileId: file.id,
        mimeType,
      });
    });

    return list;
  }, [state.currentCanvases, state.uploadedFiles, state.pinnedDriveFiles]);

  // Open file from explorer tree
  const handleOpenFileFromTree = useCallback((node: DriveFileNode) => {
    if (node.isFolder) return;

    const isAlreadyOpen = state.currentCanvases.some(c => c.id === node.id || c.fileId === node.id);
    if (!isAlreadyOpen) {
      const kbDoc = kbDocs.find(d => d.id === node.id);
      if (kbDoc) {
        state.setCurrentCanvases(prev => [
          ...prev,
          {
            id: kbDoc.id,
            title: kbDoc.title,
            content: kbDoc.content || '',
            fileId: kbDoc.id,
            mimeType: kbDoc.metadata?.mime_type || (kbDoc.title.endsWith('.pdf') ? 'application/pdf' : 'text/markdown'),
            metadata: kbDoc.metadata,
          }
        ]);
      }
    }
    state.openCanvas(node.id, 'viewer');
  }, [kbDocs, state]);
  
  // 🧠 Chat Orchestrator Hook
  const chat = useChatOrchestrator({
    workspaceState: state,
    enableAgenticExecution: state.enableAgenticExecution,
    smartAutonomyMode: state.smartAutonomyMode,
    selectedAssistant: state.selectedAssistant,
    currentPromptTier: state.currentPromptTier,
    user: user,
  });

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // File drop helpers
  const handleFiles = useCallback((files: FileList) => {
    const list = Array.from(files);
    state.setUploadedFiles(prev => [...prev, ...list]);
  }, [state]);

  const handleSelectConversation = useCallback((id: string) => {
    console.log('Select conversation:', id);
  }, []);

  const renderPinnedFiles = useCallback(() => {
    if (state.uploadedFiles.length === 0 && state.pinnedDriveFiles.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-3 animate-in slide-in-from-bottom-2 duration-300">
        {state.uploadedFiles.map((file, index) => {
          const fileId = `local-${file.name}`;
          return (
            <div key={`local-${index}`} className="flex items-center gap-1.5 bg-primary/10 text-primary-foreground border border-primary/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight">
              <button
                onClick={() => {
                  state.setActiveCanvasId(fileId);
                  state.setCanvasViewMode('viewer');
                  state.setShowCanvasPanel(true);
                }}
                className="flex items-center gap-1 hover:underline text-left"
                title="Click to Preview Exhibit"
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px]">{file.name}</span>
              </button>
              <button
                onClick={() => {
                  state.setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                  if (state.activeCanvasId === fileId) {
                    state.setActiveCanvasId(null);
                  }
                }}
                className="ml-1 text-primary/60 hover:text-primary transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {state.pinnedDriveFiles.map((file) => {
          const fileId = `drive-${file.id}`;
          return (
            <div key={`drive-${file.id}`} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight">
              <button
                onClick={() => {
                  state.setActiveCanvasId(fileId);
                  state.setCanvasViewMode('viewer');
                  state.setShowCanvasPanel(true);
                }}
                className="flex items-center gap-1 hover:underline text-left"
                title="Click to Preview Exhibit"
              >
                <Folder className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px]">{file.name}</span>
              </button>
              <button
                onClick={() => {
                  state.setPinnedDriveFiles(prev => prev.filter(f => f.id !== file.id));
                  if (state.activeCanvasId === fileId) {
                    state.setActiveCanvasId(null);
                  }
                }}
                className="ml-1 text-emerald-600/60 hover:text-emerald-600 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  }, [state]);

  // 📡 Listen for agentic canvas creation events and display in the live workspace
  useEffect(() => {
    const handleCanvasCreated = (e: any) => {
      const doc = e.detail;
      if (!doc || !doc.id) return;
      console.log('🎨 SovereignWorkspace: Received genieflow:create-canvas event:', doc.title);
      const newDoc: ViewerDocument = {
        id: doc.id,
        title: doc.title || 'Generated Legal Document',
        content: doc.content || '',
        modified: new Date()
      };
      state.setCurrentCanvases(prev => {
        const filtered = prev.filter(c => c.id !== doc.id);
        return [newDoc, ...filtered];
      });
      state.setActiveCanvasId(doc.id);
      state.setCanvasViewMode('viewer');
      state.setShowCanvasPanel(true);
      state.setPanelOrder(prev => prev.includes('canvas') ? prev : [...prev, 'canvas']);
    };

    const handleFileModified = (e: any) => {
      const { path: filePath, content } = e.detail || {};
      if (!filePath || !content) return;
      state.setCurrentCanvases(prev =>
        prev.map(c => (c.metadata?.path === filePath || c.title === filePath.split(/[/\\]/).pop())
          ? { ...c, content, modified: new Date() }
          : c
        )
      );
    };

    window.addEventListener('genieflow:create-canvas', handleCanvasCreated as EventListener);
    window.addEventListener('genieflow:file-modified', handleFileModified as EventListener);
    return () => {
      window.removeEventListener('genieflow:create-canvas', handleCanvasCreated as EventListener);
      window.removeEventListener('genieflow:file-modified', handleFileModified as EventListener);
    };
  }, [state]);

  // Keyboard shortcut listener
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chat.handleSendMessage();
    }
  }, [chat]);

  return (
    <AIErrorBoundary>
      <TooltipProvider>
        <div className={cn(
          'flex flex-row h-full min-h-0 flex-1 rounded-lg border w-full max-w-[100vw] overflow-hidden relative',
          isDark ? 'bg-gray-900 text-white' : 'bg-background text-foreground'
        )}>
          {/* 1. Left Sidebar: Assistants & Chats */}
          {state.showSidebar && (
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-white dark:bg-slate-900 shadow-sm animate-in slide-in-from-left duration-300 z-10 overflow-hidden">
              <AssistantSidebarPanel
                autoCloseSidebar={state.autoCloseSidebar}
                setAutoCloseSidebar={state.setAutoCloseSidebar}
                handleNewChat={chat.handleNewChat}
                isRecentAssistantsCollapsed={state.isRecentAssistantsCollapsed}
                setIsRecentAssistantsCollapsed={state.setIsRecentAssistantsCollapsed}
                assistants={state.assistants}
                handleStartChatWithAssistant={state.setSelectedAssistant}
                isMyAssistantsCollapsed={state.isMyAssistantsCollapsed}
                setIsMyAssistantsCollapsed={state.setIsMyAssistantsCollapsed}
                assistantPresets={state.assistantPresets}
                selectedAssistant={state.selectedAssistant}
                setShowSidebar={state.setShowSidebar}
              />
              <FlexibleConversationSidebar
                conversations={chat.conversations}
                currentConversation={chat.currentConversationId}
                onNewChat={chat.handleNewChat}
                onSelectConversation={chat.handleSelectConversation}
                onDeleteConversation={chat.handleDeleteConversation}
                onPinConversation={chat.handlePinConversation}
                onUnpinConversation={chat.handleUnpinConversation}
                onUpdateConversation={chat.handleUpdateConversation}
                onClearAllChats={chat.handleClearAllChats}
                showClearChatsMode={chat.showClearChatsMode}
                selectedChatsToDelete={chat.selectedChatsToDelete}
                onSelectChatForDeletion={chat.handleSelectChatForDeletion}
                onToggleClearChatsMode={chat.handleToggleClearChatsMode}
                onSelectAllChats={chat.handleSelectAllChats}
                onDeleteSelectedChats={chat.handleDeleteSelectedChats}
                className="flex-1 overflow-hidden min-h-0"
              />
            </div>
          )}

          {/* 2. Main Workspace Layout */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            
            {/* MODULAR HEADER */}
            <AssistantPageHeader
              selectedAssistant={state.selectedAssistant}
              isTyping={chat.isTyping}
              activeWorkflowId={null}
              showSidebar={state.showSidebar}
              setShowSidebar={state.setShowSidebar}
              handleTemplateSelected={(template) => {
                chat.setInput(prev => prev + (prev ? '\n' : '') + `[Use Template]: ${template.title || template.name}`);
              }}
              currentPromptTier={state.currentPromptTier}
              handlePromptTierChange={state.setCurrentPromptTier}
              setShowFineTuningPanel={state.setShowFineTuningPanel}
              panelOrder={state.panelOrder}
              setShowAgentTaskManager={state.setShowAgentTaskManager}
              setShowTaskOrchestration={state.setShowTaskOrchestration}
              toggleExtraPanel={state.togglePanel}
              setShowCanvasPanel={state.setShowCanvasPanel}
              setAutoCanvasIntegration={state.setAutoCanvasIntegration}
              setShowRightPanel={state.setShowRightPanel}
              layoutMode={state.layoutMode === 'standard' ? 'proportional' : state.layoutMode}
              setLayoutMode={(mode) => state.setLayoutMode(mode === 'proportional' ? 'standard' : mode)}
              isReorganizeMode={state.isReorganizeMode}
              setIsReorganizeMode={state.setIsReorganizeMode}
              setPanelOrder={state.setPanelOrder}
              downloadConversation={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chat.messages, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href",     dataStr);
                downloadAnchor.setAttribute("download", `chat-history-${state.selectedAssistant?.id || 'assistant'}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              saveAssistantPreset={() => {
                if (state.selectedAssistant) {
                  state.setAssistantPresets(prev => {
                    const next = new Set(prev);
                    if (next.has(state.selectedAssistant.id)) {
                      next.delete(state.selectedAssistant.id);
                    } else {
                      next.add(state.selectedAssistant.id);
                    }
                    return next;
                  });
                }
              }}
              assistantPresets={state.assistantPresets}
              enableAgenticExecution={state.enableAgenticExecution}
              setEnableAgenticExecution={state.setEnableAgenticExecution}
              smartAutonomyMode={state.smartAutonomyMode}
              setSmartAutonomyMode={state.setSmartAutonomyMode}
            />
            
            {/* NEURAL CONTROL PANEL (FINE-TUNING CONFIGURATION) */}
            {state.showFineTuningPanel && (
              <div className="absolute top-[73px] right-6 w-96 z-30 shadow-2xl rounded-2xl border border-slate-200/50 dark:border-white/[0.05] bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex flex-col max-h-[75vh]">
                <div className="p-4 border-b border-slate-100 dark:border-white/[0.03] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500 animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Neural Core Config</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.05]" 
                    onClick={() => state.setShowFineTuningPanel(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="overflow-y-auto p-4 flex-1">
                  <NeuralControlPanel
                    settings={state.neuralSettings}
                    onSettingsChange={state.setNeuralSettings}
                    isThinking={chat.isLoading}
                    thinkingState={{
                      currentLayer: chat.isLoading ? 'Deep cognitive processing active...' : 'System Idle',
                      progress: chat.isLoading ? 65 : 0,
                      insights: []
                    }}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Layout Panel Container */}
            <div className="flex-1 flex flex-row min-w-0 h-full overflow-x-auto overflow-y-hidden relative bg-background">
              {state.panelOrder.map((panelId) => {
                // Determine panel-specific classes based on current layoutMode
                let panelClass = "flex-1 flex flex-col h-full overflow-hidden relative border-l border-slate-100 dark:border-white/[0.03]";
                
                if (state.layoutMode === 'focus') {
                  if (panelId === 'chat') {
                    panelClass = "w-[33%] shrink-0 flex flex-col h-full overflow-hidden relative";
                  } else {
                    panelClass = "flex-1 flex flex-col h-full overflow-hidden relative border-l border-slate-100 dark:border-white/[0.03]";
                  }
                } else if (state.layoutMode === 'split') {
                  if (panelId === 'chat') {
                    panelClass = "flex-1 flex flex-col h-full overflow-hidden relative";
                  } else {
                    panelClass = "flex-1 flex flex-col h-full overflow-hidden relative border-l border-slate-100 dark:border-white/[0.03]";
                  }
                } else {
                  // Standard proportional
                  if (panelId === 'chat') {
                    panelClass = "flex-[1.2] min-w-[360px] flex flex-col h-full overflow-hidden relative";
                  } else if (panelId === 'canvas') {
                    panelClass = "flex-[1.5] min-w-[450px] border-l border-slate-100 dark:border-white/[0.03] flex flex-col h-full overflow-hidden relative";
                  } else {
                    panelClass = "flex-1 min-w-[320px] border-l border-slate-100 dark:border-white/[0.03] flex flex-col h-full overflow-hidden relative";
                  }
                }

                switch (panelId) {
                  case 'chat':
                    return (
                      <div key="chat" className={cn(panelClass, "bg-background flex flex-col h-full overflow-hidden")}>
                        {/* 💬 Full Interactive Discussion & Thinking History */}
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                          <WorkspaceChatPanel
                            messages={chat.messages}
                            selectedAssistant={state.selectedAssistant}
                            user={user}
                            isLoading={chat.isLoading}
                            isTyping={chat.isTyping}
                            messagesEndRef={messagesEndRef}
                            getUserInitials={() => 'GF'}
                            showCanvasPanel={state.showCanvasPanel}
                            renderPinnedFiles={renderPinnedFiles}
                            fileInputRef={fileInputRef}
                            handleFileInputChange={(e) => e.target.files && handleFiles(e.target.files)}
                            handleUploadFile={() => fileInputRef.current?.click()}
                            showMentionList={false}
                            filteredMentions={[]}
                            mentionListIndex={0}
                            setMentionListIndex={() => {}}
                            handleSelectMention={() => {}}
                            chatInputRef={chatInputRef}
                            input={chat.input}
                            handleInputChange={(e) => chat.setInput(e.target.value)}
                            handleKeyDown={handleKeyDown}
                            isRecording={false}
                            setIsRecording={() => {}}
                            handleSendMessage={chat.handleSendMessage}
                            uploadedFilesCount={state.uploadedFiles.length}
                            handleFiles={handleFiles}
                            setPinnedDriveFiles={state.setPinnedDriveFiles}
                            setInput={chat.setInput}
                            agenticThinkingState={chat.agenticState}
                            runInBackground={chat.runInBackground}
                            setRunInBackground={chat.setRunInBackground}
                            isDark={isDark}
                            onOpenDocument={(doc) => {
                              const docId = `doc-${Date.now()}`;
                              state.setCurrentCanvases(prev => [{
                                id: docId,
                                title: doc.title,
                                content: doc.content,
                                contentType: 'pleading',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                aiGenerated: true
                              }, ...(prev || [])]);
                              state.setActiveCanvasId(docId);
                              state.setCanvasViewMode('viewer');
                              state.setShowCanvasPanel(true);
                            }}
                          />
                        </div>
                      </div>
                    );

                  case 'canvas':
                    return (
                      <div key="canvas" className={panelClass + " animate-in slide-in-from-right duration-300"}>
                        <div className="flex items-center justify-between px-3 py-1 border-b shrink-0 bg-muted/40">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => state.setCanvasViewMode('canvas')}
                              className={cn(
                                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-l transition-all",
                                state.canvasViewMode === 'canvas' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              Canvas
                            </button>
                            <button
                              onClick={() => state.setCanvasViewMode('viewer')}
                              className={cn(
                                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-r transition-all",
                                state.canvasViewMode === 'viewer' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              ⚖️ Viewer
                            </button>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => {
                              state.setShowCanvasPanel(false);
                              state.setPanelOrder(prev => prev.filter(p => p !== 'canvas'));
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {state.canvasViewMode === 'canvas' ? (
                          <div className="flex-1 min-h-0 overflow-hidden">
                            <UnifiedCanvasSystem
                              selectedAssistant={state.selectedAssistant}
                              assistants={state.assistants}
                              neuralSettings={null}
                              enableAIDriveSync={true}
                              autoSaveInterval={30000}
                              onClose={() => {
                                state.setShowCanvasPanel(false);
                                state.setPanelOrder(prev => prev.filter(p => p !== 'canvas'));
                              }}
                              onCanvasChange={() => {}}
                              pendingAction={state.pendingCanvasAction}
                              onActionProcessed={() => state.setPendingCanvasAction(null)}
                              chatIntegration={{
                                sendToCanvas: () => {},
                                appendToCanvas: () => {},
                                createCanvasDocument: () => {},
                                currentPromptTier: 'advanced'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 min-h-0 overflow-hidden">
                            <SovereignDocViewer
                              documents={viewerDocuments}
                              activeDocumentId={state.activeCanvasId || undefined}
                              onDocumentSelect={state.setActiveCanvasId}
                              onContentChange={(id, newContent) => {
                                state.setCurrentCanvases((prev) =>
                                  prev.map((c) => (c.id === id ? { ...c, content: newContent, modified: new Date() } : c))
                                );
                              }}
                              driveFiles={driveFileTree}
                              onFileOpen={handleOpenFileFromTree}
                              onDocumentClose={(id) => {
                                state.setCurrentCanvases((prev) => prev.filter((c) => c.id !== id));
                                state.setUploadedFiles((prev) => prev.filter((f) => `local-${f.name}` !== id));
                                state.setPinnedDriveFiles((prev) => prev.filter((f) => `drive-${f.id}` !== id));
                                if (state.activeCanvasId === id) {
                                  const remaining = viewerDocuments.filter((d) => d.id !== id);
                                  state.setActiveCanvasId(remaining.length > 0 ? remaining[0].id : null);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );

                  case 'tasks':
                    return (
                      <div key="tasks" className={panelClass + " bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl animate-in slide-in-from-right duration-300"}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.03] shrink-0">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4.5 w-4.5 text-blue-500" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              AI Orchestration Center
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => {
                              state.setShowTaskOrchestration(false);
                              state.setShowAgentTaskManager(false);
                              state.setPanelOrder(prev => prev.filter(p => p !== 'tasks'));
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-6">
                          <div className="space-y-2">
                            <AgentObserverInbox />
                          </div>
                          
                          <div className="space-y-2 border-t border-slate-100 dark:border-white/[0.03] pt-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                              <ListTodo className="h-3.5 w-3.5 text-blue-500" />
                              Task Manager
                            </h3>
                            <UnifiedTaskOrchestrator
                              isVisible={state.showTaskOrchestration}
                              onToggle={() => {
                                state.setShowTaskOrchestration(false);
                                state.setShowAgentTaskManager(false);
                                state.setPanelOrder(prev => prev.filter(p => p !== 'tasks'));
                              }}
                              userId={user?.id}
                              onCanvasAction={state.setPendingCanvasAction}
                            />
                          </div>
                        </div>
                      </div>
                    );

                  case 'knowledge':
                    return (
                      <div key="knowledge" className={panelClass + " bg-white dark:bg-[#0a0a0f] animate-in slide-in-from-right duration-300"}>
                        <div className="p-3 border-b border-slate-100 dark:border-white/[0.03] bg-muted/20 flex justify-between items-center shrink-0">
                          <span className="text-xs font-bold uppercase tracking-wider px-2">Knowledge Base</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => {
                              state.setShowRightPanel(false);
                              state.setPanelOrder(prev => prev.filter(p => p !== 'knowledge'));
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <KnowledgeBasePanel
                            relevantDocuments={viewerDocuments}
                            onPin={(doc) => {
                              state.setPinnedDriveFiles((prev: any[]) => {
                                if (prev.find(f => f.id === doc.id)) return prev;
                                return [...prev, { id: doc.id, name: doc.title || 'Untitled Document' }];
                              });
                            }}
                          />
                        </div>
                      </div>
                    );

                  case 'email':
                    return (
                      <div key="email" className={panelClass + " bg-white dark:bg-[#0a0a0f] animate-in slide-in-from-right duration-300"}>
                        <div className="p-4 border-b border-slate-100 dark:border-white/[0.03] bg-muted/30 flex justify-between items-center shrink-0">
                          <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            <Mail className="h-4 w-4 text-blue-500" />
                            Email Assistant
                          </h3>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => state.setPanelOrder(prev => prev.filter(p => p !== 'email'))}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                          <div className="h-20 w-20 bg-blue-50 dark:bg-blue-950/20 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-100 dark:shadow-none">
                            <Mail className="h-10 w-10 text-blue-500" />
                          </div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Mission Control: Email</h3>
                          <p className="text-xs text-slate-500 mt-4 max-w-xs leading-relaxed font-bold italic">
                            "Connected to the Neural Communication Array. Orchestrating {state.selectedAssistant?.name || 'AI Assistant'}'s inbox synchronization..."
                          </p>
                          <div className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                            System Online
                          </div>
                        </div>
                      </div>
                    );

                  case 'browser':
                    return (
                      <div key="browser" className={panelClass + " bg-white dark:bg-[#0a0a0f] animate-in slide-in-from-right duration-300 overflow-hidden"}>
                        <BrowserPanel
                          htmlContent={state.liveBrowserHtml}
                          title={state.liveBrowserTitle}
                          onClose={() => state.setPanelOrder(prev => prev.filter(p => p !== 'browser'))}
                          onSave={async (html, title) => {
                            // Save to G:\My Drive\.GENIEFLOW_MASTER\dashboards\
                            const safeName = title.replace(/[^a-z0-9_\-\s]/gi, '').trim().replace(/\s+/g, '_') || 'dashboard';
                            const fileName = `${safeName}-${new Date().toISOString().slice(0,10)}.html`;
                            try {
                              // Use Electron IPC if available, else download
                              const bridge = (window as any).electronBridge;
                              if (bridge?.fs?.writeFile) {
                                const saveDir = await sovereignWorkspace.resolvePath('dashboards');
const savePath = `${saveDir}/${fileName}`;
                                await bridge.fs.writeFile(savePath, html);
                                const { toast } = await import('sonner');
                                toast.success(`Saved to dashboards/${fileName}`);
                              } else {
                                const blob = new Blob([html], { type: 'text/html' });
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(blob);
                                a.download = fileName;
                                a.click();
                                const { toast } = await import('sonner');
                                toast.success(`Downloaded: ${fileName}`);
                              }
                            } catch (err) {
                              console.error('Dashboard save failed:', err);
                              const { toast } = await import('sonner');
                              toast.error('Save failed — downloading instead');
                              const blob = new Blob([html], { type: 'text/html' });
                              const a = document.createElement('a');
                              a.href = URL.createObjectURL(blob);
                              a.download = fileName;
                              a.click();
                            }
                          }}
                        />
                      </div>
                    );

                  case 'ai-drive':
                    return (
                      <div key="ai-drive" className={panelClass + " bg-white dark:bg-[#0a0a0f] animate-in slide-in-from-right duration-300"}>
                        <div className="p-4 border-b border-slate-100 dark:border-white/[0.03] bg-muted/30 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent shrink-0">
                          <h3 className="font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">
                            <Folder className="h-4 w-4" />
                            GenieDrive Repository
                            {state.pinnedDriveFiles.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                                {state.pinnedDriveFiles.length} pinned
                              </span>
                            )}
                          </h3>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600" onClick={() => state.setPanelOrder(prev => prev.filter(p => p !== 'ai-drive'))}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {/* Pinned files strip */}
                        {state.pinnedDriveFiles.length > 0 && (
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.03] bg-blue-50/50 dark:bg-blue-950/20 flex flex-wrap gap-1.5 shrink-0">
                            {state.pinnedDriveFiles.map((f) => (
                              <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700">
                                <Sparkles className="h-2.5 w-2.5 text-blue-500" />
                                {f.name}
                                <button
                                  onClick={() => state.setPinnedDriveFiles(prev => prev.filter(p => p.id !== f.id))}
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
                            onSelect={async (file: any) => {
                              state.setPinnedDriveFiles((prev: any[]) => {
                                if (prev.find((f) => f.id === file.id)) return prev;
                                return [...prev, { id: file.id, name: file.name, content: file.content, file }];
                              });

                              let content = file.content || file.content_preview || '';
                              const bridge = (window as any).electronBridge;
                              if (!content && bridge?.fs?.readFile && file.path) {
                                try {
                                  const readRes = await bridge.fs.readFile({ path: file.path });
                                  if (readRes?.success && readRes.content) {
                                    content = readRes.content;
                                  }
                                } catch (_e) {}
                              }

                              const docId = file.id || `doc_${Date.now()}`;
                              const newDoc = {
                                id: docId,
                                title: file.name || 'Document',
                                content: content,
                                fileId: file.id,
                                mimeType: file.mime_type || 'text/markdown',
                                modified: new Date()
                              };

                              state.setCurrentCanvases((prev: any[]) => {
                                const filtered = prev.filter((c: any) => c.id !== docId);
                                return [newDoc, ...filtered];
                              });
                              state.setActiveCanvasId(docId);
                              state.setCanvasViewMode('viewer');
                              state.setShowCanvasPanel(true);
                              state.setPanelOrder((prev: string[]) => prev.includes('canvas') ? prev : [...prev, 'canvas']);
                            }}
                            onPin={(file: any) => {
                              state.setPinnedDriveFiles((prev: any[]) => {
                                if (prev.find((f) => f.id === file.id)) return prev;
                                return [...prev, { id: file.id, name: file.name, content: file.content, file }];
                              });
                            }}
                          />
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>

        </div>
      </TooltipProvider>
    </AIErrorBoundary>
  );
}

export default SovereignWorkspace;
