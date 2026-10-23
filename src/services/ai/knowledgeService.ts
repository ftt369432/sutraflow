// Unified API for learning, storage, and knowledge retrieval
import { getEnv } from '../../config/env';

export interface LearningMetadata {
  source?: string;
  timestamp?: string;
  tags?: string[];
  context?: string;
}

export interface KnowledgeQuery {
  query: string;
  limit?: number;
  filter?: Record<string, any>;
}

export interface LearningStats {
  system: {
    collections: {
      WRITING_SAMPLES: { points: number };
      KNOWLEDGE: { points: number };
      CONVERSATIONS: { points: number };
      STYLE_PROFILE: { points: number };
    };
    styleProfile: {
      vocabularySize: number;
      phrasesLearned: number;
      tone: string;
      avgSentenceLength: string;
    };
  };
  personalModels: {
    success: boolean;
    models: string[];
  };
  pipeline: {
    queueSize: number;
    samplesProcessed: number;
    nextModelUpdate: number;
  };
}

class PrivateKnowledgeService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.nanoHubUrl;
    this.apiKey = env.nanoHubApiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('genieflow_api_key') : null);

    console.log('🧠 Private Knowledge Base initialized');
    console.log('📍 URL:', this.baseUrl);
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey || ''
    };
  }

  // Learn from text (adds to private knowledge base)
  async learnFromText(text: string, metadata?: LearningMetadata): Promise<{ queued: boolean; queueSize: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/learn/text`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ text, metadata })
      });

      if (!response.ok) {
        throw new Error(`Learning failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to learn from text:', error);
      throw error;
    }
  }

  // Learn from conversation (captures chat history)
  async learnFromConversation(messages: Array<{ role: string; content: string }>, metadata?: LearningMetadata): Promise<{ queued: boolean; queueSize: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/learn/conversation`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ messages, metadata })
      });

      if (!response.ok) {
        throw new Error(`Conversation learning failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to learn from conversation:', error);
      throw error;
    }
  }

  // Query knowledge base (semantic search)
  async queryKnowledge(query: string, options?: { limit?: number }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          limit: options?.limit || 5
        })
      });

      if (!response.ok) {
        throw new Error(`Knowledge query failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to query knowledge:', error);
      throw error;
    }
  }

  // Generate in personal style
  async generatePersonal(prompt: string): Promise<{ response: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate/personal`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`Personal generation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to generate personal response:', error);
      throw error;
    }
  }

  // Get learning statistics
  async getStats(): Promise<LearningStats> {
    try {
      const response = await fetch(`${this.baseUrl}/api/learn/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Stats request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      throw error;
    }
  }

  // Create personal AI model (after collecting enough samples)
  async createPersonalModel(baseModel: string = 'llama3.2:3b', modelName: string = 'me'): Promise<any> {
    try {
      // Note: This requires authentication token, not just API key
      const response = await fetch(`${this.baseUrl}/api/model/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Requires login
        },
        body: JSON.stringify({ baseModel, modelName })
      });

      if (!response.ok) {
        throw new Error(`Model creation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to create personal model:', error);
      throw error;
    }
  }

  // List personal models
  async listModels(): Promise<{ models: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/model/list`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Model list failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to list models:', error);
      throw error;
    }
  }

  // Test personal model
  async testModel(modelName: string, prompt: string): Promise<{ response: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/model/test`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ modelName, prompt })
      });

      if (!response.ok) {
        throw new Error(`Model test failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to test model:', error);
      throw error;
    }
  }

  // Auto-learn from user actions (call this from your app)
  enableAutoLearning() {
    console.log('🤖 Auto-learning enabled - will capture user interactions');

    // Hook into global events to capture learning opportunities
    if (typeof window !== 'undefined') {
      // Capture document edits
      document.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
          // Debounce and learn from text
          this.debouncedLearn(target);
        }
      });
    }
  }

  private debounceTimers: Map<HTMLElement, NodeJS.Timeout> = new Map();

  private debouncedLearn(element: HTMLElement) {
    const existing = this.debounceTimers.get(element);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      const value = (element as HTMLInputElement | HTMLTextAreaElement).value;
      if (value && value.length > 50) { // Only learn from substantial text
        this.learnFromText(value, {
          source: 'user_input',
          timestamp: new Date().toISOString()
        }).catch(console.error);
      }
    }, 5000); // Wait 5s after typing stops

    this.debounceTimers.set(element, timer);
  }
}

// Export singleton
export const knowledgeService = new PrivateKnowledgeService();
