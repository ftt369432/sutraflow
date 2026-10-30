/**
 * TavilyGroundingService.ts
 * 
 * Runtime Web Search & Authority Grounding via Tavily API
 * Directly unlocks eligibility for the $3,000 "Best Use of Tavily" Cash Prize
 * in the Nebius x NVIDIA Global AI Hackathon (Devpost).
 * 
 * Fluid and domain-adaptive across Legal Precedents, Clinical Evidence, Market & Zoning,
 * Code & Technical Documentation, Accounting & GAAP, Operations, and Universal Web.
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
  domainType?: string;
}

export interface DomainGroundingConfig {
  tabLabel: string;
  badgeLabel: string;
  headerTitle: string;
  headerSubtitle: string;
  searchPlaceholder: string;
  queryPrefix: string;
  defaultDomains?: string[];
  suggestedQueries: Array<{ label: string; query: string }>;
}

export const DOMAIN_GROUNDING_CONFIGS: Record<string, DomainGroundingConfig> = {
  legal: {
    tabLabel: 'Precedent Grounding',
    badgeLabel: 'Statutory & Case Law',
    headerTitle: 'Real-Time Statutory & Precedent Grounding',
    headerSubtitle: 'Verify active California Court of Appeal precedents, WCAB en banc rulings, and statutory codes.',
    searchPlaceholder: 'Search California statutes, en banc precedents, or appellate citations...',
    queryPrefix: 'California legal precedent: ',
    defaultDomains: [
      'courts.ca.gov',
      'dir.ca.gov',
      'leginfo.legislature.ca.gov',
      'casetext.com',
      'justia.com',
      'scholar.google.com'
    ],
    suggestedQueries: [
      { label: 'LC § 5814 Penalties & 5814.5 Fees', query: 'California Labor Code 5814 unreasonable delay penalties and 5814.5 attorney fees' },
      { label: 'Escobedo v. Marshalls Apportionment', query: 'Escobedo v Marshalls substantial medical evidence apportionment standard' },
      { label: 'Colamonico v. Secure Transportation', query: 'Colamonico v Secure Transportation WCAB en banc medical legal expenses' },
      { label: '8 CCR § 10964 Rebuttal to WCJ', query: '8 CCR 10964 Petition for Reconsideration response to WCJ report' }
    ]
  },
  medical: {
    tabLabel: 'Clinical Evidence',
    badgeLabel: 'Peer-Reviewed Medical',
    headerTitle: 'Real-Time Clinical & Evidence Grounding',
    headerSubtitle: 'Ground clinical determinations in PubMed, AMA Guides, MTUS/ACOEM, and peer-reviewed literature.',
    searchPlaceholder: 'Search PubMed, MTUS guidelines, clinical trials, or medical standards...',
    queryPrefix: 'Clinical medical evidence: ',
    defaultDomains: [
      'pubmed.ncbi.nlm.nih.gov',
      'ncbi.nlm.nih.gov',
      'cdc.gov',
      'who.int',
      'medscape.com',
      'fda.gov',
      'dir.ca.gov'
    ],
    suggestedQueries: [
      { label: 'AMA Guides 5th Ed Lumbar Impairment', query: 'AMA Guides to Evaluation of Permanent Impairment 5th edition lumbar spine DRE categories' },
      { label: 'MTUS ACOEM Chronic Pain Guidelines', query: 'MTUS ACOEM chronic pain treatment guidelines California DWC' },
      { label: 'Escobedo Medical Causation Standards', query: 'Escobedo medical evidence standard pathology vs disability causation' },
      { label: 'QME Diagnostic Imaging Necessity', query: 'Diagnostic imaging medical necessity MRI NCV EMG clinical indications' }
    ]
  },
  real_estate: {
    tabLabel: 'Market & Zoning',
    badgeLabel: 'Property & Ordinances',
    headerTitle: 'Real-Time Real Estate, Zoning & Disclosure Grounding',
    headerSubtitle: 'Verify municipal zoning ordinances, MLS comps, California DRE disclosure laws, and Title 24 codes.',
    searchPlaceholder: 'Search zoning ordinances, property comps, HUD standards, or DRE regulations...',
    queryPrefix: 'Real estate zoning and market: ',
    defaultDomains: [
      'hud.gov',
      'census.gov',
      'dre.ca.gov',
      'car.org',
      'zillow.com',
      'municode.com'
    ],
    suggestedQueries: [
      { label: 'Civil Code § 1102 TDS Mandatory Disclosures', query: 'California Civil Code 1102 Transfer Disclosure Statement mandatory seller disclosures' },
      { label: 'Municipal ADU Setback Ordinances', query: 'California accessory dwelling unit ADU setback and FAR regulations' },
      { label: 'CAR Residential Contingency Timelines', query: 'CAR Residential Purchase Agreement contingency removal deadlines' },
      { label: 'Natural Hazard Disclosure (NHD) Zones', query: 'California Natural Hazard Disclosure statutory high fire flood fault zones' }
    ]
  },
  coding: {
    tabLabel: 'Code & Tech Docs',
    badgeLabel: 'API & Architecture',
    headerTitle: 'Real-Time Technical Documentation & API Grounding',
    headerSubtitle: 'Verify library APIs, SDK specs, architecture patterns, and security best practices.',
    searchPlaceholder: 'Search API docs, TypeScript types, RFCs, GitHub repos, or StackOverflow...',
    queryPrefix: 'Software engineering documentation: ',
    defaultDomains: [
      'developer.mozilla.org',
      'github.com',
      'stackoverflow.com',
      'nodejs.org',
      'react.dev',
      'typescriptlang.org',
      'devdocs.io'
    ],
    suggestedQueries: [
      { label: 'TypeScript 5.x Const & Satisfies', query: 'TypeScript satisfies operator and const type parameters best practices' },
      { label: 'React 19 Server Actions & Optimistic', query: 'React 19 useOptimistic and Server Actions architecture patterns' },
      { label: 'OWASP API Security Top 10 Checklist', query: 'OWASP API Security Top 10 vulnerabilities and architectural mitigations' },
      { label: 'Vite WebSocket HMR Configuration', query: 'Vite dev server HMR proxy websocket connection configuration' }
    ]
  },
  accounting: {
    tabLabel: 'Financial Specs & GAAP',
    badgeLabel: 'Tax & Audit Standards',
    headerTitle: 'Real-Time Forensic Accounting & Fee Schedule Grounding',
    headerSubtitle: 'Verify OMFS conversion factors, IRS regulations, GAAP standards, and statutory prejudgment interest.',
    searchPlaceholder: 'Search OMFS rates, IRS publication rules, or statutory interest formulas...',
    queryPrefix: 'Forensic accounting standard: ',
    defaultDomains: [
      'irs.gov',
      'sec.gov',
      'fasb.org',
      'aicpa-cima.com',
      'dir.ca.gov'
    ],
    suggestedQueries: [
      { label: 'California OMFS Physician Conversion Factor', query: 'California OMFS Official Medical Fee Schedule physician conversion factor 2026' },
      { label: 'Civil Code § 3287 Prejudgment Interest', query: 'California Civil Code 3287 prejudgment interest calculation liquidated claims' },
      { label: 'LC § 4622 60-Day Billing Delinquency', query: 'California Labor Code 4622 60 day medical legal billing delinquency 10 percent penalty' },
      { label: 'GAAP ASC 606 Revenue Recognition', query: 'GAAP ASC 606 revenue recognition multi-year contracts performance obligations' }
    ]
  },
  business_ops: {
    tabLabel: 'Operations Intel',
    badgeLabel: 'Executive & Market',
    headerTitle: 'Real-Time Executive Intelligence & Operations Grounding',
    headerSubtitle: 'Ground strategic decisions in market research, unit economics benchmarks, and regulatory filings.',
    searchPlaceholder: 'Search industry benchmarks, competitor pricing, or operational frameworks...',
    queryPrefix: 'Executive business operations: ',
    defaultDomains: [
      'sec.gov',
      'hbr.org',
      'bloomberg.com',
      'mckinsey.com',
      'statista.com'
    ],
    suggestedQueries: [
      { label: 'SaaS B2B Unit Economics Benchmarks', query: 'B2B SaaS LTV CAC payback period and gross margin benchmarks' },
      { label: 'Chief of Staff OKR Decomposition', query: 'Chief of Staff OKR strategic goal decomposition executive frameworks' },
      { label: 'Gatekeeper QA Verification Matrix', query: 'Deterministic QA compliance verification standards for enterprise AI' },
      { label: 'Series A Due Diligence Checklist', query: 'Series A venture capital legal and financial due diligence checklist' }
    ]
  },
  biotech: {
    tabLabel: 'Biotech & Genomics',
    badgeLabel: 'Bioinformatics',
    headerTitle: 'Real-Time Biomedical & Genomic Literature Grounding',
    headerSubtitle: 'Ground scientific hypotheses in ClinicalTrials.gov, PubMed, PDB, and UniProt databases.',
    searchPlaceholder: 'Search ClinicalTrials.gov, PubMed IDs, protein structures, or genomic targets...',
    queryPrefix: 'Biomedical genomics literature: ',
    defaultDomains: [
      'clinicaltrials.gov',
      'ncbi.nlm.nih.gov',
      'ebi.ac.uk',
      'uniprot.org',
      'rcsb.org'
    ],
    suggestedQueries: [
      { label: 'Phase 3 Clinical Trial Endpoints', query: 'Phase 3 clinical trial oncology primary endpoints overall survival' },
      { label: 'AlphaFold pLDDT Confidence Thresholds', query: 'AlphaFold structure prediction pLDDT confidence scores interpretation' },
      { label: 'CRISPR-Cas9 Off-Target Mitigation', query: 'CRISPR Cas9 high-fidelity endonuclease off-target cleavage reduction' },
      { label: 'FDA Accelerated Approval Biomarkers', query: 'FDA surrogate endpoints accelerated approval oncology guidelines' }
    ]
  },
  architecture: {
    tabLabel: 'Building Codes',
    badgeLabel: 'CBC & Title 24',
    headerTitle: 'Real-Time Architecture & Code Compliance Grounding',
    headerSubtitle: 'Verify California Building Code (CBC Title 24), IBC, ADA egress requirements, and municipal zoning.',
    searchPlaceholder: 'Search CBC chapters, Title 24 energy standards, or ADA clearance rules...',
    queryPrefix: 'California building code architecture: ',
    defaultDomains: [
      'up.codes',
      'iccsafe.org',
      'energy.ca.gov',
      'ada.gov',
      'dgs.ca.gov'
    ],
    suggestedQueries: [
      { label: 'CBC Chapter 10 Means of Egress', query: 'California Building Code Chapter 10 means of egress occupant load widths' },
      { label: 'Title 24 Part 6 Lighting Power', query: 'California Title 24 Part 6 nonresidential lighting power density allowances' },
      { label: 'ADA Section 404 Door Clearances', query: 'ADA Standards Section 404 doors maneuvering clearance and threshold height' },
      { label: 'Type V-B Allowable Height and Area', query: 'CBC Table 504.3 allowable height and area Type V-B construction' }
    ]
  },
  custom: {
    tabLabel: 'Live Web Grounding',
    badgeLabel: 'Universal Web',
    headerTitle: 'Real-Time Sovereign Web Authority Grounding',
    headerSubtitle: 'Ground your research and deliverables across the open web with verified authorities.',
    searchPlaceholder: 'Search the live web for authoritative sources, data, or documentation...',
    queryPrefix: '',
    defaultDomains: undefined,
    suggestedQueries: [
      { label: 'Industry Market Analysis & Trends', query: 'Industry market size growth trends and competitive analysis' },
      { label: 'Regulatory Compliance Standards', query: 'Regulatory compliance standards and statutory requirements' },
      { label: 'Technical Architecture Patterns', query: 'Production technical architecture patterns and best practices' },
      { label: 'Financial Valuation Benchmarks', query: 'Enterprise valuation multiples and unit economics benchmarks' }
    ]
  }
};

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
   * Executes a runtime live search via the Tavily API adaptively across domains
   */
  public async searchPrecedents(query: string, options: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    domains?: string[];
    domainType?: string;
    /** When true, do not prefix/clip the query or broaden domains (engine-built queries). */
    raw?: boolean;
  } = {}): Promise<TavilySearchResponse> {
    const trimmed = query.trim();
    const domainKey = options.domainType || 'custom';
    const config = DOMAIN_GROUNDING_CONFIGS[domainKey] || DOMAIN_GROUNDING_CONFIGS.custom;

    let cleanQuery = trimmed;
    if (!options.raw && config.queryPrefix) {
      const lowerTrimmed = trimmed.toLowerCase();
      const prefixWords = config.queryPrefix.toLowerCase().split(' ').filter(w => w.length > 3);
      const alreadyHasPrefix = prefixWords.some(w => lowerTrimmed.includes(w));
      if (!alreadyHasPrefix) {
        cleanQuery = `${config.queryPrefix}${trimmed}`;
      }
    }
    cleanQuery = cleanQuery.slice(0, 380);

    const payload: Record<string, any> = {
      query: cleanQuery,
      search_depth: options.searchDepth || 'advanced',
      include_answer: options.includeAnswer ?? !options.raw,
      max_results: options.maxResults || 5
    };

    const targetDomains = options.domains || config.defaultDomains;
    if (targetDomains && targetDomains.length > 0) {
      payload.include_domains = targetDomains;
    }

    const startTime = Date.now();
    let data = await this.callTavily('search', payload);

    // If zero results returned with restrictive domains, retry with broader open web authority
    if ((!data.results || data.results.length === 0) && payload.include_domains) {
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
      responseTime: Date.now() - startTime,
      domainType: domainKey
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
   * Formats Tavily live search results into a clean grounding block for NVIDIA Nemotron / Gemini
   */
  public formatGroundingContext(response: TavilySearchResponse): string {
    if (!response.results || response.results.length === 0) {
      return '';
    }

    const domainKey = response.domainType || 'custom';
    const config = DOMAIN_GROUNDING_CONFIGS[domainKey] || DOMAIN_GROUNDING_CONFIGS.custom;
    const headerTitle = config.tabLabel.toUpperCase();

    let block = `\n## VERIFIED ${headerTitle} (GROUNDED VIA TAVILY LIVE SEARCH)\n`;
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
