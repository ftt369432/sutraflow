export interface ClinicalTrial {
  nctId: string;
  briefTitle: string;
  status: string;
  phase?: string[];
  conditions?: string[];
  interventions?: string[];
}

export class ClinicalTrialsService {
  private static BASE_URL = 'https://clinicaltrials.gov/api/v2';

  /**
   * Search for clinical trials related to a gene or condition.
   * @param query The search term (e.g., 'LMNA', 'Laminopathy')
   */
  static async searchTrials(query: string): Promise<ClinicalTrial[]> {
    try {
      // Searching for human trials, recruiting or completed
      const response = await fetch(`${this.BASE_URL}/studies?query.term=${encodeURIComponent(query)}&pageSize=10`);
      if (!response.ok) throw new Error('Failed to fetch clinical trials');
      
      const data = await response.json();
      const studies = data.studies || [];
      
      return studies.map((study: any) => {
        const info = study.protocolSection;
        return {
          nctId: info.identificationModule.nctId,
          briefTitle: info.identificationModule.briefTitle,
          status: info.statusModule.overallStatus,
          phase: info.designModule?.phases,
          conditions: info.conditionsModule?.conditions,
          interventions: info.armsInterventionsModule?.interventions?.map((i: any) => i.name)
        };
      });
    } catch (error) {
      console.error('ClinicalTrialsService Error:', error);
      return []; // Return empty instead of throwing to keep UI stable
    }
  }
}
