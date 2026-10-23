// AI Service Factory - Easy switching between providers
import { groqService } from './groqService';
import { geminiSimplifiedService as geminiService } from '../gemini-simplified';
import { mockAIService } from './mockAIService';
import { privateService } from './privateService';
import HybridAIService from './hybridService';
import { getEnv } from '../../config/env';
import { TokenTracker, estimateTokens } from './TokenTracker';
import { nebiusTokenFactory } from './NebiusTokenFactoryService';

export type AIProvider = 'groq' | 'gemini' | 'google' | 'private' | 'hybrid' | 'claude' | 'nebius';

// Simple interface for AI services
export interface SimpleAIService {
  generateText(prompt: string, options?: any): Promise<string>;
}

export class AIServiceFactory {
  private static instance: SimpleAIService;
  private static currentProvider: AIProvider;
  private static fallbackToMock: boolean = false;

  // 🧠 Smart resource conservation: remember invalid Gemini key or exhausted quotas per provider
  private static _geminiKeyInvalid: boolean = false;
  private static _exhaustedProviders: Record<string, number> = {}; // mapping of provider -> timestamp
  private static _lastFetchFailureTime: number = 0;
  private static readonly QUOTA_COOLDOWN = 60000; // 1 minute cooldown
  private static readonly FETCH_FAILURE_COOLDOWN = 30000; // 30s before retrying edge functions

  static getInstance(preferredProvider?: AIProvider): SimpleAIService {
    const env = getEnv();

    // 🧠 Check if edge functions recently failed (fetch errors)
    if (this._lastFetchFailureTime && (Date.now() - this._lastFetchFailureTime < this.FETCH_FAILURE_COOLDOWN)) {
      console.warn('⛽ AIServiceFactory: Edge functions recently failed. Using mock (cooldown active).');
      return this.createErrorHandlingWrapper(mockAIService);
    }

    // 🧠 PERSISTENCE: Check localStorage for user-selected provider
    let savedProvider: AIProvider | null = null;
    try {
      savedProvider = localStorage.getItem('genieflow_ai_provider') as AIProvider;
    } catch (_e) {
      console.warn('AIServiceFactory: Could not access localStorage');
    }

    let requestedProvider = preferredProvider || savedProvider || env.aiProvider as AIProvider;

    // 🔍 Smart normalization: Treat 'google' as 'gemini'
    if (requestedProvider === 'google') {
      console.log('🎯 AIServiceFactory: Normalizing "google" provider to "gemini"');
      requestedProvider = 'gemini';
    }

    // 🧠 Check if we are in "Wait" mode due to quota exhaustion for the *requested* provider
    const lastFailure = this._exhaustedProviders[requestedProvider] || 0;
    if (lastFailure && (Date.now() - lastFailure < this.QUOTA_COOLDOWN)) {
      // Instead of dropping straight to mock, check if we can fall back to the other cloud provider
      const fallbackProvider = requestedProvider === 'gemini' ? 'groq' : 'gemini';
      const fallbackFailure = this._exhaustedProviders[fallbackProvider] || 0;
      const isFallbackExhausted = !!(fallbackFailure && (Date.now() - fallbackFailure < this.QUOTA_COOLDOWN));
      const isFallbackValid = fallbackProvider === 'gemini' ? !this._geminiKeyInvalid : true;

      if (!isFallbackExhausted && isFallbackValid) {
        console.warn(`⛽ AIServiceFactory: Quota recently exhausted for ${requestedProvider}. Falling back to ${fallbackProvider} instead of Mock.`);
        requestedProvider = fallbackProvider;
      } else {
        console.warn(`⛽ AIServiceFactory: Both primary and fallback providers exhausted/invalid. Using Mock service to conserve energy.`);
        return this.createErrorHandlingWrapper(mockAIService);
      }
    } else if (lastFailure) {
      console.log(`⛽ AIServiceFactory: Quota cooldown expired for ${requestedProvider}. Re-testing provider...`);
      delete this._exhaustedProviders[requestedProvider];
    }

    console.log('🎯 AIServiceFactory: Current port:', typeof window !== 'undefined' ? window.location?.port : '3000');
    console.log('🎯 AIServiceFactory: Requested provider:', requestedProvider);
    console.log('🎯 AIServiceFactory: Fallback to mock:', this.fallbackToMock);

    // Normalize aliases
    if ((requestedProvider as string) === 'local') requestedProvider = 'private';
    if ((requestedProvider as string) === 'sovereign') requestedProvider = 'gemini';
    if ((requestedProvider as string) === 'google') requestedProvider = 'gemini';

    // Validate provider
    if (!requestedProvider || !['groq', 'gemini', 'private', 'hybrid', 'claude', 'nebius'].includes(requestedProvider)) {
      console.warn(`⚠️ Invalid provider "${requestedProvider}" from env/storage, defaulting to ${env.aiProvider === 'google' ? 'gemini' : env.aiProvider}`);
      requestedProvider = (env.aiProvider === 'google' ? 'gemini' : env.aiProvider) as AIProvider;

      if (!['groq', 'gemini', 'private', 'hybrid', 'claude', 'nebius'].includes(requestedProvider)) {
        requestedProvider = 'groq';
      }

      // Clear cached instance if provider is totally invalid
      // Clear cached instance if provider is totally invalid
      if (this.currentProvider !== requestedProvider) {
        this.instance = null as any;
      }
    }

    // Check if we need to switch providers or create new instance
    if (!this.instance || this.currentProvider !== requestedProvider) {
      this.switchProvider(requestedProvider);
    }

    // Wrap the instance to detect CORS errors and fallback
    return this.createErrorHandlingWrapper(this.instance);
  }

