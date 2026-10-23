import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { type AIAssistant, type AIFolder } from '../types/ai';
import { useAssistantStore } from '../store/assistantStore';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizeHandle
} from '../components/ui/ResizablePanel';
import { AssistantList } from '../components/assistants/AssistantList';
import { AssistantChat } from '../components/assistants/AssistantChat';
import { Button } from '../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/Dialog';
import {
  Brain,
  MessageSquare,
  BarChart3,
  Zap,
  BookOpen,
  Settings,
  Activity,
  Users,
  Plus,
  Bot,
  FolderOpen
} from 'lucide-react';
import { AssistantConfig } from '../components/assistants/AssistantConfig';
import { KnowledgeBaseSelector } from '../components/knowledge/KnowledgeBaseSelector';
import EmbeddingHealthMonitor from '../components/knowledge/EmbeddingHealthMonitor';
import { AssistantFolderManager } from '../components/knowledge/AssistantFolderManager';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { debugAssistants } from '../utils/debugAssistants';
import { EnhancedAssistantTraining } from '../components/assistants/EnhancedAssistantTraining';
import { NeuralControlPanel } from '../components/NeuralControlPanel';
import { CollectiveBrainMonitor } from '../components/CollectiveBrainMonitor';
import { useLearningSystem } from '../hooks/useLearningSystem';
import { ConversationalAssistantCreator } from '../components/assistants/ConversationalAssistantCreator';
import { useSwarmStore } from '../stores/swarmStore';

import { AssistantOverviewTab, AssistantStats } from '../components/assistants/AssistantOverviewTab';
import { AssistantAnalyticsTab } from '../components/assistants/AssistantAnalyticsTab';
import { AssistantWorkflowsTab } from '../components/assistants/AssistantWorkflowsTab';
import { AssistantSwarmTab } from '../components/assistants/AssistantSwarmTab';
import { AssistantBuilderTab } from '../components/assistants/AssistantBuilderTab';
import { AssistantWelcomeScreen } from '../components/assistants/AssistantWelcomeScreen';

type ViewType = 'chat' | 'config' | 'training' | 'knowledge' | 'analytics' | 'overview' | 'builder' | 'workflows' | 'swarm';

