/**
 * QuoteGuard.ts
 *
 * Deterministic Quote Guard for Professional Deliverables.
 * Verifies that any quoted rule text, statutory provision, or numerical measurement (>= 40 chars)
 * exists verbatim in the verified authority ledger or factual record.
 */

import { AuthorityItem, Fact } from './types';

export interface QuoteCheckResult {
  passed: boolean;
  unverifiedQuotes: string[];
  cleanText: string;
}

export class QuoteGuard {
  private static instance: QuoteGuard;

  private constructor() {}

  public static getInstance(): QuoteGuard {
    if (!QuoteGuard.instance) {
      QuoteGuard.instance = new QuoteGuard();
    }
    return QuoteGuard.instance;
  }

  /**
   * Verifies quoted blocks in draft text against verified authorities and facts.
   */
  public verifyQuotes(
    draft: string,
    authorities: AuthorityItem[],
    facts: Fact[]
  ): QuoteCheckResult {
    const corpusParts: string[] = [
      ...authorities.filter(a => a.tier !== 'secondary').map(a => a.text.toLowerCase()),
      ...facts.map(f => f.fact.toLowerCase())
    ];

    const unverifiedQuotes: string[] = [];
    const quotes = this.extractQuotes(draft);

    for (const q of quotes) {
      if (q.length < 40) continue;

      const normalizedQ = this.normalize(q);
      const isGrounded = corpusParts.some(corpus => this.normalize(corpus).includes(normalizedQ));

      if (!isGrounded) {
        unverifiedQuotes.push(q);
      }
    }

    return {
      passed: unverifiedQuotes.length === 0,
      unverifiedQuotes,
      cleanText: draft
    };
  }

  private extractQuotes(text: string): string[] {
    const results: string[] = [];

    // 1. Markdown blockquotes (> ...)
    const blockquoteRegex = /^>\s+(.+)$/gm;
    let bMatch;
    while ((bMatch = blockquoteRegex.exec(text)) !== null) {
      results.push(bMatch[1].trim());
    }

    // 2. Double-quoted strings ("...")
    const quoteRegex = /"([^"\n]{40,})"/g;
    let qMatch;
    while ((qMatch = quoteRegex.exec(text)) !== null) {
      results.push(qMatch[1].trim());
    }

    return results;
  }

  private normalize(s: string): string {
    return s.toLowerCase().replace(/[\r\n\s\t]+/g, ' ').replace(/[^\w\s]/g, '').trim();
  }
}

export const quoteGuard = QuoteGuard.getInstance();
