import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContentAnalysis, ChatContext } from '../../types/canvas';

export interface ThinkingProcess {
  context: string;
  objectives: string[];
  constraints: string[];
  reasoning: string[];
  alternatives: string[];
  confidence: number;
  nextSteps: string[];
  timestamp: Date;
}

export class ThinkingProcessService {
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  }

  async generateThinkingProcess(
    userInput: string,
    chatContext: ChatContext,
    canvasAnalysis?: ContentAnalysis
  ): Promise<ThinkingProcess> {
    try {
      const prompt = this.buildThinkingPrompt(userInput, chatContext, canvasAnalysis);
      
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const fullPrompt = `You are an AI assistant that provides detailed thinking processes. 
            Analyze user input and provide a structured thinking process that includes:
            - Context understanding
            - Clear objectives
            - Constraints and limitations
            - Step-by-step reasoning
            - Alternative approaches considered
            - Confidence level
            - Next steps or actions
            
            Format your response as JSON with the exact structure specified.
            
            ${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const thinkingData = JSON.parse(content);
      
      return {
        context: thinkingData.context || '',
        objectives: thinkingData.objectives || [],
        constraints: thinkingData.constraints || [],
        reasoning: thinkingData.reasoning || [],
        alternatives: thinkingData.alternatives || [],
        confidence: thinkingData.confidence || 0.8,
        nextSteps: thinkingData.nextSteps || [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating thinking process:', error);
      
      // Fallback thinking process
      return this.createFallbackThinkingProcess(userInput, canvasAnalysis);
    }
  }

  private buildThinkingPrompt(
    userInput: string,
    chatContext: ChatContext,
    canvasAnalysis?: ContentAnalysis
  ): string {
    let prompt = `Analyze this user input and provide a detailed thinking process:

User Input: "${userInput}"

Chat Context: ${this.buildContextString(chatContext)}`;

    if (canvasAnalysis) {
      prompt += `

Canvas Analysis:
- Content Type: ${canvasAnalysis.contentType}
- Confidence: ${canvasAnalysis.confidence}
- Should Open Canvas: ${canvasAnalysis.shouldOpenCanvas}
- Extracted Requirements: ${canvasAnalysis.extractedRequirements.join(', ')}
- Suggested Agents: ${canvasAnalysis.suggestedAgents.join(', ')}`;
    }

    prompt += `

Provide a JSON response with this exact structure:
{
  "context": "Brief description of the current situation and user's intent",
  "objectives": ["List of specific goals to achieve"],
  "constraints": ["Limitations, requirements, or boundaries"],
  "reasoning": ["Step-by-step thought process", "Analysis of options", "Decision making logic"],
  "alternatives": ["Other approaches considered", "Why they were not chosen"],
  "confidence": 0.85,
  "nextSteps": ["Immediate actions to take", "Follow-up tasks"]
}

Focus on providing clear, actionable reasoning that shows how you arrived at your conclusions.`;

    return prompt;
  }

  private buildContextString(chatContext: ChatContext): string {
    const recentMessages = chatContext.previousMessages
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return `Recent conversation:\n${recentMessages}`;
  }

  private createFallbackThinkingProcess(
    userInput: string,
    canvasAnalysis?: ContentAnalysis
  ): ThinkingProcess {
    const context = `User requested: "${userInput}"`;
    
    const objectives = [
      'Understand user intent',
      'Provide helpful response',
      canvasAnalysis?.shouldOpenCanvas ? 'Prepare canvas document creation' : 'Continue conversation'
    ];

    const reasoning = [
      'Analyzed user input for intent and requirements',
      'Identified key information and context',
      canvasAnalysis?.shouldOpenCanvas 
        ? 'Detected document creation intent, preparing canvas integration'
        : 'Proceeding with standard conversation flow'
    ];

    const nextSteps = canvasAnalysis?.shouldOpenCanvas 
      ? [
          'Launch canvas with appropriate template',
          'Initialize AI agents for document creation',
          'Provide user with canvas interface'
        ]
      : [
          'Generate appropriate response',
          'Continue conversation flow'
        ];

    return {
      context,
      objectives,
      constraints: ['Limited context from fallback'],
      reasoning,
      alternatives: ['Standard conversation approach'],
      confidence: canvasAnalysis?.confidence || 0.7,
      nextSteps,
      timestamp: new Date()
    };
  }

  // Generate thinking process specifically for canvas-related actions
  async generateCanvasThinkingProcess(
    userInput: string,
    canvasAnalysis: ContentAnalysis,
    chatContext: ChatContext
  ): Promise<ThinkingProcess> {
    const baseThinking = await this.generateThinkingProcess(userInput, chatContext, canvasAnalysis);
    
    // Enhance with canvas-specific reasoning
    return {
      ...baseThinking,
      reasoning: [
        ...baseThinking.reasoning,
        `Detected ${canvasAnalysis.contentType} document creation intent`,
        `Confidence level: ${Math.round(canvasAnalysis.confidence * 100)}%`,
        `Will launch canvas with ${canvasAnalysis.suggestedAgents.length} AI agents`,
        'Preparing specialized editing environment'
      ],
      nextSteps: [
        'Create canvas window with appropriate template',
        'Initialize AI agents for document creation',
        'Set up real-time collaboration features',
        'Provide user with canvas interface'
      ]
    };
  }
}

export const thinkingProcessService = new ThinkingProcessService(); 