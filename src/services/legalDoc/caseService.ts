import axios from 'axios';
// import { getEmbedding } from '../embeddingService';
import { Citation } from './legalDocumentService';

// Types for Case Law API
export interface CaseLawSearchResult {
  id: string;
  name: string;
  citation: string;
  court: string;
  date: string;
  summary: string;
  url: string;
  text?: string;
  relevance?: number;
}

export interface CaseLawSearchParams {
  query: string;
  jurisdiction?: string;
  court?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  limit?: number;
}

export class LegalCaseService {
  // private supabase;
  
  // Cache to prevent redundant API calls
  private caseCache: Map<string, CaseLawSearchResult[]> = new Map();
  
  constructor() {
    // this.supabase = supabase;
  }
  
  /**
   * Searches for case law using public APIs
   * Uses a multi-source approach with fallbacks
   */
  async searchCaseLaw(params: CaseLawSearchParams): Promise<CaseLawSearchResult[]> {
    // Check cache first
    const cacheKey = JSON.stringify(params);
    if (this.caseCache.has(cacheKey)) {
      return this.caseCache.get(cacheKey) || [];
    }
    
    try {
      // Try Case Law Access Project API first (cap.law.harvard.edu)
      const harvardResults = await this.searchHarvardCaseLaw(params);
      
      // If we have enough results, return them
      if (harvardResults.length >= (params.limit || 5)) {
        this.cacheCache(cacheKey, harvardResults);
        return harvardResults;
      }
      
      // Try CourtListener API as backup
      const courtListenerResults = await this.searchCourtListener(params);
      
      // Combine results, remove duplicates
      const combinedResults = this.deduplicateResults([
        ...harvardResults,
        ...courtListenerResults
      ]);
      
      // Cache results
      this.cacheCache(cacheKey, combinedResults);
      
      return combinedResults;
    } catch (error) {
      console.error('Error searching case law:', error);
      
      // Fallback to mock data in case of API failure
      return this.getMockCaseLaw(params.query);
    }
  }
  
