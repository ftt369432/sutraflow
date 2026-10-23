/**
 * 🔮 DataClassifier
 * 
 * Classifies data sensitivity BEFORE it enters any AI model or
 * crosses any network boundary. Routes content to the appropriate
 * model tier based on what it contains.
 * 
 * Classification levels (NIST-aligned):
 *  - PUBLIC:       Can go to any cloud model
 *  - INTERNAL:     Cloud OK, no logging, no training
 *  - CONFIDENTIAL: Private/on-prem model only
 *  - RESTRICTED:   BLOCK — must not enter any prompt
 * 
 * Also performs: PII detection, PHI detection, key/secret detection.
 */

export enum SensitivityLevel {
  PUBLIC       = 'public',        // Free to use any model
  INTERNAL     = 'internal',      // Cloud OK, no data retention
  CONFIDENTIAL = 'confidential',  // Private model only (Ollama)
  RESTRICTED   = 'restricted',    // BLOCK — never enters any prompt
}

export enum PIIType {
  SSN                 = 'ssn',
  CREDIT_CARD         = 'credit_card',
  BANK_ACCOUNT        = 'bank_account',
  PASSPORT            = 'passport',
  DRIVERS_LICENSE     = 'drivers_license',
  API_KEY             = 'api_key',
  PRIVATE_KEY         = 'private_key',
  DATE_OF_BIRTH       = 'date_of_birth',
  PHONE               = 'phone',
  EMAIL               = 'email',
  IP_ADDRESS          = 'ip_address',
  MEDICAL_RECORD      = 'medical_record',
  DIAGNOSIS           = 'diagnosis',
  MEDICATION          = 'medication',
  INSURANCE_ID        = 'insurance_id',
  ATTORNEY_WORK       = 'attorney_work_product',
  CASE_NUMBER         = 'case_number',
}

export interface DetectedPII {
  type: PIIType;
  pattern: string;
  positions: number[];     // Character offsets in original text
  count: number;
  redacted: string;        // What to replace it with
}

export interface ClassificationResult {
  level: SensitivityLevel;
  piiDetected: DetectedPII[];
  recommendedModel: 'any' | 'cloud_no_log' | 'private' | 'block';
  redactedText: string;    // Safe version with PII replaced
  reasons: string[];       // Human-readable explanation
  complianceFlags: string[]; // HIPAA, GDPR, SOC-2, attorney-client, etc.
}

// ─────────────────────────────────────────────────────────────────
// PII DETECTION PATTERNS
// ─────────────────────────────────────────────────────────────────

interface PIIPattern {
  type: PIIType;
  pattern: RegExp;
  level: SensitivityLevel; // Minimum sensitivity when found
  redactedLabel: string;
  compliance: string[];
}

