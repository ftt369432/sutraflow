/**
 * Utility functions for extracting legal information from documents
 */

/**
 * Extract labor codes mentioned in text
 * Common patterns: Labor Code § 1234, LC 1234, Labor Code section 1234
 */
export function extractLaborCodes(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    // Labor Code patterns
    /(?:Labor Code|LC|L\.C\.|Lab\. Code)\s*(?:§|section|\u00A7)?\s*(\d+(?:\.\d+)?)/gi,
    /(?:§|section|\u00A7)\s*(\d+(?:\.\d+)?)\s*(?:of the)?\s*(?:Labor Code|LC|L\.C\.|Lab\. Code)/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.add(`Labor Code ${match[1]}`);
    }
  });

  
  return Array.from(codes);
}

/**
 * Extract CCR citations from text
 * Common patterns: 8 CCR 9789.10, Title 8, CCR, § 9789.10
 */
export function extractCCRCitations(text: string): string[] {
  if (!text) return [];

  const patterns = [
    // Matches "Title 8, California Code of Regulations, section 10133.54"
    /Title\s+(\d+)[,.]?\s*(?:California Code of Regulations|Cal(?:ifornia)?\s*Code\s*of\s*Reg(?:ulation)?s?)[,.]?\s*(?:§|section|\u00A7)?\s*([\d\.]+)/gi,
    // Matches "8 CCR 1234.56" or "8 C.C.R. § 9792.27.1"
    /(\d+)\s*(?:CCR|C\.C\.R\.|ccr|C\.?C\.?R\.?)\s*(?:§|section|\u00A7)?\s*([\d\.]+)/gi,
    // Matches "section 1234.56 of Title 8 of the CCR"
    /(?:§|section|\u00A7)\s*([\d\.]+)\s*of\s*Title\s*(\d+)(?:\s*,\s*|\s+of\s+the\s+)?(?:CCR|C\.C\.R\.|ccr|California Code of Regulations|Cal(?:ifornia)?\s*Code\s*of\s*Reg(?:ulation)?s?)/gi,
  ];

  const citations = new Set<string>();
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Pattern 3 has swapped capture groups
      if (pattern.source.includes('of\s*Title')) {
        citations.add(`${match[2]} CCR ${match[1]}`);
      } else {
        // Remove any trailing period
        const sectionNumber = match[2].endsWith('.') ? match[2].slice(0, -1) : match[2];
        citations.add(`${match[1]} CCR ${sectionNumber}`);
      }
    }
  });

  return Array.from(citations);
}

/**
 * Extract case law citations from text
 */
export function extractCaseCitations(text: string): string[] {
  if (!text) return [];

  const patterns = [
    // Captures: "Capital Builders v. The ABC Corp. (2016) 5 Cal.App.5th 658"
    /\b(?:The case of |See )?([A-Z][A-Za-z\s',.&-]+? v\. [A-Z][A-Za-z\s',.&-]+?)\s*\(\s*(\d{4})\s*\)\s*(\d+)\s+Cal\.App\.(?:2d|3d|4th|5th)\s+(\d+)/gi,
    // Captures: "Aldi v. The Other Guys (2006) 71 Cal. Comp. Cases 783"
    /\b(?:The case of |See )?([A-Z][A-Za-z\s',.&-]+? v\. [A-Z][A-Za-z\s',.&-]+?)\s*\(\s*(\d{4})\s*\)\s*(\d+)\s+Cal\.\s*Comp\.\s*Cases\s+(\d+)/gi,
    // Simple "v." citations, e.g., "Smith v. Jones". This is a fallback.
    /\b([A-Z][a-z'-]+ v\. [A-Z][a-z'-]+)\b/g,
  ];

  const citations = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
        if (pattern.source.includes('Cal')) { // For complex and Cal. Comp. cases
            let citation = match[1].trim();
            if (match[2]) { // Year
                citation += ` (${match[2]})`;
            }
            if (match[3]) { // Volume
                citation += ` ${match[3]}`;
            }
            if (pattern.source.includes('App')) {
                const reporterMatch = text.substring(match.index).match(/Cal\.App\.(?:2d|3d|4th|5th)/);
                if (reporterMatch) {
                    citation += ` ${reporterMatch[0]}`;
                }
            } else {
                citation += ` Cal. Comp. Cases`;
            }
            if (match[4]) { // Page
                citation += ` ${match[4]}`;
            }
            citations.add(citation);
        } else { // For simple "v." cases
            const alreadyFound = Array.from(citations).some(c => c.includes(match[1]));
            if (!alreadyFound) {
                citations.add(match[1].trim());
            }
        }
    }
  }

  const complexCitations = Array.from(citations).filter(c => c.includes('('));
  const simpleCitations = Array.from(citations).filter(c => !c.includes('('));

  const finalSimpleCitations = simpleCitations.filter(s => !complexCitations.some(c => c.startsWith(s)));
  
  return [...complexCitations, ...finalSimpleCitations];
}

/**
 * Extract Civil Code citations from text
 */
export function extractCivilCodeCitations(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    /(?:Civil Code|CC|Civ\. Code)\s*(?:§|section|\u00A7)?\s*(\d+(?:\.\d+)?)/gi,
    /(?:§|section|\u00A7)\s*(\d+(?:\.\d+)?)\s*(?:of the)?\s*(?:Civil Code|CC|Civ\. Code)/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.add(`Civil Code ${match[1]}`);
    }
  });
  
  return Array.from(codes);
}

/**
 * Extract Code of Civil Procedure citations from text
 */
export function extractCCPCitations(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    /(?:Code of Civil Procedure|CCP|C\.C\.P\.)\s*(?:§|section|\u00A7)?\s*([\d\.]+[a-z]?)/gi,
    /(?:§|section|\u00A7)\s*([\d\.]+[a-z]?)\s*(?:of the)?\s*(?:Code of Civil Procedure|CCP|C\.C\.P\.)/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1].endsWith('.') ? match[1].slice(0, -1) : match[1];
      codes.add(`CCP ${code}`);
    }
  });
  
  return Array.from(codes);
}

/**
 * Extract Evidence Code citations from text
 */
export function extractEvidenceCodeCitations(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    /(?:Evidence Code|EC|Evid\. Code)\s*(?:§|section|\u00A7)?\s*(\d+(?:\.\d+)?)/gi,
    /(?:§|section|\u00A7)\s*(\d+(?:\.\d+)?)\s*(?:of the)?\s*(?:Evidence Code|EC|Evid\. Code)/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.add(`Evidence Code ${match[1]}`);
    }
  });
  
  return Array.from(codes);
}

/**
 * Extract all legal references from a document
 */
export function extractLegalReferences(text: string): {
  laborCodes: string[],
  ccrCitations: string[],
  caseCitations: string[],
  civilCodeCitations: string[],
  ccpCitations: string[],
  evidenceCodeCitations: string[],
  allReferences: string[]
} {
  const laborCodes = extractLaborCodes(text);
  const ccrCitations = extractCCRCitations(text);
  const caseCitations = extractCaseCitations(text);
  const civilCodeCitations = extractCivilCodeCitations(text);
  const ccpCitations = extractCCPCitations(text);
  const evidenceCodeCitations = extractEvidenceCodeCitations(text);
  
  return {
    laborCodes,
    ccrCitations,
    caseCitations,
    civilCodeCitations,
    ccpCitations,
    evidenceCodeCitations,
    allReferences: [
        ...laborCodes, 
        ...ccrCitations, 
        ...caseCitations,
        ...civilCodeCitations,
        ...ccpCitations,
        ...evidenceCodeCitations
    ]

  };
}
