/**
 * 🔢 TokenTracker — Central AI Usage Monitoring Service
 * 
 * Intercepts and tracks every AI API call across the application.
 * Provides real-time usage stats, source attribution, and cost estimates.
 * 
 * Usage:
 *   TokenTracker.record({ provider, model, inputTokens, outputTokens, source, ... })
 *   TokenTracker.getSessionStats()
 *   TokenTracker.subscribe(listener)
 */

export interface TokenEvent {
  id: string;
  timestamp: number;
  provider: 'gemini' | 'groq' | 'mock' | 'openai' | 'private';
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  source: string;        // e.g. "Soul.agentic_loop", "LearningService", "ChatResponse"
  category: 'chat' | 'agentic' | 'utility' | 'learning' | 'embedding' | 'canvas' | 'system';
  success: boolean;
  latencyMs: number;
  promptPreview: string; // First 120 chars of the prompt for debugging
  cost: number;          // Estimated USD cost
}

export interface SessionStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { calls: number; tokens: number; cost: number }>;
  byCategory: Record<string, { calls: number; tokens: number }>;
  bySource: Record<string, { calls: number; tokens: number; lastUsed: number }>;
  failedCalls: number;
  sessionStartTime: number;
  lastCallTime: number;
}

type Listener = (stats: SessionStats, event: TokenEvent) => void;

// Cost estimates per 1M tokens (USD)
const COST_TABLE: Record<string, { input: number; output: number }> = {
  'gemini-3.8-flash':   { input: 0.15,  output: 0.60  },
  'gemini-2.0-flash':   { input: 0.10,  output: 0.40  },
  'gemini-2.0-pro':     { input: 1.25,  output: 5.00  },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
  'qwen2.5:7b':         { input: 0,     output: 0     },
  'qwen3.8:27b':        { input: 0,     output: 0     },
  'deepseek-r1:14b':    { input: 0,     output: 0     },
  'deepseek-r1:32b':    { input: 0,     output: 0     },
  'private':            { input: 0,     output: 0     },
  'mock':               { input: 0,     output: 0     },
  'default':            { input: 0.10,  output: 0.40  },
};