const PII_PATTERNS: PIIPattern[] = [
  // ── RESTRICTED (NEVER enter any AI prompt) ────────────────────
  {
    type: PIIType.API_KEY,
    pattern: /\b(sk-[a-zA-Z0-9]{20,}|pk_[a-zA-Z0-9]{20,}|Bearer\s+[a-zA-Z0-9\-._~+/]+=*)/g,
    level: SensitivityLevel.RESTRICTED,
    redactedLabel: '[API_KEY]',
    compliance: ['SOC-2', 'CWE-312'],
  },
  {
    type: PIIType.PRIVATE_KEY,
    pattern: /-----BEGIN\s+(RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+.*?KEY-----/g,
    level: SensitivityLevel.RESTRICTED,
    redactedLabel: '[PRIVATE_KEY]',
    compliance: ['SOC-2', 'CWE-321'],
  },
  {
    type: PIIType.SSN,
    pattern: /\b(?!000|666|9\d\d)\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g,
    level: SensitivityLevel.RESTRICTED,
    redactedLabel: '[SSN]',
    compliance: ['HIPAA', 'GDPR', 'CCPA'],
  },
  {
    type: PIIType.CREDIT_CARD,
    // Luhn-adjacent: 13-19 digit sequences with common credit card prefixes
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    level: SensitivityLevel.RESTRICTED,
    redactedLabel: '[CREDIT_CARD]',
    compliance: ['PCI-DSS', 'GDPR'],
  },
  {
    type: PIIType.BANK_ACCOUNT,
    pattern: /\b(account\s*(?:#|number|num|no\.?)\s*:?\s*\d{8,17}|\bIBAN\b\s*:?\s*[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16})\b/gi,
    level: SensitivityLevel.RESTRICTED,
    redactedLabel: '[BANK_ACCOUNT]',
    compliance: ['PCI-DSS', 'SOX', 'GDPR'],
  },

  // ── CONFIDENTIAL (Private model only) ─────────────────────────
  {
    type: PIIType.MEDICAL_RECORD,
    pattern: /\b(MRN|medical\s+record\s+(number|#|no\.?))\s*:?\s*([A-Z]?\d{5,10})\b/gi,
    level: SensitivityLevel.CONFIDENTIAL,
    redactedLabel: '[MEDICAL_RECORD_NUM]',
    compliance: ['HIPAA', 'PHI'],
  },
  {
    type: PIIType.DIAGNOSIS,
    // ICD-10 codes like F41.1, Z23, M54.5, etc.
    pattern: /\bICD[-–]?10?\s*:?\s*[A-Z]\d{2}\.?\d{0,4}\b|\bdiagnosis\s*:?\s*[A-Z][^.\n]{5,60}/gi,
    level: SensitivityLevel.CONFIDENTIAL,
    redactedLabel: '[DIAGNOSIS]',
    compliance: ['HIPAA', 'PHI'],
  },
  {
    type: PIIType.MEDICATION,
    pattern: /\b(prescribed|medication|Rx|dosage)\s*:?\s*[A-Z][a-z]+\s+\d+\s?mg\b/gi,
    level: SensitivityLevel.CONFIDENTIAL,
    redactedLabel: '[MEDICATION]',
    compliance: ['HIPAA', 'PHI'],
  },
  {
    type: PIIType.INSURANCE_ID,
    pattern: /\b(insurance\s+(id|#|policy)\s*:?\s*[A-Z0-9\-]{6,20}|policy\s+number\s*:?\s*[A-Z0-9\-]{6,20})\b/gi,
    level: SensitivityLevel.CONFIDENTIAL,
    redactedLabel: '[INSURANCE_ID]',
    compliance: ['HIPAA', 'PHI'],
  },
  {
    type: PIIType.ATTORNEY_WORK,
    pattern: /\b(attorney.?client\s+privilege|privileged\s+and\s+confidential|work\s+product\s+doctrine|attorney\s+work\s+product)\b/gi,
    level: SensitivityLevel.CONFIDENTIAL,
    redactedLabel: '[PRIVILEGED_CONTENT]',
    compliance: ['ABA-Model-Rules', 'State-Bar'],
  },
  {
    type: PIIType.PASSPORT,
    pattern: /\b([A-Z]{1,2}\d{6,9})\b(?=.*\b(passport|travel\s+doc)\b)/gi,
    level: SensitivityLevel.CONFIDENTIAL,
    redactedLabel: '[PASSPORT_NUM]',
    compliance: ['GDPR', 'CCPA'],
  },

  // ── INTERNAL (Cloud OK, no logging) ──────────────────────────
  {
    type: PIIType.DATE_OF_BIRTH,
    pattern: /\b(DOB|date\s+of\s+birth|born\s+on)\s*:?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
    level: SensitivityLevel.INTERNAL,
    redactedLabel: '[DATE_OF_BIRTH]',
    compliance: ['HIPAA', 'GDPR'],
  },
  {
    type: PIIType.CASE_NUMBER,
    pattern: /\b(case\s*(?:#|number|no\.?)\s*:?\s*[A-Z0-9\-]{4,20})\b/gi,
    level: SensitivityLevel.INTERNAL,
    redactedLabel: '[CASE_NUMBER]',
    compliance: ['COURT-RULES'],
  },
  {
    type: PIIType.PHONE,
    pattern: /\b(\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    level: SensitivityLevel.INTERNAL,
    redactedLabel: '[PHONE]',
    compliance: ['CCPA', 'GDPR'],
  },
  {
    type: PIIType.EMAIL,
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/g,
    level: SensitivityLevel.INTERNAL,
    redactedLabel: '[EMAIL]',
    compliance: ['CAN-SPAM', 'GDPR', 'CCPA'],
  },
  {
    type: PIIType.IP_ADDRESS,
    pattern: /\b(?!10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)(?:\d{1,3}\.){3}\d{1,3}\b/g,
    level: SensitivityLevel.INTERNAL,
    redactedLabel: '[IP_ADDRESS]',
    compliance: ['GDPR'],
  },
];

// ─────────────────────────────────────────────────────────────────
// KEYWORD-BASED DOMAIN CLASSIFIERS
// ─────────────────────────────────────────────────────────────────

const DOMAIN_CLASSIFIERS: Array<{
  keywords: RegExp;
  minLevel: SensitivityLevel;
  compliance: string[];
  reason: string;
}> = [
  {
    keywords: /\b(HIPAA|PHI|protected\s+health|medical\s+record|patient\s+(data|info|name|id))\b/i,
    minLevel: SensitivityLevel.CONFIDENTIAL,
    compliance: ['HIPAA'],
    reason: 'Document contains HIPAA-covered health information',
  },
  {
    keywords: /\b(attorney.?client|privilege(d)?|work\s+product|legal\s+advice|in\s+camera)\b/i,
    minLevel: SensitivityLevel.CONFIDENTIAL,
    compliance: ['ABA-Model-Rules'],
    reason: 'Document may contain attorney-client privileged communication',
  },
  {
    keywords: /\b(classified|top\s+secret|secret\s+\/\/|confidential\s*\/\/|CUI|FOUO)\b/i,
    minLevel: SensitivityLevel.RESTRICTED,
    compliance: ['32-CFR-2001', 'EO-13526'],
    reason: 'Document contains government classification markings',
  },
  {
    keywords: /\b(GDPR|data\s+subject|right\s+to\s+erasure|personal\s+data\s+breach)\b/i,
    minLevel: SensitivityLevel.INTERNAL,
    compliance: ['GDPR'],
    reason: 'Document references GDPR-regulated personal data',
  },
];

// ─────────────────────────────────────────────────────────────────
// MAIN CLASSIFIER
// ─────────────────────────────────────────────────────────────────

export class DataClassifier {
  private static instance: DataClassifier;

  public static getInstance(): DataClassifier {
    if (!DataClassifier.instance) {
      DataClassifier.instance = new DataClassifier();
    }
    return DataClassifier.instance;
  }

  /**
   * 🔍 Classify text and return sensitivity level + detected PII.
   * Call this before sending ANY content to an AI model.
   */
  public classify(text: string): ClassificationResult {
    const piiDetected: DetectedPII[] = [];
    const reasons: string[] = [];
    const complianceFlags = new Set<string>();
    let highestLevel = SensitivityLevel.PUBLIC;
    let redactedText = text;

    // 1. Run PII pattern detection
    for (const piip of PII_PATTERNS) {
      const matches: number[] = [];
      let match: RegExpExecArray | null;
      const regex = new RegExp(piip.pattern.source, piip.pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        matches.push(match.index);
      }

      if (matches.length > 0) {
        piiDetected.push({
          type: piip.type,
          pattern: piip.pattern.source,
          positions: matches,
          count: matches.length,
          redacted: piip.redactedLabel,
        });

        // Elevate sensitivity level
        highestLevel = this.elevate(highestLevel, piip.level);

        // Add compliance flags
        piip.compliance.forEach(c => complianceFlags.add(c));
        reasons.push(`Found ${piip.type}: ${matches.length} occurrence(s)`);

        // Perform redaction
        redactedText = redactedText.replace(new RegExp(piip.pattern.source, piip.pattern.flags), piip.redactedLabel);
      }
    }

    // 2. Run domain keyword classifiers
    for (const dc of DOMAIN_CLASSIFIERS) {
      if (dc.keywords.test(text)) {
        highestLevel = this.elevate(highestLevel, dc.minLevel);
        dc.compliance.forEach(c => complianceFlags.add(c));
        reasons.push(dc.reason);
      }
    }

    // 3. Determine recommended model
    const recommendedModel = this.getModelRecommendation(highestLevel);

    return {
      level: highestLevel,
      piiDetected,
      recommendedModel,
      redactedText,
      reasons,
      complianceFlags: Array.from(complianceFlags),
    };
  }

  /**
   * Quick check — just returns the sensitivity level.
   */
  public getLevel(text: string): SensitivityLevel {
    return this.classify(text).level;
  }

  /**
   * Returns just the redacted text. Safe to log.
   */
  public redact(text: string): string {
    return this.classify(text).redactedText;
  }

  /**
   * Bulk classify an array of strings (e.g., documents in a drive folder).
   * Returns items sorted by sensitivity (restricted first).
   */
  public bulkClassify(items: Array<{ id: string; text: string }>): Array<{
    id: string;
    level: SensitivityLevel;
    piiTypes: PIIType[];
  }> {
    return items
      .map(item => {
        const result = this.classify(item.text);
        return {
          id: item.id,
          level: result.level,
          piiTypes: result.piiDetected.map(p => p.type),
        };
      })
      .sort((a, b) => {
        const order = [
          SensitivityLevel.RESTRICTED,
          SensitivityLevel.CONFIDENTIAL,
          SensitivityLevel.INTERNAL,
          SensitivityLevel.PUBLIC,
        ];
        return order.indexOf(a.level) - order.indexOf(b.level);
      });
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────

  private elevate(current: SensitivityLevel, candidate: SensitivityLevel): SensitivityLevel {
    const order = [
      SensitivityLevel.PUBLIC,
      SensitivityLevel.INTERNAL,
      SensitivityLevel.CONFIDENTIAL,
      SensitivityLevel.RESTRICTED,
    ];
    return order.indexOf(candidate) > order.indexOf(current) ? candidate : current;
  }

  private getModelRecommendation(level: SensitivityLevel): 'any' | 'cloud_no_log' | 'private' | 'block' {
    switch (level) {
      case SensitivityLevel.PUBLIC:       return 'any';
      case SensitivityLevel.INTERNAL:     return 'cloud_no_log';
      case SensitivityLevel.CONFIDENTIAL: return 'private';
      case SensitivityLevel.RESTRICTED:   return 'block';
    }
  }
}

export const dataClassifier = DataClassifier.getInstance();
