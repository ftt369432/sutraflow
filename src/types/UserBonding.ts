/**
 * User Bonding System Types
 * 
 * Defines the architecture for creating deep user connections
 */

export interface UserPersonality {
  communicationStyle: 'direct' | 'collaborative' | 'exploratory' | 'analytical';
  preferredPacing: 'fast' | 'methodical' | 'flexible';
  decisionMaking: 'systematic' | 'intuitive' | 'research-heavy';
  emotionalMarkers: {
    excitement: string[];
    frustration: string[];
    satisfaction: string[];
    curiosity: string[];
  };
}

export interface ConversationMemory {
  userId: string;
  sessionContext: {
    currentGoals: string[];
    achievedMilestones: string[];
    preferences: Record<string, any>;
    successPatterns: string[];
  };
  emotionalJourney: {
    timestamp: Date;
    emotion: string;
    trigger: string;
    response: string;
  }[];
  relationshipDepth: {
    trustLevel: number; // 0-100
    understandingLevel: number; // 0-100
    collaborationSuccess: number; // 0-100
  };
}

export interface BondingInsight {
  type: 'pattern' | 'preference' | 'emotional' | 'technical';
  confidence: number;
  description: string;
  actionable: boolean;
  examples: string[];
}

export interface AdaptiveResponse {
  content: string;
  tone: 'supportive' | 'excited' | 'methodical' | 'encouraging';
  personalizations: string[];
  memoryReferences: string[];
}
