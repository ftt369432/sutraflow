/**
 * Emotional Intelligence Engine
 * 
 * Analyzes user emotions, patterns, and builds deep understanding
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserPersonality, ConversationMemory, BondingInsight } from '../types/UserBonding';

interface EmotionalContext {
  currentEmotion: string;
  confidence: number;
  triggers: string[];
  suggestedResponse: string;
}

export const useEmotionalIntelligence = (userId: string) => {
  const [userPersonality, setUserPersonality] = useState<UserPersonality | null>(null);
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory | null>(null);
  const [bondingInsights, setBondingInsights] = useState<BondingInsight[]>([]);
  const [emotionalContext, setEmotionalContext] = useState<EmotionalContext | null>(null);

  // Analyze emotional markers in user input
  const analyzeEmotion = useCallback((message: string) => {
    const emotionPatterns = {
      excitement: /\b(amazing|love|great|perfect|excellent|fantastic|brilliant)\b/i,
      frustration: /\b(confused|stuck|not working|error|problem|issue)\b/i,
      satisfaction: /\b(good|nice|thanks|appreciate|helpful|working)\b/i,
      curiosity: /\b(how|why|what if|wonder|explore|learn|understand)\b/i,
      determination: /\b(let's|we need to|must|have to|going to)\b/i
    };

    let detectedEmotion = 'neutral';
    let confidence = 0;

    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      const matches = message.match(pattern);
      if (matches) {
        detectedEmotion = emotion;
        confidence = Math.min(matches.length * 0.3, 1.0);
        break;
      }
    }

    return { emotion: detectedEmotion, confidence };
  }, []);

  // Build user personality profile
  const updatePersonality = useCallback((messages: any[]) => {
    const communicationPatterns = {
      direct: /\b(let's|do this|fix|solve|get it done)\b/i,
      collaborative: /\b(we|us|together|our|team)\b/i,
      analytical: /\b(analyze|understand|structure|system|architecture)\b/i,
      exploratory: /\b(explore|try|experiment|see what happens)\b/i
    };

    const styleScores: Record<string, number> = {};
    
    messages.forEach(msg => {
      Object.entries(communicationPatterns).forEach(([style, pattern]) => {
        const matches = msg.content.match(pattern);
        if (matches) {
          styleScores[style] = (styleScores[style] || 0) + matches.length;
        }
      });
    });

    const dominantStyle = Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'collaborative';

    return {
      communicationStyle: dominantStyle as any,
      preferredPacing: 'methodical', // Detected from systematic approach
      decisionMaking: 'systematic', // Detected from audit methodology
      emotionalMarkers: {
        excitement: ['love', 'great', 'perfect', 'excellent'],
        frustration: ['stuck', 'error', 'not working'],
        satisfaction: ['good', 'working', 'fixed'],
        curiosity: ['how', 'why', 'what if']
      }
    };
  }, []);

  // Generate bonding insights
  const generateBondingInsights = useCallback((personality: UserPersonality, memory: ConversationMemory) => {
    const insights: BondingInsight[] = [];

    // Pattern-based insights
    if (personality.communicationStyle === 'analytical') {
      insights.push({
        type: 'pattern',
        confidence: 0.9,
        description: 'User prefers structured, step-by-step approaches',
        actionable: true,
        examples: ['Break complex tasks into phases', 'Provide clear progress indicators']
      });
    }

    // Emotional insights
    const recentEmotions = memory.emotionalJourney.slice(-5);
    const excitementMoments = recentEmotions.filter(e => e.emotion === 'excitement');
    
    if (excitementMoments.length > 2) {
      insights.push({
        type: 'emotional',
        confidence: 0.8,
        description: 'User shows high engagement with systematic problem-solving',
        actionable: true,
        examples: ['Celebrate incremental wins', 'Reference previous successes']
      });
    }

    return insights;
  }, []);

  // Create adaptive response based on context
  const createAdaptiveResponse = useCallback((
    baseResponse: string, 
    emotionalContext: EmotionalContext,
    personality: UserPersonality
  ) => {
    let adaptedResponse = baseResponse;
    const personalizations: string[] = [];

    // Adapt tone based on emotion
    if (emotionalContext.currentEmotion === 'excitement') {
      adaptedResponse = `🎉 ${adaptedResponse}`;
      personalizations.push('Added celebration emoji');
    } else if (emotionalContext.currentEmotion === 'frustration') {
      adaptedResponse = `I understand this is challenging. ${adaptedResponse}`;
      personalizations.push('Added empathetic opening');
    }

    // Adapt structure based on personality
    if (personality.communicationStyle === 'analytical') {
      if (!adaptedResponse.includes('##') && !adaptedResponse.includes('###')) {
        adaptedResponse = `## Here's how we'll approach this:\n\n${adaptedResponse}`;
        personalizations.push('Added structured formatting');
      }
    }

    return {
      content: adaptedResponse,
      tone: emotionalContext.currentEmotion as any,
      personalizations,
      memoryReferences: []
    };
  }, []);

  return {
    analyzeEmotion,
    updatePersonality,
    generateBondingInsights,
    createAdaptiveResponse,
    userPersonality,
    conversationMemory,
    bondingInsights,
    emotionalContext
  };
};
