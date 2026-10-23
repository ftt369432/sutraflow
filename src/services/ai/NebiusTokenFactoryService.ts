/**
 * NebiusTokenFactoryService.ts
 * 
 * First-Class Nebius Token Factory & NVIDIA Nemotron Client
 * Built for the Nebius x NVIDIA Global AI Hackathon (Devpost)
 * 
 * Features:
 * - Tiered NVIDIA Nemotron Execution:
 *   - 'nvidia/Nemotron-3-Ultra-550b-a55b' for deep statutory reasoning and 28-line legal pleadings.
 *   - 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B' for sub-second Zero-PHI triage and fast entity parsing.
 *   - 'nvidia/nemotron-3-super-120b-a12b' for balanced reasoning.
 * - Real-time streaming and token tracking.
 * - Direct authentication via Bearer API Key with Nebius Studio Cloud.
 */

import { sanitizeTokenDegeneration } from '../../utils/deliverableUnwrapper';

export interface NebiusCompletionOptions {
  model?: 'ultra' | 'nano' | 'super' | string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
  onProgress?: (status: string) => void;
}

export class NebiusTokenFactoryService {
  private static instance: NebiusTokenFactoryService;
  private baseUrl: string = 'https://api.studio.nebius.ai/v1';

  // Model catalog verified live on Nebius Token Factory
  public static readonly MODELS = {
    ULTRA: 'nvidia/Nemotron-3-Ultra-550b-a55b',
    SUPER: 'nvidia/nemotron-3-super-120b-a12b',
    NANO: 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B',
    LIGHTNING: 'nvidia/Nemotron-3_5-Lightning',
  };

  private cachedApiKey: string = '';

  private constructor() {
    this.initApiKey();
  }

