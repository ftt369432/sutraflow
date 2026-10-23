/**
 * 🧠 NEURO-OPTIMIZED STATE CONSOLIDATION
 * Reduces 30+ useState hooks to 3 consolidated state objects
 * Prevents re-render cascades and flickering
 */

import { useState, useCallback } from 'react';
import type { Message, AIAssistant, Conversation } from '../types/ai';

// Consolidated Chat State
interface ChatState {
  messages: Message[];
  input: string;
  isLoading: boolean;
  isTyping: boolean;
  selectedAssistant: AIAssistant | null;
  conversations: Conversation[];
  currentConversation: string | null;
  uploadedFiles: File[];
  stagedFileParts: any[];
  editingMessageId: string | null;
  originalMessageContent: string;
  pinnedDriveFiles: any[];
  pendingCanvasAction: any | null;
}

// Consolidated UI State  
interface UIState {
  showSidebar: boolean;
  showRightPanel: boolean;
  showFineTuningPanel: boolean;
  showPromptPanel: boolean;
  showCanvasPanel: boolean;
  showCollectiveBrain: boolean;
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  isHeaderVisible: boolean;
  showClearChatsMode: boolean;
  isDraggingOver: boolean;
  filePreviewMode: boolean;
  amendmentMode: boolean;
  panelOrder: string[];
  isReorganizeMode: boolean;
  autoCloseSidebar: boolean;
  layoutMode: 'proportional' | 'split' | 'focus';
  browserUrl: string;
  browserCompatibilityMode: boolean;
  browserReaderMode: boolean;
  showTaskOrchestration: boolean;
  showAgentTaskManager: boolean;
}

// Consolidated AI State
interface AIState {
  messageAnalyses: Map<string, any>;
  assistantPresets: Map<string, any>;
  currentCanvases: any[];
  activeCanvasId: string | null;
  aiAgentTasks: any[];
  activeWorkflowId: string | null;
  neuralAIEnabled: boolean;
  collectiveBrainActive: boolean;
  currentPromptTier: 'basic' | 'advanced' | 'expert' | 'master' | 'neuroBrain' | 'collectiveBrain';
  brainMode: 'thinking' | 'organizing' | 'monitoring' | 'knowledge';
  intelligenceDisplay: any;
  relevantDocuments: any[];
  neuralSettings: any;
}

export function useConsolidatedState() {
  // Single state object per domain - 3 total instead of 30+
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    input: '',
    isLoading: false,
    isTyping: false,
    selectedAssistant: null,
    conversations: [],
    currentConversation: null,
    uploadedFiles: [],
    stagedFileParts: [],
    editingMessageId: null,
    originalMessageContent: '',
    pinnedDriveFiles: [],
    pendingCanvasAction: null
  });

  const [uiState, setUIState] = useState<UIState>({
    showSidebar: true,
    showRightPanel: false,
    showFineTuningPanel: false,
    showPromptPanel: false,
    showCanvasPanel: false,
    showCollectiveBrain: false,
    isLeftPanelCollapsed: false,
    isRightPanelCollapsed: false,
    isHeaderVisible: true,
    showClearChatsMode: false,
    isDraggingOver: false,
    filePreviewMode: false,
    amendmentMode: false,
    panelOrder: ['chat'],
    isReorganizeMode: false,
    autoCloseSidebar: false,
    layoutMode: 'proportional',
    browserUrl: 'https://www.google.com/search?q=GenieFlow+AI',
    browserCompatibilityMode: true,
    browserReaderMode: false,
    showTaskOrchestration: false,
    showAgentTaskManager: false
  });

  const [aiState, setAIState] = useState<AIState>({
    messageAnalyses: new Map(),
    assistantPresets: new Map(),
    currentCanvases: [],
    activeCanvasId: null,
    aiAgentTasks: [],
    activeWorkflowId: null,
    neuralAIEnabled: false,
    collectiveBrainActive: false,
    currentPromptTier: 'master',
    brainMode: 'thinking',
    intelligenceDisplay: null,
    relevantDocuments: [],
    neuralSettings: {
      thinkingDepth: 3,
      creativity: 0.7,
      detailLevel: 'balanced',
      deepThinking: false,
      showThinkingProcess: true,
      showAlternatives: false,
      showConcerns: false,
    }
  });

  // Batch updates to prevent multiple re-renders
  const updateChatState = useCallback((updatesOrFn: Partial<ChatState> | ((prev: ChatState) => Partial<ChatState>)) => {
    setChatState(prev => {
      const updates = typeof updatesOrFn === 'function' ? updatesOrFn(prev) : updatesOrFn;
      return { ...prev, ...updates };
    });
  }, []);

  const updateUIState = useCallback((updatesOrFn: Partial<UIState> | ((prev: UIState) => Partial<UIState>)) => {
    setUIState(prev => {
      const updates = typeof updatesOrFn === 'function' ? updatesOrFn(prev) : updatesOrFn;
      return { ...prev, ...updates };
    });
  }, []);

  const updateAIState = useCallback((updatesOrFn: Partial<AIState> | ((prev: AIState) => Partial<AIState>)) => {
    setAIState(prev => {
      const updates = typeof updatesOrFn === 'function' ? updatesOrFn(prev) : updatesOrFn;
      return { ...prev, ...updates };
    });
  }, []);

  return {
    // State
    chatState,
    uiState,
    aiState,
    // Updaters (batched)
    updateChatState,
    updateUIState,
    updateAIState,
    // Atomic setters for backwards compatibility
    setChatState,
    setUIState,
    setAIState
  };
}
