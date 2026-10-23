import { soul } from '../../cortex/Soul';

export interface CapabilityAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  suggestedImprovements?: string[];
  knowledgeGaps: string[];
  overallScore: number;
}

class AssistantConversationService {
  generateWelcomeMessage(assistant: any | null): string {
    if (assistant) {
      return `Hello! I'm ${assistant.name}. ${assistant.description || ''}`;
    }
    return 'Hello! I\'m ready to help you configure a new AI assistant.';
  }

  async generateResponse(
    userMessage: string,
    context: {
      name: string;
      description?: string;
      systemPrompt?: string;
      knowledgeFolders?: string[];
      assistantId?: string;
    },
    history: { role: string; content: string }[]
  ): Promise<string> {
    console.log(`🤖 AssistantService: Synchronizing with Spirit [${context.name}]...`);

    // 1. Ensure the Soul is wearing the right Persona
    if (context.assistantId && soul.getCurrentPersonaId() !== context.assistantId) {
      await soul.setPersona(context.assistantId);
    }

    // 2. Let the Soul decide the next action
    const intention = await soul.decide({
      lastUserMessage: userMessage,
      timestamp: Date.now(),
      history,
      environment: 'assistant-chat',
      metadata: {
        assistantName: context.name,
        description: context.description
      }
    });

    if (!intention) return "I'm reflecting on that...";

    // 3. For chat responses, we primarily care about the 'reasoning' (the text)
    // and any immediate actions that can be acknowledged.
    if (intention.action === 'SEND_MESSAGE' && intention.payload?.message) {
      return intention.payload.message;
    }

    return intention.reasoning || "Acknowledged. I'm processing your request.";
  }

  extractSystemPromptSuggestion(message: string): string | null {
    // Look for patterns that suggest system prompt content
    const promptPatterns = [
      /you should be (.*?)(?:\.|$)/i,
      /your role should be (.*?)(?:\.|$)/i,
      /system prompt: (.*?)(?:\.|$)/i,
      /configure you to (.*?)(?:\.|$)/i
    ];

    for (const pattern of promptPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  async analyzeCapabilities(assistant: any): Promise<CapabilityAnalysis> {
    // Mock implementation for now - can be enhanced with real analysis
    const mockAnalysis: CapabilityAnalysis = {
      strengths: [
        "Well-defined role and purpose",
        "Clear communication style",
        "Specialized knowledge base"
      ],
      weaknesses: [
        "Limited contextual awareness",
        "Could improve response personalization"
      ],
      suggestions: [
        "Add more specific examples to system prompt",
        "Include conversation history in responses",
        "Expand knowledge base with recent information"
      ],
      knowledgeGaps: [
        "Current events and trends",
        "User-specific preferences",
        "Domain-specific terminology"
      ],
      overallScore: 75
    };

    return mockAnalysis;
  }
}

export const assistantConversationService = new AssistantConversationService();