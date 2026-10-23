import { AIAssistantService } from '../AIAssistantService';
import { LearningOrchestrator } from './LearningOrchestrator';
import { PersonalityProfile } from '../../types/personality';
import { AIDocument } from '../../types/ai';
import { Message } from '../../types/ai';

/**
 * Intelligent Assistant Manager
 * 
 * This service manages the integration between assistant services and learning components,
 * ensuring that assistants learn and improve over time based on user interactions.
 */
export class IntelligentAssistantManager {
  private assistantService: AIAssistantService;
  private learningOrchestrator: LearningOrchestrator;
  private personalityProfile: PersonalityProfile;
  private messageHistory: Message[] = [];
  
  /**
   * Constructor for the Intelligent Assistant Manager
   * 
   * @param personalityProfile - Initial personality profile for the assistant
   */
  constructor(personalityProfile: PersonalityProfile) {
    this.personalityProfile = personalityProfile;
    this.assistantService = new AIAssistantService(this.personalityProfile);
    this.learningOrchestrator = new LearningOrchestrator();
    
    // Connect the assistant to the learning orchestrator
    this.learningOrchestrator.connectAssistant(this.assistantService);
    
    console.log('Intelligent Assistant Manager initialized');
  }
  
  /**
   * Process user input and generate a response
   * 
   * @param input - User message
   * @param relevantDocuments - Documents relevant to the message
   * @returns The assistant's response
   */
  public async processUserInput(
    input: string, 
    relevantDocuments: AIDocument[] = []
  ): Promise<string> {
    try {
      // Add user message to history
      this.addMessageToHistory({
        id: Date.now().toString(),
        content: input,
        role: 'user',
        timestamp: new Date()
      });
      
      // Process the input with the assistant service
      const response = await this.assistantService.processInput(input);
      
      // Add assistant message to history
      this.addMessageToHistory({
        id: (Date.now() + 1).toString(),
        content: response.text,
        role: 'assistant',
        timestamp: new Date()
      });
      
      // Record the interaction for learning
      this.learningOrchestrator.recordInteraction(
        input,
        response.text,
        {
          type: response.actions.length > 0 ? response.actions[0].type as any : 'unknown',
          confidence: 0.8,
          entities: []
        },
        relevantDocuments
      );
      
      return response.text;
    } catch (error) {
      console.error('Error processing user input:', error);
      return 'I apologize, but I encountered an error processing your request.';
    }
  }
  
  /**
   * Add user feedback to improve learning
   * 
   * @param messageId - ID of the message being rated
   * @param score - Feedback score (-1 to 1)
   */
  public addFeedback(messageId: string, score: number): void {
    const message = this.messageHistory.find(m => m.id === messageId);
    if (!message) {
      console.warn(`Message with ID ${messageId} not found`);
      return;
    }
    
    // Get the previous message for context
    const messageIndex = this.messageHistory.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) {
      console.warn('Cannot add feedback: no previous message found');
      return;
    }
    
    const previousMessage = this.messageHistory[messageIndex - 1];
    
    // Record feedback for learning
    this.learningOrchestrator.recordInteraction(
      previousMessage.content,
      message.content,
      { type: 'feedback', confidence: 1.0, entities: [] },
      [],
      score
    );
    
    console.log(`Feedback recorded for message ${messageId}: ${score}`);
  }
  
  /**
   * Add a message to the history
   */
  private addMessageToHistory(message: Message): void {
    this.messageHistory.push(message);
    
    // Limit history size to avoid memory issues
    if (this.messageHistory.length > 1000) {
      this.messageHistory.shift();
    }
  }
  
  /**
   * Get the message history
   */
  public getMessageHistory(): Message[] {
    return [...this.messageHistory];
  }
  
  /**
   * Get learning insights
   */
  public getLearningInsights(): {
    patterns: number,
    documentsTracked: number,
    topDocuments: Array<{documentId: string, usageCount: number}>,
  } {
    const learningPatterns = this.learningOrchestrator.getLearningPatterns();
    const workflowPatterns = this.learningOrchestrator.getWorkflowPatterns();
    const documentUsage = this.learningOrchestrator.getDocumentsByUsage();
    
    return {
      patterns: learningPatterns.size + workflowPatterns.length,
      documentsTracked: documentUsage.length,
      topDocuments: documentUsage.slice(0, 5)
    };
  }
  
  /**
   * Enable or disable learning
   */
  public setLearningEnabled(enabled: boolean): void {
    this.learningOrchestrator.setLearningEnabled(enabled);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    this.learningOrchestrator.dispose();
  }
}
