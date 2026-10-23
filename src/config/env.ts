/**
 * Environment configuration
 * Loads environment variables and provides a typed interface
 */

// Environment configuration type
export interface EnvironmentConfig {
  useMock: boolean | 'hybrid'; // Re-adding useMock with support for hybrid mode
  isDevelopment: boolean;
  isProduction: boolean;
  serverUrl: string;
  apiUrl: string;
  googleApiKey: string;
  anthropicApiKey: string;
  googleClientId: string;
  googleScopes: string[];
  authCallbackUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  // AI-related configurations
  aiProvider: 'groq' | 'gemini' | 'google' | 'private' | 'hybrid';
  aiModel: string;
  enableGpt5Mini?: boolean;
  geminiApiKey: string;
  geminiApiKey2?: string;
  hasGeminiApiKey: boolean;
  groqApiKey: string;
  groqApiKey2?: string;
  hasGroqApiKey: boolean;
  debug: boolean;
  // Model settings
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  // Node environment
  nodeEnv: string;
  // Hybrid mode settings
  enableLiveData: boolean;
  enableMockData: boolean;

  // 🧠 MODEL REGISTRY - Per-task model configuration (NO hardcoding!)
  models: ModelRegistry;
  embeddingDimension: number;

  // 🧪 Nano Hub / Private Intelligence
  nanoHubUrl: string;
  nanoHubApiKey: string;
}

/**
 * 🎯 Model Registry - Configurable models for different tasks
 * Allows switching AI models without code changes
 */
export interface ModelRegistry {
  // Chat/Conversational AI
  chat: string;           // Main chat model (e.g., 'llama-3.3-70b-versatile', 'gemini-pro')
  chatFast: string;       // Faster model for quick responses

  // Embedding models
  embedding: string;      // Text embedding model
  embeddingDimension: number; // Embedding vector size (768, 1536, 4096, etc.)

  // Vision/Multimodal
  vision: string;         // Vision model for image analysis

  // Private/Local models
  privateChatModel: string;     // Ollama/DeepSeek model for private mode
  privateEmbeddingModel: string; // Local embedding model

  // Agent/Reasoning models
  reasoning: string;      // For complex reasoning tasks
  coding: string;         // For code generation
}

// 🔧 DEFAULT MODELS - Override via VITE_* env vars
const DEFAULT_MODELS: ModelRegistry = {
  // Cloud models (Groq/Gemini)
  chat: 'gemini-3.8-flash',
  chatFast: 'llama-3.1-8b-instant',

  // Embeddings (Google Gemini standard)
  embedding: 'text-embedding-004',
  embeddingDimension: 768, 

  // Vision
  vision: 'gemini-3.8-flash',

  // Private/Local (Ollama)
  privateChatModel: 'deepseek-r1:1.5b',
  privateEmbeddingModel: 'nomic-embed-text',

  // Specialized
  reasoning: 'gemini-3.8-flash',
  coding: 'gemini-3.8-flash',
};

// Provider-specific embedding dimensions
export const EMBEDDING_DIMENSIONS: Record<string, number> = {
  'text-embedding-004': 768,         // Google Gemini
  'embedding-001': 768,              // Google Gemini
  'text-embedding-ada-002': 1536,    // OpenAI
  'text-embedding-3-small': 1536,    // OpenAI
  'text-embedding-3-large': 3072,    // OpenAI
  'nomic-embed-text': 768,           // Ollama/Nomic
  'mxbai-embed-large': 1024,         // Ollama
  'all-minilm': 384,                 // Sentence Transformers
  'bge-large': 1024,                 // BGE
};

// Default AI provider
const DEFAULT_AI_PROVIDER = 'google';

// Cache for the environment config
let environmentConfig: EnvironmentConfig | null = null;

/**
 * Get the environment configuration
 */
