/**
 * 💡 Cognitive Reflector
 * A second-layer reasoning system that validates the Soul's intentions.
 * It prevents "hallucinations" or non-sensical autonomous actions.
 */
import { Intention } from './types';
import { AIServiceFactory } from '../services/ai/aiServiceFactory';

export class CognitiveReflector {
    private static instance: CognitiveReflector;

    public static getInstance() {
        if (!CognitiveReflector.instance) {
            CognitiveReflector.instance = new CognitiveReflector();
        }
        return CognitiveReflector.instance;
    }

    /**
     * 🔍 Reflect: Double-check an intention before it's executed.
     * Uses a fast, high-logic model (like Groq) to verify sanity.
     */
    public async reflect(intention: Intention, contextLines: string[]): Promise<{
        valid: boolean;
        goalCompleted?: boolean;
        refinedIntention?: Intention;
        critique?: string;
    }> {
        if (intention.action === 'THINK' || intention.action === 'IDLE') {
            return { valid: true };
        }

        console.log(`💡 Reflector: Validating action: ${intention.action}...`);

        try {
            const aiService = AIServiceFactory.getInstance();
            const validationPrompt = `
## CRITICAL SYSTEM AUDIT
You are the Cognitive Reflector for an autonomous agent.
The "Soul" has generated the following intention:
ACTION: ${intention.action}
REASONING: ${intention.reasoning}
PAYLOAD: ${JSON.stringify(intention.payload)}

## CONTEXTual MEMORY:
${contextLines.join('\n')}

## YOUR TASK:
Evaluate if this action is safe, logical, and follows the user's implicit goals.
If it looks like a "loop" or "non-productive", mark it as invalid.

## OUTPUT FORMAT:
Return ONLY a JSON object:
{
  "valid": boolean,
  "goalCompleted": boolean,
  "critique": "brief internal analysis",
  "recommendedAction": "if invalid, what should it do instead? (optional)"
}
`;

            const response = await aiService.generateText(validationPrompt, {
                maxTokens: 200,
                temperature: 0.1 // Very deterministic
            });

            const firstBrace = response.indexOf('{');
            const lastBrace = response.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                const result = JSON.parse(response.substring(firstBrace, lastBrace + 1));

                if (!result.valid) {
                    console.warn(`💡 Reflector REJECTED action: ${result.critique}`);
                }

                return {
                    valid: result.valid === true,
                    goalCompleted: result.goalCompleted === true,
                    critique: result.critique
                };
            }

            return { valid: true, goalCompleted: false }; // Default to valid if check fails
        } catch (e) {
            console.error('💡 Reflector Error:', e);
            return { valid: true }; // Don't block system on error
        }
    }
}

export const cognitiveReflector = CognitiveReflector.getInstance();
