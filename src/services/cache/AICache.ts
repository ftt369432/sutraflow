import { LRUCache } from 'lru-cache';

interface CacheOptions {
  maxSize?: number;
  ttl?: number;
}

interface CachedResponse {
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CachedEmbedding {
  vector: number[];
  timestamp: number;
}

export class AICache {
  private responseCache: LRUCache<string, CachedResponse>;
  private embeddingCache: LRUCache<string, CachedEmbedding>;

  constructor(options: CacheOptions = {}) {
    const {
      maxSize = 1000,
      ttl = 1000 * 60 * 60 // 1 hour default TTL
    } = options;

    this.responseCache = new LRUCache({
      max: maxSize,
      ttl,
      updateAgeOnGet: true
    });

    this.embeddingCache = new LRUCache({
      max: maxSize,
      ttl: ttl * 24, // Embeddings can be cached longer
      updateAgeOnGet: true
    });
  }

  // Response caching
  getCachedResponse(key: string): string | null {
    const cached = this.responseCache.get(key);
    return cached ? cached.content : null;
  }

  cacheResponse(key: string, content: string, metadata?: Record<string, any>) {
    this.responseCache.set(key, {
      content,
      timestamp: Date.now(),
      metadata
    });
  }

  // Embedding caching
  getCachedEmbedding(key: string): number[] | null {
    const cached = this.embeddingCache.get(key);
    return cached ? cached.vector : null;
  }

  cacheEmbedding(key: string, vector: number[]) {
    this.embeddingCache.set(key, {
      vector,
      timestamp: Date.now()
    });
  }

  // Cache management
  clearResponseCache() {
    this.responseCache.clear();
  }

  clearEmbeddingCache() {
    this.embeddingCache.clear();
  }

  clearAll() {
    this.clearResponseCache();
    this.clearEmbeddingCache();
  }

  // Cache statistics
  getStats() {
    return {
      responses: {
        size: this.responseCache.size,
        maxSize: this.responseCache.max,
      },
      embeddings: {
        size: this.embeddingCache.size,
        maxSize: this.embeddingCache.max,
      }
    };
  }
}

// Create a singleton instance
export const aiCache = new AICache(); 