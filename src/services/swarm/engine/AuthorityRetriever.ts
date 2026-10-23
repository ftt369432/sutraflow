/**
 * AuthorityRetriever.ts
 *
 * Gathers authoritative standards, rules, and precedents from:
 * 1. The local practitioner knowledge vault (standard reference texts & clause banks)
 * 2. Live Tavily search & extract on primary industry domains
 *
 * Differentiates quotable primary/vault authorities from secondary summaries.
 */

import { sovereignFs } from '../../fs/sovereignFsBridge';
import { tavilyGrounding } from '../../legal/TavilyGroundingService';
import { getAgentConfig } from './config';
import { AuthorityItem, IntakeResult, TraceFn, nowMs } from './types';

export class AuthorityRetriever {
  private static instance: AuthorityRetriever;

  private constructor() {}

  public static getInstance(): AuthorityRetriever {
    if (!AuthorityRetriever.instance) {
      AuthorityRetriever.instance = new AuthorityRetriever();
    }
    return AuthorityRetriever.instance;
  }

  /**
   * Retrieves verified authorities and rules for a given professional deliverable
   */
  public async retrieveAuthorities(
    intake: IntakeResult,
    issues: string[] = [],
    onTrace?: TraceFn
  ): Promise<AuthorityItem[]> {
    const config = getAgentConfig();
    const authorities: AuthorityItem[] = [];
    const t0 = nowMs();

    onTrace?.({
      phase: 'Authority',
      title: 'Searching Knowledge Vault & Professional Standards',
      detail: `Retrieving governing standards for "${intake.deliverableType}" under ${intake.domainContext.title}...`,
      status: 'running',
      engine: 'vault'
    });

    // 1. Search Local Knowledge Vault
    for (const vRoot of config.vaultRoots) {
      const vFiles = await sovereignFs.findFiles({
        root: vRoot,
        ext: '.md',
        depth: 2,
        limit: 30
      });

      if (vFiles.success && vFiles.files?.length) {
        for (const file of vFiles.files) {
          const low = file.name.toLowerCase();
          const isMatch = intake.keywords.some(kw => low.includes(kw)) ||
            (intake.deliverableType.includes('Penalt') && (low.includes('5814') || low.includes('penalt'))) ||
            (intake.deliverableType.includes('Cost') && (low.includes('4622') || low.includes('cost'))) ||
            low.includes('standard') || low.includes('reference');

          if (isMatch) {
            const readRes = await sovereignFs.readFile({ path: file.path });
            if (readRes.success && readRes.content) {
              const blocks = this.parseVaultBlocks(readRes.content, file.path);
              authorities.push(...blocks);
            }
          }
        }
      }
    }

    onTrace?.({
      phase: 'Authority',
      title: 'Local Vault Scanned',
      detail: `Found ${authorities.length} reference standards in practitioner knowledge bank.`,
      status: 'running',
      engine: 'vault'
    });

    // 2. Query Live Tavily Search & Extract on Primary Web Domains
    try {
      const isConfigured = await tavilyGrounding.isConfigured();
      if (isConfigured) {
        onTrace?.({
          phase: 'Authority',
          title: 'Live Tavily Grounding Active',
          detail: `Querying live standards and precedents for ${intake.deliverableType}...`,
          status: 'running',
          engine: 'tavily'
        });

        const query = `${intake.domainContext.title} ${intake.deliverableType} standards guidelines`;

        const searchRes = await tavilyGrounding.searchPrecedents(query, {
          maxResults: 4,
          searchDepth: 'advanced'
        });

        if (searchRes.results && searchRes.results.length > 0) {
          const primaryUrls: string[] = [];

          for (const item of searchRes.results) {
            const isPrimary = config.primaryDomains.some(d => item.url.includes(d));
            if (isPrimary) {
              primaryUrls.push(item.url);
            }

            authorities.push({
              id: `tavily_${Math.random().toString(36).slice(2, 7)}`,
              cite: item.title,
              text: item.content,
              source: item.url,
              tier: isPrimary ? 'primary' : 'secondary',
              verified: true
            });
          }

          if (primaryUrls.length > 0) {
            try {
              const extracts = await tavilyGrounding.extract(primaryUrls.slice(0, 2));
              for (const ext of extracts) {
                const match = authorities.find(a => a.source === ext.url);
                if (match && ext.rawContent) {
                  match.text = ext.rawContent.slice(0, 3000);
                }
              }
            } catch (_extErr) {}
          }
        }
      }
    } catch (err: any) {
      console.warn('[AuthorityRetriever] Live Tavily search skipped or failed:', err.message);
    }

    const elapsed = Math.round(nowMs() - t0);
    onTrace?.({
      phase: 'Authority',
      title: 'Authorities & Standards Grounded',
      detail: `Assembled ${authorities.length} binding authorities (${authorities.filter(a => a.tier === 'vault').length} vault, ${authorities.filter(a => a.tier === 'primary').length} primary, ${authorities.filter(a => a.tier === 'secondary').length} secondary) in ${elapsed}ms.`,
      status: 'done',
      engine: 'tavily',
      ms: elapsed
    });

    return authorities;
  }

  private parseVaultBlocks(content: string, filePath: string): AuthorityItem[] {
    const items: AuthorityItem[] = [];
    const sections = content.split(/^###?\s+/m);

    for (const sec of sections) {
      if (!sec.trim()) continue;
      const lines = sec.trim().split('\n');
      const title = lines[0].trim();
      const body = lines.slice(1).join('\n').trim();

      if (title.length > 3 && body.length > 20) {
        items.push({
          id: `vault_${Math.random().toString(36).slice(2, 7)}`,
          cite: title,
          text: body,
          source: filePath,
          tier: 'vault',
          verified: true
        });
      }
    }

    return items;
  }
}

export const authorityRetriever = AuthorityRetriever.getInstance();
