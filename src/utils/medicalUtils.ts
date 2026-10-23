/**
 * Utility functions for extracting medical information from documents
 */

/**
 * Extract ICD-10 codes mentioned in text
 * Common patterns: ICD-10: A01.0, ICD-10 code A01.0, etc.
 */
export function extractICD10Codes(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    // ICD-10 patterns - matches letter followed by 2 digits, then optional dot and more digits
    /\b(?:ICD-?10|International Classification of Diseases)(?:\s+code)?[:\s]\s*([A-Z]\d{2}(?:\.\d+)?)\b/gi,
    /\b([A-Z]\d{2}(?:\.\d+)?)\s+(?:is\s+the\s+ICD-?10\s+code|ICD-?10)\b/gi,
    // Also match common ICD-10 patterns in parentheses
    /\((?:ICD-?10\s+)?([A-Z]\d{2}(?:\.\d+)?)\)/gi,
    // Match ICD-10 codes that appear after diagnoses
    /(?:likely|possibly|confirmed|diagnosis of)\s+[\w\s\-]+\s+\(([A-Z]\d{2}(?:\.\d+)?)\)/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Standardize output format
      codes.add(`ICD-10 ${match[1].toUpperCase()}`);
    }
  });
  
  return Array.from(codes);
}

/**
 * Extract CPT codes from text
 * Common patterns: CPT code 99213, CPT: 99213
 */
export function extractCPTCodes(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    // CPT code patterns - typically 5 digits, sometimes with modifiers
    /\b(?:CPT|Current Procedural Terminology)(?:\s+code)?[:\s]\s*(\d{5}(?:-[A-Z0-9]{1,5})?)\b/gi,
    /\b(\d{5}(?:-[A-Z0-9]{1,5})?)\s+(?:is\s+the\s+CPT\s+code|CPT)\b/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.add(`CPT ${match[1]}`);
    }
  });
  
  return Array.from(codes);
}

/**
 * Extract medication references from text
 * Includes generic and brand names along with dosages
 */
export function extractMedications(text: string): string[] {
  if (!text) return [];
  
  const commonMeds = [
    // Common medication patterns - partial list
    'acetaminophen', 'advil', 'albuterol', 'amoxicillin', 'aspirin', 'atorvastatin', 
    'azithromycin', 'benadryl', 'cephalexin', 'ciprofloxacin', 'clonazepam', 'codeine', 
    'cyclobenzaprine', 'doxycycline', 'gabapentin', 'hydrochlorothiazide', 'hydrocodone', 
    'ibuprofen', 'levothyroxine', 'lisinopril', 'loratadine', 'losartan', 'metformin', 
    'metoprolol', 'naproxen', 'omeprazole', 'oxycodone', 'pantoprazole', 'prednisone', 
    'sertraline', 'simvastatin', 'tramadol', 'tylenol', 'warfarin', 'xanax', 'zoloft',
    'lipitor', 'nexium', 'prozac', 'crestor', 'humira', 'enbrel', 'remicade', 'rituxan',
    'avastin', 'herceptin', 'lantus', 'januvia', 'lyrica', 'spiriva', 'symbicort'
  ];

  const dosagePattern = /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units|IU|mEq)\b/gi;
  const medicationPattern = new RegExp(
    '\\b(' + commonMeds.join('|') + ')\\b(?:[\\s,]+(\\d+(?:\\.\\d+)?\\s*(?:mg|mcg|g|ml|units|IU|mEq)))?', 
    'gi'
  );
  
  const medications = new Set<string>();
  let match;
  
  while ((match = medicationPattern.exec(text)) !== null) {
    if (match[2]) {
      // If dosage is captured in the regex
      medications.add(`${match[1].charAt(0).toUpperCase() + match[1].slice(1)} ${match[2]}`);
    } else {
      // Look ahead for dosage in text
      const remainder = text.substring(match.index + match[0].length, match.index + match[0].length + 20);
      const dosageMatch = remainder.match(dosagePattern);
      
      if (dosageMatch) {
        medications.add(`${match[1].charAt(0).toUpperCase() + match[1].slice(1)} ${dosageMatch[0]}`);
      } else {
        medications.add(match[1].charAt(0).toUpperCase() + match[1].slice(1));
      }
    }
  }

  return Array.from(medications);
}

