/**
 * Interface representing a designed CRISPR guide RNA.
 */
export interface GuideRNA {
  id: string;
  sequence: string;
  pam: string;
  strand: '+' | '-';
  offTargetScore: number;
  onTargetScore: number;
  genomicLocation: string;
}

export class CrisprService {
  /**
   * Mock/Wrapper for predicting optimum guide RNAs (gRNAs)
   * In a production environment, this would call out to CRISPOR, Synthego, or a local Cas-OFFinder instance.
   * 
   * @param targetSequence The DNA sequence targeted for editing
   * @param pamType The Protospacer Adjacent Motif (default typically SpCas9 'NGG')
   */
  static async designGuides(targetSequence: string, pamType: string = 'NGG'): Promise<GuideRNA[]> {
    console.log(`[CrisprService] Designing guides for sequence target (PAM: ${pamType})`);
    
    // Simulate API delay for deep learning prediction of on/off target scores
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demonstration, returning mock highly-scored guides targeting the LMNA defect
    return [
      {
        id: 'gRNA-LMNA-1',
        sequence: 'GCTGCAGCTGCAGCTGCAGC',
        pam: 'TGG',
        strand: '+',
        offTargetScore: 92.5,
        onTargetScore: 88.3,
        genomicLocation: 'chr1:156100000-156100020'
      },
      {
        id: 'gRNA-LMNA-2',
        sequence: 'CCAGCAGCTGCAGCTGCAGC',
        pam: 'AGG',
        strand: '-',
        offTargetScore: 95.1,
        onTargetScore: 79.8,
        genomicLocation: 'chr1:156100010-156100030'
      }
    ];
  }

  /**
   * Evaluates the risk of a specific edit based on its off-target profile across the human genome.
   */
  static async orderGuideSet(_guideId: string): Promise<{
    status: string;
    orderId: string;
    eta: string;
  }> {
    return {
      status: 'ORDERED',
      orderId: 'ORD-12345',
      eta: '3-5 business days'
    };
  }
}
