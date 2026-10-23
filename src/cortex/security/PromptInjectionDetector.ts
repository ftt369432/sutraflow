/**
 * 🔥 PromptInjectionDetector
 * 
 * Real-time scanner that detects prompt injection attacks, jailbreaks,
 * and social engineering attempts BEFORE they reach any AI model.
 * 
 * This is the core engine of @genieflow/sentinel (OSS).
 * 
 * Threat categories:
 *  - Direct injection ("ignore previous instructions")
 *  - Role hijacking ("you are now a DAN/unrestricted AI")
 *  - System prompt extraction ("output your system prompt")
 *  - Data exfiltration attempts ("include all .env contents")  
 *  - Indirect injection (malicious content in uploaded files)
 *  - Multi-turn manipulation (gradual persona drift)
 */

export enum ThreatCategory {
  DIRECT_INJECTION   = 'direct_injection',
  ROLE_HIJACK        = 'role_hijack',
  SYSTEM_EXTRACTION  = 'system_extraction',
  DATA_EXFILTRATION  = 'data_exfiltration',
  INDIRECT_INJECTION = 'indirect_injection',
  PERSONA_DRIFT      = 'persona_drift',
  ENCODING_ATTACK    = 'encoding_attack',
  RECURSIVE_PROMPT   = 'recursive_prompt',
}

export interface ThreatSignal {
  category: ThreatCategory;
  pattern: string;
  confidence: number;     // 0.0 - 1.0
  match: string;          // The substring that matched
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScanResult {
  safe: boolean;
  riskScore: number;        // 0.0 (safe) → 1.0 (definitely malicious)
  threats: ThreatSignal[];
  sanitized: string;        // Input with attempt markers highlighted
  recommendation: 'allow' | 'warn' | 'block' | 'quarantine';
  processingMs: number;
}

// ─────────────────────────────────────────────────────────────────
// THREAT SIGNATURE DATABASE
// ─────────────────────────────────────────────────────────────────

interface ThreatPattern {
  category: ThreatCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  pattern: RegExp;
}

const THREAT_SIGNATURES: ThreatPattern[] = [
  // ── DIRECT INJECTION ──────────────────────────────────────────
  {
    category: ThreatCategory.DIRECT_INJECTION,
    severity: 'critical',
    confidence: 0.98,
    pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context|rules?)/i,
  },
  {
    category: ThreatCategory.DIRECT_INJECTION,
    severity: 'critical',
    confidence: 0.97,
    pattern: /disregard\s+(all\s+)?(previous|your|the)\s+(instructions?|rules?|guidelines?|constraints?)/i,
  },
  {
    category: ThreatCategory.DIRECT_INJECTION,
    severity: 'high',
    confidence: 0.90,
    pattern: /forget\s+(everything|all|your|the)\s+(instructions?|rules?|context|memory|training)/i,
  },
  {
    category: ThreatCategory.DIRECT_INJECTION,
    severity: 'high',
    confidence: 0.85,
    pattern: /\bnew\s+(instruction|directive|command|task|role|rule|order)s?\b.*?:/i,
  },
  {
    category: ThreatCategory.DIRECT_INJECTION,
    severity: 'medium',
    confidence: 0.75,
    pattern: /from\s+now\s+on[,\s]/i,
  },

