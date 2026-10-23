/**
 * 🧠 useWorkspaceState Hook
 * 
 * Manages all non-chat UI state, panel layouts, files, and assistants for SovereignWorkspace.
 * Keeps state management isolated from view presentation (Rule 3 compliant).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useConsolidatedState } from '../../../hooks/useConsolidatedState';
import { getAssistants } from '../../../services/assistantService';
import type { AIAssistant } from '../../../types/ai';
import { useKnowledgeBaseStore } from '../../../store/knowledgeBaseStore';

export interface DriveFile {
  id: string;
  name: string;
}

export function useWorkspaceState() {
  const { uiState, updateUIState, aiState, updateAIState } = useConsolidatedState();

  // 🎨 Layout & Panel Visibility
  const [layoutMode, setLayoutMode] = useState<'standard' | 'split' | 'focus'>('standard');
  const [panelOrder, setPanelOrder] = useState<string[]>(['chat']);
  const [showCanvasPanel, setShowCanvasPanel] = useState(false);
  const [showTaskOrchestration, setShowTaskOrchestration] = useState(false);
  const [showAgentTaskManager, setShowAgentTaskManager] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // 🛠️ Canvas & Document State
  const [canvasViewMode, setCanvasViewMode] = useState<'canvas' | 'viewer'>('canvas');
  const [currentCanvases, setCurrentCanvases] = useState<any[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [pendingCanvasAction, setPendingCanvasAction] = useState<any | null>(null);

  // 🌐 Browser Panel State (AI-generated dashboards — zero hardcoding)
  const [liveBrowserHtml, setLiveBrowserHtml] = useState<string | null>(null);
  const [liveBrowserTitle, setLiveBrowserTitle] = useState<string>('AI Dashboard');

  // 📎 Pinned & Staged Files State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [pinnedDriveFiles, setPinnedDriveFiles] = useState<DriveFile[]>([]);
  const [stagedFileParts, setStagedFileParts] = useState<any[]>([]);

  // 🤖 Assistant Selection State
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [assistantPresets, setAssistantPresets] = useState<Set<string>>(new Set());

  // ⚙️ Keyboard Shortcut States
  const [amendmentMode, setAmendmentMode] = useState(false);

  // 🤖 AGENTIC EXECUTION & ORCHESTRATION FLAGS (Default: ON for autonomous legal workflows)
  const [enableAgenticExecution, setEnableAgenticExecution] = useState(true);
  const [smartAutonomyMode, setSmartAutonomyMode] = useState(true);
  const [currentPromptTier, setCurrentPromptTier] = useState<'basic' | 'advanced' | 'expert' | 'neuroBrain' | 'collectiveBrain' | 'master'>('advanced');
  const [showFineTuningPanel, setShowFineTuningPanel] = useState(false);
  const [isReorganizeMode, setIsReorganizeMode] = useState(false);
  const [autoCanvasIntegration, setAutoCanvasIntegration] = useState(true);

  // Load active assistants on mount
  useEffect(() => {
    async function loadAssistants() {
      try {
        const loaded = await getAssistants();
        setAssistants(loaded);
        if (loaded.length > 0 && !selectedAssistant) {
          setSelectedAssistant(loaded[0]);
        }
      } catch (err) {
        console.error('Failed to load assistants:', err);
      }
    }
    loadAssistants();
  }, [selectedAssistant]);

  // Load knowledge base documents/folders on startup
  useEffect(() => {
    async function initKB() {
      console.log('📚 [Startup] Initializing knowledge base...');
      try {
        await useKnowledgeBaseStore.getState().loadDocuments();
      } catch (kbErr) {
        console.error('⚠️ [Startup] Non-blocking knowledge base load error:', kbErr);
      }
    }
    initKB();
  }, []);

  // Sidebar Toggles
  const [isRecentAssistantsCollapsed, setIsRecentAssistantsCollapsed] = useState(false);
  const [isMyAssistantsCollapsed, setIsMyAssistantsCollapsed] = useState(false);
  const [autoCloseSidebar, setAutoCloseSidebar] = useState(false);

  const openPanel = useCallback((panelId: string) => {
    setPanelOrder(prev => (prev.includes(panelId) ? prev : [...prev, panelId]));
  }, []);

  const closePanel = useCallback((panelId: string) => {
    setPanelOrder(prev => prev.filter(p => p !== panelId));
  }, []);

  const togglePanel = useCallback((panelId: string) => {
    setPanelOrder(prev => {
      if (prev.includes(panelId)) {
        return prev.filter(p => p !== panelId);
      } else {
        return [...prev, panelId];
      }
    });
  }, []);

  const openCanvas = useCallback((docId?: string, viewMode: 'canvas' | 'viewer' = 'viewer') => {
    setPanelOrder(prev => (prev.includes('canvas') ? prev : [...prev, 'canvas']));
    setShowCanvasPanel(true);
    setCanvasViewMode(viewMode);
    if (docId) {
      setActiveCanvasId(docId);
    }
  }, []);

  const openBrowser = useCallback(() => {
    setPanelOrder(prev => (prev.includes('browser') ? prev : [...prev, 'browser']));
  }, []);

  const openTasks = useCallback(() => {
    setPanelOrder(prev => (prev.includes('tasks') ? prev : [...prev, 'tasks']));
    setShowTaskOrchestration(true);
    setShowAgentTaskManager(true);
  }, []);

  const openKnowledge = useCallback(() => {
    setPanelOrder(prev => (prev.includes('knowledge') ? prev : [...prev, 'knowledge']));
    setShowRightPanel(true);
  }, []);

  const openEmail = useCallback(() => {
    setPanelOrder(prev => (prev.includes('email') ? prev : [...prev, 'email']));
  }, []);

  return {
    // Layout
    layoutMode,
    setLayoutMode,
    panelOrder,
    setPanelOrder,
    showCanvasPanel,
    setShowCanvasPanel,
    showTaskOrchestration,
    setShowTaskOrchestration,
    showAgentTaskManager,
    setShowAgentTaskManager,
    showSidebar,
    setShowSidebar,
    isLeftPanelCollapsed,
    setIsLeftPanelCollapsed,
    showRightPanel,
    setShowRightPanel,

    // Canvas
    canvasViewMode,
    setCanvasViewMode,
    currentCanvases,
    setCurrentCanvases,
    activeCanvasId,
    setActiveCanvasId,
    pendingCanvasAction,
    setPendingCanvasAction,

    // Browser Panel
    liveBrowserHtml,
    setLiveBrowserHtml,
    liveBrowserTitle,
    setLiveBrowserTitle,

    // Files
    uploadedFiles,
    setUploadedFiles,
    pinnedDriveFiles,
    setPinnedDriveFiles,
    stagedFileParts,
    setStagedFileParts,

    // Assistants
    assistants,
    selectedAssistant,
    setSelectedAssistant,
    assistantPresets,
    setAssistantPresets,
    isRecentAssistantsCollapsed,
    setIsRecentAssistantsCollapsed,
    isMyAssistantsCollapsed,
    setIsMyAssistantsCollapsed,
    autoCloseSidebar,
    setAutoCloseSidebar,

    // Panel Actions (Auto Pop-up / Openers)
    openCanvas,
    openBrowser,
    openTasks,
    openKnowledge,
    openEmail,
    openPanel,
    closePanel,
    togglePanel,

    // Orchestration & Header settings
    enableAgenticExecution,
    setEnableAgenticExecution,
    smartAutonomyMode,
    setSmartAutonomyMode,
    currentPromptTier,
    setCurrentPromptTier,
    showFineTuningPanel,
    setShowFineTuningPanel,
    isReorganizeMode,
    setIsReorganizeMode,
    autoCanvasIntegration,
    setAutoCanvasIntegration,
    neuralSettings: aiState.neuralSettings,
    setNeuralSettings: (settings: any) => updateAIState({ neuralSettings: settings })
  };
}
