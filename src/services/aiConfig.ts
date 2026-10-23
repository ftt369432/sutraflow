import { aiProviders } from '../config/aiProviders';
import type { AIProvider } from '../config/aiProviders';

class AIConfig {
  private providers: AIProvider[];

  constructor() {
    this.providers = aiProviders;
  }

  getProviderConfig(providerId: string): AIProvider | undefined {
    return this.providers.find(p => p.id === providerId);
  }

  isEnabled(providerId: string): boolean {
    const provider = this.getProviderConfig(providerId);
    return provider?.enabled ?? false;
  }

  getApiKey(providerId: string): string {
    const provider = this.getProviderConfig(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const env = (import.meta as any).env || process.env;
    const key = env[provider.apiKeyName];
    if (!key) {
      console.error(`API key not found for provider ${providerId}. Looking for key: ${provider.apiKeyName}`);
      throw new Error(`API key not found for provider ${providerId}`);
    }

    // Don't log the actual key in production
    console.debug(`Found API key for ${providerId}`);
    return key;
  }

  getEnabledProviders(): AIProvider[] {
    return this.providers.filter(provider => this.isEnabled(provider.id));
  }

  getServiceProvider(serviceName: 'ai-drive' | 'ai-assistant' | 'ai-agent'): string {
    // Return the configured AI provider from environment
    const env = (import.meta as any).env || process.env;
    return env.VITE_AI_PROVIDER || 'groq';
  }
}

export const aiConfig = new AIConfig(); 