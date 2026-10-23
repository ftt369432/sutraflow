/**
 * 🔄 The Agentic Loop
 * Think → Act → Reflect → Self-Correct
 * 
 * Runs up to MAX_ITERATIONS. Each iteration:
 * 1. Soul decides what to do (Intention)
 * 2. Guardrails check the intention
 * 3. SkillExecutor executes it
 * 4. CognitiveReflector evaluates the result
 * 5. If unsatisfied, loop again with new context
 */

import { soul } from './Soul';
import { Guardrails, SafetyLevel } from './Guardrails';
import { skillExecutor } from './SkillExecutor';
import { cognitiveReflector } from './CognitiveReflector';

const MAX_ITERATIONS = 5;

export interface AgenticStep {
  iteration: number;
  phase: 'think' | 'act' | 'reflect' | 'blocked' | 'error';
  intention?: any;
  result?: any;
  reflection?: any;
  reason?: string;
  error?: string;
}

export interface AgenticResult {
  steps: AgenticStep[];
  finalResult: any;
  iterationsUsed: number;
}

export async function processUserRequestAgentic(
  userMessage: string,
  missionId?: string,
  onStepUpdate?: (step: AgenticStep) => void
): Promise<AgenticResult> {
  
  const steps: AgenticStep[] = [];
  let context: any = { lastUserMessage: userMessage, missionId, timestamp: Date.now(), environment: 'browser' };
  let finalResult: any = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // 1. THINK — Soul decides
    const intention = await soul.decide(context);
    if (!intention || intention.action === 'IDLE') break;

    steps.push({ iteration: i + 1, phase: 'think', intention });
    onStepUpdate?.({ iteration: i + 1, phase: 'think', intention });

    // 2. CHECK — Guardrails validate
    if (intention.action !== 'THINK') {
      const policy = Guardrails.scanInput(JSON.stringify(intention.payload));
      
      if (policy.blocked) {
        steps.push({ iteration: i + 1, phase: 'blocked', reason: policy.reason });
        onStepUpdate?.({ iteration: i + 1, phase: 'blocked', reason: policy.reason });
        break;
      }
    }

    // 3. ACT — Execute the intention
    let result: any;
    try {
      if (intention.action === 'THINK') {
        result = { thought: intention.reasoning };
      } else {
        result = await skillExecutor.execute(intention);
      }
      steps.push({ iteration: i + 1, phase: 'act', result });
      onStepUpdate?.({ iteration: i + 1, phase: 'act', result });
    } catch (error: any) {
      steps.push({ iteration: i + 1, phase: 'error', error: error.message });
      onStepUpdate?.({ iteration: i + 1, phase: 'error', error: error.message });
      
      // Feed error back into context for self-correction
      context.lastUserMessage = `Previous action "${intention.action}" failed with error: ${error.message}. Try a different approach.`;
      continue;  // Self-correct on next iteration
    }

    // 4. REFLECT — CognitiveReflector evaluates
    const reflection = await cognitiveReflector.reflect(intention, [
      `Result: ${JSON.stringify(result)}`,
      `Original goal: ${userMessage}`
    ]);
    
    steps.push({ iteration: i + 1, phase: 'reflect', reflection });
    onStepUpdate?.({ iteration: i + 1, phase: 'reflect', reflection });

    // Assuming reflection returns 'goalCompleted' field if it is added as per Task 2.3
    if ((reflection as any).goalCompleted) {
      finalResult = result;
      break;  // Goal achieved!
    }

    // Feed reflection back for next iteration
    context.lastUserMessage = `Continue working on: "${userMessage}". Previous step result: ${JSON.stringify(result)}. Reflector says: ${reflection.critique || reflection.reflection}`;
  }

  return { steps, finalResult, iterationsUsed: steps.length };
}
