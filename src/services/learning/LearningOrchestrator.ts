import { LearningService } from '../LearningService';
import { WorkflowLearner } from '../WorkflowLearner';
import { AIAssistantService } from '../AIAssistantService';
import { UserBehavior, LearningPattern } from '../../types/learning';
import { WorkflowPattern } from '../../types/workflow';
import { PersonalityProfile } from '../../types/personality';
import { Intent } from '../../types/assistant';
import { AIDocument } from '../../types/ai';

/**
 * LearningOrchestrator coordinates the different learning components
 * to create a unified learning system that adapts to user behavior,
 * improves assistant responses, and enhances workflows.
 */
export class LearningOrchestrator {
  private learningService: LearningService;
  private workflowLearner: WorkflowLearner;
  private assistantService: AIAssistantService | null = null;
  private learningEnabled = true;
  private persistenceInterval: NodeJS.Timeout | null = null;
  private documentUsageTracker: Map<string, number> = new Map();
  
  constructor() {
    this.learningService = new LearningService();
    this.workflowLearner = new WorkflowLearner();
    
    // Set up persistence
    this.setupPersistence();
    
    // Load previous learning state
    this.loadLearningState();
  }
  
  /**
   * Connect an assistant service to the learning orchestrator
   */
  public connectAssistant(assistantService: AIAssistantService): void {
    this.assistantService = assistantService;
    console.log('Assistant service connected to learning orchestrator');
  }
  
  /**
   * Record a user interaction for learning
   */
  public recordInteraction(
    input: string,
    response: string,
    intent: Intent,
    usedDocuments: AIDocument[] = [],
    feedbackScore?: number
  ): void {
    if (!this.learningEnabled) return;
    
    // Create a behavior record
    const behavior: UserBehavior = {
      type: 'interaction',
      timestamp: new Date(),
      context: {
        input,
        response,
        intent: intent.type,
        confidence: intent.confidence,
        documents: usedDocuments.map(doc => doc.id),
        feedbackScore
      },
      metadata: {
        frequency: 1,
        importance: this.calculateImportance(input, usedDocuments, feedbackScore),
        duration: 0 // Will be filled by measuring time between interactions
      }
    };
    
    // Record in learning service
    this.learningService.recordBehavior(behavior);
    
    // Create a user action for workflow learner
    this.workflowLearner.recordAction({
      type: `message_${intent.type}`,
      payload: {
        input,
        response,
        intent: intent.type
      },
      timestamp: new Date(),
      userId: 'current_user' // Replace with actual user ID in production
    });
    
    // Track document usage
    this.trackDocumentUsage(usedDocuments);
    
    // Trigger learning cycle
    this.triggerLearningCycle();
  }
  
  /**
   * Record document usage to track which documents are most valuable
   */
  private trackDocumentUsage(documents: AIDocument[]): void {
    for (const doc of documents) {
      const currentCount = this.documentUsageTracker.get(doc.id) || 0;
      this.documentUsageTracker.set(doc.id, currentCount + 1);
    }
  }
  
  /**
   * Calculate importance score for a behavior
   */
  private calculateImportance(input: string, documents: AIDocument[], feedbackScore?: number): number {
    let importance = 0.5; // Default importance
    
    // Factor 1: Input complexity (measured by length)
    if (input.length > 100) importance += 0.1;
    
    // Factor 2: Document usage
    if (documents.length > 0) importance += 0.1;
    
    // Factor 3: Explicit feedback
    if (feedbackScore !== undefined) {
      // Scale from -1 (negative) to +1 (positive) feedback to 0-0.2 addition
      importance += ((feedbackScore + 1) / 10); 
    }
    
    // Ensure importance is between 0 and 1
    return Math.min(1, Math.max(0, importance));
  }
  
  /**
   * Trigger a learning cycle to update patterns and suggestions
   */
  private triggerLearningCycle(): void {
    // Analyze patterns in learning service
    const learningPatterns = this.getLearningPatterns();
    
    // Analyze patterns in workflow learner
    this.workflowLearner.analyzePatterns();
    const workflowPatterns = this.workflowLearner.getPatterns();
    
    // Update assistant if connected
    if (this.assistantService) {
      // Generate adaptations based on learning patterns
      const adaptations = this.learningService.suggestAdaptations();
      
      // Apply adaptations to assistant personality if significant
      if (Object.keys(adaptations).length > 0) {
        this.assistantService.updatePersonality(adaptations);
      }
      
      // Log the learning cycle
      console.log(`Learning cycle completed: ${learningPatterns.size} learning patterns, ${workflowPatterns.length} workflow patterns`);
    }
  }
  
  /**
   * Get all learning patterns
   */
  public getLearningPatterns(): Map<string, LearningPattern> {
    return this.learningService.getLearningPatterns();
  }
  
  /**
   * Get all workflow patterns
   */
  public getWorkflowPatterns(): WorkflowPattern[] {
    return this.workflowLearner.getPatterns();
  }
  
  /**
   * Get documents sorted by usage frequency
   */
  public getDocumentsByUsage(): Array<{documentId: string, usageCount: number}> {
    return Array.from(this.documentUsageTracker.entries())
      .map(([documentId, usageCount]) => ({ documentId, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount);
  }
  
  /**
   * Enable or disable learning
   */
  public setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
    console.log(`Learning ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Setup persistence for learning data
   */
  private setupPersistence(): void {
    // Save learning state every 5 minutes
    this.persistenceInterval = setInterval(() => {
      this.saveLearningState();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Save learning state to localStorage
   */
  private saveLearningState(): void {
    try {
      // Save learning patterns
      const learningPatterns = this.learningService.getLearningPatterns();
      const serializedPatterns = JSON.stringify(Array.from(learningPatterns.entries()));
      localStorage.setItem('learning_patterns', serializedPatterns);
      
      // Save document usage
      const serializedDocumentUsage = JSON.stringify(Array.from(this.documentUsageTracker.entries()));
      localStorage.setItem('document_usage', serializedDocumentUsage);
      
      console.log('Learning state saved successfully');
    } catch (error) {
      console.error('Error saving learning state:', error);
    }
  }
  
  /**
   * Load learning state from localStorage
   */
  private loadLearningState(): void {
    try {
      // Load learning patterns
      const serializedPatterns = localStorage.getItem('learning_patterns');
      if (serializedPatterns) {
        const patterns = new Map(JSON.parse(serializedPatterns));
        // TODO: Implement a way to restore patterns to LearningService
      }
      
      // Load document usage
      const serializedDocumentUsage = localStorage.getItem('document_usage');
      if (serializedDocumentUsage) {
        this.documentUsageTracker = new Map(JSON.parse(serializedDocumentUsage));
      }
      
      console.log('Learning state loaded successfully');
    } catch (error) {
      console.error('Error loading learning state:', error);
    }
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }
    
    // Save state one last time
    this.saveLearningState();
  }
}
