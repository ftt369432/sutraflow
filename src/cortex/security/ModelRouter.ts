/**
 * 🧠 ModelRouter
 * 
 * Intent-based AI model routing. Selects the RIGHT model for each
 * cognitive task based on speed, cost, capability, and data sensitivity.
 * 
 * The current AIServiceFactory routes ALL requests to ONE provider.
 * ModelRouter adds a second axis: task type.
 * 
 * Result: Better quality, lower cost, data sovereignty compliance.
 * 
 * ┌────────────────────────────────────────────────────────────┐
 * │  Intent          │  Model            │  Reason             │
 * ├──────────────────┼───────────────────┼─────────────────────┤
 * │  deep_reasoning  │  Gemini / Claude  │  Best prose+logic   │
 * │  fast_validate   │  Groq (Llama)     │  <100ms latency     │
 * │  multimodal      │  Gemini Pro       │  Native vision      │
 * │  classify        │  Groq (Llama)     │  Speed > quality    │
 * │  embed           │  Gemini Embedding │  Cost effective     │
 * │  summarize       │  Groq (Llama)     │  Speed matters      │
 * │  code_gen        │  Gemini / Claude  │  Best code output   │
 * │  private         │  Ollama (local)   │  Data never leaves  │
 * └──────────────────┴───────────────────┴─────────────────────┘
 */

import { AIServiceFactory, SimpleAIService } from '../../services/ai/aiServiceFactory';
import { SensitivityLevel } from './DataClassifier';

export type CognitiveIntent =
  | 'deep_reasoning'     // Soul.decide, legal analysis, strategic planning
  | 'fast_validate'      // CognitiveReflector, intent classification, safety checks
  | 'multimodal'         // PDF/image/handwriting ingestion
  | 'code_generation'    // Skill creation, template building
  | 'classify'           // Domain detection, persona selection, routing decisions
  | 'embed'              // Vector generation for RAG
  | 'summarize'          // Chat history compression, mission log distillation
  | 'draft'              // Long-form writing: legal briefs, reports, proposals
  | 'private';           // Sensitive data must stay on-device

export interface RouteDecision {
  provider: string;
  intent: CognitiveIntent;
  service: SimpleAIService;
  reason: string;
  estimatedCostTier: 'free' | 'low' | 'medium' | 'high';
  supportsStreaming: boolean;
}

export interface RouteOptions {
  sensitivityOverride?: SensitivityLevel;
  forceProvider?: string;
  preferSpeed?: boolean;
  preferQuality?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// ROUTING TABLE
// ─────────────────────────────────────────────────────────────────

interface RouteConfig {
  primaryProvider: string;
  fallbackProvider: string;
  costTier: 'free' | 'low' | 'medium' | 'high';
  streaming: boolean;
  reason: string;
}

const INTENT_ROUTING_TABLE: Record<CognitiveIntent, RouteConfig> = {
  deep_reasoning: {
    primaryProvider: 'gemini',   // Upgrade to 'claude' when available
    fallbackProvider: 'groq',
    costTier: 'high',
    streaming: true,
    reason: 'Deep reasoning requires strongest model for multi-step logic and nuanced analysis',
  },
  fast_validate: {
    primaryProvider: 'groq',
    fallbackProvider: 'gemini',
    costTier: 'low',
    streaming: false,
    reason: 'Validation is a yes/no classification — speed trumps quality',
  },
  multimodal: {
    primaryProvider: 'gemini',
    fallbackProvider: 'gemini',  // No fallback — requires native multimodal
    costTier: 'medium',
    streaming: false,
    reason: 'Gemini Pro has native vision/PDF/audio understanding in one API call',
  },
  code_generation: {
    primaryProvider: 'gemini',   // Upgrade to 'claude' when available
    fallbackProvider: 'groq',
    costTier: 'high',
    streaming: true,
    reason: 'Code generation requires precise instruction-following and syntax awareness',
  },
  classify: {
    primaryProvider: 'groq',
    fallbackProvider: 'gemini',
    costTier: 'low',
    streaming: false,
    reason: 'Classification is a fast pattern-matching task — Groq/Llama excels here',
  },
  embed: {
    primaryProvider: 'gemini',
    fallbackProvider: 'gemini',
    costTier: 'free',            // Embedding API is very cheap
    streaming: false,
    reason: 'Gemini Embedding API is cost-optimized for vector generation at scale',
  },
  summarize: {
    primaryProvider: 'groq',
    fallbackProvider: 'gemini',
    costTier: 'low',
    streaming: false,
    reason: 'Summarization benefits from speed — Groq is 3-5x faster than alternatives',
  },
  draft: {
    primaryProvider: 'gemini',   // Upgrade to 'claude' for prose quality
    fallbackProvider: 'groq',
    costTier: 'high',
    streaming: true,
    reason: 'Long-form drafting requires strongest model for prose quality and coherence',
  },
  private: {
    primaryProvider: 'private',   // Ollama local model
    fallbackProvider: 'private',  // No cloud fallback for private data
    costTier: 'free',
    streaming: false,
    reason: 'CONFIDENTIAL/RESTRICTED data must never leave the user\'s device',
  },
};

// ─────────────────────────────────────────────────────────────────
// SENSITIVITY → INTENT OVERRIDE
// When data is sensitive, override to private regardless of intent
// ─────────────────────────────────────────────────────────────────

function applySensitivityOverride(
  intent: CognitiveIntent,
  level: SensitivityLevel
): CognitiveIntent {
  if (level === SensitivityLevel.CONFIDENTIAL || level === SensitivityLevel.RESTRICTED) {
    return 'private';
  }
  return intent;
}

// ─────────────────────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────────────────────

export class ModelRouter {
  private static instance: ModelRouter;

