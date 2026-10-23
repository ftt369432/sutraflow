/**
 * LLMRouter.ts
 *
 * Tiered execution router:
 * - Local GPU (Ollama / vLLM on port 11434 via Vite proxy /api/chat)
 * - Cloud Nebius (Ultra / Nano)
 * - Cloud Gemini (AIServiceFactory fallback)
 *
 * Enforces Zero-PHI/PII egress protection: scrubs sensitive identifiers before external cloud calls and restores them after.
 */

import { zeroPhiShield, PhiTokenVault } from '../legal/ZeroPhiShield';
import { nebiusTokenFactory } from '../../ai/NebiusTokenFactoryService';
import { AIServiceFactory } from '../../ai/aiServiceFactory';
import { EngineLabel, nowMs, TraceFn } from './types';

export interface LLMRequest {
  prompt: string;
  system?: string;
  tier: 'fast' | 'reasoning';
  temperature?: number;
  maxTokens?: number;
  onToken?: (t: string) => void;
}

export interface LLMResponse {
  text: string;
  engine: EngineLabel;
  elapsedMs: number;
}

function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${endpoint}`;
  }
  return `http://localhost:3000${endpoint}`;
}

export class LLMRouter {
  private static instance: LLMRouter;
  private localAvailable: boolean | null = null;
  private lastHealthCheck = 0;

  private constructor() {}

  public static getInstance(): LLMRouter {
    if (!LLMRouter.instance) {
      LLMRouter.instance = new LLMRouter();
    }
    return LLMRouter.instance;
  }

  /**
   * Quick check if local Ollama/vLLM daemon is reachable on /api/tags
   */
  public async checkLocalHealth(): Promise<boolean> {
    const now = Date.now();
    // Cache local status for 30s if healthy, or 5 minutes if unavailable
    const cacheDuration = this.localAvailable === false ? 300000 : 30000;
    if (this.localAvailable !== null && now - this.lastHealthCheck < cacheDuration) {
      return this.localAvailable;
    }

    try {
      const res = await fetch(getApiUrl('/api/tags'), {
        method: 'GET',
        signal: AbortSignal.timeout(1500)
      });
      this.localAvailable = res.ok;
    } catch (_e) {
      this.localAvailable = false;
    }
    this.lastHealthCheck = now;
    return this.localAvailable;
  }

  /**
   * Main completion entry point with automatic Zero-PHI handling and tier routing.
   */
  public async complete(
    req: LLMRequest,
    sharedVault: PhiTokenVault,
    onTrace?: TraceFn
  ): Promise<LLMResponse> {
    const t0 = nowMs();
    const isLocal = await this.checkLocalHealth();

    // 1. Local execution if available
    if (isLocal) {
      try {
        const localRes = await this.callLocal(req);
        const elapsedMs = Math.round(nowMs() - t0);
        onTrace?.({
          phase: 'Inference',
          title: `Local GPU Generation (${req.tier})`,
          detail: `Generated ${localRes.length} chars in ${elapsedMs}ms via local daemon`,
          status: 'done',
          engine: 'local-gpu',
          ms: elapsedMs
        });
        return { text: localRes, engine: 'local-gpu', elapsedMs };
      } catch (err: any) {
        console.warn('[LLMRouter] Local inference failed, escalating to cloud:', err.message);
        this.localAvailable = false;
        this.lastHealthCheck = Date.now();
        onTrace?.({
          phase: 'Inference',
          title: 'Local GPU Offline / Error',
          detail: `Local daemon error: ${err.message}. Escalating to Sovereign Cloud with Zero-PHI shielding.`,
          status: 'warn',
          engine: 'local-gpu'
        });
      }
    }

    // 2. Cloud Execution: Apply Zero-PHI Scrubbing
    const scrubbedPrompt = this.scrubWithVault(req.prompt, sharedVault);
    const scrubbedSystem = req.system ? this.scrubWithVault(req.system, sharedVault) : undefined;

    // Check Nebius availability
    const nebiusKey = nebiusTokenFactory.getApiKey();
    if (nebiusKey) {
      const model = req.tier === 'reasoning' ? 'ultra' : 'nano';
      const engineLabel: EngineLabel = req.tier === 'reasoning' ? 'nebius-ultra' : 'nebius-nano';
      try {
        const cloudText = await nebiusTokenFactory.generateText(scrubbedPrompt, {
          model,
          system: scrubbedSystem,
          temperature: req.temperature ?? 0.2,
          maxTokens: req.maxTokens,
          onToken: req.onToken
        });

        // Restore PHI from vault
        const restoredText = zeroPhiShield.restore(cloudText, sharedVault);
        const elapsedMs = Math.round(nowMs() - t0);

        onTrace?.({
          phase: 'Inference',
          title: `Nebius Sovereign (${model})`,
          detail: `Generated ${restoredText.length} chars in ${elapsedMs}ms with Zero-PHI de-identification.`,
          status: 'done',
          engine: engineLabel,
          ms: elapsedMs
        });

        return { text: restoredText, engine: engineLabel, elapsedMs };
      } catch (err: any) {
        console.warn(`[LLMRouter] Nebius (${model}) failed, falling back to Gemini:`, err.message);
      }
    }

    // 3. Fallback to Gemini via AIServiceFactory
    try {
      const ai = AIServiceFactory.getInstance('gemini');
      const combined = scrubbedSystem ? `${scrubbedSystem}\n\n${scrubbedPrompt}` : scrubbedPrompt;
      const geminiText = await ai.generateText(combined, {
        temperature: req.temperature ?? 0.2
      });

      const restoredText = zeroPhiShield.restore(geminiText, sharedVault);
      const elapsedMs = Math.round(nowMs() - t0);

      onTrace?.({
        phase: 'Inference',
        title: 'Gemini Sovereign Fallback',
        detail: `Generated ${restoredText.length} chars in ${elapsedMs}ms with Zero-PHI de-identification.`,
        status: 'done',
        engine: 'gemini',
        ms: elapsedMs
      });

      return { text: restoredText, engine: 'gemini', elapsedMs };
    } catch (err: any) {
      throw new Error(`All LLM execution tiers failed: ${err.message}`);
    }
  }

  private async callLocal(req: LLMRequest): Promise<string> {
    const res = await fetch(getApiUrl('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [
          ...(req.system ? [{ role: 'system', content: req.system }] : []),
          { role: 'user', content: req.prompt }
        ],
        stream: false,
        options: {
          temperature: req.temperature ?? 0.2,
          num_ctx: 4096
        }
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return data.message?.content || data.response || '';
  }

  private scrubWithVault(text: string, vault: PhiTokenVault): string {
    const res = zeroPhiShield.scrub(text);
    res.vault.replacements.forEach((orig, tok) => vault.replacements.set(tok, orig));
    res.vault.reverseReplacements.forEach((tok, orig) => vault.reverseReplacements.set(orig, tok));
    return res.scrubbedText;
  }
}

export const llmRouter = LLMRouter.getInstance();
