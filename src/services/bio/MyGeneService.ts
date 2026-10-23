export interface GeneInfo {
  _id: string;
  symbol: string;
  name: string;
  taxid: number;
  type_of_gene: string;
  summary?: string;
  map_location?: string;
  genomic_pos?: {
    chr: string;
    start?: number;
    end?: number;
    ensemblgene?: string;
    strand?: number;
  };
}

export class MyGeneService {
  private static BASE_URL = 'https://mygene.info/v3';

  /**
   * Search for genes by symbol or keyword.
   * @param query The search term (e.g., 'LMNA')
   */
  static async searchGenes(query: string): Promise<GeneInfo[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/query?q=${encodeURIComponent(query)}&species=human&fields=symbol,name,taxid,type_of_gene,summary,map_location,genomic_pos`);
      if (!response.ok) throw new Error('Failed to fetch gene data');
      
      const data = await response.json();
      return data.hits as GeneInfo[];
    } catch (error) {
      console.error('MyGeneService Error:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific gene ID.
   * @param geneId The Entrez gene ID
   */
  static async getGene(geneId: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/gene/${geneId}?fields=all`);
      if (!response.ok) throw new Error('Failed to fetch gene details');
      
      return await response.json();
    } catch (error) {
      console.error('MyGeneService Error:', error);
      throw error;
    }
  }
}