/**
 * Extract medical journal citations from text
 */
export function extractJournalCitations(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    // Matches citations like: Author et al., Journal Name (Year)
    /(?:According to |by |See |From )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+et\s+al\.?,\s+([A-Za-z\s]+)\s+\((\d{4})\)/gi,
    // Journal citations with volume and pages
    /(?:According to |by |See |From )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+et\s+al\.?,\s+([A-Za-z\s]+)\.\s+(\d{4})(?:;|\s+Vol\.?\s*)(\d+)(?:\s*\(\s*\d+\s*\))?:\s*(\d+)(?:\s*-\s*\d+)?/gi,
    // Match DOI numbers - handles parentheses and trailing punctuation
    /\bDOI:\s*(10\.\d{4,}\/[A-Za-z0-9\.\-_\/()]+)(?:[.,)]|$)/gi,
    // Match PMID numbers
    /\bPMID:?\s*(\d{5,})\b/gi
  ];
  
  const citations = new Set<string>();
  // Special handling for DOI pattern
  const doiPattern = /\bDOI:\s*(10\.\d{4,}\/[A-Za-z0-9\.\-_\/()]+)/gi;
  let doiMatch;
  while ((doiMatch = doiPattern.exec(text)) !== null) {
    citations.add(`DOI: ${doiMatch[1]}`);
  }
  
  // Handle PMID and journal citations
  patterns.filter(p => !p.source.includes('DOI')).forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (pattern.source.includes('PMID')) {
        citations.add(`PMID: ${match[1]}`);
      } else if (match[4] && match[5]) {
        citations.add(`${match[1]} et al., ${match[2]} (${match[3]}) ${match[4]}:${match[5]}`);
      } else if (match[1] && match[2] && match[3]) {
        citations.add(`${match[1]} et al., ${match[2]} (${match[3]})`);
      }
    }
  });
  
  return Array.from(citations);
}

/**
 * Extract HCPCS codes from text
 * Common patterns: HCPCS code G0447, HCPCS: G0447
 */
export function extractHCPCSCodes(text: string): string[] {
  if (!text) return [];
  
  const patterns = [
    // HCPCS code patterns - typically letter followed by 4 digits
    /\b(?:HCPCS|Healthcare Common Procedure Coding System)(?:\s+code)?[:\s]\s*([A-Z]\d{4}(?:-[A-Z0-9]{1,5})?)\b/gi,
    /\b([A-Z]\d{4}(?:-[A-Z0-9]{1,5})?)\s+(?:is\s+the\s+HCPCS\s+code|HCPCS)\b/gi,
  ];
  
  const codes = new Set<string>();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.add(`HCPCS ${match[1].toUpperCase()}`);
    }
  });
  
  return Array.from(codes);
}

/**
 * Extract all medical references from a document
 */
export function extractMedicalReferences(text: string): {
  icd10Codes: string[],
  cptCodes: string[],
  medications: string[],
  journalCitations: string[],
  hcpcsCodes: string[],
  allReferences: string[]
} {
  const icd10Codes = extractICD10Codes(text);
  const cptCodes = extractCPTCodes(text);
  const medications = extractMedications(text);
  const journalCitations = extractJournalCitations(text);
  const hcpcsCodes = extractHCPCSCodes(text);
  
  return {
    icd10Codes,
    cptCodes,
    medications,
    journalCitations,
    hcpcsCodes,
    allReferences: [
        ...icd10Codes, 
        ...cptCodes, 
        ...medications,
        ...journalCitations,
        ...hcpcsCodes
    ]
  };
}
