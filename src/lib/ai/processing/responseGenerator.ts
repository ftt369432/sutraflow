/**
 * ResponseGenerator - Generates AI responses based on context
 * Part of Layer 2: Processing
 */

import type { MessageContext } from '../detection/contextExtractor';
import { AICommand } from '../detection/mentionDetector';

export interface AIResponse {
  content: string;
  confidence: number;
  command?: AICommand;
  metadata?: {
    model: string;
    timestamp: Date;
    processingTime: number;
  };
}

export interface GenerationOptions {
  style?: 'professional' | 'casual' | 'technical';
  maxLength?: number;
  temperature?: number;
}

export class ResponseGenerator {
  /**
   * Generate AI response based on context and prompt
   */
  static async generate(
    prompt: string,
    context: MessageContext,
    command?: AICommand,
    options: GenerationOptions = {}
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    console.log('🤖 [ResponseGenerator] Generating response for:', { prompt, command });
    
    const {
      style = 'professional',
      maxLength = 500,
      temperature = 0.7
    } = options;
    
    try {
      // Handle specific commands
      if (command) {
        const commandResponse = await this.handleCommand(command, prompt, context);
        if (commandResponse) {
          return {
            ...commandResponse,
            metadata: {
              model: 'command-handler',
              timestamp: new Date(),
              processingTime: Date.now() - startTime
            }
          };
        }
      }
      
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context, style);
      
      // Build user prompt with context
      const fullPrompt = this.buildUserPrompt(prompt, context);
      
      console.log('📝 [ResponseGenerator] System prompt:', systemPrompt);
      console.log('📝 [ResponseGenerator] User prompt:', fullPrompt);
      
      // For now, return a simulated response
      // TODO: Replace with actual AI service integration
      const content = await this.simulateAIResponse(prompt, context, command);
      
      const processingTime = Date.now() - startTime;
      
      console.log('✅ [ResponseGenerator] Response generated in', processingTime, 'ms');
      
      return {
        content,
        confidence: 0.85,
        command,
        metadata: {
          model: 'simulated',
          timestamp: new Date(),
          processingTime
        }
      };
      
    } catch (error) {
      console.error('❌ [ResponseGenerator] Error generating response:', error);
      
      return {
        content: `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your question.`,
        confidence: 0,
        command,
        metadata: {
          model: 'error',
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Handle specific commands
   */
  private static async handleCommand(
    command: AICommand,
    prompt: string,
    context: MessageContext
  ): Promise<AIResponse | null> {
    console.log('🎯 [ResponseGenerator] Handling command:', command);
    
    switch (command) {
      case AICommand.HELP:
        return {
          content: this.getHelpResponse(),
          confidence: 1.0,
          command
        };
        
      case AICommand.SUMMARIZE:
        return {
          content: await this.generateSummary(context),
          confidence: 0.9,
          command
        };
        
      case AICommand.SEARCH:
        return {
          content: `Searching for: "${prompt}"\n\n_Search functionality coming soon!_`,
          confidence: 0.7,
          command
        };
        
      default:
        return null;
    }
  }
  
  /**
   * Build system prompt for AI
   */
  private static buildSystemPrompt(context: MessageContext, style: string): string {
    return `You are an AI assistant participating in a team chat channel called "${context.channelName}".

Channel type: ${context.channelType}
Active participants: ${context.participants.map(p => p.name).join(', ')}

Communication style: ${style}
- Be helpful and proactive
- Provide clear, actionable responses
- Reference conversation context when relevant
- Admit when you're unsure
- Be a good team member

Recent conversation has ${context.recentMessages.length} messages.`;
  }
  
  /**
   * Build user prompt with context
   */
  private static buildUserPrompt(prompt: string, context: MessageContext): string {
    let fullPrompt = `User question: ${prompt}\n\n`;
    
    // Inject pinned file context if available
    if (context.pinnedDriveFiles && context.pinnedDriveFiles.length > 0) {
      fullPrompt += `📋 CURRENT PINNED DOCUMENTS CONTEXT:\n`;
      context.pinnedDriveFiles.forEach(file => {
        fullPrompt += `--- START FILE: ${file.name} ---\n`;
        const content = file.ocr_text || file.content || file.ai_summary || "(No readable text detected or file not yet processed)";
        fullPrompt += `${content}\n`;
        fullPrompt += `--- END FILE: ${file.name} ---\n\n`;
      });
    }

    if (context.recentMessages.length > 0) {
      const recentMsgs = context.recentMessages.slice(-10);
      fullPrompt += `Recent conversation:\n`;
      recentMsgs.forEach(msg => {
        const userName = msg.user_profile?.full_name || msg.user_profile?.display_name || 'User';
        fullPrompt += `${userName}: ${msg.content}\n`;
      });
      fullPrompt += `\n`;
    }
    
    return fullPrompt;
  }
  
  /**
   * Simulate AI response (temporary)
   */
  private static async simulateAIResponse(
    prompt: string,
    context: MessageContext,
    command?: AICommand
  ): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (command === AICommand.SUMMARIZE) {
      return this.generateSummary(context);
    }
    
    // Generic helpful response
    return `I understand you're asking about: "${prompt}"\n\nIn the **${context.channelName}** channel, I can help with:\n• Answering questions about our conversation\n• Summarizing discussions\n• Searching for information\n• Drafting documents\n\n_Note: Full AI integration coming soon! Currently in demo mode._`;
  }
  
  /**
   * Generate conversation summary
   */
  private static async generateSummary(context: MessageContext): Promise<string> {
    const messageCount = context.recentMessages.length;
    
    if (messageCount === 0) {
      return `No recent messages to summarize in **${context.channelName}**.`;
    }
    
    const participants = new Set(context.recentMessages.map(m => {
      return m.user_profile?.full_name || m.user_profile?.display_name || m.user_id;
    })).size;
    const recentTopics = this.extractTopics(context.recentMessages);
    
    let summary = `**Summary of ${context.channelName}**\n\n`;
    summary += `📊 **Stats**: ${messageCount} messages from ${participants} participants\n\n`;
    
    if (recentTopics.length > 0) {
      summary += `**Topics discussed**:\n`;
      recentTopics.forEach(topic => {
        summary += `• ${topic}\n`;
      });
    }
    
    const recentMsgs = context.recentMessages.slice(-5);
    summary += `\n**Recent messages**:\n`;
    recentMsgs.forEach(msg => {
      const userName = msg.user_profile?.full_name || msg.user_profile?.display_name || 'User';
      summary += `• **${userName}**: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}\n`;
    });
    
    return summary;
  }
  
  /**
   * Extract topics from messages (simple keyword extraction)
   */
  private static extractTopics(messages: import('../../../types/team').Thread[]): string[] {
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Simple topic detection based on common words
    const topics: string[] = [];
    
    if (/\b(project|feature|task)\b/.test(allText)) topics.push('Project work');
    if (/\b(meeting|schedule|calendar)\b/.test(allText)) topics.push('Scheduling');
    if (/\b(bug|issue|fix|error)\b/.test(allText)) topics.push('Technical issues');
    if (/\b(deadline|due|urgent)\b/.test(allText)) topics.push('Deadlines');
    if (/\b(question|help|how)\b/.test(allText)) topics.push('Questions & help');
    
    return topics;
  }
  
  /**
   * Get help response
   */
  private static getHelpResponse(): string {
    return `**🤖 AI Assistant Help**

I'm here to help your team collaborate better! Here's what I can do:

**Commands:**
• \`@AI <question>\` - Ask me anything
• \`@AI summarize\` - Summarize recent conversation
• \`@AI search <query>\` - Search knowledge base
• \`@AI draft <type>\` - Draft a document
• \`@AI help\` - Show this help

**Examples:**
\`\`\`
@AI what did we decide about the timeline?
@AI summarize the last discussion
@AI draft a meeting agenda
\`\`\`

**Tips:**
• Mention me with @AI to get my attention
• I understand context from recent messages
• I work best with clear, specific questions

_Currently in demo mode - full AI integration coming soon!_`;
  }
}
