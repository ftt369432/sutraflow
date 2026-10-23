/**
 * 🎯 AI Assistant Hooks - Centralized Export
 * 
 * This file exports all AI Assistant related hooks for easy importing
 */

// Main hook exports (Enhanced - Recommended)
export { useAIAssistantHooks, useEnhancedAIAssistantHooks, useAIFeatures, useAIAssistant } from './useAIAssistantHooks';
export type { AIAssistantHooks, EnhancedAIAssistantHooks, AIFeatureConfig } from './useAIAssistantHooks';

// Enhanced individual hooks (New)
export { useEnhancedAIAssistant } from './useEnhancedAIAssistant';
export type { EnhancedChatState, ConversationContext } from './useEnhancedAIAssistant';

export { useCanvasIntegration } from './useCanvasIntegration';
export type { CanvasState as CanvasIntegrationState, CanvasDocument } from './useCanvasIntegration';

// Core individual hook exports (Legacy)
export { useChatState } from './useChatState';
export type { ChatState } from './useChatState';

export { useCanvasState } from './useCanvasState';
export type { CanvasState, Canvas } from './useCanvasState';

export { useClearChats } from './useClearChats';
export type { ClearChatsState } from './useClearChats';

/**
 * 🚀 Quick Start Guide:
 * 
 * For new AI Assistant implementations, use:
 * ```typescript
 * import { useAIAssistant } from '@/hooks/ai';
 * 
 * function MyAIComponent() {
 *   const { enhanced, canvas } = useAIAssistant();
 *   // Access all ChatGPT-style features and Canvas integration
 * }
 * ```
 * 
 * For legacy compatibility, use:
 * ```typescript
 * import { useAIAssistantHooks } from '@/hooks/ai';
 * 
 * function MyLegacyComponent() {
 *   const { chat, canvas, clearChats } = useAIAssistantHooks();
 *   // Basic functionality
 * }
 * ```
 */
