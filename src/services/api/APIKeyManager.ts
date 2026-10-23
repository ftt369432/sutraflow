import { encrypt, decrypt, secureCompare } from '../../lib/utils';

export type Provider = 'openai' | 'anthropic' | 'google';

interface StoredKey {
  provider: Provider;
  encryptedKey: string;
  lastUsed: string;
}

export class APIKeyManager {
  private static instance: APIKeyManager;
  private readonly storageKey = 'ai-api-keys';
  private keys: Map<Provider, StoredKey>;

  private constructor() {
    this.keys = new Map();
    this.loadKeys();
  }

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  private loadKeys(): void {
    try {
      const storedKeys = localStorage.getItem(this.storageKey);
      if (storedKeys) {
        const parsedKeys: StoredKey[] = JSON.parse(storedKeys);
        parsedKeys.forEach(key => {
          this.keys.set(key.provider, key);
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      throw new Error('Failed to load API keys from storage');
    }
  }

  private saveKeys(): void {
    try {
      const keysArray = Array.from(this.keys.values());
      localStorage.setItem(this.storageKey, JSON.stringify(keysArray));
    } catch (error) {
      console.error('Failed to save API keys:', error);
      throw new Error('Failed to save API keys to storage');
    }
  }

  setKey(provider: Provider, key: string): void {
    if (!this.validateKey(provider, key)) {
      throw new Error(`Invalid API key format for provider: ${provider}`);
    }

    const encryptedKey = encrypt(key);
    const storedKey: StoredKey = {
      provider,
      encryptedKey,
      lastUsed: new Date().toISOString()
    };

    this.keys.set(provider, storedKey);
    this.saveKeys();
  }

  getKey(provider: Provider): string {
    const storedKey = this.keys.get(provider);
    if (!storedKey) {
      throw new Error(`No API key found for provider: ${provider}`);
    }

    try {
      return decrypt(storedKey.encryptedKey);
    } catch (error) {
      console.error(`Failed to decrypt key for provider ${provider}:`, error);
      throw new Error(`Failed to retrieve API key for provider: ${provider}`);
    }
  }

  removeKey(provider: Provider): void {
    if (this.keys.delete(provider)) {
      this.saveKeys();
    }
  }

  clearKeys(): void {
    this.keys.clear();
    this.saveKeys();
  }

  hasKey(provider: Provider): boolean {
    return this.keys.has(provider);
  }

  getProviders(): Provider[] {
    return Array.from(this.keys.keys());
  }

  updateLastUsed(provider: Provider): void {
    const key = this.keys.get(provider);
    if (key) {
      key.lastUsed = new Date().toISOString();
      this.saveKeys();
    }
  }

  private validateKey(provider: Provider, key: string): boolean {
    if (!key || typeof key !== 'string') return false;

    switch (provider) {
      case 'openai':
        return /^sk-[a-zA-Z0-9]{32,}$/.test(key);
      case 'anthropic':
        return /^sk-ant-[a-zA-Z0-9]{32,}$/.test(key);
      case 'google':
        return /^[a-zA-Z0-9_-]{39}$/.test(key);
      default:
        return false;
    }
  }

  getMaskedKey(provider: Provider): string {
    const key = this.getKey(provider);
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  validateAllKeys(): boolean {
    try {
      for (const [provider, storedKey] of this.keys) {
        const key = decrypt(storedKey.encryptedKey);
        if (!this.validateKey(provider, key)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  compareKey(provider: Provider, key: string): boolean {
    try {
      const storedKey = this.getKey(provider);
      return secureCompare(key, storedKey);
    } catch {
      return false;
    }
  }
} 