  private static createErrorHandlingWrapper(service: SimpleAIService, trackerSource?: string): SimpleAIService {
    return {
      async generateText(prompt: string, options?: any): Promise<string> {
        const callStart = Date.now();
        const source = trackerSource || options?._trackerSource || 'unknown';
        const category = options?._trackerCategory || 'chat';

        // 🧠 Dynamically resolve which provider we are wrapping rather than only relying on global state
        const provider = service === groqService ? 'groq' : service === geminiService ? 'gemini' : AIServiceFactory.currentProvider;

        // 🧠 If Gemini key was already found invalid, skip straight to available fallback
        if (AIServiceFactory._geminiKeyInvalid && provider === 'gemini') {
          const env = getEnv();
          const hasGroq = !!env.groqApiKey && !env.groqApiKey.includes('PLACEHOLDER');
          if (hasGroq) {
            try {
              const result = await groqService.generateText(prompt, options);
              TokenTracker.record({ provider: 'groq', model: 'llama-3.3-70b-versatile', promptText: prompt, responseText: result, source: `${source}.gemini_skip_fallback`, category: category as any, success: true, latencyMs: Date.now() - callStart });
              return result;
            } catch (retryError) {
              // continue to next fallback
            }
          }
          if (env.nebiusApiKey && !env.nebiusApiKey.includes('PLACEHOLDER')) {
            try {
              const result = await (nebiusTokenFactory as any).generateText(prompt, options);
              TokenTracker.record({ provider: 'nebius', model: 'nvidia/Nemotron-3-Ultra-550b-a55b', promptText: prompt, responseText: result, source: `${source}.gemini_skip_fallback`, category: category as any, success: true, latencyMs: Date.now() - callStart });
              return result;
            } catch (nebiusErr) {
              // continue to private fallback
            }
          }
          try {
            return await privateService.generateText(prompt, options);
          } catch (privateErr) {
            console.error('❌ AIServiceFactory: All fallbacks failed when Gemini cached as invalid');
          }
        }

        try {
          console.log('🚀 AIServiceFactory: Attempting to generate text with', provider);
          const result = await service.generateText(prompt, options);
          const trackedModel = options?.model || (provider === 'private' ? (localStorage.getItem('genieflow_local_model') || 'qwen2.5:7b') : 'gemini-3.8-flash');
          TokenTracker.record({ provider: provider as any || 'gemini', model: trackedModel, promptText: prompt, responseText: result, source, category: category as any, success: true, latencyMs: Date.now() - callStart });
          return result;
        } catch (error) {
          console.error('❌ AIServiceFactory: Error generating text:', error);

          // Check if it's a CORS or fetch error (edge function unreachable)
          if (error instanceof TypeError && error.message.includes('fetch')) {
            AIServiceFactory._lastFetchFailureTime = Date.now();
            console.warn('🚨 AIServiceFactory: Edge function unreachable, using mock (will retry in 30s)');
            return await mockAIService.generateText(prompt, options);
          }

          // Check for other network errors
          if (error instanceof Error && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
            AIServiceFactory._lastFetchFailureTime = Date.now();
            console.warn('🚨 AIServiceFactory: Network error, using mock (will retry in 30s)');
            return await mockAIService.generateText(prompt, options);
          }

          // 🧠 Check for Gemini API key errors (404 is a model route error, not an invalid key)
          const isGeminiFatalError = error instanceof Error && (
            error.message.includes('API key not valid') ||
            error.message.includes('API_KEY_INVALID') ||
            error.message.includes('INVALID_ARGUMENT') ||
            error.message.includes('KEY_INVALID')
          );

          const isGeminiRateLimit = error instanceof Error && (
            error.message.includes('429') ||
            error.message.includes('rate limit') ||
            error.message.includes('Quota exceeded') ||
            error.message.includes('503') ||
            error.message.includes('high demand') ||
            error.message.includes('Service Unavailable') ||
            error.message.includes('overload')
          );

          const isGroqError = error instanceof Error && (
            error.message.includes('Groq API error') ||
            provider === 'groq'
          );

          if (provider === 'gemini' && (isGeminiFatalError || isGeminiRateLimit)) {
            console.warn(`🚨 AIServiceFactory: Gemini failure (${isGeminiFatalError ? 'Fatal Key Issue' : 'Rate Limit / Quota'}). Attempting fallback cascade...`);

            if (isGeminiRateLimit) {
              AIServiceFactory._exhaustedProviders['gemini'] = Date.now();
            }
            if (isGeminiFatalError && !AIServiceFactory._geminiKeyInvalid) {
              console.warn('🚨 AIServiceFactory: Caching Gemini as invalid for key issue.');
              AIServiceFactory._geminiKeyInvalid = true;
            }

            // 1. Try Groq if configured
            const env = getEnv();
            const hasGroq = !!env.groqApiKey && !env.groqApiKey.includes('PLACEHOLDER') && !(AIServiceFactory._exhaustedProviders['groq'] && Date.now() - AIServiceFactory._exhaustedProviders['groq'] < AIServiceFactory.QUOTA_COOLDOWN);
            if (hasGroq) {
              try {
                console.warn('🔄 AIServiceFactory: Falling back to Groq Llama 3.3...');
                return await groqService.generateText(prompt, options);
              } catch (retryError) {
                console.warn('❌ AIServiceFactory: Groq fallback also failed:', retryError);
                if (retryError instanceof Error && (retryError.message.includes('rate_limit') || retryError.message.includes('Rate limit'))) {
                  AIServiceFactory._exhaustedProviders['groq'] = Date.now();
                }
              }
            }

            // 2. Try Nebius Token Factory (NVIDIA Nemotron) if configured
            const hasNebius = !!env.nebiusApiKey && !env.nebiusApiKey.includes('PLACEHOLDER');
            if (hasNebius) {
              try {
                console.warn('🔄 AIServiceFactory: Falling back to Nebius Token Factory (Nemotron)...');
                return await (nebiusTokenFactory as any).generateText(prompt, options);
              } catch (nebiusErr) {
                console.warn('❌ AIServiceFactory: Nebius fallback failed:', nebiusErr);
              }
            }

            // 3. Try Sovereign Private AI (RTX 4090 / Local Nano Hub)
            try {
              console.warn('🔄 AIServiceFactory: Falling back to Sovereign Private AI (RTX 4090 / Nano Hub)...');
              return await privateService.generateText(prompt, options);
            } catch (privateErr) {
              console.warn('❌ AIServiceFactory: Private AI fallback failed:', privateErr);
            }

            // 4. Graceful degradation: return a helpful message rather than crashing UI
            console.error('💀 AIServiceFactory: CRITICAL - All AI providers temporarily unavailable.');
            return "System is currently over capacity. I am maintaining the session in a low-power state. Please check your network or try switching AI providers in the header.";
          }

          // 🔄 SYMMETRICAL FALLBACK: If Groq fails (Rate Limit), try Gemini or Private
          if (provider === 'groq' && isGroqError) {
            console.warn('🚨 AIServiceFactory: Groq failure detected. Falling back to Gemini or Private AI...');
            AIServiceFactory._exhaustedProviders['groq'] = Date.now();

            if (!AIServiceFactory._geminiKeyInvalid && (!AIServiceFactory._exhaustedProviders['gemini'] || Date.now() - AIServiceFactory._exhaustedProviders['gemini'] > AIServiceFactory.QUOTA_COOLDOWN)) {
              try {
                return await geminiService.generateText(prompt, options);
              } catch (geminiErr) {
                console.warn('❌ AIServiceFactory: Gemini fallback failed:', geminiErr);
              }
            }

            try {
              return await privateService.generateText(prompt, options);
            } catch (privateErr) {
              console.warn('❌ AIServiceFactory: Private AI fallback failed:', privateErr);
            }

            return "System is currently over capacity. Please check your API quotas or switch to Sovereign Local GPU mode.";
          }

          // 🔄 If Private AI was attempted and failed, try Cloud Fallback (Gemini then Groq)
          if (provider === 'private') {
            console.warn('🚨 AIServiceFactory: Private AI endpoint not reachable, attempting Cloud fallback...');
            if (!AIServiceFactory._geminiKeyInvalid) {
              try {
                return await geminiService.generateText(prompt, options);
              } catch (geminiErr) {
                console.warn('❌ AIServiceFactory: Cloud Gemini fallback failed:', geminiErr);
              }
            }
            try {
              return await groqService.generateText(prompt, options);
            } catch (groqErr) {
              console.warn('❌ AIServiceFactory: Cloud Groq fallback failed:', groqErr);
            }
          }

          throw error;
        }
      }
    };
  }