  /**
   * Searches the Harvard Case Law Access Project API
   * Documentation: https://case.law/api/
   */
  private async searchHarvardCaseLaw(params: CaseLawSearchParams): Promise<CaseLawSearchResult[]> {
    try {
      // Harvard API uses a different format
      const response = await axios.get('https://api.case.law/v1/cases/', {
        params: {
          search: params.query,
          jurisdiction: params.jurisdiction,
          court__name: params.court,
          decision_date_min: params.dateRange?.start,
          decision_date_max: params.dateRange?.end,
          limit: params.limit || 10
        }
      });
      
      if (response.data && response.data.results) {
        return response.data.results.map((result: any) => ({
          id: result.id.toString(),
          name: result.name,
          citation: result.citations.join('; '),
          court: result.court.name,
          date: result.decision_date,
          summary: result.preview || '',
          url: `https://case.law/cases/${result.id}/`,
          relevance: 1.0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching from Harvard Case Law API:', error);
      return [];
    }
  }
  
  /**
   * Searches the CourtListener API
   * Documentation: https://www.courtlistener.com/api/
   */
  private async searchCourtListener(params: CaseLawSearchParams): Promise<CaseLawSearchResult[]> {
    try {
      const response = await axios.get('https://www.courtlistener.com/api/rest/v3/search/', {
        params: {
          q: params.query,
          court: params.court,
          filed_after: params.dateRange?.start,
          filed_before: params.dateRange?.end,
          limit: params.limit || 10
        }
      });
      
      if (response.data && response.data.results) {
        return response.data.results.map((result: any) => ({
          id: result.id.toString(),
          name: result.caseName,
          citation: result.citation || '',
          court: result.court_name || '',
          date: result.dateFiled || '',
          summary: result.snippet || '',
          url: result.absolute_url || `https://www.courtlistener.com${result.path}`,
          relevance: 1.0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching from CourtListener API:', error);
      return [];
    }
  }
  
  /**
   * Extracts citations from document text
   */
  async extractCitations(text: string): Promise<Citation[]> {
    // Example regex patterns for common citation formats
    const citationPatterns = [
      // US Supreme Court: 410 U.S. 113
      /(\d+)\s+U\.S\.\s+(\d+)/g,
      
      // Federal Reporter: 497 F.2d 680
      /(\d+)\s+F\.\s*(\d+d)\s+(\d+)/g,
      
      // Regional Reporters: 79 Cal. App. 4th 570
      /(\d+)\s+(Cal|N\.Y|Tex|Ill|Pa|Mass|Ohio)\.(\s+App\.)?\s+(\d+d|)\s+(\d+)/g,
      
      // Simple case name: Smith v. Jones
      /([A-Z][a-z]+)\s+v\.\s+([A-Z][a-z]+)/g
    ];
    
    const citations: Citation[] = [];
    
    // Document ID will be assigned later
    const docId = 'temp';
    
    // Extract citations using regex patterns
    for (const pattern of citationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const citationText = match[0];
        
        // Check if we already found this citation
        if (!citations.some(c => c.citation_text === citationText)) {
          citations.push({
            document_id: docId,
            citation_text: citationText,
            relevance_score: 1.0
          });
        }
      }
    }
    
    // For each citation, try to look up more details
    for (const citation of citations) {
      try {
        const searchResults = await this.searchCaseLaw({
          query: citation.citation_text,
          limit: 1
        });
        
        if (searchResults.length > 0) {
          const result = searchResults[0];
          citation.source = result.court;
          citation.url = result.url;
        }
      } catch (error) {
        console.error(`Error looking up details for citation: ${citation.citation_text}`, error);
      }
    }
    
    return citations;
  }
  
  /**
   * Provides mock case law data for testing
   */
  private getMockCaseLaw(_query: string): CaseLawSearchResult[] {
    // This function can be expanded with more mock cases
    return [
      {
        id: "1",
        name: "Roe v. Wade",
        citation: "410 U.S. 113 (1973)",
        court: "Supreme Court of the United States",
        date: "1973-01-22",
        summary: "Case establishing the right to abortion under the constitutional right to privacy",
        url: "https://supreme.justia.com/cases/federal/us/410/113/",
        relevance: 0.95
      },
      {
        id: "2",
        name: "Brown v. Board of Education",
        citation: "347 U.S. 483 (1954)",
        court: "Supreme Court of the United States",
        date: "1954-05-17",
        summary: "Landmark decision declaring segregation in public schools unconstitutional",
        url: "https://supreme.justia.com/cases/federal/us/347/483/",
        relevance: 0.85
      },
      {
        id: "3",
        name: "Obergefell v. Hodges",
        citation: "576 U.S. 644 (2015)",
        court: "Supreme Court of the United States",
        date: "2015-06-26",
        summary: "Case establishing the right to same-sex marriage under the Equal Protection Clause",
        url: "https://supreme.justia.com/cases/federal/us/576/644/",
        relevance: 0.75
      }
    ];
  }
  
  /**
   * Helper method to cache search results
   */
  private cacheCache(key: string, results: CaseLawSearchResult[]): void {
    this.caseCache.set(key, results);
    
    // Limit cache size to prevent memory issues
    if (this.caseCache.size > 100) {
      const oldestKey = this.caseCache.keys().next().value;
      if (oldestKey) {
        this.caseCache.delete(oldestKey);
      }
    }
  }
  
  /**
   * Helper method to remove duplicate results
   */
  private deduplicateResults(results: CaseLawSearchResult[]): CaseLawSearchResult[] {
    const uniqueMap = new Map<string, CaseLawSearchResult>();
    
    for (const result of results) {
      // Use name and citation as unique identifier
      const key = `${result.name}|${result.citation}`;
      
      // If this is a duplicate, keep the one with more info
      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key)!;
        
        if (result.summary.length > existing.summary.length) {
          uniqueMap.set(key, result);
        }
      } else {
        uniqueMap.set(key, result);
      }
    }
    
    return Array.from(uniqueMap.values());
  }
} 