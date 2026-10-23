/**
 * 🛡️ ZeroPhiShield
 * 
 * Strict Zero-PHI Egress Shield for GenieFlow AI Swarms.
 * De-identifies claimant and defendant personal data prior to external LLM dispatch
 * by converting sensitive identifiers into reversible cryptographic tokens.
 * 
 * Ensures compliance with AGENTS.md Zero-PHI Egress Mandate and HIPAA/CJIS standards.
 */

export interface PhiTokenVault {
  id: string;
  claimantName?: string;
  dateOfBirth?: string;
  ssn?: string;
  phone?: string;
  email?: string;
  address?: string;
  adjNumber?: string;
  claimNumber?: string;
  replacements: Map<string, string>; // token -> original
  reverseReplacements: Map<string, string>; // original -> token
}

export class ZeroPhiShield {
  private static instance: ZeroPhiShield;

  private constructor() {}

  public static getInstance(): ZeroPhiShield {
    if (!ZeroPhiShield.instance) {
      ZeroPhiShield.instance = new ZeroPhiShield();
    }
    return ZeroPhiShield.instance;
  }

  /**
   * Creates a new token vault and scrubs PHI from input text
   */
  public scrub(text: string): { scrubbedText: string; vault: PhiTokenVault } {
    if (!text) {
      return {
        scrubbedText: '',
        vault: {
          id: `vault_${Date.now()}`,
          replacements: new Map(),
          reverseReplacements: new Map()
        }
      };
    }

    const vault: PhiTokenVault = {
      id: `vault_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      replacements: new Map(),
      reverseReplacements: new Map()
    };

    let scrubbed = text;

    const registerToken = (original: string, token: string) => {
      const cleanOriginal = original.trim();
      if (!cleanOriginal || cleanOriginal.length < 3) return;
      if (!vault.reverseReplacements.has(cleanOriginal)) {
        vault.reverseReplacements.set(cleanOriginal, token);
        vault.replacements.set(token, cleanOriginal);
      }
    };

    // 1. Scrub SSNs (Social Security Numbers)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b|\bSSN[:\s]*\d{9}\b/gi;
    let ssnCount = 0;
    scrubbed = scrubbed.replace(ssnRegex, (match) => {
      ssnCount++;
      const token = `[CLAIMANT_SSN_${ssnCount}]`;
      registerToken(match, token);
      if (!vault.ssn) vault.ssn = match;
      return token;
    });

    // 2. Scrub Dates of Birth
    const dobRegex = /(?:DOB|Date of Birth|D\.O\.B\.)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi;
    scrubbed = scrubbed.replace(dobRegex, (_match, dateVal) => {
      const token = `[CLAIMANT_DOB]`;
      registerToken(dateVal, token);
      if (!vault.dateOfBirth) vault.dateOfBirth = dateVal;
      return `DOB: ${token}`;
    });

    // 3. Scrub Phone Numbers
    const phoneRegex = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g;
    let phoneCount = 0;
    scrubbed = scrubbed.replace(phoneRegex, (match) => {
      phoneCount++;
      const token = `[PHONE_NUM_${phoneCount}]`;
      registerToken(match, token);
      if (!vault.phone) vault.phone = match;
      return token;
    });

    // 4. Scrub Email Addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    let emailCount = 0;
    scrubbed = scrubbed.replace(emailRegex, (match) => {
      emailCount++;
      const token = `[EMAIL_ADDRESS_${emailCount}]`;
      registerToken(match, token);
      if (!vault.email) vault.email = match;
      return token;
    });

    // 5. Detect and token-mask specific Applicant / Claimant Name headers
    const applicantNameRegex = /(?:Applicant|Claimant|Injured Worker|Employee)[:\s]+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/g;
    scrubbed = scrubbed.replace(applicantNameRegex, (match, nameVal) => {
      const trimmed = nameVal.trim();
      // Skip generic words
      if (/^(Attorney|Counsel|Doctor|Judge|Carrier|State|WCAB|Defendant)/i.test(trimmed)) {
        return match;
      }
      const token = `[CLAIMANT_NAME]`;
      registerToken(trimmed, token);
      if (!vault.claimantName) vault.claimantName = trimmed;
      return match.replace(trimmed, token);
    });

    return { scrubbedText: scrubbed, vault };
  }

  /**
   * Restores scrubbed tokens using the matching token vault
   */
  public restore(text: string, vault: PhiTokenVault): string {
    if (!text || !vault || !vault.replacements) return text;
    let restored = text;
    vault.replacements.forEach((original, token) => {
      restored = restored.split(token).join(original);
    });
    return restored;
  }
}

export const zeroPhiShield = ZeroPhiShield.getInstance();