  /**
   * Get a low-cost service for background/utility tasks
   * Prefers Gemini (if key valid) or a faster Groq model
   */
  static getUtilityService(): SimpleAIService {
    const env = getEnv();

    // If user has explicitly selected Sovereign Private AI, respect it for utility tasks
    if (this.currentProvider === 'private') {
      console.log('⛽ AIServiceFactory: Routing utility task to Sovereign Private AI (RTX 4090)');
      return this.createErrorHandlingWrapper(privateService, 'LocalGPUUtilityService');
    }

    // If user has explicitly selected Nebius, respect it for utility tasks
    if (this.currentProvider === 'nebius' && env.nebiusApiKey && !env.nebiusApiKey.includes('PLACEHOLDER')) {
      console.log('⛽ AIServiceFactory: Routing utility task to Nebius Token Factory');
      return this.createErrorHandlingWrapper(nebiusTokenFactory as any, 'NebiusUtilityService');
    }

    const isGeminiExhausted = !!(this._exhaustedProviders['gemini'] && (Date.now() - this._exhaustedProviders['gemini'] < this.QUOTA_COOLDOWN));
    const hasGemini = !this._geminiKeyInvalid && !isGeminiExhausted && !!env.geminiApiKey && !env.geminiApiKey.includes('PLACEHOLDER');

    if (hasGemini) {
      console.log('⛽ AIServiceFactory: Routing utility task to Gemini (Flash tier)');
      return this.createErrorHandlingWrapper(geminiService, 'UtilityService');
    }

    const hasGroq = !!env.groqApiKey && !env.groqApiKey.includes('PLACEHOLDER');
    if (hasGroq) {
      console.log('⛽ AIServiceFactory: Routing utility task to Groq (Cheapest available)');
      return this.createErrorHandlingWrapper(groqService);
    }

    // Sovereign fallback: Route utility tasks to Local GPU (RTX 4090, 0 cost, 140 tok/s)
    console.log('⛽ AIServiceFactory: Routing utility task to Local GPU (Sovereign RTX 4090)');
    return this.createErrorHandlingWrapper(privateService, 'LocalGPUUtilityService');
  }

