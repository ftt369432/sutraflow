import { UserBehavior, LearningPattern } from '../types/learning';
import { PersonalityProfile } from '../types/personality';

export class LearningService {
  private readonly LEARNING_RATE = 0.1;
  private readonly PATTERN_THRESHOLD = 0.7;
  private behaviorHistory: UserBehavior[] = [];
  private learningPatterns: Map<string, LearningPattern> = new Map();

  public recordBehavior(behavior: UserBehavior) {
    this.behaviorHistory.push(behavior);
    this.analyzeBehaviorPatterns();
  }

  private analyzeBehaviorPatterns() {
    const recentBehaviors = this.behaviorHistory.slice(-100);
    const patterns = this.detectPatterns(recentBehaviors);
    
    patterns.forEach(pattern => {
      if (pattern.confidence > this.PATTERN_THRESHOLD) {
        this.updatePattern(pattern);
      }
    });
  }

  private detectPatterns(behaviors: UserBehavior[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    
    // Time-based patterns
    this.detectTimePatterns(behaviors, patterns);
    
    // Context patterns
    this.detectContextPatterns(behaviors, patterns);
    
    // Sequence patterns
    this.detectSequencePatterns(behaviors, patterns);
    
    return patterns;
  }

  private detectTimePatterns(behaviors: UserBehavior[], patterns: LearningPattern[]) {
    const timeGroups = new Map<number, UserBehavior[]>();
    
    behaviors.forEach(behavior => {
      const hour = new Date(behavior.timestamp).getHours();
      const group = timeGroups.get(hour) || [];
      group.push(behavior);
      timeGroups.set(hour, group);
    });

    timeGroups.forEach((group, hour) => {
      if (group.length >= 3) {
        patterns.push({
          id: `time-${hour}`,
          type: 'behavior',
          confidence: group.length / behaviors.length,
          frequency: group.length,
          context: { type: 'time', hour },
          metadata: {
            lastObserved: new Date(),
            sampleSize: group.length
          },
          behaviors: group
        });
      }
    });
  }

  private detectContextPatterns(behaviors: UserBehavior[], patterns: LearningPattern[]) {
    // Stub implementation for context pattern detection
    const contextGroups = new Map<string, UserBehavior[]>();
    
    behaviors.forEach(behavior => {
      const contextKey = behavior.type;
      const group = contextGroups.get(contextKey) || [];
      group.push(behavior);
      contextGroups.set(contextKey, group);
    });

    contextGroups.forEach((group, contextKey) => {
      if (group.length >= 2) {
        patterns.push({
          id: `context-${contextKey}`,
          type: 'behavior',
          confidence: group.length / behaviors.length,
          frequency: group.length,
          context: { contextType: contextKey },
          metadata: {
            lastObserved: new Date(),
            sampleSize: group.length
          },
          behaviors: group
        });
      }
    });
  }

  private detectSequencePatterns(behaviors: UserBehavior[], patterns: LearningPattern[]) {
    // Stub implementation for sequence pattern detection
    for (let i = 0; i < behaviors.length - 1; i++) {
      const sequence = behaviors.slice(i, i + 2);
      patterns.push({
        id: `sequence-${i}`,
        type: 'workflow',
        confidence: 0.5,
        frequency: 1,
        context: { sequenceIndex: i },
        metadata: {
          lastObserved: new Date(),
          sampleSize: 2
        },
        behaviors: sequence
      });
    }
  }

  private updatePattern(pattern: LearningPattern) {
    const existing = this.learningPatterns.get(pattern.id);
    if (existing) {
      // Update confidence using simple averaging 
      existing.confidence = (existing.confidence + pattern.confidence) / 2 + 
                          this.LEARNING_RATE * pattern.confidence;
      existing.frequency += pattern.frequency;
      existing.metadata.lastObserved = new Date();
      existing.metadata.sampleSize += pattern.metadata.sampleSize;
      if (existing.behaviors && pattern.behaviors) {
        existing.behaviors = [...existing.behaviors, ...pattern.behaviors];
      }
    } else {
      // Add new pattern
      this.learningPatterns.set(pattern.id, pattern);
    }
  }

  public suggestAdaptations(): Partial<PersonalityProfile> {
    const suggestions: Partial<PersonalityProfile> = {};

    this.learningPatterns.forEach(pattern => {   
      if (pattern.confidence > 0.8) {
        this.applyPatternToProfile(pattern, suggestions);
      }
    });

    return suggestions;
  }

  private applyPatternToProfile(pattern: LearningPattern, suggestions: Partial<PersonalityProfile>) {
    // Apply high-confidence patterns to personality profile suggestions
    const contextType = pattern.context.contextType as string;
    
    if (contextType === 'communication') {
      if (!suggestions.communicationStyle) {
        suggestions.communicationStyle = {
          tone: 'friendly',
          verbosity: 0.5,
          formality: 0.5
        };
      }
      // Update based on pattern insights
      suggestions.communicationStyle.tone = 'adaptive' as any;
    }
    
    if (contextType === 'task_management') {
      if (!suggestions.workStyle) {
        suggestions.workStyle = {
          peakProductivityHours: [9, 10, 11, 14, 15],
          preferredTaskDuration: 45,
          breakFrequency: 60
        };
      }
      // Update work style based on patterns
      suggestions.workStyle.preferredTaskDuration = pattern.frequency * 15; // Adjust based on pattern frequency
    }
  }

  public getLearningPatterns(): Map<string, LearningPattern> {
    return new Map(this.learningPatterns);
  }

  public getBehaviorHistory(): UserBehavior[] {
    return [...this.behaviorHistory];
  }

  public getPatternStats(): { [key: string]: { count: number, avgConfidence: number } } {
    const stats: { [key: string]: { count: number, avgConfidence: number, types: Set<string> } } = {};
    
    this.learningPatterns.forEach((pattern, id) => {
      const type = pattern.type;
      if (!stats[type]) {
        stats[type] = { count: 0, avgConfidence: 0, types: new Set() };
      }
      stats[type].count++;
      stats[type].avgConfidence += pattern.confidence;
      stats[type].types.add(pattern.context.type || pattern.context.contextType || 'unknown');
    });

    // Calculate averages
    Object.keys(stats).forEach(type => {
      stats[type].avgConfidence /= stats[type].count;
    });

    return stats;
  }
}