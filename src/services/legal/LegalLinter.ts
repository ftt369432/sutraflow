/**
 * ⚖️ LegalLinter
 * 
 * The deterministic "Legal Compiler" for GenieFlow AI.
 * Validates California Labor Code citations, 8 CCR regulations,
 * WCAB En Banc precedents, and mandatory pleading structural elements.
 */

export interface LintFinding {
  type: 'error' | 'warning' | 'info';
  category: 'citation' | 'fact' | 'structure' | 'statute';
  message: string;
  line?: number;
  snippet?: string;
  suggestedFix?: string;
}

export interface LintResult {
  passed: boolean;
  score: number; // 0 - 100
  findings: LintFinding[];
  verifiedCitations: string[];
}

export class LegalLinter {
  private static instance: LegalLinter;

  // Curated database of valid California Labor Code sections in Workers' Comp
  private validLaborCodes = new Set([
    '4600', '4603.2', '4604.5', '4650', '4658', '4659', '4660', '4662',
    '5307.27', '5401', '5402', '5700', '5705', '5813', '5814', '5900', '5903'
  ]);

  // Curated valid 8 CCR (California Code of Regulations) sections
  private validCcrSections = new Set([
    '37.1', '9885', '10160', '10561', '10582.5', '10606', '10770', '10842'
  ]);

  // Key California WCAB En Banc Precedents
  private validPrecedents = [
    { name: 'Navarro', citation: '71 Cal.Comp.Cases 1387', topic: 'Multiple QME Panels / Additional Specialty' },
    { name: 'Gamble', citation: '79 Cal.Comp.Cases 1298', topic: 'LC 4659 SAWW COLA Life Pension Calculation' },
    { name: 'Baker', citation: '76 Cal.Comp.Cases 701', topic: 'SAWW COLA Escalation' },
    { name: 'Benson', citation: '70 Cal.Comp.Cases 1208', topic: 'Apportionment between Multiple Injuries' },
    { name: 'Escobedo', citation: '70 Cal.Comp.Cases 604', topic: 'Substantial Medical Evidence on Apportionment' }
  ];

  public static getInstance(): LegalLinter {
    if (!LegalLinter.instance) {
      LegalLinter.instance = new LegalLinter();
    }
    return LegalLinter.instance;
  }

  /**
   * Lint a draft legal pleading or brief against statutory and factual rules.
   */
  public lintPleading(text: string, activeCaseState?: any): LintResult {
    const findings: LintFinding[] = [];
    const verifiedCitations: string[] = [];

    // 1. Check Mandatory Structural Sections
    const lower = text.toLowerCase();
    if (!lower.includes('caption') && !lower.includes('workers\' compensation appeals board') && !lower.includes('state of california')) {
      findings.push({
        type: 'warning',
        category: 'structure',
        message: 'Document appears to lack a standard WCAB Court Caption block.',
        suggestedFix: 'Include standard caption: Court, District Office, Applicant, Defendant, EAMS ADJ number.'
      });
    }

    if (!lower.includes('statement of facts') && !lower.includes('procedural history') && !lower.includes('factual background')) {
      findings.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing Statement of Facts / Procedural History section.',
        suggestedFix: 'Add factual timeline detailing medical records and procedural filings.'
      });
    }

    if (!lower.includes('points and authorities') && !lower.includes('argument') && !lower.includes('legal basis')) {
      findings.push({
        type: 'error',
        category: 'structure',
        message: 'Missing Legal Points and Authorities / Argument section.',
        suggestedFix: 'Detail specific statutory violations and good-cause justifications.'
      });
    }

    if (!lower.includes('verification') && !lower.includes('prayer') && !lower.includes('respectfully submitted')) {
      findings.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing Formal Prayer for Relief / Signature line.',
        suggestedFix: 'Close with formal Prayer and Attorney signature block.'
      });
    }

    // 2. Validate Labor Code citations: e.g. "Labor Code § 4660", "LC § 5700", "Labor Code section 5814"
    const lcRegex = /(?:Labor\s+Code|LC)\s*(?:§+|section)?\s*(\d+(?:\.\d+)?(?:\([a-z0-9]+\))?)/gi;
    let match;
    while ((match = lcRegex.exec(text)) !== null) {
      const fullCitation = match[0];
      const sectionNum = match[1].split('(')[0];

      if (this.validLaborCodes.has(sectionNum)) {
        verifiedCitations.push(fullCitation);
      } else {
        findings.push({
          type: 'warning',
          category: 'statute',
          message: `Unverified Labor Code reference: "${fullCitation}". Verify section exists under California Labor Code.`,
          snippet: fullCitation
        });
      }
    }

    // 3. Validate 8 CCR citations: e.g. "8 CCR § 10582.5"
    const ccrRegex = /8\s*CCR\s*(?:§+|section)?\s*(\d+(?:\.\d+)?)/gi;
    while ((match = ccrRegex.exec(text)) !== null) {
      const fullCcr = match[0];
      const sectionNum = match[1];

      if (this.validCcrSections.has(sectionNum)) {
        verifiedCitations.push(fullCcr);
      } else {
        findings.push({
          type: 'info',
          category: 'statute',
          message: `8 CCR § ${sectionNum} flagged for manual review against current DWC regulations.`,
          snippet: fullCcr
        });
      }
    }

    // 4. Validate Precedent citations (Navarro, Gamble/Baker, Benson, Escobedo)
    this.validPrecedents.forEach(p => {
      if (text.includes(p.name)) {
        verifiedCitations.push(`${p.name} En Banc (${p.citation})`);
      }
    });

    // 5. Check Case Consistency (if activeCaseState provided)
    if (activeCaseState) {
      if (activeCaseState.eamsNumber && !text.includes(activeCaseState.eamsNumber)) {
        findings.push({
          type: 'error',
          category: 'fact',
          message: `EAMS Case Number (${activeCaseState.eamsNumber}) missing from pleading.`,
          suggestedFix: `Include EAMS ADJ No. ${activeCaseState.eamsNumber} in caption and footer.`
        });
      }

      if (activeCaseState.applicantName && !text.toLowerCase().includes(activeCaseState.applicantName.toLowerCase())) {
        findings.push({
          type: 'error',
          category: 'fact',
          message: `Applicant Name (${activeCaseState.applicantName}) not found in document text.`,
          suggestedFix: `Ensure correct claimant party: ${activeCaseState.applicantName}`
        });
      }
    }

    const errors = findings.filter(f => f.type === 'error').length;
    const warnings = findings.filter(f => f.type === 'warning').length;
    const score = Math.max(0, 100 - (errors * 25 + warnings * 10));

    return {
      passed: errors === 0,
      score,
      findings,
      verifiedCitations
    };
  }
}

export const legalLinter = LegalLinter.getInstance();
