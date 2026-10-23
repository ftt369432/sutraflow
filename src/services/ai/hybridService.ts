// Hybrid AI Service - Intelligent routing between Cloud and Private AI
// Routes requests to appropriate backend without disrupting existing system

import type { SimpleAIService } from './aiServiceFactory';
import { knowledgeService } from './knowledgeService';

export interface HybridOptions {
  preferPrivate?: boolean; // Force private AI
  preferCloud?: boolean; // Force cloud AI
  learnFromResponse?: boolean; // Automatically learn from conversations
  usePersonalStyle?: boolean; // Generate in user's learned style
  queryKnowledge?: boolean; // Search private knowledge base first
}

class HybridAIService implements SimpleAIService {
  private cloudService: SimpleAIService | null = null;
  private privateService: SimpleAIService | null = null;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(cloudService: SimpleAIService, privateService: SimpleAIService) {
    this.cloudService = cloudService;
    this.privateService = privateService;
    
    console.log('🔀 Hybrid AI Service initialized');
    console.log('☁️  Cloud AI: Available');
    console.log('🏠 Private AI: Available');
    console.log('🧠 Knowledge Base: Connected');
  }

  async generateText(prompt: string, options?: HybridOptions): Promise<string> {
    try {
      // Step 1: Query private knowledge base if requested
      let contextFromKnowledge = '';
      if (options?.queryKnowledge) {
        try {
          const knowledge = await knowledgeService.queryKnowledge(prompt, { limit: 3 });
          if (knowledge?.results?.length > 0) {
            contextFromKnowledge = '\n\nRelevant context from your knowledge base:\n' +
              knowledge.results.map((r: any) => `- ${r.payload.text}`).join('\n');
            console.log('📚 Retrieved context from private knowledge base');
          }
        } catch (error) {
          console.warn('⚠️ Knowledge query failed, continuing without context:', error);
        }
      }

      const enhancedPrompt = prompt + contextFromKnowledge;

      // Step 2: Determine which AI to use
      let response: string;
      
      if (options?.usePersonalStyle && this.privateService) {
        // Generate in user's personal style
        console.log('🎨 Using personal style generation');
        try {
          const result = await knowledgeService.generatePersonal(enhancedPrompt);
          response = result.response;
        } catch (error) {
          console.warn('⚠️ Personal style generation failed, falling back to cloud:', error);
          response = await this.cloudService!.generateText(enhancedPrompt, options);
        }
      } else if (options?.preferPrivate && this.privateService) {
        // Use private AI (local Ollama)
        console.log('🏠 Routing to private AI');
        response = await this.privateService.generateText(enhancedPrompt, options);
      } else if (options?.preferCloud && this.cloudService) {
        // Use cloud AI (Gemini/Groq)
        console.log('☁️  Routing to cloud AI');
        response = await this.cloudService.generateText(enhancedPrompt, options);
      } else {
        // Smart routing: Try private first for speed, fall back to cloud
        console.log('🔀 Smart routing: Trying private first...');
        try {
          response = await this.privateService!.generateText(enhancedPrompt, { 
            ...options, 
            timeout: 10000 // 10s timeout for private
          });
          console.log('✅ Private AI responded');
        } catch (error) {
          console.log('⚠️ Private AI unavailable, falling back to cloud');
          response = await this.cloudService!.generateText(enhancedPrompt, options);
        }
      }

      // Step 3: Learn from the conversation if enabled
      if (options?.learnFromResponse) {
        this.conversationHistory.push(
          { role: 'user', content: prompt },
          { role: 'assistant', content: response }
        );

        // Learn from user's message (not the AI response)
        knowledgeService.learnFromText(prompt, {
          source: 'chat',
          timestamp: new Date().toISOString(),
          context: 'user_message'
        }).catch(err => console.warn('Learning failed:', err));

        // Periodically save conversation history
        if (this.conversationHistory.length >= 10) {
          knowledgeService.learnFromConversation(
            this.conversationHistory.slice(-10),
            { source: 'chat_history' }
          ).catch(err => console.warn('Conversation learning failed:', err));
        }
      }

      return response;

    } catch (error) {
      console.error('❌ Hybrid AI request failed:', error);
      throw error;
    }
  }

  // Helper: Learn from any text
  async learn(text: string, metadata?: any): Promise<void> {
    await knowledgeService.learnFromText(text, metadata);
  }

  // Helper: Query knowledge base
  async search(query: string, limit?: number): Promise<any> {
    return await knowledgeService.queryKnowledge(query, { limit });
  }

  // Helper: Get learning progress
  async getProgress(): Promise<any> {
    return await knowledgeService.getStats();
  }

  // Helper: Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Check system status
  async checkStatus(): Promise<{
    cloud: boolean;
    private: boolean;
    knowledge: boolean;
    samplesCollected: number;
    readyForPersonalModel: boolean;
  }> {
    const status = {
      cloud: false,
      private: false,
      knowledge: false,
      samplesCollected: 0,
      readyForPersonalModel: false
    };

    // Test cloud
    try {
      await this.cloudService?.generateText('ping', { timeout: 3000 });
      status.cloud = true;
    } catch (e) {
      console.warn('Cloud AI unavailable');
    }

    // Test private
    try {
      await this.privateService?.generateText('ping', { timeout: 3000 });
      status.private = true;
    } catch (e) {
      console.warn('Private AI unavailable');
    }

    // Check knowledge base
    try {
      const stats = await knowledgeService.getStats();
      status.knowledge = true;
      status.samplesCollected = stats.pipeline.samplesProcessed;
      status.readyForPersonalModel = stats.pipeline.samplesProcessed >= 100;
    } catch (e) {
      console.warn('Knowledge base unavailable');
    }

    return status;
  }
}

export default HybridAIService;
