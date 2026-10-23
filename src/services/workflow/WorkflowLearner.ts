import type { AgentSuggestion, AutonomyLevel } from '../../types/agent';
import type { WorkflowPattern } from '../../types/workflow';

export class WorkflowLearner {
  private patterns: WorkflowPattern[] = [];
  private learningPatterns: Map<string, WorkflowPattern> = new Map();

  public suggestAutomation(): AgentSuggestion[] {
    return this.patterns
      .filter(pattern => pattern.frequency > 0.7)
      .map(pattern => ({
        type: 'automation',
        description: pattern.description,
        confidence: pattern.confidence,
        suggestedAgent: {
          name: `${pattern.category} Assistant`,
          capabilities: pattern.requiredCapabilities,
          autonomyLevel: this.determineAutonomyLevel(pattern),
          triggers: pattern.triggers
        }
      }));
  }

  public suggestAgents(_context: any): any[] {
    const relevantPatterns = Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.confidence > 0.7);
    
    return relevantPatterns.map(pattern => ({
      agent: {
        name: `${pattern.category} Assistant`, 
        capabilities: pattern.requiredCapabilities,
        autonomyLevel: this.determineAutonomyLevel(pattern),
        triggers: pattern.triggers
      }
    }));
  }

  private determineAutonomyLevel(pattern: WorkflowPattern): AutonomyLevel {
    // Determine autonomy level based on pattern confidence and complexity
    if (pattern.confidence > 0.9) {
      return 'autonomous';
    } else if (pattern.confidence > 0.7) {
      return 'semi-autonomous';
    } else {
      return 'supervised';
    }
  }

  public addPattern(pattern: WorkflowPattern): void {
    this.patterns.push(pattern);
    this.learningPatterns.set(pattern.id, pattern);
  }

  public getPatterns(): WorkflowPattern[] {
    return this.patterns;
  }

  public getLearningPatterns(): Map<string, WorkflowPattern> {
    return this.learningPatterns;
  }
}