export const AssistantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [assistantStats, setAssistantStats] = useState<Record<string, AssistantStats>>({});
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [showConversationalCreator, setShowConversationalCreator] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    assistantId?: string;
    assistantName?: string;
  }>({ isOpen: false });
  const [marketplaceIds] = useState<Set<string>>(new Set());

  const {
    assistants,
    loading,
    error,
    fetchAssistants,
    addAssistant,
    updateAssistant,
    removeAssistant
  } = useAssistantStore();

  const { folders: knowledgeFolders } = useKnowledgeBaseStore();
  const { createSwarm } = useSwarmStore();

  // Neural System Integration
  const [neuralSettings, setNeuralSettings] = useState({
    deepThinking: true,
    strategicPlanning: true,
    riskAnalysis: true,
    creativeSynthesis: false,
    truthSeekingMode: true,
    peopleePleasingResistance: 60,
    directnessLevel: 65,
    challengeWillingness: 70,
    thinkingDepth: 3,
    responseTime: 'thoughtful' as const,
    showThinkingProcess: false,
    showAlternatives: true,
    showConcerns: true
  });

  const [showNeuralPanel, setShowNeuralPanel] = useState(false);
  const [showBrainMonitor, setShowBrainMonitor] = useState(false);

  const learningSystem = useLearningSystem(selectedAssistant?.id || '', {
    enableLearning: true,
    collectFeedback: true,
    personalityProfile: selectedAssistant?.personalityProfile
  });

  const saveTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const savingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const initializeAssistants = async () => {
      try {
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Authentication error:', userError);
          setAuthLoading(false);
          return;
        }

        if (user) {
          setCurrentUser(user);
          try {
            await fetchAssistants();
          } catch (fetchError) {
            console.error('Error fetching assistants:', fetchError);
          }
        }
        setAuthLoading(false);
      } catch (err) {
        console.error('Error initializing assistants:', err);
        setAuthLoading(false);
      }
    };

    initializeAssistants();
  }, [fetchAssistants]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await fetchAssistants();
        } catch (error) {
          console.error('Error fetching assistants after sign in:', error);
        }
      }

      if (event === 'SIGNED_OUT') {
        setSelectedAssistant(null);
        setCurrentView('overview');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchAssistants]);

  // Load Assistant Stats
  useEffect(() => {
    const loadAssistantStats = () => {
      const stats: Record<string, AssistantStats> = {};
      for (const assistant of assistants) {
        if (assistant.id) {
          stats[assistant.id] = {
            totalConversations: Math.floor(Math.random() * 20) + 5,
            avgResponseTime: Math.floor(Math.random() * 500) + 300,
            accuracyScore: Math.floor(Math.random() * 15) + 85,
            learningProgress: Math.floor(Math.random() * 40) + 60,
            knowledgeSources: assistant.knowledgeBase?.length || 0,
            activeTrainingSessions: Math.floor(Math.random() * 3)
          };
        }
      }
      setAssistantStats(stats);
    };

    if (assistants.length > 0) {
      loadAssistantStats();
    }
  }, [assistants]);

  const handleUpdateLinkedFolders = async (assistantId: string, newFolderIds: string[]) => {
    try {
      setActionInProgress(true);
      const foldersToLink = newFolderIds
        .map((folderId) => {
          const folder = knowledgeFolders.find((f) => f.id === folderId);
          if (!folder) return null;
          return {
            id: folder.id,
            name: folder.name,
            documents: [],
            createdAt: folder.createdAt || new Date(),
            updatedAt: folder.updatedAt || new Date(),
            parent_folder_id: (folder as any).parent_folder_id
          } as AIFolder;
        })
        .filter((f): f is AIFolder => f !== null);

      await updateAssistant(assistantId, { knowledgeBase: foldersToLink });
      await fetchAssistants();

      const updated = assistants.find((a) => a.id === assistantId);
      if (updated && selectedAssistant?.id === assistantId) {
        setSelectedAssistant(JSON.parse(JSON.stringify(updated)));
      }
    } catch (error) {
      console.error('Error updating linked folders:', error);
      alert('Failed to update knowledge folders');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSaveAssistant = useCallback(
    async (assistantData: Partial<AIAssistant>) => {
      if (!selectedAssistant?.id) return;
      const assistantId = selectedAssistant.id;

      if (savingRef.current.has(assistantId)) return;

      const existingTimeout = saveTimeoutRef.current.get(assistantId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        saveTimeoutRef.current.delete(assistantId);
      }

      const timeoutId = setTimeout(async () => {
        saveTimeoutRef.current.delete(assistantId);
        try {
          savingRef.current.add(assistantId);
          await updateAssistant(assistantId, assistantData);
          await fetchAssistants();
          const updated = assistants.find((a) => a.id === assistantId);
          if (updated) setSelectedAssistant(updated);
        } catch (error) {
          console.error('Error saving assistant:', error);
          alert('Failed to save assistant');
        } finally {
          savingRef.current.delete(assistantId);
        }
      }, 500);

      saveTimeoutRef.current.set(assistantId, timeoutId);
    },
    [selectedAssistant, updateAssistant, fetchAssistants, assistants]
  );

  const handleSelectAssistant = (assistant: AIAssistant | null) => {
    setSelectedAssistant(assistant);
    setCurrentView('overview');
  };

  const handleDeleteAssistant = (assistantId: string) => {
    const assistant = assistants.find((a) => a.id === assistantId);
    setDeleteConfirmDialog({
      isOpen: true,
      assistantId,
      assistantName: assistant?.name || 'Unknown Assistant'
    });
  };

  const confirmDeleteAssistant = async () => {
    if (!deleteConfirmDialog.assistantId) return;
    try {
      await removeAssistant(deleteConfirmDialog.assistantId);
      if (selectedAssistant?.id === deleteConfirmDialog.assistantId) {
        setSelectedAssistant(null);
        setCurrentView('overview');
      }
      setDeleteConfirmDialog({ isOpen: false });
    } catch (err) {
      console.error('Error deleting assistant:', err);
      alert('Failed to delete assistant');
    }
  };

  const handleConversationalAssistantCreated = async (assistantData: any) => {
    setIsCreatingAssistant(true);
    try {
      const newAssistantId = await addAssistant(assistantData);
      setShowConversationalCreator(false);
      await fetchAssistants();
      if (newAssistantId) {
        const created = assistants.find((a) => a.id === newAssistantId);
        if (created) setSelectedAssistant(created);
      }
    } catch (err) {
      console.error('Error creating assistant:', err);
      alert('Failed to create assistant');
    } finally {
      setIsCreatingAssistant(false);
    }
  };

  const handlePromoteToCreator = (assistant: AIAssistant) => {
    alert(
      `🎉 "${assistant.name}" has been promoted to the Creator Space!\n\nRedirecting to Creator Dashboard to package as a .gpack, set up pricing, and publish.`
    );
    navigate('/creator/dashboard');
  };

  if (loading && assistants.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Brain className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Loading Your AI Assistants
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Setting up your personalized assistant workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!authLoading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please sign in to view and manage your AI assistants.
          </p>
          <Button onClick={() => (window.location.href = '/')} variant="default">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Assistants
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchAssistants} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => debugAssistants()} variant="ghost" size="sm">
              Debug Info
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!selectedAssistant) {
      return (
        <AssistantWelcomeScreen
          assistants={assistants}
          isCreatingAssistant={isCreatingAssistant}
          onOpenCreator={() => setShowConversationalCreator(true)}
          onSelectFirstAssistant={() => setSelectedAssistant(assistants[0])}
        />
      );
    }

    switch (currentView) {
      case 'overview':
        return (
          <AssistantOverviewTab
            selectedAssistant={selectedAssistant}
            stats={selectedAssistant.id ? assistantStats[selectedAssistant.id] : undefined}
            onSetView={setCurrentView}
            onPromoteToCreator={handlePromoteToCreator}
          />
        );

      case 'chat':
        return <AssistantChat assistant={selectedAssistant} />;

      case 'training':
        return (
          <div className="space-y-6 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Neural Control & Learning Systems
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNeuralPanel(!showNeuralPanel)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {showNeuralPanel ? 'Hide' : 'Show'} Neural Controls
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBrainMonitor(!showBrainMonitor)}
                    className="flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    {showBrainMonitor ? 'Hide' : 'Show'} Brain Monitor
                  </Button>
                </div>
              </div>

              {learningSystem.insights && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Learning Insights</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium">Patterns Learned</div>
                      <div className="text-blue-800 dark:text-blue-300">{learningSystem.insights.patterns}</div>
                    </div>
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium">Documents Tracked</div>
                      <div className="text-blue-800 dark:text-blue-300">{learningSystem.insights.documentsTracked}</div>
                    </div>
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium">Improvement Score</div>
                      <div className="text-blue-800 dark:text-blue-300">{learningSystem.insights.improvementScore}%</div>
                    </div>
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium">Training Entries</div>
                      <div className="text-blue-800 dark:text-blue-300">{learningSystem.insights.lastTrainingEntries?.length || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {showNeuralPanel && (
                <div className="mb-6">
                  <NeuralControlPanel
                    settings={neuralSettings}
                    onSettingsChange={setNeuralSettings}
                    isThinking={learningSystem.isProcessing}
                    thinkingState={{
                      currentLayer: 'Processing assistant capabilities',
                      progress: learningSystem.isProcessing ? 75 : 0,
                      insights: learningSystem.insights ? [`${learningSystem.insights.patterns} patterns identified`] : []
                    }}
                  />
                </div>
              )}

              {showBrainMonitor && (
                <div className="mb-6">
                  <CollectiveBrainMonitor
                    selectedAssistant={selectedAssistant}
                    autonomousLearning={true}
                    neuralAIEnabled={neuralSettings.deepThinking}
                    onModeChange={(mode) => console.log('Brain mode:', mode)}
                  />
                </div>
              )}
            </div>

            <EnhancedAssistantTraining
              assistant={selectedAssistant}
              onUpdate={(updates) => {
                if (selectedAssistant.id) {
                  updateAssistant(selectedAssistant.id, updates);
                }
              }}
            />
          </div>
        );

      case 'knowledge':
        return (
          <div className="space-y-6 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Link Knowledge Folders</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Link folders from your knowledge base to make their content available to this assistant.
              </p>
              <AssistantFolderManager
                onClose={async () => {
                  setActionInProgress(true);
                  try {
                    await fetchAssistants();
                  } finally {
                    setActionInProgress(false);
                  }
                }}
              />
            </div>

            <KnowledgeBaseSelector
              folders={knowledgeFolders as any}
              selectedFolders={selectedAssistant.knowledgeBase?.map((f) => f.id) || []}
              onSelect={(folderId) =>
                handleUpdateLinkedFolders(selectedAssistant.id, [
                  ...(selectedAssistant.knowledgeBase?.map((f) => f.id) || []),
                  folderId
                ])
              }
              onUnselect={(folderId) => {
                const currentFolders = selectedAssistant.knowledgeBase?.map((f) => f.id) || [];
                handleUpdateLinkedFolders(
                  selectedAssistant.id,
                  currentFolders.filter((id) => id !== folderId)
                );
              }}
              assistantName={selectedAssistant.name}
              assistantType={selectedAssistant.type}
              isLoading={actionInProgress}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Knowledge Base Health</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Monitor and repair document embeddings to ensure optimal semantic search performance.
              </p>
              <EmbeddingHealthMonitor />
            </div>
          </div>
        );

      case 'config':
        return (
          <div className="p-6">
            <AssistantConfig assistant={selectedAssistant} onSave={handleSaveAssistant} />
          </div>
        );

      case 'analytics':
        return <AssistantAnalyticsTab selectedAssistant={selectedAssistant} />;

      case 'builder':
        return <AssistantBuilderTab onAddAssistant={addAssistant} onSetView={setCurrentView} />;

      case 'workflows':
        return <AssistantWorkflowsTab selectedAssistant={selectedAssistant} />;

      case 'swarm':
        return (
          <AssistantSwarmTab
            selectedAssistant={selectedAssistant}
            currentUser={currentUser}
            createSwarm={createSwarm}
          />
        );

      default:
        return (
          <AssistantOverviewTab
            selectedAssistant={selectedAssistant}
            stats={selectedAssistant.id ? assistantStats[selectedAssistant.id] : undefined}
            onSetView={setCurrentView}
            onPromoteToCreator={handlePromoteToCreator}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={15}>
          <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">AI Assistants</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {assistants.length} assistant{assistants.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Create Button */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setShowConversationalCreator(true)}
                variant="default"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/20 text-white font-semibold"
                disabled={isCreatingAssistant}
              >
                {isCreatingAssistant ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create New Assistant
                  </>
                )}
              </Button>
            </div>

            {/* Assistant List */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <AssistantList
                assistants={assistants}
                selectedAssistant={selectedAssistant}
                onSelect={handleSelectAssistant}
                onDelete={(assistant) => assistant.id && handleDeleteAssistant(assistant.id)}
                marketplaceIds={marketplaceIds}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizeHandle direction="horizontal" />

        <ResizablePanel defaultSize={75}>
          {selectedAssistant ? (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
              {/* Navigation Bar */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedAssistant.name}
                  </h2>
                  {selectedAssistant.knowledgeBase && selectedAssistant.knowledgeBase.length > 0 && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                      <FolderOpen className="w-3 h-3" />
                      <span>{selectedAssistant.knowledgeBase.length}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant={currentView === 'overview' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('overview')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </Button>
                  <Button
                    variant={currentView === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('chat')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button
                    variant={currentView === 'training' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('training')}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Training
                  </Button>
                  <Button
                    variant={currentView === 'knowledge' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('knowledge')}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Knowledge
                  </Button>
                  <Button
                    variant={currentView === 'config' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('config')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Config
                  </Button>
                  <Button
                    variant={currentView === 'builder' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('builder')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agent Builder
                  </Button>
                  <Button
                    variant={currentView === 'workflows' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('workflows')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Workflows
                  </Button>
                  <Button
                    variant={currentView === 'swarm' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('swarm')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Swarm
                  </Button>
                </div>
              </div>

              {/* View Content */}
              <div className="flex-1 overflow-y-auto">{renderContent()}</div>
            </div>
          ) : (
            <div className="h-full">{renderContent()}</div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog.isOpen}
        onOpenChange={(open) =>
          setDeleteConfirmDialog({ ...deleteConfirmDialog, isOpen: open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assistant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmDialog.assistantName}</strong>?
              This action cannot be undone. All training data, conversations, and configurations will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialog({ isOpen: false })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAssistant}>
              Delete Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversational Assistant Creator */}
      <ConversationalAssistantCreator
        isOpen={showConversationalCreator}
        onClose={() => setShowConversationalCreator(false)}
        onAssistantCreated={handleConversationalAssistantCreated}
      />
    </div>
  );
};

export default AssistantsPage;