export function getEnv(): EnvironmentConfig {
  // If we've already loaded the config, return it
  if (environmentConfig) {
    return environmentConfig;
  }

  // Check for temporary config override (for live email)
  const tempConfig = typeof window !== 'undefined' ? (window as any).TEMP_CONFIG_OVERRIDE : undefined;

  // Determine the environment
  const isDevelopment = typeof import.meta !== 'undefined' ? import.meta.env?.MODE === 'development' : process.env.NODE_ENV === 'development';
  const isProduction = typeof import.meta !== 'undefined' ? import.meta.env?.MODE === 'production' : process.env.NODE_ENV === 'production';

  // Determine useMock from environment variable or temp config
  const useMockRaw = tempConfig?.VITE_USE_MOCK || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_USE_MOCK : process.env.VITE_USE_MOCK);
  let useMock: boolean | 'hybrid' = false; // Default to false for live email

  if (useMockRaw === 'true' || useMockRaw === true) {
    useMock = true;
  } else if (useMockRaw === 'hybrid') {
    useMock = 'hybrid';
  }

  // Check localStorage for demo mode override (runtime toggle)
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('GENIEFLOW_DEMO_MODE') === 'true') {
      useMock = true;
      console.log('🚀 Demo Mode active via localStorage (GENIEFLOW_DEMO_MODE)');
    }
  } catch (e) {
    // Ignore localStorage access errors
    console.warn('Failed to access localStorage for demo mode check', e);
  }

  // Set up the base URL depending on environment
  const baseUrl = isDevelopment
    ? (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000')
    : 'https://genieflowai.netlify.app';

  // Set up the auth callback URL
  const authCallbackUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUTH_CALLBACK_URL) ||
    (isDevelopment
      ? `${baseUrl}/auth/callback`
      : 'https://genieflowai.netlify.app/auth/callback');

  // Parse AI provider with debug logging
  const envSource = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ((typeof process !== 'undefined' ? process.env : {}) as any);
  const rawProvider = envSource.VITE_AI_PROVIDER;
  console.log('🔍 [env.ts] Raw VITE_AI_PROVIDER from envSource:', rawProvider);
  const aiProvider = (rawProvider as any) || DEFAULT_AI_PROVIDER;
  console.log('🎯 [env.ts] Final aiProvider after cast:', aiProvider);

  // Create the environment config
  environmentConfig = {
    useMock,
    isDevelopment,
    isProduction,
    serverUrl: baseUrl,
    apiUrl: `${baseUrl}/api`,
    googleApiKey: tempConfig?.VITE_GOOGLE_API_KEY || envSource.VITE_GOOGLE_API_KEY || '',
    googleClientId: tempConfig?.VITE_GOOGLE_CLIENT_ID || envSource.VITE_GOOGLE_CLIENT_ID || '',
    googleScopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/tasks'
    ],
    authCallbackUrl,
    supabaseUrl: envSource.VITE_SUPABASE_URL || '',
    supabaseAnonKey: envSource.VITE_SUPABASE_ANON_KEY || '',
    // AI-related configurations
    aiProvider,
    enableGpt5Mini: envSource.VITE_ENABLE_GPT5_MINI === 'true',
    aiModel: envSource.VITE_ENABLE_GPT5_MINI === 'true'
      ? 'gpt-5-mini'
      : (envSource.VITE_AI_MODEL || 'llama-3.3-70b-versatile'),
    geminiApiKey: tempConfig?.VITE_GEMINI_API_KEY || envSource.VITE_GEMINI_API_KEY || envSource.VITE_GOOGLE_API_KEY || (typeof window !== 'undefined' ? (localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('gemini_api_key') || '') : ''),
    geminiApiKey2: envSource.VITE_GEMINI_API_KEY_2 || '',
    anthropicApiKey: envSource.VITE_ANTHROPIC_API_KEY || (typeof window !== 'undefined' ? (localStorage.getItem('anthropic_api_key') || '') : ''),
    hasGeminiApiKey: !!(envSource.VITE_GEMINI_API_KEY || envSource.VITE_GOOGLE_API_KEY || envSource.VITE_GEMINI_API_KEY_2 || (typeof window !== 'undefined' && (localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('gemini_api_key')))),
    groqApiKey: envSource.VITE_GROQ_API_KEY || (typeof window !== 'undefined' ? (localStorage.getItem('groq_api_key') || localStorage.getItem('VITE_GROQ_API_KEY') || '') : ''),
    groqApiKey2: envSource.VITE_GROQ_API_KEY_2 || '',
    hasGroqApiKey: !!(envSource.VITE_GROQ_API_KEY || envSource.VITE_GROQ_API_KEY_2 || (typeof window !== 'undefined' && (localStorage.getItem('groq_api_key') || localStorage.getItem('VITE_GROQ_API_KEY')))),
    debug: tempConfig?.VITE_DEBUG === 'true' || envSource.VITE_DEBUG_MODE === 'true',
    // Model settings
    maxTokens: envSource.VITE_MAX_TOKENS ? Number(envSource.VITE_MAX_TOKENS) : undefined,
    temperature: envSource.VITE_TEMPERATURE ? Number(envSource.VITE_TEMPERATURE) : undefined,
    topP: envSource.VITE_TOP_P ? Number(envSource.VITE_TOP_P) : undefined,
    topK: envSource.VITE_TOP_K ? Number(envSource.VITE_TOP_K) : undefined,
    // Node environment
    nodeEnv: envSource.NODE_ENV || '',
    // Hybrid mode settings
    enableLiveData: envSource.VITE_ENABLE_LIVE_DATA === 'true',
    enableMockData: envSource.VITE_ENABLE_MOCK_DATA === 'true',

    // 🧠 MODEL REGISTRY - All configurable via env vars, no hardcoding!
    embeddingDimension: parseInt(envSource.VITE_EMBEDDING_DIMENSION || '768'),
    models: {
      // Chat models - from env or defaults
      chat: envSource.VITE_MODEL_CHAT || DEFAULT_MODELS.chat,
      chatFast: envSource.VITE_MODEL_CHAT_FAST || DEFAULT_MODELS.chatFast,

      // Embedding - from env or defaults
      embedding: envSource.VITE_MODEL_EMBEDDING || DEFAULT_MODELS.embedding,
      embeddingDimension: parseInt(envSource.VITE_EMBEDDING_DIMENSION || String(DEFAULT_MODELS.embeddingDimension)),

      // Vision - from env or defaults
      vision: envSource.VITE_MODEL_VISION || DEFAULT_MODELS.vision,

      // Private/Local - from env or defaults
      privateChatModel: envSource.VITE_MODEL_PRIVATE_CHAT || DEFAULT_MODELS.privateChatModel,
      privateEmbeddingModel: envSource.VITE_MODEL_PRIVATE_EMBEDDING || DEFAULT_MODELS.privateEmbeddingModel,

      // Specialized - from env or defaults
      reasoning: envSource.VITE_MODEL_REASONING || DEFAULT_MODELS.reasoning,
      coding: envSource.VITE_MODEL_CODING || DEFAULT_MODELS.coding,
    },

    // Nano Hub
    nanoHubUrl: envSource.VITE_NANO_HUB_URL || 'http://localhost:8080',
    nanoHubApiKey: envSource.VITE_NANO_HUB_API_KEY || ''
  };

  // AI-related configurations logging
  console.log('🔑 [env.ts] Gemini Primary Key:', environmentConfig.geminiApiKey ? 'PRESENT' : 'MISSING');
  console.log('🔑 [env.ts] Gemini Secondary Key:', environmentConfig.geminiApiKey2 ? 'PRESENT' : 'MISSING');
  console.log('🔑 [env.ts] Groq Primary Key:', environmentConfig.groqApiKey ? 'PRESENT' : 'MISSING');
  console.log('🔑 [env.ts] Groq Secondary Key:', environmentConfig.groqApiKey2 ? 'PRESENT' : 'MISSING');

  console.log('🔑 [env.ts] googleApiKey:', environmentConfig.googleApiKey ? 'PRESENT' : 'MISSING');
  console.log('🔑 [env.ts] googleClientId:', environmentConfig.googleClientId ? 'PRESENT' : 'MISSING');

  return environmentConfig;
}

/**
 * Update the environment configuration 
 * Used for runtime configuration updates
 */
export function updateEnvConfig(updates: Partial<EnvironmentConfig>): void {
  if (environmentConfig) {
    environmentConfig = { ...environmentConfig, ...updates };
  }
}

/**
 * Reset the environment configuration cache
 * Forces a reload of environment variables
 */
export function resetEnvConfig(): void {
  environmentConfig = null;
}