/**
 * Estimate token count from text length.
 * Rule of thumb: ~4 chars per token for English text.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

class TokenTrackerService {
  private events: TokenEvent[] = [];
  private listeners: Set<Listener> = new Set();
  private sessionStart: number = Date.now();
  private _eventIdCounter = 0;

  /**
   * Record an AI API call
   */
  record(params: {
    provider: TokenEvent['provider'];
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    promptText?: string;
    responseText?: string;
    source: string;
    category: TokenEvent['category'];
    success?: boolean;
    latencyMs?: number;
  }): TokenEvent {
    const model = params.model || 'unknown';
    const inputTokens = params.inputTokens ?? estimateTokens(params.promptText || '');
    const outputTokens = params.outputTokens ?? estimateTokens(params.responseText || '');
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost (Local GPU / private and mock are 100% free)
    const isFree = params.provider === 'private' || params.provider === 'mock' || model.includes('qwen');
    const rates = isFree ? { input: 0, output: 0 } : (COST_TABLE[model] || COST_TABLE['default']);
    const cost = isFree ? 0 : ((inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output);

    const event: TokenEvent = {
      id: `tk_${++this._eventIdCounter}_${Date.now()}`,
      timestamp: Date.now(),
      provider: params.provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      source: params.source,
      category: params.category,
      success: params.success ?? true,
      latencyMs: params.latencyMs ?? 0,
      promptPreview: (params.promptText || '').slice(0, 120).replace(/\n/g, ' '),
      cost,
    };

    this.events.push(event);

    // Keep only last 500 events in memory
    if (this.events.length > 500) {
      this.events = this.events.slice(-500);
    }

    // Persist to localStorage for cross-session tracking
    this._persistSummary();

    // Notify listeners
    const stats = this.getSessionStats();
    this.listeners.forEach(fn => {
      try { fn(stats, event); } catch (e) { /* swallow listener errors */ }
    });

    // Console logging for developer visibility
    const emoji = event.success ? '✅' : '❌';
    console.log(
      `${emoji} [TokenTracker] ${event.provider}/${event.model} | ${event.source} (${event.category}) | ` +
      `In: ${inputTokens} Out: ${outputTokens} | $${cost.toFixed(6)} | ${event.latencyMs}ms`
    );

    return event;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): SessionStats {
    const stats: SessionStats = {
      totalCalls: this.events.length,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byCategory: {},
      bySource: {},
      failedCalls: 0,
      sessionStartTime: this.sessionStart,
      lastCallTime: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : 0,
    };

    for (const event of this.events) {
      stats.totalInputTokens += event.inputTokens;
      stats.totalOutputTokens += event.outputTokens;
      stats.totalTokens += event.totalTokens;
      stats.totalCost += event.cost;
      if (!event.success) stats.failedCalls++;

      // By provider
      if (!stats.byProvider[event.provider]) {
        stats.byProvider[event.provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      stats.byProvider[event.provider].calls++;
      stats.byProvider[event.provider].tokens += event.totalTokens;
      stats.byProvider[event.provider].cost += event.cost;

      // By category
      if (!stats.byCategory[event.category]) {
        stats.byCategory[event.category] = { calls: 0, tokens: 0 };
      }
      stats.byCategory[event.category].calls++;
      stats.byCategory[event.category].tokens += event.totalTokens;

      // By source
      if (!stats.bySource[event.source]) {
        stats.bySource[event.source] = { calls: 0, tokens: 0, lastUsed: 0 };
      }
      stats.bySource[event.source].calls++;
      stats.bySource[event.source].tokens += event.totalTokens;
      stats.bySource[event.source].lastUsed = event.timestamp;
    }

    return stats;
  }

  /**
   * Get recent events (for the UI feed)
   */
  getRecentEvents(count: number = 20): TokenEvent[] {
    return this.events.slice(-count).reverse();
  }

  /**
   * Get all events in the current session
   */
  getAllEvents(): TokenEvent[] {
    return [...this.events];
  }

  /**
   * Subscribe to token events (for real-time UI updates)
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Reset session tracking
   */
  resetSession(): void {
    this.events = [];
    this.sessionStart = Date.now();
    this._eventIdCounter = 0;
    console.log('🔄 [TokenTracker] Session reset');
  }

  /**
   * Get the daily cumulative stats from localStorage
   */
  getDailyStats(): { date: string; totalTokens: number; totalCalls: number; totalCost: number } {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(`genieflow_token_daily_${today}`);
      if (stored) return JSON.parse(stored);
    } catch (_e) { /* ignore */ }
    return { date: new Date().toISOString().split('T')[0], totalTokens: 0, totalCalls: 0, totalCost: 0 };
  }

  /**
   * Persist a daily summary to localStorage
   */
  private _persistSummary(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `genieflow_token_daily_${today}`;
      const existing = this.getDailyStats();
      const lastEvent = this.events[this.events.length - 1];
      if (lastEvent) {
        existing.totalTokens += lastEvent.totalTokens;
        existing.totalCalls += 1;
        existing.totalCost += lastEvent.cost;
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch (_e) { /* swallow storage errors */ }
  }
}

// Singleton export
export const TokenTracker = new TokenTrackerService();

// Expose globally for debugging: window.TokenTracker
if (typeof window !== 'undefined') {
  (window as any).TokenTracker = TokenTracker;
  (window as any).getTokenStats = () => {
    const stats = TokenTracker.getSessionStats();
    console.table({
      'Total Calls': stats.totalCalls,
      'Total Tokens': stats.totalTokens.toLocaleString(),
      'Input Tokens': stats.totalInputTokens.toLocaleString(),
      'Output Tokens': stats.totalOutputTokens.toLocaleString(),
      'Est. Cost': `$${stats.totalCost.toFixed(4)}`,
      'Failed Calls': stats.failedCalls,
      'Session Duration': `${Math.round((Date.now() - stats.sessionStartTime) / 60000)} min`,
    });
    console.log('\n📊 By Provider:');
    console.table(stats.byProvider);
    console.log('\n📊 By Category:');
    console.table(stats.byCategory);
    console.log('\n📊 By Source (Top Token Consumers):');
    const sorted = Object.entries(stats.bySource).sort((a, b) => b[1].tokens - a[1].tokens);
    console.table(Object.fromEntries(sorted.slice(0, 10)));
    return stats;
  };
}
