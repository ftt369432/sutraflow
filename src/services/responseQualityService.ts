/**
 * Response Quality Monitoring Service
 * 
 * This service monitors and evaluates the quality of AI responses,
 * providing metrics and feedback to improve response relevance and helpfulness.
 */

import type { Message } from '../types/ai';

interface QualityMetrics {
  responseTime: number;       // Time taken to generate response in ms
  responseLength: number;     // Character count of response
  documentReferences: number; // Number of document references included
  streamingChunks?: number;   // Number of streaming chunks if streaming was used
  hasCodeBlocks: boolean;     // Whether response contains code blocks
  readabilityScore?: number;  // Optional readability score (0-100)
}

export interface ResponseEvaluation {
  messageId: string;
  metrics: QualityMetrics;
  feedback?: string;          // Optional user feedback
  relevanceScore?: number;    // Optional relevance score (0-10)
  qualityScore?: number;      // Optional quality score (0-10)
}

/**
 * Evaluates the quality of an AI response based on various metrics
 */
export function evaluateResponse(message: Message, query: string, responseTimeMs: number): ResponseEvaluation {
  // Calculate basic metrics
  const responseLength = message.content.length;
  const hasCodeBlocks = message.content.includes('```');
  
  // Count document references
  const documentReferences = (message.metadata?.referencedDocuments?.length || 0);
  
  // Count streaming chunks if available
  const streamingChunks = message.chunks?.length || 0;
  
  // Calculate readability score
  const readabilityScore = calculateReadabilityScore(message.content);
  
  return {
    messageId: message.id,
    metrics: {
      responseTime: responseTimeMs,
      responseLength,
      documentReferences,
      streamingChunks: streamingChunks > 0 ? streamingChunks : undefined,
      hasCodeBlocks,
      readabilityScore
    }
  };
}

/**
 * Calculate a simple readability score based on sentence and word length
 * This is a simplified version of common readability formulas
 */
function calculateReadabilityScore(text: string): number {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  // Count words
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  if (words.length === 0) return 0;
  
  // Average sentence length
  const avgSentenceLength = words.length / sentences.length;
  
  // Average word length
  const avgWordLength = words.join('').length / words.length;
  
  // Long sentences and long words reduce readability
  const readabilityScore = 100 - (avgSentenceLength * 1.5) - (avgWordLength * 5);
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, readabilityScore));
}

/**
 * Analyzes conversation context to improve future responses
 */
export function analyzeConversationContext(messages: Message[]): {
  suggestedTopics: string[];
  complexityLevel: 'simple' | 'moderate' | 'complex';
} {
  // Simple topic extraction
  const allText = messages.map(msg => msg.content).join(' ');
  const words = allText.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  
  // Count word frequencies
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  }
  
  // Get top 5 frequent words as topics
  const suggestedTopics = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Determine complexity based on average message length
  const avgMessageLength = messages.reduce((sum, msg) => sum + msg.content.length, 0) / messages.length;
  
  let complexityLevel: 'simple' | 'moderate' | 'complex';
  if (avgMessageLength < 200) {
    complexityLevel = 'simple';
  } else if (avgMessageLength < 800) {
    complexityLevel = 'moderate';
  } else {
    complexityLevel = 'complex';
  }
  
  return {
    suggestedTopics,
    complexityLevel
  };
}

/**
 * Tracks user engagement metrics with responses
 */
export function trackUserEngagement(message: Message, userActions: {
  timeSpentViewing?: number;
  copied?: boolean;
  expanded?: boolean;
  followed?: boolean;
}): void {
  // In a real implementation, this would send data to an analytics service
  console.log('[ResponseQualityService] User engagement tracked:', { 
    messageId: message.id,
    actions: userActions
  });
}

export default {
  evaluateResponse,
  analyzeConversationContext,
  trackUserEngagement
};