  /**
   * EASY SWITCHING: Change AI provider on the fly
   */
  static switchProvider(provider: AIProvider): void {
    console.log(`🔄 AIServiceFactory: Switching to provider: ${provider}`);
    console.trace('🔍 AIServiceFactory: Stack trace for provider switch:');

    // Normalize aliases
    if ((provider as string) === 'local') provider = 'private';
    if ((provider as string) === 'sovereign') provider = 'gemini';
    if (provider === 'google') {
      provider = 'gemini';
    }
    if (!['groq', 'gemini', 'private', 'hybrid', 'claude', 'nebius'].includes(provider)) {
      console.warn(`⚠️  Invalid provider: ${provider}, forcing to groq`);
      provider = 'groq';
    }

    // 🧠 PERSISTENCE: Save selection
    try {
      localStorage.setItem('genieflow_ai_provider', provider);
    } catch (_e) {
      console.warn('AIServiceFactory: Could not save to localStorage');
    }

    switch (provider) {
      case 'groq':
        this.instance = groqService;
        this.currentProvider = 'groq';
        console.log('✅ Now using Groq AI (via Supabase Edge Function)');
        break;

      case 'gemini':
        this.instance = geminiService;
        this.currentProvider = 'gemini';
        console.log('✅ Now using Gemini AI');
        break;

      case 'private':
        this.instance = privateService;
        this.currentProvider = 'private';
        console.log('✅ Now using Private AI (Nano Hub - Encrypted Home Server)');
        break;

      case 'hybrid':
        // Hybrid mode: Smart routing between cloud (Gemini) and private (Ollama)
        this.instance = new HybridAIService(geminiService, privateService);
        this.currentProvider = 'hybrid';
        console.log('✅ Now using Hybrid AI (Cloud + Private + Knowledge Base)');
        console.log('   ☁️  Cloud: Gemini (fast, online)');
        console.log('   🏠 Private: Ollama (secure, offline)');
        console.log('   🧠 Knowledge: Learning enabled');
        break;

      case 'claude':
        this.currentProvider = 'claude';
        // We set the instance to a lazy loader
        this.instance = {
          generateText: async (prompt: string, options?: any) => {
            const { AIService } = await import('./aiService');
            const svc = await AIService.getInstance();
            return await svc.generateText(prompt, { ...options, provider: 'anthropic' });
          }
        };
        console.log('✅ Now using Claude AI (Anthropic)');
        break;

      case 'nebius':
        this.instance = nebiusTokenFactory as any;
        this.currentProvider = 'nebius';
        console.log('✅ Now using Nebius Token Factory (NVIDIA Nemotron)');
        break;

      default:
        console.warn(`⚠️  Unknown provider: ${provider}, falling back to Groq`);
        this.instance = groqService;
        this.currentProvider = 'groq';
        break;
    }
  }