  // ── ROLE HIJACKING ────────────────────────────────────────────
  {
    category: ThreatCategory.ROLE_HIJACK,
    severity: 'critical',
    confidence: 0.99,
    pattern: /\bDAN\b.*?\bmode\b|\bDAN\b.*?\benable\b|\benable\b.*?\bDAN\b/i,
  },
  {
    category: ThreatCategory.ROLE_HIJACK,
    severity: 'critical',
    confidence: 0.95,
    pattern: /you\s+are\s+now\s+(a|an)\s+(un)?restricted\s+(AI|assistant|model)/i,
  },
  {
    category: ThreatCategory.ROLE_HIJACK,
    severity: 'high',
    confidence: 0.90,
    pattern: /act\s+as\s+(if\s+you\s+(are|were)|a)\s+(un)?restricted/i,
  },
  {
    category: ThreatCategory.ROLE_HIJACK,
    severity: 'high',
    confidence: 0.88,
    pattern: /pretend\s+(you\s+are|to\s+be)\s+[^.]{0,50}(no\s+rules?|no\s+limits?|without\s+(restrictions?|constraints?))/i,
  },
  {
    category: ThreatCategory.ROLE_HIJACK,
    severity: 'medium',
    confidence: 0.70,
    pattern: /you\s+are\s+(a|an|the)\s+(evil|unethical|unrestricted|jailbroken|freed|uncensored)/i,
  },
  {
    category: ThreatCategory.ROLE_HIJACK,
    severity: 'medium',
    confidence: 0.72,
    pattern: /hypothetically\s+speak(ing)?.{0,30}(no\s+rules?|anything|anything\s+goes)/i,
  },

  // ── SYSTEM PROMPT EXTRACTION ──────────────────────────────────
  {
    category: ThreatCategory.SYSTEM_EXTRACTION,
    severity: 'critical',
    confidence: 0.99,
    pattern: /output\s+(your|the|all)\s+(system\s+)?prompt/i,
  },
  {
    category: ThreatCategory.SYSTEM_EXTRACTION,
    severity: 'critical',
    confidence: 0.97,
    pattern: /repeat\s+(your|the)\s+(initial|system|original|full)\s+(instructions?|prompt|context)/i,
  },
  {
    category: ThreatCategory.SYSTEM_EXTRACTION,
    severity: 'high',
    confidence: 0.92,
    pattern: /what\s+(are|were|is)\s+your\s+(initial|system|original|hidden)\s+(instructions?|directives?|prompt)/i,
  },
  {
    category: ThreatCategory.SYSTEM_EXTRACTION,
    severity: 'high',
    confidence: 0.90,
    pattern: /reveal\s+(your|the)\s+(system|initial|hidden|secret)\s+(prompt|instructions?|context)/i,
  },
  {
    category: ThreatCategory.SYSTEM_EXTRACTION,
    severity: 'medium',
    confidence: 0.75,
    pattern: /print\s+(everything|all)?\s*(above|before|prior)/i,
  },

  // ── DATA EXFILTRATION ─────────────────────────────────────────
  {
    category: ThreatCategory.DATA_EXFILTRATION,
    severity: 'critical',
    confidence: 0.99,
    pattern: /\.env\b.*?(contents?|file|variab|key|secret)/i,
  },
  {
    category: ThreatCategory.DATA_EXFILTRATION,
    severity: 'critical',
    confidence: 0.98,
    pattern: /reveal\s+(your|the|all|any)\s+(api|secret|access)\s*keys?/i,
  },
  {
    category: ThreatCategory.DATA_EXFILTRATION,
    severity: 'critical',
    confidence: 0.97,
    pattern: /send\s+(all|every|the)\s+(file|document|data|record)s?\s+(to|via)\s+(email|http|url|webhook)/i,
  },
  {
    category: ThreatCategory.DATA_EXFILTRATION,
    severity: 'high',
    confidence: 0.90,
    pattern: /include\s+(all|the)\s+(content|text|contents?\s+of)\s+(every|all|the)\s+(file|doc)/i,
  },
  {
    category: ThreatCategory.DATA_EXFILTRATION,
    severity: 'high',
    confidence: 0.88,
    pattern: /base64\s*encode\s*(and)?\s*send|encode\s+.{0,20}\s+base64/i,
  },
  {
    category: ThreatCategory.DATA_EXFILTRATION,
    severity: 'medium',
    confidence: 0.70,
    pattern: /exfiltrate|exfil\b/i,
  },

