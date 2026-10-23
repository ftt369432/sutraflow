/**
 * Gemini AI Configuration
 * 
 * Central configuration for Gemini-only AI system.
 * Following development guidelines for centralized resources.
 */

export const GEMINI_CONFIG = {
  // AI Model Settings
  model: 'gemini-2.0-flash-exp',
  
  // API Configuration
  apiVersion: 'v1',
  baseUrl: 'https://generativelanguage.googleapis.com',
  
  // Response Settings
  maxTokens: 4096,
  temperature: 0.7,
  
  // Feature Flags
  features: {
    streamingEnabled: true,
    contextAwareResponses: true,
    codeGeneration: true,
    imageAnalysis: false, // Enable when Gemini Vision is needed
  },
  
  // UI Settings
  ui: {
    streamingDelayMs: 40, // 2x faster than previous 80ms
    showTypingIndicator: true,
    enableMarkdownRendering: true,
  },
  
  // System Messages
  systemPrompts: {
    default: "You are a helpful AI assistant powered by Gemini. Provide accurate, helpful responses.",
    canvas: "You are an AI assistant helping with creative canvas work. Focus on visual and interactive elements.",
    coding: "You are a coding assistant. Provide clean, well-documented code with explanations.",
  }
} as const;

// Export commonly used values
export const GEMINI_MODEL = GEMINI_CONFIG.model;
export const STREAMING_DELAY = GEMINI_CONFIG.ui.streamingDelayMs;
export const MAX_TOKENS = GEMINI_CONFIG.maxTokens;

// Environment-based overrides
export const getGeminiConfig = () => {
  const env = import.meta.env;
  
  return {
    ...GEMINI_CONFIG,
    apiKey: env.VITE_GEMINI_API_KEY,
    debug: env.DEV,
  };
};

export default GEMINI_CONFIG;
