import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAIStore } from '../store/aiStore';
import { useNotifications } from './useNotifications';
import type { AIConfig, Message, DocumentReference } from '../types/ai';
import { mockAIService } from '../services/ai/mockOpenAI';

// Only support Gemini provider
export type AIProvider = 'gemini';

interface AIState extends AIConfig {
  provider: AIProvider;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useNotifications();
  const [config, setConfig] = useState<AIState>({
    provider: 'gemini',
    model: 'gemini-1.5-flash'
  });

  // Initialize Gemini client only if API key is available
  const genAI = import.meta.env.VITE_GEMINI_API_KEY ? new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY) : null;

  const formatContextForProvider = (
    context: DocumentReference[] | undefined
  ): string => {
    if (!context || context.length === 0) return '';

    const formattedContext = context
      .map(doc => `${doc.title}:\n${doc.excerpt}`)
      .join('\n\n');

    return `Here is some relevant context:\n${formattedContext}\n\nUsing this context, `;
  };

  const sendMessage = useCallback(async (
    content: string,
    options?: Partial<AIConfig>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // If no API keys are available, use mock service
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        const mockResponse = await mockAIService.getCompletion(content, {
          model: options?.model || config.model,
          temperature: options?.temperature || 0.7
        });
        return mockResponse;
      }

      const mergedConfig = { ...config, ...options };
      const contextPrefix = formatContextForProvider(mergedConfig.context);
      const fullContent = contextPrefix + content;

      if (!genAI) throw new Error('Gemini API key not configured');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
      });

      const prompt = mergedConfig.systemPrompt 
        ? `${mergedConfig.systemPrompt}\n\n${fullContent}`
        : fullContent;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config, genAI, showError]);

  const updateConfig = useCallback((newConfig: Partial<AIState>) => {
    setConfig(current => ({ ...current, ...newConfig }));
  }, []);

  return {
    sendMessage,
    updateConfig,
    config,
    isLoading,
    error
  };
}