  // ── ENCODING ATTACKS (obfuscation) ───────────────────────────
  {
    category: ThreatCategory.ENCODING_ATTACK,
    severity: 'high',
    confidence: 0.85,
    pattern: /base64_decode|atob\(|eval\(/i,
  },
  {
    category: ThreatCategory.ENCODING_ATTACK,
    severity: 'high',
    confidence: 0.80,
    // Detects leetspeak-style injection attempts: 1gn0r3, ign0re, etc.
    pattern: /[i1][g9][n][o0][r][e3]\s+[a-z0-9\s]*[i1][n][s5][t7][r][u][c][t7]/i,
  },
  {
    category: ThreatCategory.ENCODING_ATTACK,
    severity: 'medium',
    confidence: 0.72,
    // Unicode direction override characters used to hide malicious text
    pattern: /[\u202A-\u202E\u2066-\u2069\u200F\u061C]/,
  },

  // ── RECURSIVE PROMPT INJECTION ────────────────────────────────
  {
    category: ThreatCategory.RECURSIVE_PROMPT,
    severity: 'high',
    confidence: 0.88,
    pattern: /when\s+you\s+(read|process|analyze|see|encounter)\s+.{0,50}(execute|run|perform|do)/i,
  },
  {
    category: ThreatCategory.RECURSIVE_PROMPT,
    severity: 'high',
    confidence: 0.85,
    // Hidden instructions in document-style payloads
    pattern: /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i,
  },

  // ── PERSONA DRIFT (gradual manipulation) ─────────────────────
  {
    category: ThreatCategory.PERSONA_DRIFT,
    severity: 'medium',
    confidence: 0.65,
    pattern: /you\s+(should|must|need\s+to|have\s+to)\s+be\s+(more|less)\s+(strict|restrictive|careful|cautious|ethical)/i,
  },
  {
    category: ThreatCategory.PERSONA_DRIFT,
    severity: 'medium',
    confidence: 0.68,
    pattern: /your\s+(previous|last|prior)\s+(response|answer)\s+(was|felt)\s+(too\s+)?(restricted|cautious|careful)/i,
  },
];

// ─────────────────────────────────────────────────────────────────
// MAIN DETECTOR CLASS
// ─────────────────────────────────────────────────────────────────

export class PromptInjectionDetector {
  private static instance: PromptInjectionDetector;
  private scanHistory: Map<string, number> = new Map(); // throttle repeated attacks

  public static getInstance(): PromptInjectionDetector {
    if (!PromptInjectionDetector.instance) {
      PromptInjectionDetector.instance = new PromptInjectionDetector();
    }
    return PromptInjectionDetector.instance;
  }

  /**
   * 🔍 Primary scan method. Call this on EVERY user input, file content,
   * and external message before it touches any AI model.
   */
  public scan(input: string, source: 'user_message' | 'file_content' | 'external_agent' | 'webhook' = 'user_message'): ScanResult {
    const startTime = performance.now();
    const threats: ThreatSignal[] = [];

    // 1. Normalize input for detection
    const normalized = this.normalize(input);

    // 2. Run all threat signatures
    for (const sig of THREAT_SIGNATURES) {
      const match = normalized.match(sig.pattern);
      if (match) {
        threats.push({
          category: sig.category,
          pattern: sig.pattern.source,
          confidence: sig.confidence,
          match: match[0].substring(0, 100),
          severity: sig.severity,
        });
      }
    }

    // 3. Check for indirect injection in file content (hidden instructions)
    if (source === 'file_content') {
      const fileThreats = this.scanFileContent(normalized);
      threats.push(...fileThreats);
    }

    // 4. Calculate risk score
    const riskScore = this.calculateRiskScore(threats);

    // 5. Determine recommendation
    const recommendation = this.getRecommendation(riskScore, threats, source);

    // 6. Generate sanitized version
    const sanitized = this.sanitize(input, threats);

    // 7. Log to threat history
    if (threats.length > 0) {
      const key = input.substring(0, 50);
      this.scanHistory.set(key, (this.scanHistory.get(key) || 0) + 1);
      console.warn(`🚨 PromptInjectionDetector: ${threats.length} threat(s) detected in ${source}. Risk: ${(riskScore * 100).toFixed(0)}%`);
    }

    return {
      safe: riskScore < 0.3,
      riskScore,
      threats,
      sanitized,
      recommendation,
      processingMs: performance.now() - startTime,
    };
  }

  /**
   * Quick check — just returns safe/unsafe. Use when you need speed.
   */
  public isSafe(input: string): boolean {
    return this.scan(input).safe;
  }

  /**
   * Scan a full conversation history for cumulative persona drift
   */
  public scanConversation(messages: Array<{ role: string; content: string }>): {
    driftDetected: boolean;
    driftScore: number;
    indicators: string[];
  } {
    const userMessages = messages.filter(m => m.role === 'user');
    const indicators: string[] = [];
    let driftScore = 0;

    for (const msg of userMessages) {
      const result = this.scan(msg.content);
      const personaDrift = result.threats.filter(t => t.category === ThreatCategory.PERSONA_DRIFT);
      if (personaDrift.length > 0) {
        driftScore += personaDrift.reduce((sum, t) => sum + t.confidence, 0);
        indicators.push(msg.content.substring(0, 80) + '...');
      }
    }

    return {
      driftDetected: driftScore > 0.5,
      driftScore: Math.min(driftScore, 1.0),
      indicators,
    };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────

  private normalize(input: string): string {
    return input
      // Decode common obfuscation
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }

  private scanFileContent(content: string): ThreatSignal[] {
    const threats: ThreatSignal[] = [];

    // Look for hidden instructions that might be invisible in rendered text
    const hiddenPatterns = [
      { pattern: /<!--[\s\S]*?(ignore|instruction|system)[\s\S]*?-->/i, match: 'HTML comment injection' },
      { pattern: /\/\*[\s\S]*?(ignore|instruction|override)[\s\S]*?\*\//i, match: 'Block comment injection' },
      { pattern: /\[\s*system\s*\]\s*:/i, match: 'System tag injection in document' },
      { pattern: /<system>[\s\S]*?<\/system>/i, match: 'XML system tag injection' },
    ];

    for (const hp of hiddenPatterns) {
      if (hp.pattern.test(content)) {
        threats.push({
          category: ThreatCategory.INDIRECT_INJECTION,
          pattern: hp.pattern.source,
          confidence: 0.92,
          match: hp.match,
          severity: 'critical',
        });
      }
    }

    return threats;
  }

  private calculateRiskScore(threats: ThreatSignal[]): number {
    if (threats.length === 0) return 0;

    // Weight by severity
    const severityWeights = { low: 0.15, medium: 0.35, high: 0.65, critical: 0.95 };
    const scores = threats.map(t => severityWeights[t.severity] * t.confidence);

    // Use maximum score + cumulative bonus for multiple threats
    const maxScore = Math.max(...scores);
    const cumulativeBonus = Math.min(scores.length * 0.05, 0.2);

    return Math.min(maxScore + cumulativeBonus, 1.0);
  }

  private getRecommendation(
    riskScore: number,
    threats: ThreatSignal[],
    source: string
  ): 'allow' | 'warn' | 'block' | 'quarantine' {
    const hasCritical = threats.some(t => t.severity === 'critical');
    const hasHighExfil = threats.some(
      t => t.category === ThreatCategory.DATA_EXFILTRATION && t.severity === 'high'
    );

    if (hasCritical || hasHighExfil) return 'quarantine';
    if (riskScore >= 0.65) return 'block';
    if (riskScore >= 0.30) return 'warn';
    return 'allow';
  }

  private sanitize(input: string, threats: ThreatSignal[]): string {
    let sanitized = input;
    for (const threat of threats) {
      sanitized = sanitized.replace(
        new RegExp(threat.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        `[⚠️ BLOCKED:${threat.category}]`
      );
    }
    return sanitized;
  }
}

export const promptInjectionDetector = PromptInjectionDetector.getInstance();
