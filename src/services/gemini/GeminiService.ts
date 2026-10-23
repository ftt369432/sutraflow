/**
 * Gemini AI Service
 * 
 * Centralized service for Gemini AI interactions.
 * Follows development guidelines:
 * - Clean, production-ready code
 * - Centralized resource strategy
 * - React hooks integration
 * - Beautiful error handling
 */

import { getGeminiConfig, STREAMING_DELAY } from '../../config/gemini';

export interface GeminiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finish_reason?: string;
}

export interface GeminiStreamChunk {
  content: string;
  isComplete: boolean;
}

export class GeminiService {
  private static instance: GeminiService;
  private config = getGeminiConfig();

  public constructor() {
    console.log('🤖 Gemini Service initialized - Gemini-only mode');
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Generate a response from Gemini AI
   */
  async generateResponse(
    prompt: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<GeminiResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: options.systemPrompt 
                  ? `${options.systemPrompt}\n\nUser: ${prompt}`
                  : prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature,
          maxOutputTokens: options.maxTokens ?? this.config.maxTokens,
        }
      };

      const response = await fetch(
        `${this.config.baseUrl}/${this.config.apiVersion}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      return {
        content: data.candidates[0].content.parts[0].text,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        } : undefined,
        finish_reason: data.candidates[0].finishReason || 'stop',
      };
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming response from Gemini AI
   * Simulates streaming for better UX
   */
  async *generateStreamingResponse(
    prompt: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<GeminiStreamChunk, void, unknown> {
    try {
      // Get the full response first
      const response = await this.generateResponse(prompt, options);
      const words = response.content.split(/(\s+)/);
      
      // Stream words with delay for better UX
      for (let i = 0; i < words.length; i++) {
        yield {
          content: words.slice(0, i + 1).join(''),
          isComplete: i === words.length - 1,
        };
        
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, STREAMING_DELAY));
        }
      }
    } catch (error) {
      console.error('❌ Gemini streaming error:', error);
      yield {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isComplete: true,
      };
    }
  }

  /**
   * Chat with context (conversation history)
   */
  async chatWithContext(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    newMessage: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<GeminiResponse> {
    // Convert conversation to a single prompt
    const conversationHistory = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    const fullPrompt = conversationHistory 
      ? `${conversationHistory}\n\nUser: ${newMessage}`
      : newMessage;

    return this.generateResponse(fullPrompt, options);
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      model: this.config.model,
      apiVersion: this.config.apiVersion,
      features: this.config.features,
    };
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance();
export default geminiService;
