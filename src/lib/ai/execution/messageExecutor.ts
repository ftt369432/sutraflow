/**
 * MessageExecutor - Executes AI responses by posting to channels
 * Part of Layer 3: Execution
 */

import type { Thread } from '../../../types/team';
import type { AIResponse } from '../processing/responseGenerator';

export interface PostOptions {
  replyToMessageId?: string;
  isAI?: boolean;
}

export class MessageExecutor {
  /**
   * Format AI response for posting
   */
  static formatAIMessage(response: AIResponse): string {
    let formatted = response.content;
    
    // Add confidence indicator if low
    if (response.confidence < 0.8 && response.confidence > 0) {
      const confidencePercent = Math.round(response.confidence * 100);
      formatted += `\n\n_Confidence: ${confidencePercent}%_`;
    }
    
    // Add metadata footer
    if (response.metadata) {
      const processingTime = response.metadata.processingTime;
      if (processingTime > 1000) {
        formatted += `\n\n_Processed in ${(processingTime / 1000).toFixed(1)}s_`;
      }
    }
    
    return formatted;
  }
  
  /**
   * Create AI message object for posting
   */
  static createAIMessage(
    response: AIResponse,
    userId: string = 'ai-assistant',
    userName: string = 'AI Assistant'
  ): Thread {
    const formattedContent = this.formatAIMessage(response);
    
    return {
      id: `ai-${Date.now()}`,
      page_id: '',
      user_id: userId,
      content: formattedContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_profile: {
        id: userId,
        full_name: userName,
        display_name: userName,
        avatar_url: '🤖'
      }
    };
  }
  
  /**
   * Validate message before posting
   */
  static validateMessage(message: Thread): { valid: boolean; error?: string } {
    if (!message.content || message.content.trim().length === 0) {
      return { valid: false, error: 'Message content is empty' };
    }
    
    if (message.content.length > 10000) {
      return { valid: false, error: 'Message exceeds maximum length' };
    }
    
    return { valid: true };
  }
}
