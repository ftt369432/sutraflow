import { useChatState, type ChatState } from './useChatState';
import { useCanvasState, type CanvasState } from './useCanvasState';
import { useClearChats, type ClearChatsState } from './useClearChats';
import { useEnhancedAIAssistant, type EnhancedChatState } from './useEnhancedAIAssistant';
import { useCanvasIntegration, type CanvasState as CanvasIntegrationState } from './useCanvasIntegration';

export interface AIAssistantHooks {
  chat: ChatState;
  canvas: CanvasState;
  clearChats: ClearChatsState;
}

export interface EnhancedAIAssistantHooks {
  enhanced: EnhancedChatState;
  canvas: CanvasIntegrationState;
}

/**
 * Main hook that provides all AI Assistant functionality
 * This is the single entry point for all AI Assistant hooks
 */
export function useAIAssistantHooks(): AIAssistantHooks {
  // Core hooks
  const chatState = useChatState();
  const canvasState = useCanvasState();
  
  // Feature hooks
  const clearChatsState = useClearChats(
    chatState.conversations,
    chatState.setConversations,
    chatState.currentConversation,
    chatState.setCurrentConversation
  );

  return {
    chat: chatState,
    canvas: canvasState,
    clearChats: clearChatsState,
  };
}

/**
 * 🚀 Enhanced AI Assistant Hook - ChatGPT-style with Canvas Integration
 * 
 * This is the new recommended hook that provides:
 * - All ChatGPT-style features (reactions, bookmarks, editing, etc.)
 * - Advanced conversation management
 * - Canvas integration with master/slave architecture
 * - File handling and multimodal support
 * - Autonomous learning capabilities
 * - Voice commands (future)
 * - Specialized assistant support
 */
export function useEnhancedAIAssistantHooks(): EnhancedAIAssistantHooks {
  const enhancedChat = useEnhancedAIAssistant();
  const canvasIntegration = useCanvasIntegration();

  return {
    enhanced: enhancedChat,
    canvas: canvasIntegration,
  };
}

/**
 * Hook configuration for enabling/disabling features
 */
export interface AIFeatureConfig {
  enableClearChats?: boolean;
  enableCanvasMode?: boolean;
  enableLearning?: boolean;
  enableFileHandling?: boolean;
  enableVoiceCommands?: boolean;
  enableProactiveAssistance?: boolean;
  enableMessageReactions?: boolean;
  enableBookmarks?: boolean;
  enableMessageEditing?: boolean;
  enableAutonomousLearning?: boolean;
  // Easy to add new features here
}

/**
 * Future extensible hook for plugin-style features
 */
export function useAIFeatures(config: AIFeatureConfig = {}) {
  const baseHooks = useAIAssistantHooks();
  
  // In the future, conditionally load additional hooks based on config
  // if (config.enableVoiceCommands) {
  //   const voiceState = useVoiceCommands();
  //   return { ...baseHooks, voice: voiceState };
  // }
  
  return baseHooks;
}

/**
 * 🎯 Recommended Hook for New Implementations
 * 
 * Use this for all new AI Assistant implementations.
 * It provides the complete ChatGPT-style experience with Canvas integration.
 */
export function useAIAssistant() {
  return useEnhancedAIAssistantHooks();
}
