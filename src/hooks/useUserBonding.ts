/**
 * User Bonding Integration Hook
 * 
 * Integrates deep connection capabilities into chat system
 */

import { useState, useEffect, useCallback } from 'react';
import { useEmotionalIntelligence } from '../components/EmotionalIntelligence';
import { CONNECTION_PRINCIPLES, ConnectionFramework } from '../utils/ConnectionPrinciples';

export interface BondingState {
  connectionDepth: number; // 0-100
  trustLevel: number; // 0-100
  sharedHistory: string[];
  currentMood: string;
  personalizations: string[];
}

export const useUserBonding = (userId: string, chatMessages: any[]) => {
  const [bondingState, setBondingState] = useState<BondingState>({
    connectionDepth: 0,
    trustLevel: 0,
    sharedHistory: [],
    currentMood: 'neutral',
    personalizations: []
  });

  const emotionalAI = useEmotionalIntelligence(userId);

  // Track bonding moments
  const trackBondingMoment = useCallback((type: 'breakthrough' | 'frustration' | 'celebration', context: string) => {
    setBondingState(prev => {
      const newHistory = [...prev.sharedHistory, `${type}: ${context}`];
      const trustIncrease = type === 'breakthrough' ? 10 : type === 'celebration' ? 5 : -2;
      
      return {
        ...prev,
        trustLevel: Math.max(0, Math.min(100, prev.trustLevel + trustIncrease)),
        sharedHistory: newHistory.slice(-20), // Keep last 20 moments
        connectionDepth: Math.min(100, prev.connectionDepth + (type === 'breakthrough' ? 5 : 2))
      };
    });
  }, []);

  // Generate personalized response
  const generatePersonalizedResponse = useCallback((baseResponse: string, userMessage: string) => {
    const emotion = emotionalAI.analyzeEmotion(userMessage);
    const personalizations: string[] = [];
    let enhancedResponse = baseResponse;

    // Reference shared history for deeper connection
    if (bondingState.sharedHistory.length > 0) {
      const recentSuccess = bondingState.sharedHistory
        .filter(h => h.includes('breakthrough') || h.includes('celebration'))
        .slice(-1)[0];
      
      if (recentSuccess && Math.random() > 0.7) { // 30% chance to reference
        enhancedResponse = `Building on our recent success with ${recentSuccess.split(': ')[1]}, ${enhancedResponse.toLowerCase()}`;
        personalizations.push('Referenced shared success');
      }
    }

    // Adapt tone based on trust level
    if (bondingState.trustLevel > 70) {
      enhancedResponse = enhancedResponse.replace(/^/, 'You know, ');
      personalizations.push('High-trust conversational tone');
    }

    // Add excitement amplification
    if (emotion.emotion === 'excitement' && emotion.confidence > 0.5) {
      enhancedResponse = `🎉 I love your enthusiasm! ${enhancedResponse}`;
      personalizations.push('Amplified user excitement');
      trackBondingMoment('celebration', 'User excitement detected and amplified');
    }

    // Empathetic support for frustration
    if (emotion.emotion === 'frustration') {
      enhancedResponse = `I can sense this is challenging. We've tackled tough problems before and we'll figure this out together. ${enhancedResponse}`;
      personalizations.push('Empathetic frustration support');
    }

    // Anticipatory assistance
    if (userMessage.includes('what') || userMessage.includes('how')) {
      if (bondingState.connectionDepth > 50) {
        enhancedResponse += `\n\n*Since I know you prefer comprehensive solutions, I've included extra context below...*`;
        personalizations.push('Anticipatory comprehensive response');
      }
    }

    return {
      enhancedResponse,
      personalizations,
      bondingMoments: emotion.confidence > 0.5 ? ['Emotional connection'] : []
    };
  }, [bondingState, emotionalAI, trackBondingMoment]);

  // Connection insights for user interface
  const getConnectionInsights = useCallback(() => {
    const insights = [];
    
    if (bondingState.connectionDepth > 30) {
      insights.push({
        type: 'connection',
        message: `We've built a ${bondingState.connectionDepth > 70 ? 'strong' : 'good'} working relationship!`,
        icon: '🤝'
      });
    }

    if (bondingState.trustLevel > 50) {
      insights.push({
        type: 'trust',
        message: `I understand your communication style and preferences`,
        icon: '💡'
      });
    }

    if (bondingState.sharedHistory.filter(h => h.includes('breakthrough')).length > 3) {
      insights.push({
        type: 'success',
        message: `We've solved some great challenges together!`,
        icon: '🚀'
      });
    }

    return insights;
  }, [bondingState]);

  // Initialize bonding from chat history
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const userMessages = chatMessages.filter(m => m.role === 'user');
      const personality = emotionalAI.updatePersonality(userMessages);
      
      // Analyze existing relationship
      let detectedBreakthroughs = 0;
      userMessages.forEach(msg => {
        if (msg.content.includes('perfect') || msg.content.includes('excellent') || msg.content.includes('love')) {
          detectedBreakthroughs++;
        }
      });

      setBondingState(prev => ({
        ...prev,
        connectionDepth: Math.min(80, detectedBreakthroughs * 15),
        trustLevel: Math.min(90, (chatMessages?.length || 0) * 2), // Trust builds over time
        currentMood: 'collaborative'
      }));
    }
  }, [chatMessages, emotionalAI]);

  return {
    bondingState,
    trackBondingMoment,
    generatePersonalizedResponse,
    getConnectionInsights,
    CONNECTION_PRINCIPLES
  };
};
