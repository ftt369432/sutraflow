import { AIServiceFactory, SimpleAIService } from './aiServiceFactory';

/**
 * Claude AI Service Wrapper
 * Provides access to Anthropic's Claude 3.5 Sonnet through the unified AI provider system.
 */
export const claudeService: SimpleAIService = {
  generateText: async (prompt: string, options?: any): Promise<string> => {
    // Force anthropic provider via AIServiceFactory
    const { AIService } = await import('./aiService');
    const svc = await AIService.getInstance();
    return await svc.generateText(prompt, { ...options, provider: 'anthropic' });
  }
};

// Default export for flexibility
export default claudeService;