  public static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  /**
   * 🎯 Route: Get the right AI service for this intent + sensitivity combo.
   */
  public route(
    intent: CognitiveIntent,
    options: RouteOptions = {}
  ): RouteDecision {
    // 1. Apply data sensitivity override (security-first)
    const effectiveIntent = options.sensitivityOverride
      ? applySensitivityOverride(intent, options.sensitivityOverride)
      : intent;

    // 2. Apply force override (explicit provider selection)
    if (options.forceProvider) {
      const service = AIServiceFactory.getService(options.forceProvider as any);
      return {
        provider: options.forceProvider,
        intent: effectiveIntent,
        service,
        reason: `Forced override to: ${options.forceProvider}`,
        estimatedCostTier: 'medium',
        supportsStreaming: false,
      };
    }

    // 3. Look up routing table
    const config = INTENT_ROUTING_TABLE[effectiveIntent];

    // 4. Apply preference modifiers
    let selectedProvider = config.primaryProvider;

    // 🧠 Respect globally selected provider from AIServiceFactory if it differs from gemini/google
    // to prevent cascading through Gemini when the user explicitly selected Groq or Private modes
    const globalProvider = AIServiceFactory.getCurrentProvider();
    if (globalProvider && globalProvider !== 'gemini' && globalProvider !== 'google') {
      const cloudCompatibleIntents = ['deep_reasoning', 'draft', 'code_generation', 'summarize', 'classify', 'fast_validate'];
      if (cloudCompatibleIntents.includes(effectiveIntent)) {
        selectedProvider = globalProvider;
      }
    }

    if (options.preferSpeed && config.costTier === 'high') {
      // Speed preference: downgrade from high-cost to faster model
      selectedProvider = config.fallbackProvider;
    }

    // 5. Get service from factory
    const service = AIServiceFactory.getService(selectedProvider as any);

    console.log(
      `🧠 ModelRouter: ${intent}${effectiveIntent !== intent ? `→${effectiveIntent}` : ''} → ${selectedProvider} | ${config.reason} (Global: ${globalProvider})`
    );

    return {
      provider: selectedProvider,
      intent: effectiveIntent,
      service,
      reason: config.reason,
      estimatedCostTier: config.costTier,
      supportsStreaming: config.streaming,
    };
  }

  /**
   * ⚡ Quick access: just get the service, no decision object.
   */
  public getService(intent: CognitiveIntent, sensitivityLevel?: SensitivityLevel): SimpleAIService {
    return this.route(intent, {
      sensitivityOverride: sensitivityLevel,
    }).service;
  }

  /**
   * 📊 Get cost estimate for an operation before running it.
   * Useful for showing the user "This will use [high-cost] model."
   */
  public estimateCost(intent: CognitiveIntent, sensitivityLevel?: SensitivityLevel): {
    tier: 'free' | 'low' | 'medium' | 'high';
    provider: string;
    privateRequired: boolean;
  } {
    const decision = this.route(intent, { sensitivityOverride: sensitivityLevel });
    return {
      tier: decision.estimatedCostTier,
      provider: decision.provider,
      privateRequired: decision.intent === 'private',
    };
  }

  /**
   * 🧬 Auto-detect intent from a prompt string.
   * Useful when you don't know the intent at call time.
   * 
   * Examples:
   *  "Analyze the evidence and draft a legal strategy" → deep_reasoning
   *  "Is this prompt safe?" → fast_validate
   *  "Summarize this document in 3 bullet points" → summarize
   */
  public detectIntent(prompt: string): CognitiveIntent {
    const lower = prompt.toLowerCase();

    // Check for code-related tasks
    if (/\b(write code|implement|function|class|component|api|endpoint|script)\b/.test(lower)) {
      return 'code_generation';
    }

    // Check for embedding requests
    if (/\b(embed|vector|vectorize|similarity|semantic search)\b/.test(lower)) {
      return 'embed';
    }

    // Check for multimodal content
    if (/\b(image|pdf|photo|screenshot|scan|ocr|handwriting|extract from)\b/.test(lower)) {
      return 'multimodal';
    }

    // Check for summarization
    if (/\b(summarize|summary|tldr|key points|brief|condense|compress)\b/.test(lower)) {
      return 'summarize';
    }

    // Check for classification
    if (/\b(classify|categorize|detect|identify what|what type|is this)\b/.test(lower)) {
      return 'classify';
    }

    // Check for validation/safety
    if (/\b(validate|verify|check|safe|allowed|permitted|review)\b/.test(lower)) {
      return 'fast_validate';
    }

    // Check for drafting tasks
    if (/\b(draft|write|compose|create|generate|prepare)\b.*\b(letter|brief|report|proposal|petition|document|memo)\b/.test(lower)) {
      return 'draft';
    }

    // Default to deep reasoning for complex analytical tasks
    return 'deep_reasoning';
  }
}

export const modelRouter = ModelRouter.getInstance();
