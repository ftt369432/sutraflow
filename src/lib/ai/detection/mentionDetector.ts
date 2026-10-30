/**
 * MentionDetector - Detects when AI is mentioned in messages
 * Part of Layer 1: Detection
 */

export interface MentionDetection {
  isAIMention: boolean;
  mentionType: 'explicit' | 'implicit' | 'none';
  extractedPrompt: string;
  command?: AICommand;
}

export enum AICommand {
  SUMMARIZE = 'summarize',
  SEARCH = 'search',
  DRAFT = 'draft',
  SCHEDULE = 'schedule',
  REMIND = 'remind',
  ANALYZE = 'analyze',
  HELP = 'help'
}

export class MentionDetector {
  /**
   * Detect if message mentions AI
   */
  static detect(message: string): MentionDetection {
    console.log('🔍 [MentionDetector] Analyzing message:', message);
    
    // Explicit @AI or @Assistant mention
    const explicitMention = /@(AI|Assistant)\b/i.test(message);
    
    // Check for command pattern: @AI command text
    const commandMatch = message.match(/@(AI|Assistant)\s+(summarize|search|draft|schedule|remind|analyze|help)\s+(.+)/i);
    
    if (commandMatch) {
      const command = commandMatch[2].toLowerCase() as AICommand;
      const prompt = commandMatch[3].trim();
      
      console.log('✅ [MentionDetector] Command detected:', command, 'Prompt:', prompt);
      
      return {
        isAIMention: true,
        mentionType: 'explicit',
        extractedPrompt: prompt,
        command
      };
    }
    
    if (explicitMention) {
      // Simple @AI mention without command
      const prompt = message.replace(/@(AI|Assistant)\s*/i, '').trim();
      
      console.log('✅ [MentionDetector] Explicit mention detected. Prompt:', prompt);
      
      return {
        isAIMention: true,
        mentionType: 'explicit',
        extractedPrompt: prompt
      };
    }
    
    // Check for implicit questions (AI could help proactively)
    const implicitTriggers = [
      /^(what|how|why|when|where|who)\b/i,
      /\?$/,
      /can someone help/i,
      /anyone know/i,
      /does anyone/i
    ];
    
    const isImplicit = implicitTriggers.some(regex => regex.test(message));
    
    if (isImplicit) {
      console.log('💡 [MentionDetector] Implicit question detected (not auto-responding)');
      
      return {
        isAIMention: false, // Don't respond automatically to implicit
        mentionType: 'implicit',
        extractedPrompt: message
      };
    }
    
    console.log('❌ [MentionDetector] No AI mention detected');
    
    return {
      isAIMention: false,
      mentionType: 'none',
      extractedPrompt: ''
    };
  }
  
  /**
   * Get help text for AI commands
   */
  static getHelpText(): string {
    return `
**AI Commands:**

• \`@AI <question>\` - Ask me anything
• \`@AI summarize <topic>\` - Summarize conversation or document
• \`@AI search <query>\` - Search knowledge base
• \`@AI draft <type>\` - Draft a document
• \`@AI schedule <event>\` - Help schedule meetings
• \`@AI remind <task>\` - Set reminders
• \`@AI analyze <data>\` - Analyze information
• \`@AI help\` - Show this help

**Examples:**
• \`@AI what did we decide about the project timeline?\`
• \`@AI summarize the last 20 messages\`
• \`@AI draft a proposal for the new feature\`
    `.trim();
  }
}
