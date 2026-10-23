/**
 * 🛡️ Cortex Guardrails — Hardened Edition
 *
 * The safety layer that strictly enforces permissions for autonomous actions.
 * Now integrated with the full Sentinel security stack:
 *  - Prompt injection detection (30+ threat signatures)
 *  - Data sensitivity classification (HIPAA, GDPR, PCI-DSS aware)
 *  - Model routing recommendations
 *
 * Every action must pass through this layer before execution.
 */

import { promptInjectionDetector } from './security/PromptInjectionDetector';
import { dataClassifier, SensitivityLevel } from './security/DataClassifier';
import { modelRouter, CognitiveIntent } from './security/ModelRouter';

export { SensitivityLevel };

export enum SafetyLevel {
    SAFE      = 'SAFE',
    SENSITIVE = 'SENSITIVE',
    FORBIDDEN = 'FORBIDDEN'
}

export interface Policy {
    level: SafetyLevel;
    reason: string;
    injectionDetected?: boolean;
    dataLevel?: SensitivityLevel;
    recommendedModel?: string;
    threats?: string[];
}

export class Guardrails {

    /**
     * 🔍 Full security check on any incoming user text.
     * Call this on user messages, file contents, external webhooks.
     */
    static scanInput(
        input: string,
        source: 'user_message' | 'file_content' | 'external_agent' | 'webhook' = 'user_message'
    ): Policy {
        const injectionResult = promptInjectionDetector.scan(input, source);

        if (injectionResult.recommendation === 'quarantine' || injectionResult.recommendation === 'block') {
            const topThreat = injectionResult.threats[0];
            console.error(`🛡️ GUARDRAILS: Prompt injection BLOCKED. Category: ${topThreat?.category}`);
            return {
                level: SafetyLevel.FORBIDDEN,
                reason: `Prompt injection detected: ${topThreat?.category}`,
                injectionDetected: true,
                threats: injectionResult.threats.map(t => t.category),
            };
        }

        const classification = dataClassifier.classify(input);

        if (classification.level === SensitivityLevel.RESTRICTED) {
            return {
                level: SafetyLevel.FORBIDDEN,
                reason: `RESTRICTED content: ${classification.reasons.join('; ')}`,
                dataLevel: classification.level,
                threats: classification.complianceFlags,
            };
        }

        return {
            level: SafetyLevel.SAFE,
            reason: `Input cleared. Sensitivity: ${classification.level}`,
            injectionDetected: false,
            dataLevel: classification.level,
            recommendedModel: classification.recommendedModel,
        };
    }

    /**
     * ⚙️ Validate an intended action against the safety policy.
     */
    static check(action: string, payload: any): Policy {
        const act = action.toUpperCase();

        // 🔴 FORBIDDEN — critical files
        if (act === 'DELETE_FILE' && (
            payload.path?.includes('.env') ||
            payload.path?.includes('package.json') ||
            payload.path?.includes('.ssh')
        )) {
            return { level: SafetyLevel.FORBIDDEN, reason: 'Cannot delete critical system or credential files' };
        }

        // 🔴 FORBIDDEN — reading credentials
        if (act === 'READ_FILE' && (
            payload.path?.includes('.env') ||
            payload.path?.endsWith('.pem') ||
            payload.path?.endsWith('.key') ||
            payload.path?.includes('id_rsa')
        )) {
            return { level: SafetyLevel.FORBIDDEN, reason: 'Cannot read credential or private key files' };
        }

        // 🔴 FORBIDDEN — destructive shell commands
        if (act === 'RUN_COMMAND' && payload.command) {
            const cmd = payload.command.toLowerCase();
            if (/rm\s+-rf|curl\s+.*\|\s*bash|wget\s+.*\|\s*sh/.test(cmd)) {
                return { level: SafetyLevel.FORBIDDEN, reason: 'Destructive shell command blocked' };
            }
        }

        // 🟢 SAFE
        if (['READ_FILE', 'LIST_FILES', 'SEARCH_KNOWLEDGE', 'THINK', 'PLAN', 'BROWSER_SNAPSHOT'].includes(act)) {
            return { level: SafetyLevel.SAFE, reason: 'Read-only or internal operation' };
        }

        // 🟠 SENSITIVE
        if (['WRITE_FILE', 'SEND_MESSAGE', 'RUN_COMMAND', 'DELETE_FILE', 'SEND_EMAIL', 'BROWSER_NAVIGATE'].includes(act)) {
            return { level: SafetyLevel.SENSITIVE, reason: 'Modifies external state or sends data' };
        }

        return { level: SafetyLevel.SENSITIVE, reason: 'Unknown action type requires approval' };
    }

    /**
     * 🧠 Get model recommendation for content + intent.
     */
    static getModelForContent(content: string, intent: CognitiveIntent = 'deep_reasoning'): string {
        const classification = dataClassifier.classify(content);
        const decision = modelRouter.route(intent, { sensitivityOverride: classification.level });
        return decision.provider;
    }
}