  /**
   * Get current active provider
   */
  static getCurrentProvider(): AIProvider {
    if (this.currentProvider) {
      return this.currentProvider;
    }
    try {
      const saved = localStorage.getItem('genieflow_ai_provider') as AIProvider;
      if (saved && ['groq', 'gemini', 'private', 'hybrid', 'claude'].includes(saved)) {
        this.currentProvider = saved;
        return saved;
      }
    } catch (_e) {}

    const env = getEnv();
    const envProvider = (env.aiProvider === 'google' ? 'gemini' : env.aiProvider) as AIProvider;
    if (envProvider && ['groq', 'gemini', 'private', 'hybrid', 'claude'].includes(envProvider)) {
      this.currentProvider = envProvider;
      return envProvider;
    }
    return 'private';
  }

  /**
   * Get a specific service by provider name (without switching global state)
   */
  static getService(provider: AIProvider): SimpleAIService {
    // Normalize 'google' to 'gemini'
    if (provider === 'google') provider = 'gemini';
    
    switch (provider) {
      case 'groq': return groqService;
      case 'gemini': return geminiService;
      case 'private': return privateService;
      case 'nebius': return nebiusTokenFactory as any;
      case 'claude':
        return {
          generateText: async (p, o) => {
             const { AIService } = await import('./aiService');
             const svc = await AIService.getInstance();
             return svc.generateText(p, { ...o, provider: 'anthropic' });
          }
        };
      default: return groqService;
    }
  }

  /**
   * Internal helper to get service instance for specific provider
   */
  private static async getProviderService(provider: AIProvider): Promise<SimpleAIService> {
    switch (provider) {
      case 'groq': return groqService;
      case 'gemini': return geminiService;
      case 'private': return privateService;
      case 'claude':
        const { AIService } = await import('./aiService');
        const svc = await AIService.getInstance();
        return {
          generateText: (p, o) => svc.generateText(p, { ...o, provider: 'anthropic' })
        };
      default: return groqService;
    }
  }

  /**
   * Force refresh - useful after environment changes
   */
  static refresh(): SimpleAIService {
    console.log('🔄 AIServiceFactory: Force refresh requested');
    this.instance = null as any;
    this.currentProvider = null as any;
    this.fallbackToMock = false; // Reset mock fallback
    this._geminiKeyInvalid = false; // 🧠 Re-test Gemini key on refresh
    this._exhaustedProviders = {};  // Clear all provider exhaustion states
    return this.getInstance();
  }

  /**
   * Reset mock fallback state - useful when switching environments
   */
  static resetMockFallback(): void {
    console.log('🔄 AIServiceFactory: Resetting mock fallback state');
    this.fallbackToMock = false;
  }
}

// Export convenience function for easy switching
export function switchAIProvider(provider: AIProvider): void {
  AIServiceFactory.switchProvider(provider);
}

// Export current provider getter
export function getCurrentAIProvider(): AIProvider {
  return AIServiceFactory.getCurrentProvider();
}