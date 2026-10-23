/**
 * 📚 PubMed Service
 * Interfaces with NCBI Entrez E-Utils to provide the AI with real-time access
 * to the global research body.
 */
export interface PubMedArticle {
  id: string;
  title: string;
  journal: string;
  pubDate: string;
  authors: string[];
  abstract?: string;
}

export class PubMedService {
  private static BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  
  /**
   * 🔍 Search for PubMed IDs using keywords
   */
  static async searchArticles(query: string, maxResults: number = 10): Promise<string[]> {
    try {
      console.log(`📚 PubMed: Searching for "${query}"...`);
      const response = await fetch(`${this.BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${maxResults}`);
      
      if (!response.ok) throw new Error(`NCBI Search Error: ${response.statusText}`);
      
      const data = await response.json();
      return data.esearchresult.idlist || [];
    } catch (error) {
      console.error('📚 PubMed Search Failed:', error);
      return [];
    }
  }

  /**
   * 📄 Get Summaries for a list of PubMed IDs
   */
  static async getSummaries(ids: string[]): Promise<PubMedArticle[]> {
    if (ids.length === 0) return [];
    
    try {
      console.log(`📚 PubMed: Fetching summaries for ${ids.length} articles...`);
      const response = await fetch(`${this.BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`);
      
      if (!response.ok) throw new Error(`NCBI Summary Error: ${response.statusText}`);
      
      const data = await response.json();
      const results = data.result;
      
      return ids.map(id => {
        const doc = results[id];
        return {
          id: id,
          title: doc.title,
          journal: doc.fulljournalname || doc.source,
          pubDate: doc.pubdate,
          authors: (doc.authors || []).map((a: any) => a.name)
        };
      });
    } catch (error) {
      console.error('📚 PubMed Summaries Failed:', error);
      return [];
    }
  }

  /**
   * 🧠 Hybrid Research: Search and Summarize in one go
   */
  static async performLiteratureReview(query: string): Promise<PubMedArticle[]> {
    const ids = await this.searchArticles(query);
    return this.getSummaries(ids);
  }
}
