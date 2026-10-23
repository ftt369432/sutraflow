export interface VariantInfo {
  _id: string;
  clinvar?: {
    rcv: any; // Accommodate varied ClinVar objects (array or single)
    variant_id: string;
    clinical_significance?: string;
    review_status?: string;
  };
  cadd?: {
    phred: number;
    raw: number;
  };
  snpeff?: {
    ann: any[];
  };
}

export class MyVariantService {
  private static BASE_URL = 'https://myvariant.info/v1';

  /**
   * Deep search variants linked to a gene, filtering for pathogenesis.
   */
  static async searchDangerousVariants(geneSymbol: string, size: number = 50): Promise<VariantInfo[]> {
    try {
      // Searching specifically for variants flagged as 'Pathogenic' or 'Likely pathogenic' in ClinVar
      const query = `${encodeURIComponent(geneSymbol)} AND clinvar.clinical_significance:"Pathogenic"`;
      const response = await fetch(`${this.BASE_URL}/query?q=${query}&size=${size}&fields=clinvar,cadd,snpeff`);
      if (!response.ok) throw new Error('Failed to fetch pathogenic variant data');
      
      const data = await response.json();
      return data.hits as VariantInfo[];
    } catch (error) {
      console.error('MyVariantService Error (Deep Search):', error);
      throw error;
    }
  }

  /**
   * Search for all variants related to a gene symbol (e.g. LMNA).
   * Note: This is an aggregated wrapper.
   */
  static async searchVariants(query: string, size: number = 20): Promise<VariantInfo[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/query?q=${encodeURIComponent(query)}&size=${size}&fields=clinvar,cadd,snpeff`);
      if (!response.ok) throw new Error('Failed to fetch variant data');
      
      const data = await response.json();
      return data.hits as VariantInfo[];
    } catch (error) {
      console.error('MyVariantService Error:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific variant HGVS ID.
   * Example: chr1:g.35367G>A
   */
  static async getVariant(hgvsId: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/variant/${hgvsId}?fields=all`);
      if (!response.ok) throw new Error('Failed to fetch variant details');
      
      return await response.json();
    } catch (error) {
      console.error('MyVariantService Error:', error);
      throw error;
    }
  }
}
