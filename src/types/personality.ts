export interface UserBehavior {
  interactionType: string;
  sentiment: string;
  context: string;
  timestamp: Date;
}

export interface PersonalityProfile {
  name: string;
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  preferences: UserPreferences;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  communicationStyle: {
    tone: 'formal' | 'casual' | 'friendly' | 'professional';
    verbosity: number;
    formality: number;
  };
  workStyle: {
    peakProductivityHours: number[];
    preferredTaskDuration: number;
    breakFrequency: number;
  };
  update(updates: Partial<PersonalityProfile>): void;
}

export interface PersonalityService {
  getProfile(): PersonalityProfile;
  update(newPreferences: Partial<PersonalityProfile>): void;
  adapt(userBehavior: UserBehavior): void;
  generateResponse(context: string, emotion: string): string;
}

export interface UserPreferences {
  name: string;
  focusPreferences: {
    ambientSound: boolean;
    soundType: string;
    checkInterval: number;
  };
  communicationStyle: {
    verbosity: 'concise' | 'detailed';
    tone: 'formal' | 'casual';
    useEmoji: boolean;
  };
}

export type PersonalityType = 
  | 'Analytical'
  | 'Supportive'
  | 'Directive'
  | 'Expressive';

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface CommunicationPreferences {
  style: PersonalityType;
  traits: PersonalityTraits;
  adaptationSpeed: number;
  preferredTone: {
    morning: string;
    workday: string;
    evening: string;
  };
  contextualResponses: {
    [key: string]: {
      tone: string;
      verbosity: number;
      formality: number;
    };
  };
}

export interface EmotionalIntelligence {
  empathyLevel: number;
  stressRecognition: number;
  emotionalAwareness: number;
  adaptiveResponses: {
    [mood: string]: {
      tone: string;
      supportLevel: number;
      suggestions: string[];
    };
  };
}

export interface PersonalityArchetype {
  type: PersonalityType;
  traits: PersonalityTraits;
  communication: CommunicationPreferences;
  emotionalIQ: EmotionalIntelligence;
  learningStyle: {
    preferredMethod: 'visual' | 'auditory' | 'kinesthetic';
    adaptationRate: number;
    feedbackStyle: 'direct' | 'gentle' | 'balanced';
  };
} 