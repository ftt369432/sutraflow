import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Node environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // API settings
  apiUrl: z.string().url().optional(),
  port: z.number().default(3000),

  // AI Configuration
  useMock: z.boolean().default(false),
  aiProvider: z.enum(['groq', 'gemini']).default('groq'),
  aiModel: z.string().default('llama-3.3-70b-versatile'),

  // API Keys
  groqApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  polygonApiKey: z.string().optional(),

  // Google OAuth (Client Secret should only be server-side)
  googleClientId: z.string().optional(),

  // Other settings
  hasGroqApiKey: z.boolean().default(false),
  hasGeminiApiKey: z.boolean().default(false),
  hasPolygonApiKey: z.boolean().default(false),
  debug: z.boolean().default(false)
});

// Process environment variables
const processEnv = {
  nodeEnv: import.meta.env.NODE_ENV || 'development',
  apiUrl: import.meta.env.VITE_API_URL,
  port: import.meta.env.VITE_PORT ? Number(import.meta.env.VITE_PORT) : undefined,
  useMock: import.meta.env.VITE_USE_MOCK === 'true' || (!import.meta.env.VITE_USE_MOCK && import.meta.env.MODE === 'development'),
  aiProvider: import.meta.env.VITE_AI_PROVIDER,
  aiModel: import.meta.env.VITE_AI_MODEL,
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY,
  anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  polygonApiKey: import.meta.env.VITE_POLYGON_API_KEY,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  hasGroqApiKey: import.meta.env.VITE_GROQ_API_KEY ? true : false,
  hasGeminiApiKey: (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY) ? true : false,
  hasPolygonApiKey: import.meta.env.VITE_POLYGON_API_KEY ? true : false,
  debug: import.meta.env.VITE_DEBUG === 'true',
};

// Parse and validate environment variables
export const env = envSchema.parse(processEnv);

// Type export for TypeScript consumption
export type Env = z.infer<typeof envSchema>;