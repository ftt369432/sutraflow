export interface UserBehavior {
  type: string;
  timestamp: Date;
  context: Record<string, unknown>;
  metadata: {
    frequency: number;
    importance: number;
    duration: number;
  };
}

export interface LearningPattern {
  id: string;
  type: 'behavior' | 'preference' | 'workflow';
  confidence: number;
  frequency: number;
  context: Record<string, unknown>;
  metadata: {
    lastObserved: Date;
    sampleSize: number;
  };
  behaviors?: UserBehavior[];  // Optional field for workflow patterns
}

export interface LearningMetrics {
  patternCount: number;
  confidenceAverage: number;
  lastUpdated: Date;
  topPatterns: LearningPattern[];
}