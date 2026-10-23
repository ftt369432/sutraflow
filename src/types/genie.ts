import type { PersonalityProfile } from './personality';

export interface GeniePersonality extends Omit<PersonalityProfile, 'traits'> {
  traits: {
    playfulness: number; // 0-1
    wisdom: number; // 0-1
    mystique: number; // 0-1
  };
  
  responses: {
    granting: string[];
    thinking: string[];
    declining: string[];
    encouraging: string[];
  };

  catchphrases: {
    greeting: string[];
    farewell: string[];
    success: string[];
    working: string[];
  };

  style: {
    magicPhrases: string[];
    soundEffects: boolean;
    useEmojis: boolean;
    dramaticPauses: boolean;
  };
}

export interface GeniePreferences {
  wakeWord: string;
  voiceGender: 'male' | 'female' | 'neutral';
  accent: string;
  responseStyle: 'magical' | 'professional' | 'friendly' | 'wise';
  soundEffects: {
    enabled: boolean;
    volume: number;
    types: ('magic' | 'ambient' | 'success' | 'error')[];
  };
  conversationStyle: {
    turnDuration: number;
    interruptible: boolean;
    followUpQuestions: boolean;
    useMemory: boolean;
  };
} 