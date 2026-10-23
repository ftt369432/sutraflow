import { useCallback, useRef } from 'react';
import { contentDetectionService } from '../services/canvas/contentDetection';
import { thinkingProcessService, ThinkingProcess } from '../services/canvas/thinkingProcessService';
import { useCanvasStore } from '../stores/canvasStore';
import { ChatContext, ContentAnalysis } from '../types/canvas';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface CanvasIntegrationOptions {
  autoLaunch?: boolean;
  minConfidence?: number;
  showNotifications?: boolean;
}

export function useCanvasChatIntegration(options: CanvasIntegrationOptions = {}) {
  const {
    autoLaunch = true,
    minConfidence = 0.8,
    showNotifications = true
  } = options;

  const {
    createWindow,
    createAgent,
    isCanvasEnabled,
    windows
  } = useCanvasStore();

  const lastAnalysisRef = useRef<ContentAnalysis | null>(null);

  // Build chat context from message history
  const buildChatContext = useCallback((messages: Message[]): ChatContext => {
    const recentMessages = messages
      .slice(-5) // Last 5 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

    return {
      previousMessages: recentMessages,
      userPreferences: {
        responseStyle: 'detailed', // Could be extracted from user settings
        documentTypes: [] // Could be extracted from user history
      }
    };
  }, []);

  // Analyze message for canvas trigger
  const analyzeMessage = useCallback(async (
    message: string, 
    messageHistory: Message[]
  ): Promise<ContentAnalysis | null> => {
    if (!isCanvasEnabled) return null;

    try {
      const context = buildChatContext(messageHistory);
      const analysis = await contentDetectionService.analyzeUserInput(message, context);
      
      lastAnalysisRef.current = analysis;
      return analysis;
    } catch (error) {
      console.error('Canvas analysis failed:', error);
      return null;
    }
  }, [isCanvasEnabled, buildChatContext]);

  // Auto-launch canvas if conditions are met
  const handleAutoLaunch = useCallback(async (
    analysis: ContentAnalysis,
    userMessage: string
  ): Promise<string | null> => {
    if (!autoLaunch || !analysis.shouldOpenCanvas || analysis.confidence < minConfidence) {
      return null;
    }

    try {
      // Create canvas window
      const windowId = createWindow(analysis.contentType, userMessage);
      
      // Get the created window to access document ID
      const canvasWindow = windows.find(w => w.id === windowId);
      if (!canvasWindow) return null;

      // Create suggested AI agents
      const agentsCreated = analysis.suggestedAgents.length;
      setTimeout(() => {
        analysis.suggestedAgents.forEach(specialization => {
          createAgent(canvasWindow.document.id, specialization);
        });
      }, 1000);

      if (showNotifications) {
        toast.success(
          `Canvas opened for ${analysis.contentType.replace('_', ' ')} document` +
          (agentsCreated > 0 ? ` with ${agentsCreated} AI agents` : '')
        );
      }

      return windowId;
    } catch (error) {
      console.error('Auto-launch failed:', error);
      if (showNotifications) {
        toast.error('Failed to launch canvas');
      }
      return null;
    }
  }, [autoLaunch, minConfidence, showNotifications, createWindow, createAgent, windows]);

  // Main integration function to be called on each user message
  const processMessage = useCallback(async (
    userMessage: string,
    messageHistory: Message[]
  ): Promise<{
    analysis: ContentAnalysis | null;
    windowId: string | null;
    shouldShowSuggestion: boolean;
    thinkingProcess?: ThinkingProcess;
  }> => {
    const analysis = await analyzeMessage(userMessage, messageHistory);
    
    if (!analysis) {
      return {
        analysis: null,
        windowId: null,
        shouldShowSuggestion: false
      };
    }

    // Generate thinking process if canvas is triggered
    let thinkingProcess: ThinkingProcess | undefined;
    if (analysis.shouldOpenCanvas && analysis.confidence >= 0.6) {
      try {
        const context = buildChatContext(messageHistory);
        thinkingProcess = await thinkingProcessService.generateCanvasThinkingProcess(
          userMessage,
          analysis,
          context
        );
      } catch (error) {
        console.error('Error generating thinking process:', error);
      }
    }

    // Auto-launch if enabled
    const windowId = await handleAutoLaunch(analysis, userMessage);
    
    // Determine if we should show a manual suggestion
    const shouldShowSuggestion = !windowId && 
                                 analysis.shouldOpenCanvas && 
                                 analysis.confidence >= 0.6;

    return {
      analysis,
      windowId,
      shouldShowSuggestion,
      thinkingProcess
    };
  }, [analyzeMessage, handleAutoLaunch, buildChatContext]);

  // Manual launch function for user-triggered canvas creation
  const manualLaunch = useCallback(async (
    userMessage: string,
    messageHistory: Message[]
  ): Promise<string | null> => {
    const analysis = await analyzeMessage(userMessage, messageHistory);
    
    if (!analysis || !analysis.shouldOpenCanvas) {
      if (showNotifications) {
        toast.info('Unable to detect document creation intent');
      }
      return null;
    }

    return handleAutoLaunch(analysis, userMessage);
  }, [analyzeMessage, handleAutoLaunch, showNotifications]);

  // Get canvas suggestion for UI display
  const getCanvasSuggestion = useCallback((analysis: ContentAnalysis | null) => {
    if (!analysis || !analysis.shouldOpenCanvas) return null;

    const contentTypeLabel = analysis.contentType.replace('_', ' ');
    
    return {
      title: `Create ${contentTypeLabel}`,
      description: `I can help you create a ${contentTypeLabel} document with AI assistance`,
      confidence: analysis.confidence,
      contentType: analysis.contentType,
      suggestedAgents: analysis.suggestedAgents,
      requirements: analysis.extractedRequirements
    };
  }, []);

  // Check if a specific text should trigger canvas
  const shouldTriggerCanvas = useCallback((text: string): boolean => {
    return contentDetectionService.shouldLaunchCanvas(text);
  }, []);

  return {
    // Main functions
    processMessage,
    manualLaunch,
    analyzeMessage,
    
    // UI helpers
    getCanvasSuggestion,
    shouldTriggerCanvas,
    
    // State
    lastAnalysis: lastAnalysisRef.current,
    isCanvasEnabled,
    
    // Direct access to canvas functions
    createWindow,
    createAgent
  };
}

// Hook for displaying canvas suggestions in chat UI
export function useCanvasSuggestionUI() {
  const { manualLaunch } = useCanvasChatIntegration();

  const renderSuggestion = useCallback((
    analysis: ContentAnalysis,
    userMessage: string,
    messageHistory: Message[],
    onDismiss?: () => void
  ) => {
    if (!analysis.shouldOpenCanvas) return null;

    const contentTypeLabel = analysis.contentType.replace('_', ' ');
    
    return {
      type: 'canvas_suggestion',
      title: `Create ${contentTypeLabel}`,
      description: `I can help you create a ${contentTypeLabel} document with AI assistance`,
      confidence: Math.round(analysis.confidence * 100),
      agents: analysis.suggestedAgents.length,
      requirements: analysis.extractedRequirements,
      actions: [
        {
          label: 'Create Document',
          action: () => manualLaunch(userMessage, messageHistory),
          primary: true
        },
        {
          label: 'Dismiss',
          action: onDismiss,
          primary: false
        }
      ]
    };
  }, [manualLaunch]);

  return {
    renderSuggestion
  };
} 