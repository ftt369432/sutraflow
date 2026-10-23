/**
 * Universal Advanced AI Assistant Capability
 * Provides access to enhanced AI models for specialized tasks
 * Works as a capability layer that can be used by any AI system
 */

import { AICapability, CapabilityResult } from './types';

export interface AdvancedAIIntent {
  isAdvancedAI: boolean;
  task: 'completion' | 'analysis' | 'translation' | 'coding' | 'creative' | 'research';
  confidence: number;
  prompt?: string;
}

export interface AdvancedAIRequest {
  prompt: string;
  task: string;
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo';
  temperature?: number;
  maxTokens?: number;
  context?: {
    profession?: string;
    previousMessages?: Array<{role: string, content: string}>;
  };
}

export interface AdvancedAIResult extends CapabilityResult {
  response?: string;
  model?: string;
  tokensUsed?: number;
  suggestions?: string[];
}

/**
 * Universal Advanced AI Assistant Capability
 * Provides enhanced AI access to any AI system or profession
 */
export class AdvancedAICapability implements AICapability {
  name = 'advanced-ai';
  description = 'Integration with advanced AI models for specialized tasks and enhanced reasoning';
  version = '1.0.0';
  
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Detect if user wants to use advanced AI capabilities
   */
  async detectIntent(input: string): Promise<AdvancedAIIntent> {
    const lower = input.toLowerCase();
    
    // Advanced AI trigger phrases
    const advancedAIKeywords = [
      'advanced ai', 'enhanced ai', 'better ai', 'smarter ai', 'more intelligent',
      'deep analysis', 'complex reasoning', 'advanced help', 'expert analysis',
      'sophisticated response', 'detailed analysis', 'comprehensive review'
    ];
    
    // Task detection
    const taskKeywords = {
      'completion': ['complete', 'finish', 'continue writing', 'expand on'],
      'analysis': ['analyze', 'examine', 'review', 'evaluate', 'assess'],
      'translation': ['translate', 'convert language', 'translate to'],
      'coding': ['code', 'program', 'debug', 'fix code', 'write function'],
      'creative': ['creative', 'story', 'poem', 'creative writing', 'brainstorm'],
      'research': ['research', 'find information', 'explain', 'what is', 'tell me about']
    };
    
    const hasAdvancedAIIntent = advancedAIKeywords.some(keyword => lower.includes(keyword));
    
    if (!hasAdvancedAIIntent) {
      return {
        isAdvancedAI: false,
        task: 'completion',
        confidence: 0
      };
    }
    
    // Detect specific task
    let detectedTask: AdvancedAIIntent['task'] = 'completion';
    for (const [task, keywords] of Object.entries(taskKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedTask = task as AdvancedAIIntent['task'];
        break;
      }
    }
    
    // Extract prompt (remove advanced AI references)
    const prompt = input
      .replace(/advanced ai|enhanced ai|better ai|smarter ai/gi, '')
      .replace(/deep|complex|sophisticated|comprehensive/gi, '')
      .trim();
    
    return {
      isAdvancedAI: true,
      task: detectedTask,
      confidence: 0.9,
      prompt: prompt || input
    };
  }

  /**
   * Process Advanced AI request
   */
  async process(request: AdvancedAIRequest): Promise<AdvancedAIResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'OpenAI API key not configured. Please add your API key to use advanced AI features.'
        };
      }

      console.log(`� Sending request to Advanced AI (${request.model || 'gpt-3.5-turbo'})`);
      
      const response = await this.callAdvancedAI(request);
      
      return {
        success: true,
        response: response.response,
        model: response.model,
        tokensUsed: response.tokensUsed,
        suggestions: this.generateSuggestions(request.task),
        message: 'Advanced AI response generated successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Advanced AI request failed: ${error.message}`
      };
    }
  }

  /**
   * Call OpenAI Advanced AI API
   */
  private async callAdvancedAI(request: AdvancedAIRequest): Promise<{
    response: string;
    model: string;
    tokensUsed: number;
  }> {
    const model = request.model || 'gpt-3.5-turbo';
    const temperature = request.temperature || 0.7;
    const maxTokens = request.maxTokens || 2000;
    
    // Build messages array
    const messages = [];
    
    // Add system prompt based on profession/context
    if (request.context?.profession) {
      messages.push({
        role: 'system',
        content: this.getProfessionSystemPrompt(request.context.profession)
      });
    }
    
    // Add previous messages if provided
    if (request.context?.previousMessages) {
      messages.push(...request.context.previousMessages);
    }
    
    // Add current prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });
    
    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false
    };
    
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Advanced AI API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      response: data.choices[0]?.message?.content || 'No response generated',
      model,
      tokensUsed: data.usage?.total_tokens || 0
    };
  }

  /**
   * Get profession-specific system prompts
   */
  private getProfessionSystemPrompt(profession: string): string {
    const prompts = {
      'legal': 'You are an expert legal assistant. Provide accurate, professional legal guidance while noting that responses are for informational purposes only and not legal advice.',
      'medical': 'You are a knowledgeable medical assistant. Provide helpful medical information while emphasizing that responses are educational and not a substitute for professional medical advice.',
      'business': 'You are a skilled business consultant. Provide strategic business advice, market insights, and professional recommendations.',
      'real-estate': 'You are an experienced real estate professional. Provide market insights, property analysis, and real estate guidance.',
      'creative': 'You are a creative writing expert. Help with storytelling, content creation, and creative projects.',
      'academic': 'You are an academic research assistant. Provide scholarly insights, research guidance, and educational support.',
      'technical': 'You are a technical expert. Provide clear, accurate technical explanations and solutions.',
      'financial': 'You are a financial advisor. Provide financial insights, planning guidance, and investment considerations.'
    };
    
    return prompts[profession] || 'You are a helpful AI assistant. Provide accurate, useful, and professional responses.';
  }

  /**
   * Generate task-specific suggestions
   */
  private generateSuggestions(task: string): string[] {
    const suggestions = {
      'completion': [
        'Ask Advanced AI to expand specific sections',
        'Request alternative approaches',
        'Ask for more detailed examples'
      ],
      'analysis': [
        'Request deeper analysis of specific points',
        'Ask for comparative analysis',
        'Request risk assessment'
      ],
      'translation': [
        'Try different translation styles',
        'Ask for cultural context',
        'Request pronunciation guide'
      ],
      'coding': [
        'Ask for code optimization',
        'Request error handling improvements',
        'Ask for documentation'
      ],
      'creative': [
        'Request alternative creative directions',
        'Ask for character development',
        'Request plot variations'
      ],
      'research': [
        'Ask for additional sources',
        'Request specific examples',
        'Ask for related topics'
      ]
    };
    
    return suggestions[task] || [
      'Ask follow-up questions',
      'Request clarification',
      'Ask for examples'
    ];
  }

  /**
   * Set API key (for runtime configuration)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if Advanced AI is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
