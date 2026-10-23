import type { AIModel } from '../types/ai';

export interface AIProvider {
  id: string;
  name: string;
  apiKeyName: string;
  enabled: boolean;
  models?: string[];
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  debug?: boolean;
}

export const defaultProvider = 'groq';

export const aiProviders = [
  {
    id: 'groq',
    name: 'Groq',
    apiKeyName: 'VITE_GROQ_API_KEY',
    enabled: true,
    models: [
      'llama-3.3-70b-versatile',   // Default - Latest Llama model
      'llama3-8b-8192',           // Fast and efficient
      'llama3-70b-8192',          // Most capable
      'mixtral-8x7b-32768',       // Mixtral model
      'gemma-7b-it',              // Google Gemma
      'whisper-large-v3'          // Audio transcription
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    debug: false
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyName: 'VITE_GEMINI_API_KEY',
    enabled: true,
    models: [
      'gemini-3-pro-preview',      // Next-gen reasoning model
      'gemini-3-flash-preview',    // Next-gen fast model
      'gemini-2.0-flash',          // Current standard
      'gemini-2.0-pro',            // High capability
      'gemini-1.5-pro',            // Legacy
      'embedding-001'              // Embeddings
    ],
    defaultModel: 'gemini-3-pro-preview',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  }
];