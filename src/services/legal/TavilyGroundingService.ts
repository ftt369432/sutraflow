/**
 * TavilyGroundingService.ts
 * 
 * Runtime Legal Search & Authority Grounding via Tavily API
 * Directly unlocks eligibility for the $3,000 "Best Use of Tavily" Cash Prize
 * in the Nebius x NVIDIA Global AI Hackathon (Devpost).
 * 
 * Verifies active California Court of Appeal precedents, WCAB en banc decisions,
 * and statutory standards before legal pleading synthesis.
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  responseTime: number;
}

export class TavilyGroundingService {
  private static instance: TavilyGroundingService;
  private endpoint = 'https://api.tavily.com/search';

  private cachedApiKey: string = '';
  private recentSearches: TavilySearchResponse[] = [];

  private constructor() {
    this.initApiKey();
    this.loadPersistedSearches();
  }

  private loadPersistedSearches(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('genieflow_tavily_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.recentSearches = parsed.slice(0, 20);
          }
        }
      }
    } catch (_e) {}
  }

  private persistSearches(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('genieflow_tavily_history', JSON.stringify(this.recentSearches.slice(0, 20)));
      }
    } catch (_e) {}
  }

  private async initApiKey(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).electronBridge?.system?.getSecret) {
        const secret = await (window as any).electronBridge.system.getSecret('TAVILY_API_KEY');
        if (secret) {
          this.cachedApiKey = secret;
        }
      }
    } catch (_e) {}
  }

  public static getInstance(): TavilyGroundingService {
    if (!TavilyGroundingService.instance) {
      TavilyGroundingService.instance = new TavilyGroundingService();
    }
    return TavilyGroundingService.instance;
  }

  public getApiKey(): string {
    if (this.cachedApiKey) return this.cachedApiKey;

    const fromStorage = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('genieflow_tavily_key') || '')
      : '';

    const fromEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TAVILY_API_KEY)
      || (typeof process !== 'undefined' && process.env?.TAVILY_API_KEY)
      || '';

    return fromStorage || fromEnv || '';
  }

  public async resolveApiKey(): Promise<string> {
    if (this.cachedApiKey) return this.cachedApiKey;
    if (typeof window !== 'undefined' && (window as any).electronBridge?.system?.getSecret) {
      try {
        const secret = await (window as any).electronBridge.system.getSecret('TAVILY_API_KEY');
        if (secret) {
          this.cachedApiKey = secret;
          return secret;
        }
      } catch (_e) {}
    }
    return this.getApiKey();
  }

  public getRecentSearches(): TavilySearchResponse[] {
    return [...this.recentSearches];
  }

  public getLatestSearch(): TavilySearchResponse | null {
    return this.recentSearches.length > 0 ? this.recentSearches[0] : null;
  }

  public clearSearches(): void {
    this.recentSearches = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('genieflow_tavily_history');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('genieflow_tavily_cleared'));
    }
  }

  private getProxyUrl(endpoint: string): string {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${endpoint}`;
    }
    return `http://localhost:3000${endpoint}`;
  }

  /** True when the dev-server proxy (or a client-side key) can reach Tavily. */
  public async isConfigured(): Promise<boolean> {
    try {
      const r = await fetch(this.getProxyUrl('/api/tavily/status'));
      if ((r.headers.get('content-type') || '').includes('application/json')) {
        const j = await r.json();
        if (j?.configured) return true;
      }
    } catch (_e) {}
    return Boolean(await this.resolveApiKey());
  }

  /** Proxy first (server holds the key, no CORS); direct call only if a client key exists. */
  private async callTavily(kind: 'search' | 'extract', payload: Record<string, any>): Promise<any> {
    try {
      const r = await fetch(this.getProxyUrl(`/api/tavily/${kind}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000)
      });
      if ((r.headers.get('content-type') || '').includes('application/json')) {
        if (r.ok) return await r.json();
        if (r.status !== 404) {
          throw new Error(`Tavily API Error (${r.status}): ${(await r.text()).slice(0, 300)}`);
        }
      }
    } catch (err: any) {
      if (/Tavily API Error/.test(err?.message || '')) throw err;
    }
    const apiKey = await this.resolveApiKey();
    if (!apiKey) throw new Error('Tavily is not configured (no server key and no client key).');
    const res = await fetch(`https://api.tavily.com/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ ...payload, api_key: apiKey }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) throw new Error(`Tavily API Error (${res.status}): ${(await res.text()).slice(0, 300)}`);
    return res.json();
  }

  /**
   * Full-page extraction for primary-source URLs (statute / regulation / opinion text).
   */
  public async extract(urls: string[]): Promise<Array<{ url: string; rawContent: string }>> {
    if (!urls.length) return [];
    const data = await this.callTavily('extract', { urls, extract_depth: 'advanced' });
    return (data?.results || []).map((r: any) => ({ url: r.url, rawContent: r.raw_content || r.content || '' }));
  }

  /**
   * Executes a runtime live search via the Tavily API
   */
  public async searchPrecedents(query: string, options: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    domains?: string[];
    /** When true, do not prefix/clip the query or broaden domains (engine-built queries). */
    raw?: boolean;
  } = {}): Promise<TavilySearchResponse> {
    const trimmed = query.trim();
    const cleanQuery = options.raw || trimmed.toLowerCase().includes('california workers')
      ? trimmed.slice(0, 380)
      : `California workers compensation: ${trimmed}`.slice(0, 380);

    const payload: Record<string, any> = {
      query: cleanQuery,
      search_depth: options.searchDepth || 'advanced',
      include_answer: options.includeAnswer ?? !options.raw,
      max_results: options.maxResults || 5,
      include_domains: options.domains || [
        'courts.ca.gov',
        'dir.ca.gov',
        'leginfo.legislature.ca.gov',
        'casetext.com',
        'justia.com',
        'scholar.google.com'
      ]
    };

    const startTime = Date.now();
    let data = await this.callTavily('search', payload);

    // If zero results returned with restrictive legal domains, retry with broader web authority
    if ((!data.results || data.results.length === 0) && !options.domains) {
      data = await this.callTavily('search', { ...payload, include_domains: undefined });
    }

    const searchResponse: TavilySearchResponse = {
      query,
      answer: data.answer || undefined,
      results: (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score
      })),
      responseTime: Date.now() - startTime
    };

    // Store in recent searches history
    this.recentSearches = [searchResponse, ...this.recentSearches.filter(s => s.query !== query)].slice(0, 20);
    this.persistSearches();

    // Dispatch global event for UI synchronization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('genieflow_tavily_searched', {
        detail: searchResponse
      }));
    }

    return searchResponse;
  }

  /**
   * Formats Tavily live search results into a clean grounding block for NVIDIA Nemotron
   */
  public formatGroundingContext(response: TavilySearchResponse): string {
    if (!response.results || response.results.length === 0) {
      return '';
    }

    let block = `\n## VERIFIED LEGAL PRECEDENTS & AUTHORITIES (GROUNDED VIA TAVILY LIVE SEARCH)\n`;
    if (response.answer) {
      block += `**Authority Summary:** ${response.answer}\n\n`;
    }

    response.results.forEach((r, idx) => {
      block += `### Authority [${idx + 1}]: ${r.title}\n`;
      block += `Source: ${r.url}\n`;
      block += `Extract: ${r.content.trim()}\n\n`;
    });

    return block;
  }
}

export const tavilyGrounding = TavilyGroundingService.getInstance();
export const tavilyGroundingService = tavilyGrounding;