  private async initApiKey(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).electronBridge?.system?.getSecret) {
        const secret = await (window as any).electronBridge.system.getSecret('NEBIUS_API_KEY');
        if (secret) {
          this.cachedApiKey = secret;
        }
      }
    } catch (_e) {
      // Non-electron environments
    }
  }

  public static getInstance(): NebiusTokenFactoryService {
    if (!NebiusTokenFactoryService.instance) {
      NebiusTokenFactoryService.instance = new NebiusTokenFactoryService();
    }
    return NebiusTokenFactoryService.instance;
  }

  /**
   * Resolves the active Nebius API key from cached IPC secret, localStorage, or environment
   */
  public getApiKey(): string {
    if (this.cachedApiKey) return this.cachedApiKey;

    const fromStorage = typeof localStorage !== 'undefined'
      ? (localStorage.getItem('genieflow_nebius_key') || localStorage.getItem('genieflow_api_key') || '')
      : '';

    const fromEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEBIUS_API_KEY)
      || (typeof process !== 'undefined' && process.env?.NEBIUS_API_KEY)
      || '';

    return fromStorage || fromEnv || '';
  }

  /**
   * Asynchronously resolves API key prioritizing Electron IPC
   */
  public async resolveApiKey(): Promise<string> {
    if (this.cachedApiKey) return this.cachedApiKey;
    if (typeof window !== 'undefined' && (window as any).electronBridge?.system?.getSecret) {
      try {
        const secret = await (window as any).electronBridge.system.getSecret('NEBIUS_API_KEY');
        if (secret) {
          this.cachedApiKey = secret;
          return secret;
        }
      } catch (_e) {}
    }
    return this.getApiKey();
  }

  /**
   * Resolves the canonical model identifier from alias
   */
  private resolveModelName(model?: string): string {
    if (!model) return NebiusTokenFactoryService.MODELS.ULTRA;
    const lower = model.toLowerCase();
    // Intercept upstream UI defaults (e.g., gemini-2.0-flash, gpt-4) and map to Nemotron Ultra
    if (lower.includes('gemini') || lower.includes('gpt') || lower.includes('claude')) {
      return NebiusTokenFactoryService.MODELS.ULTRA;
    }
    switch (lower) {
      case 'ultra':
      case 'reasoning':
        return NebiusTokenFactoryService.MODELS.ULTRA;
      case 'nano':
      case 'fast':
        return NebiusTokenFactoryService.MODELS.NANO;
      case 'super':
        return NebiusTokenFactoryService.MODELS.SUPER;
      case 'lightning':
        return NebiusTokenFactoryService.MODELS.LIGHTNING;
      default:
        if (model.includes('/') || lower.includes('nemotron')) {
          return model;
        }
        return NebiusTokenFactoryService.MODELS.ULTRA;
    }
  }

  /**
   * Checks connectivity and authentication against Nebius Token Factory
   */
  public async checkHealth(): Promise<{ online: boolean; message: string; models?: string[] }> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      return { online: false, message: 'Nebius API Key not configured.' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { online: false, message: `Nebius responded with HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      const modelIds = (data.data || []).map((m: any) => m.id);
      return {
        online: true,
        message: `Connected to Nebius Token Factory (${modelIds.length} models available)`,
        models: modelIds
      };
    } catch (err: any) {
      return { online: false, message: `Connection failed: ${err.message}` };
    }
  }

  /**
   * Core text generation over Nebius Token Factory
   */
  public async generateText(prompt: string, options: NebiusCompletionOptions = {}): Promise<string> {
    const apiKey = await this.resolveApiKey();
    if (!apiKey) {
      throw new Error('Nebius API Key is missing. Please set VITE_NEBIUS_API_KEY or configure in settings.');
    }

    const model = this.resolveModelName(options.model);
    options.onProgress?.(`Routing request to Nebius Token Factory (${model})...`);

    const isStreaming = typeof options.onToken === 'function';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for heavy 28-line legal briefs

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(options.system ? [{ role: 'system', content: options.system }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature ?? 0.2,
          frequency_penalty: options.frequencyPenalty ?? 0.35,
          presence_penalty: options.presencePenalty ?? 0.15,
          max_tokens: options.maxTokens ?? 8192,
          stream: isStreaming
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nebius Token Factory Error (${response.status}): ${errorText}`);
      }

      if (isStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';
        let isInsideReasoning = false;
        let hasClosedReasoning = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (isInsideReasoning && !hasClosedReasoning) {
              const closeTag = '\n</think>\n\n';
              fullText += closeTag;
              options.onToken?.(closeTag);
            }
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const deltaContent = parsed.choices?.[0]?.delta?.content || '';
                const deltaReasoning = parsed.choices?.[0]?.delta?.reasoning_content || parsed.choices?.[0]?.delta?.reasoning || '';

                if (deltaReasoning) {
                  if (!isInsideReasoning) {
                    isInsideReasoning = true;
                    const openTag = '<think>\n';
                    fullText += openTag;
                    options.onToken?.(openTag);
                  }
                  fullText += deltaReasoning;
                  options.onToken?.(deltaReasoning);
                }

                if (deltaContent) {
                  if (isInsideReasoning && !hasClosedReasoning) {
                    hasClosedReasoning = true;
                    isInsideReasoning = false;
                    const closeTag = '\n</think>\n\n';
                    fullText += closeTag;
                    options.onToken?.(closeTag);
                  }
                  fullText += deltaContent;
                  options.onToken?.(deltaContent);
                }
              } catch {
                // Skip parse chunks
              }
            }
          }
        }
        return sanitizeTokenDegeneration(fullText);
      }

      const data = await response.json();
      const msg = data.choices?.[0]?.message;
      const reasoning = (msg?.reasoning_content || msg?.reasoning || '').trim();
      let content = (msg?.content || '').trim();
      if (reasoning) {
        if (!content.includes('<think>')) {
          content = `<think>\n${reasoning}\n</think>\n\n${content}`;
        }
      } else if (!content) {
        content = (data.choices?.[0]?.text || '').trim();
      }
      return sanitizeTokenDegeneration(content);
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Fast Zero-PHI Scrubbing using Nemotron-3-Nano
   */
  public async scrubZeroPhi(text: string): Promise<string> {
    const systemPrompt = `You are the Zero-PHI Egress Shield. De-identify all personal identifiers (claimant full name, SSN, date of birth, personal address, phone number, specific claim numbers) and replace them with deterministic cryptographic pseudonyms (e.g., [CLAIMANT_ALPHA], [CLAIM_NUM_01], [DOB_REDACTED]). Preserve all medical findings, statutory citations, dates of service, and dollar amounts exactly. Return ONLY the sanitized text.`;
    return this.generateText(text, {
      model: 'nano',
      system: systemPrompt,
      temperature: 0.0,
      maxTokens: 4096
    });
  }

  /**
   * Deep Statutory Reasoning & 28-Line Pleading Generation using Nemotron-3-Ultra
   */
  public async generatePleading(params: {
    caption: {
      applicant: string;
      defendants: string;
      caseNumber: string;
      pleadingTitle: string;
      venue: string;
      representative: string;
    };
    statutoryBasis: string[];
    evidenceSummary: string;
    prayerForRelief: string;
    onToken?: (token: string) => void;
    onProgress?: (status: string) => void;
  }): Promise<string> {
    const systemPrompt = `You are SutraFlow's California Legal Pleading Architect running on NVIDIA Nemotron-3-Ultra via Nebius Token Factory.
Your duty is to draft an authoritative, formal 28-line format legal pleading under California Workers' Compensation law (WCAB / Labor Code).
MANDATES:
1. Exact statutory grounding (LC §§ 4600, 4603.2, 4622, 5307.1, 5814).
2. Verbatim quotations and formal legal headings.
3. Clean, court-ready 28-line legal paper layout.
4. Include exact Notice of Hearing, Statement of Facts, Legal Argument, and Prayer for Relief.`;

    const userPrompt = `DRAFT COURT-GRADE PLEADING:
VENUE: ${params.caption.venue}
APPLICANT: ${params.caption.applicant}
DEFENDANTS: ${params.caption.defendants}
CASE NO: ${params.caption.caseNumber}
TITLE OF PLEADING: ${params.caption.pleadingTitle}
REPRESENTATIVE: ${params.caption.representative}

STATUTORY BASES:
${params.statutoryBasis.map(s => `- ${s}`).join('\n')}

EVIDENCE & CHRONOLOGY:
${params.evidenceSummary}

PRAYER FOR RELIEF:
${params.prayerForRelief}

Draft the complete California 28-line legal brief now.`;

    return this.generateText(userPrompt, {
      model: 'ultra',
      system: systemPrompt,
      temperature: 0.15,
      maxTokens: 8192,
      onToken: params.onToken,
      onProgress: params.onProgress
    });
  }
}

export const nebiusTokenFactory = NebiusTokenFactoryService.getInstance();
