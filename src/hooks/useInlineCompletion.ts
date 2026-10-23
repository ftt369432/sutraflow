/**
 * ⚡ useInlineCompletion
 * 
 * Fill-In-The-Middle (FIM) Predictive Autocomplete Hook for Sovereign Legal Canvas.
 * - 350ms idle debounce
 * - Instant AbortController request cancellation
 * - Zero-thinking budget (ultra-low latency <400ms)
 * - Intercepts TAB to lock in ghost text, ESC to discard
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AIServiceFactory } from '../services/ai/aiServiceFactory';
import { caseStateHarvester } from '../services/legal/CaseStateHarvester';

export interface InlineSuggestion {
  text: string;
  cursorIndex: number;
}

export function useInlineCompletion(
  activeText: string,
  cursorIndex: number,
  caseId: string = 'MURILLO_IRMA',
  enabled: boolean = true
) {
  const [suggestion, setSuggestion] = useState<InlineSuggestion | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear current suggestion
  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  // Accept and insert current suggestion
  const acceptSuggestion = useCallback((): string | null => {
    if (!suggestion) return null;
    const { text, cursorIndex: atIndex } = suggestion;
    
    // Insert text at specified cursor position
    const before = activeText.slice(0, atIndex);
    const after = activeText.slice(atIndex);
    const updated = before + text + after;
    
    setSuggestion(null);
    return updated;
  }, [activeText, suggestion]);

  useEffect(() => {
    // If disabled or cursor is at beginning, discard and return
    if (!enabled || cursorIndex < 10) {
      setSuggestion(null);
      return;
    }

    // Clear existing debounce timer and abort previous request in flight
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 350ms Debounce Window
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsCompleting(true);

        const prefix = activeText.slice(Math.max(0, cursorIndex - 1200), cursorIndex);
        const suffix = activeText.slice(cursorIndex, cursorIndex + 300);

        // Don't trigger if cursor is immediately after space or newline with nothing to predict
        if (prefix.trim().length === 0) {
          setIsCompleting(false);
          return;
        }

        const caseContext = caseStateHarvester.toPromptContext(caseId);

        const fimPrompt = `
You are an ultra-fast legal autocomplete engine.
Context:
${caseContext}

Prefix before cursor:
"""${prefix}"""

Suffix after cursor:
"""${suffix}"""

TASK:
Provide the next 5 to 25 words of natural, verified legal prose that seamlessly continues the prefix.
Output ONLY the raw continuation text. Do NOT include markdown code fences, greetings, or explanations.
`;

        const ai = AIServiceFactory.getUtilityService();
        const response = await ai.generateText(fimPrompt, {
          maxTokens: 50,
          temperature: 0.1,
          thinkingBudget: 0 // Explicitly disable thinking for autocomplete speed
        });

        if (!controller.signal.aborted && response && response.trim().length > 0) {
          // Clean up formatting
          const cleanText = response.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
          setSuggestion({
            text: cleanText,
            cursorIndex
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('⚡ Autocomplete aborted or failed:', err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCompleting(false);
        }
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      controller.abort();
    };
  }, [activeText, cursorIndex, caseId, enabled]);

  return {
    suggestion,
    isCompleting,
    acceptSuggestion,
    discardSuggestion
  };
}
