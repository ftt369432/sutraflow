/**
 * 🛡️ @genieflow/sentinel
 * 
 * The Sovereign Security Layer for AI Agents.
 * 
 * Three commands. Total protection.
 * 
 * ```typescript
 * import { sentinel } from '@genieflow/sentinel';
 * 
 * // 1. Scan user input for prompt injection
 * const scan = sentinel.scan(userInput);
 * if (!scan.safe) throw new Error('Blocked: ' + scan.threats[0].category);
 * 
 * // 2. Classify data sensitivity before sending to AI
 * const classification = sentinel.classify(documentContent);
 * const service = modelRouter.getService('deep_reasoning', classification.level);
 * 
 * // 3. Issue agent passport before any autonomous action
 * const passport = await sentinel.issuePassport('legal-agent', ['read:files', 'write:files']);
 * await skillExecutor.execute(intention, passport);
 * ```
 * 
 * ─────────────────────────────────────────────────────────────────
 * OPEN SOURCE CORE  (MIT License)
 * ─────────────────────────────────────────────────────────────────
 * This package is the OSS layer of GenieGateway Cloud.
 * The full managed platform (audit dashboard, model routing,
 * enterprise compliance reports) is at geniegateway.io
 * ─────────────────────────────────────────────────────────────────
 */

export { PromptInjectionDetector, promptInjectionDetector } from './PromptInjectionDetector';
export { DataClassifier, dataClassifier, SensitivityLevel, PIIType } from './DataClassifier';
export { AgentPassportService, agentPassportService } from './AgentPassport';
export { ModelRouter, modelRouter } from './ModelRouter';
export type {
  ScanResult,
  ThreatSignal,
  ThreatCategory,
} from './PromptInjectionDetector';
export type {
  ClassificationResult,
  DetectedPII,
} from './DataClassifier';
export type {
  AgentPassport,
  AgentIdentity,
  AgentPermission,
  AgentTier,
  PassportVerificationResult,
} from './AgentPassport';
export type {
  CognitiveIntent,
  RouteDecision,
  RouteOptions,
} from './ModelRouter';

import { promptInjectionDetector } from './PromptInjectionDetector';
import { dataClassifier } from './DataClassifier';
import { agentPassportService } from './AgentPassport';
import { modelRouter } from './ModelRouter';
import type { AgentPermission } from './AgentPassport';
import type { ScanResult } from './PromptInjectionDetector';
import type { ClassificationResult } from './DataClassifier';

/**
 * 🛡️ The unified sentinel interface.
 * One import, total coverage.
 */
export const sentinel = {
  /**
   * Scan input for prompt injection attacks.
   * Call this on EVERY user input, file content, and external message.
   */
  scan(
    input: string,
    source: 'user_message' | 'file_content' | 'external_agent' | 'webhook' = 'user_message'
  ): ScanResult {
    return promptInjectionDetector.scan(input, source);
  },

  /**
   * Classify data sensitivity.
   * Call this before sending content to any AI model.
   */
  classify(text: string): ClassificationResult {
    return dataClassifier.classify(text);
  },

  /**
   * Quick redact — safe version of text for logging.
   */
  redact(text: string): string {
    return dataClassifier.redact(text);
  },

  /**
   * Issue a cryptographic passport to an agent.
   * Required before any autonomous action execution.
   */
  async issuePassport(
    agentId: string,
    permissions: AgentPermission[],
    options: {
      ttlSeconds?: number;
      missionId?: string;
      caseId?: string;
    } = {}
  ) {
    return agentPassportService.issue(agentId, permissions, {
      ...options,
      issuedByCoreSystem: true,
    });
  },

  /**
   * Verify an agent passport is authentic and not expired.
   */
  async verifyPassport(passport: any) {
    return agentPassportService.verify(passport);
  },

  /**
   * Get the right AI model for a cognitive task.
   */
  router: modelRouter,

  /**
   * Comprehensive security check — scan + classify in one call.
   * Returns everything you need to make a go/no-go decision.
   */
  async inspect(input: string, source: 'user_message' | 'file_content' | 'external_agent' | 'webhook' = 'user_message') {
    const [scanResult, classification] = [
      promptInjectionDetector.scan(input, source),
      dataClassifier.classify(input),
    ];

    const blocked = !scanResult.safe || classification.level === 'restricted';
    const requiresPrivateModel = classification.recommendedModel === 'private' || classification.recommendedModel === 'block';

    return {
      blocked,
      scan: scanResult,
      classification,
      requiresPrivateModel,
      summary: blocked
        ? `❌ BLOCKED: ${scanResult.threats.length} injection threat(s), sensitivity: ${classification.level}`
        : `✅ SAFE: Risk ${(scanResult.riskScore * 100).toFixed(0)}%, sensitivity: ${classification.level}`,
    };
  },
};
