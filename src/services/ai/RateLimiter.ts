interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
}

interface QueuedRequest {
  id: string;
  priority: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export class RateLimiter {
  private requestQueue: QueuedRequest[] = [];
  private activeRequests = 0;
  private requestsThisMinute = 0;
  private lastResetTime = Date.now();
  private readonly config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequestsPerMinute: config.maxRequestsPerMinute || 60,
      maxConcurrentRequests: config.maxConcurrentRequests || 5
    };

    // Reset request count every minute
    setInterval(() => {
      this.requestsThisMinute = 0;
      this.lastResetTime = Date.now();
    }, 60000);
  }

  async enqueue<T>(
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: crypto.randomUUID(),
        priority,
        execute,
        resolve,
        reject
      };

      this.addToQueue(request);
      this.processQueue();
    });
  }

  private addToQueue(request: QueuedRequest) {
    // Insert request in priority order (higher priority first)
    const index = this.requestQueue.findIndex(r => r.priority < request.priority);
    if (index === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(index, 0, request);
    }
  }

  private async processQueue() {
    if (
      this.activeRequests >= this.config.maxConcurrentRequests ||
      this.requestsThisMinute >= this.config.maxRequestsPerMinute ||
      this.requestQueue.length === 0
    ) {
      return;
    }

    const request = this.requestQueue.shift();
    if (!request) return;

    this.activeRequests++;
    this.requestsThisMinute++;

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  getStats() {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests,
      requestsThisMinute: this.requestsThisMinute,
      timeUntilReset: 60000 - (Date.now() - this.lastResetTime)
    };
  }

  clearQueue() {
    const error = new Error('Request queue cleared');
    this.requestQueue.forEach(request => request.reject(error));
    this.requestQueue = [];
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter(); 