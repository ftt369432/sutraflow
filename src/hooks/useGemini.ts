/**
 * useGemini Hook
 * 
 * React hook for Gemini AI interactions.
 * Follows development guidelines:
 * - React hooks for logic and interactivity
 * - Centralized resource strategy
 * - Clean error handling
 * - Production-ready state management
 */

import { useState, useCallback, useRef } from 'react';
import { geminiService, GeminiResponse, GeminiStreamChunk } from '../services/gemini/GeminiService';
import { GEMINI_CONFIG } from '../config/gemini';

interface UseGeminiOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableStreaming?: boolean;
}

interface UseGeminiState {
  isLoading: boolean;
  isStreaming: boolean;
  response: string;
  fullResponse: GeminiResponse | null;
  error: string | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useGemini(options: UseGeminiOptions = {}) {
  const [state, setState] = useState<UseGeminiState>({
    isLoading: false,
    isStreaming: false,
    response: '',
    fullResponse: null,
    error: null,
  });

  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    systemPrompt = GEMINI_CONFIG.systemPrompts.default,
    temperature = GEMINI_CONFIG.temperature,
    maxTokens = GEMINI_CONFIG.maxTokens,
    enableStreaming = GEMINI_CONFIG.features.streamingEnabled,
  } = options;

  /**
   * Generate a response from Gemini AI
   */
  const generateResponse = useCallback(async (prompt: string) => {
    if (!geminiService.isConfigured()) {
      setState(prev => ({
        ...prev,
        error: 'Gemini API key not configured. Please check your environment variables.',
      }));
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      isStreaming: false,
      error: null,
      response: '',
      fullResponse: null,
    }));

    try {
      if (enableStreaming) {
        setState(prev => ({ ...prev, isStreaming: true }));
        
        const streamGenerator = geminiService.generateStreamingResponse(prompt, {
          systemPrompt,
          temperature,
          maxTokens,
        });

        for await (const chunk of streamGenerator) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          setState(prev => ({
            ...prev,
            response: chunk.content,
            isStreaming: !chunk.isComplete,
            isLoading: chunk.isComplete ? false : prev.isLoading,
          }));

          if (chunk.isComplete) {
            // Add to conversation history
            setConversation(prev => [
              ...prev,
              { role: 'user', content: prompt, timestamp: new Date() },
              { role: 'assistant', content: chunk.content, timestamp: new Date() },
            ]);
          }
        }
      } else {
        const response = await geminiService.generateResponse(prompt, {
          systemPrompt,
          temperature,
          maxTokens,
        });

        setState(prev => ({
          ...prev,
          isLoading: false,
          response: response.content,
          fullResponse: response,
          usage: response.usage,
        }));

        // Add to conversation history
        setConversation(prev => [
          ...prev,
          { role: 'user', content: prompt, timestamp: new Date() },
          { role: 'assistant', content: response.content, timestamp: new Date() },
        ]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [systemPrompt, temperature, maxTokens, enableStreaming]);

  /**
   * Continue conversation with context
   */
  const continueConversation = useCallback(async (message: string) => {
    if (!geminiService.isConfigured()) {
      setState(prev => ({
        ...prev,
        error: 'Gemini API key not configured. Please check your environment variables.',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      response: '',
    }));

    try {
      const response = await geminiService.chatWithContext(
        conversation,
        message,
        { systemPrompt, temperature, maxTokens }
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        response: response.content,
        fullResponse: response,
        usage: response.usage,
      }));

      // Add to conversation history
      setConversation(prev => [
        ...prev,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response.content, timestamp: new Date() },
      ]);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [conversation, systemPrompt, temperature, maxTokens]);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setConversation([]);
    setState(prev => ({
      ...prev,
      response: '',
      fullResponse: null,
      error: null,
    }));
  }, []);

  /**
   * Cancel current request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
      }));
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancelRequest();
    setState({
      isLoading: false,
      isStreaming: false,
      response: '',
      fullResponse: null,
      error: null,
    });
  }, [cancelRequest]);

  return {
    // State
    ...state,
    conversation,
    isConfigured: geminiService.isConfigured(),
    
    // Actions
    generateResponse,
    continueConversation,
    clearConversation,
    cancelRequest,
    reset,
    
    // Utils
    status: geminiService.getStatus(),
  };
}

export default useGemini;
