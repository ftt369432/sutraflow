// 🆓 Baseline Chat Service - FREE Tier Chat Interface
// Basic chat without specialized assistant loading

import { AIServiceFactory } from './ai/aiServiceFactory';

interface BaselineChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BaselineChatResponse {
  message: BaselineChatMessage;
  suggestions: string[];
  premiumUpgrade?: {
    message: string;
    benefits: string[];
    assistants: string[];
  };
  usage: {
    messagesLeft: number;
    dailyLimit: number;
  };
}

/**
 * 🆓 FREE TIER - Baseline Chat Service
 * Basic AI chat without specialized assistant training
 */
export class BaselineChatService {
  private static instance: BaselineChatService;
  private dailyMessageCount: number = 0;
  private lastResetDate: string = new Date().toDateString();
  
  // FREE TIER LIMITS
  private readonly DAILY_MESSAGE_LIMIT = 20;
  private readonly UPGRADE_SUGGESTIONS = [
    "💡 Try asking about creating viral content",
    "⚖️ Need legal document help?", 
    "🏥 Want medical research assistance?",
    "🚀 Looking for business strategy advice?"
  ];

  public static getInstance(): BaselineChatService {
    if (!BaselineChatService.instance) {
      BaselineChatService.instance = new BaselineChatService();
    }
    return BaselineChatService.instance;
  }

  private constructor() {
    this.resetDailyCountIfNeeded();
  }

  private resetDailyCountIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyMessageCount = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * 💬 FREE TIER CHAT - Basic AI without specialized training
   */
  public async chat(message: string): Promise<BaselineChatResponse> {
    this.resetDailyCountIfNeeded();
    
    // Check daily limits
    if (this.dailyMessageCount >= this.DAILY_MESSAGE_LIMIT) {
      return {
        message: {
          id: `baseline_${Date.now()}`,
          role: 'assistant',
          content: "🚀 You've reached your daily limit of 20 messages! Upgrade to Premium to get unlimited chat plus access to our specialized assistants like Creative Muse, Legal Eagle, and MediBot.",
          timestamp: new Date()
        },
        suggestions: [],
        premiumUpgrade: this.getPremiumUpgradeOffer(),
        usage: {
          messagesLeft: 0,
          dailyLimit: this.DAILY_MESSAGE_LIMIT
        }
      };
    }

    // Increment usage
    this.dailyMessageCount++;

    try {
      // Use basic AI service without specialized assistant training
      const aiService = AIServiceFactory.getService();
      const response = await aiService.generateResponse([
        {
          role: 'system',
          content: `You are a helpful AI assistant. You provide general assistance but remind users about specialized features available with premium assistants.

IMPORTANT: You are the FREE TIER baseline chat. You should:
- Provide helpful general responses
- Mention that specialized assistants (Creative Muse, Legal Eagle, MediBot) offer advanced features
- Encourage upgrades when relevant to user queries
- Keep responses concise and friendly

For creator content, legal questions, or medical topics, mention the relevant premium assistant.`
        },
        {
          role: 'user', 
          content: message
        }
      ]);

      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(message);
      
      // Show upgrade offer periodically
      const showUpgrade = this.shouldShowUpgradeOffer();

      return {
        message: {
          id: `baseline_${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date()
        },
        suggestions,
        premiumUpgrade: showUpgrade ? this.getPremiumUpgradeOffer() : undefined,
        usage: {
          messagesLeft: this.DAILY_MESSAGE_LIMIT - this.dailyMessageCount,
          dailyLimit: this.DAILY_MESSAGE_LIMIT
        }
      };

    } catch (error) {
      console.error('Baseline chat error:', error);
      
      return {
        message: {
          id: `baseline_${Date.now()}`,
          role: 'assistant', 
          content: "I'm sorry, I encountered an error. Please try again. Upgrade to Premium for more reliable service with our specialized assistants!",
          timestamp: new Date()
        },
        suggestions: this.UPGRADE_SUGGESTIONS,
        premiumUpgrade: this.getPremiumUpgradeOffer(),
        usage: {
          messagesLeft: this.DAILY_MESSAGE_LIMIT - this.dailyMessageCount,
          dailyLimit: this.DAILY_MESSAGE_LIMIT
        }
      };
    }
  }

  private generateSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('content') || lowerMessage.includes('viral') || lowerMessage.includes('tiktok') || lowerMessage.includes('instagram')) {
      return [
        "🎨 Creative Muse can help create viral content",
        "📱 Ask about TikTok optimization strategies", 
        "🎬 Get video script templates"
      ];
    }
    
    if (lowerMessage.includes('legal') || lowerMessage.includes('contract') || lowerMessage.includes('law')) {
      return [
        "⚖️ Legal Eagle can review contracts",
        "📋 Get legal document templates",
        "🛡️ Check compliance requirements"
      ];
    }
    
    if (lowerMessage.includes('health') || lowerMessage.includes('medical') || lowerMessage.includes('doctor')) {
      return [
        "🏥 MediBot provides medical research", 
        "📚 Get health information verification",
        "🔬 Access medical literature"
      ];
    }

    if (lowerMessage.includes('business') || lowerMessage.includes('strategy') || lowerMessage.includes('startup')) {
      return [
        "💼 Get business strategy assistance",
        "📈 Analyze market opportunities", 
        "🚀 Plan startup growth"
      ];
    }
    
    return this.UPGRADE_SUGGESTIONS;
  }

  private shouldShowUpgradeOffer(): boolean {
    // Show upgrade offer every 5 messages or when nearing limit
    return this.dailyMessageCount % 5 === 0 || this.dailyMessageCount > 15;
  }

  private getPremiumUpgradeOffer() {
    return {
      message: "🚀 Unlock the full power of GenieFlow AI!",
      benefits: [
        "🎨 Creative Muse - Viral content creation",
        "⚖️ Legal Eagle - Contract review & compliance", 
        "🏥 MediBot - Medical research & verification",
        "💼 Business Strategy - Growth planning",
        "💬 Unlimited conversations",
        "🎙️ Voice responses",
        "📱 Mobile app access"
      ],
      assistants: [
        "Creative Muse ($19.99/mo)",
        "Legal Eagle ($49.99/mo)", 
        "MediBot ($44.99/mo)",
        "Business Strategist ($39.99/mo)"
      ]
    };
  }

  /**
   * Get current usage statistics
   */
  public getUsageStats() {
    this.resetDailyCountIfNeeded();
    return {
      messagesUsed: this.dailyMessageCount,
      messagesLeft: this.DAILY_MESSAGE_LIMIT - this.dailyMessageCount,
      dailyLimit: this.DAILY_MESSAGE_LIMIT,
      resetTime: new Date(new Date().setHours(24, 0, 0, 0))
    };
  }
}