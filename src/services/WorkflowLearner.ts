import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import type { UserAction, WorkflowPattern, AgentSuggestion } from '../types/workflow';
import type { AgentCapability } from '../types/agent';

/**
 * WorkflowLearner analyzes user actions to detect patterns and suggest automations
 */
export class WorkflowLearner {
  // Observable for patterns
  public patterns$ = new BehaviorSubject<WorkflowPattern[]>([]);

  // Store user actions
  private userActions: UserAction[] = [];
  
  // Store detected patterns
  private detectedPatterns: WorkflowPattern[] = [];
  
  /**
   * Record a user action for pattern detection
   */
  public recordAction(action: UserAction): void {
    this.userActions.push({
      ...action,
      timestamp: action.timestamp || new Date()
    });
    
    // Analyze after recording a new action
    this.analyzeActions([action]);
  }
  
  /**
   * Analyze actions to detect patterns
   */
  public analyzeActions(actions: UserAction[]): void {
    console.log('Analyzing actions:', actions);
    
    // This would contain complex pattern recognition logic
    // For now, we'll use a simple demo implementation
    
    if (actions.length > 0) {
      const lastAction = actions[actions.length - 1];
      const similarActions = this.userActions.filter(a => 
        a.type === lastAction.type && a.userId !== lastAction.userId
      );
      
      if (similarActions.length >= 2) {
        // Potential pattern detected
        this.createPatternFromActions(similarActions.concat(lastAction));
      }
    }
    
    // Update patterns observable
    this.patterns$.next(this.detectedPatterns);
  }
  
  /**
   * Create a pattern from a set of similar actions
   */
  private createPatternFromActions(actions: UserAction[]): void {
    // Check if similar pattern already exists
    const existingPattern = this.detectedPatterns.find(p => 
      p.name.includes(actions[0].type)
    );
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency += 1;
      existingPattern.actions = actions.slice(-5); // Keep the last 5 actions
      return;
    }
    
    // Create new pattern
    const newPattern: WorkflowPattern = {
      id: uuidv4(),
      name: `${actions[0].type} Pattern`,
      description: `Pattern for ${actions[0].type} actions`,
      type: 'learning',
      actions: actions.slice(-5), // Keep the last 5 actions
      frequency: 1,
      confidence: 0.7,
      category: actions[0].type || 'general',
      requiredCapabilities: [] as AgentCapability[],
      triggers: ['manual'],
      complexity: 0.5
    };
    
    this.detectedPatterns.push(newPattern);
  }
  
  /**
   * Analyze all recorded actions to detect patterns
   */
  public analyzePatterns(): void {
    // Reset current patterns
    this.detectedPatterns = [];
    
    // Group actions by type
    const actionGroups: Record<string, UserAction[]> = {};
    
    this.userActions.forEach(action => {
      const key = action.type;
      if (!actionGroups[key]) {
        actionGroups[key] = [];
      }
      actionGroups[key].push(action);
    });
    
    // Create patterns from groups with enough actions
    Object.values(actionGroups).forEach(group => {
      if (group.length >= 3) {
        this.createPatternFromActions(group);
      }
    });
    
    // Update patterns observable
    this.patterns$.next(this.detectedPatterns);
  }
  
  /**
   * Get all detected patterns
   */
  public getPatterns(): WorkflowPattern[] {
    return [...this.detectedPatterns];
  }
  
  /**
   * Suggest automations based on detected patterns
   */
  public suggestAutomations(): AgentSuggestion[] {
    // Convert patterns to suggestions
    return this.detectedPatterns
      .filter(p => p.frequency >= 3 && p.confidence > 0.6)
      .map(pattern => ({
        id: uuidv4(),
        patternId: pattern.id,
        description: `I noticed you frequently perform ${pattern.name}. Would you like to automate this?`,
        confidence: pattern.confidence,
        potentialBenefits: [
          "Save time",
          "Reduce repetitive tasks",
          "Increase productivity"
        ],
        estimatedTimesSaved: 5 * pattern.frequency
      }));
  }

  /**
   * Get a single automation suggestion based on recent patterns
   * @deprecated Use suggestAutomations() instead
   */
  public suggestAutomation(): AgentSuggestion[] {
    return this.suggestAutomations();
  }
  
  /**
   * Clear all recorded actions and patterns
   */
  public reset(): void {
    this.userActions = [];
    this.detectedPatterns = [];
    this.patterns$.next([]);
  }

  /**
   * Determines the appropriate level of autonomy for a given workflow pattern.
   * This is a placeholder and would involve more complex logic based on pattern
   * characteristics, user preferences, and system capabilities.
   * 
   * @param pattern The workflow pattern to analyze.
   * @returns A numerical value representing the autonomy level (e.g., 0 for fully manual, 1 for fully autonomous).
   */
  public determineAutonomyLevel(pattern: WorkflowPattern): number {
    // Basic placeholder logic:
    // Higher frequency and confidence might suggest higher autonomy.
    // Complexity could inversely affect autonomy if high complexity means high risk.
    let autonomyScore = 0;

    if (pattern.frequency > 5) {
      autonomyScore += 0.2;
    }
    if (pattern.confidence > 0.75) {
      autonomyScore += 0.3;
    }
    if (pattern.complexity < 0.5) {
      autonomyScore += 0.2;
    }

    // Ensure score is between 0 and 1
    autonomyScore = Math.max(0, Math.min(1, autonomyScore));

    console.log(`Autonomy level for pattern '${pattern.name}': ${autonomyScore}`);
    return autonomyScore;
  }
} 