/**
 * Mode Detection Hook
 * 
 * Intelligent detection of task complexity to suggest Power Mode.
 * Used in Auto Mode to analyze user requests and recommend mode switches.
 * 
 * @module hooks/useModeDetection
 */

import { useEffect, useRef } from 'react';
import { useMode } from '../contexts/ModeContext';
import { COMPLEXITY_INDICATORS, SIMPLE_TASK_PATTERNS } from '../config/modes';

/**
 * Mode Detection Hook
 * 
 * Analyzes user messages for complexity indicators.
 * Triggers Power Mode suggestion when complex task detected.
 * 
 * @param userMessage Latest user message to analyze
 * 
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const [message, setMessage] = useState('');
 *   
 *   // Auto-detect complexity
 *   useModeDetection(message);
 *   
 *   // When user sends complex request:
 *   // "Create 3 documents: demand letter, petition, settlement"
 *   // → PowerModeSuggestion modal displays
 * }
 * ```
 */
export const useModeDetection = (userMessage: string) => {
  const { currentMode, triggerPowerModeSuggestion } = useMode();
  const lastAnalyzedMessage = useRef<string>('');
  
  useEffect(() => {
    // Only analyze in Simple or Auto mode
    if (currentMode === 'power') {
      return; // Already in Power Mode, no need to suggest
    }
    
    // Only analyze new messages (avoid re-analyzing same message)
    if (!userMessage || userMessage === lastAnalyzedMessage.current) {
      return;
    }
    
    // Only analyze messages with sufficient length
    if (userMessage.trim().length < 20) {
      return; // Too short to be complex
    }
    
    lastAnalyzedMessage.current = userMessage;
    
    // Check if it's a simple task (question, help request)
    const isSimpleTask = SIMPLE_TASK_PATTERNS.some(pattern => 
      pattern.test(userMessage)
    );
    
    if (isSimpleTask) {
      // Don't suggest Power Mode for simple questions
      return;
    }
    
    // Check for complexity indicators
    let complexityScore = 0;
    let matchedIndicators: string[] = [];
    
    COMPLEXITY_INDICATORS.forEach(pattern => {
      if (pattern.test(userMessage)) {
        complexityScore++;
        matchedIndicators.push(pattern.source);
      }
    });
    
    // Trigger suggestion if complexity threshold met
    const COMPLEXITY_THRESHOLD = 2; // Need at least 2 indicators
    
    if (complexityScore >= COMPLEXITY_THRESHOLD) {
      console.log('🔍 Complexity detected:', {
        message: userMessage.substring(0, 100) + '...',
        score: complexityScore,
        threshold: COMPLEXITY_THRESHOLD,
        indicators: matchedIndicators.map(i => i.substring(0, 50))
      });
      
      triggerPowerModeSuggestion();
    }
  }, [userMessage, currentMode, triggerPowerModeSuggestion]);
};

/**
 * Advanced Mode Detection with Context
 * 
 * Analyzes multiple factors beyond just message content:
 * - Number of canvases created
 * - Tools used in conversation
 * - Session duration
 * 
 * @param options Detection options
 */
export interface ModeDetectionOptions {
  userMessage: string;
  canvasCount?: number;
  toolsUsed?: string[];
  sessionDuration?: number;
}

export const useModeDetectionAdvanced = (options: ModeDetectionOptions) => {
  const { currentMode, triggerPowerModeSuggestion } = useMode();
  
  useEffect(() => {
    if (currentMode === 'power') {
      return;
    }
    
    const { userMessage, canvasCount = 0, toolsUsed = [], sessionDuration = 0 } = options;
    
    let complexityScore = 0;
    
    // Factor 1: Message complexity (same as basic detection)
    COMPLEXITY_INDICATORS.forEach(pattern => {
      if (pattern.test(userMessage)) {
        complexityScore++;
      }
    });
    
    // Factor 2: Multiple canvases created
    if (canvasCount >= 3) {
      complexityScore += 2; // Strong indicator of power user needs
    }
    
    // Factor 3: Advanced tools used
    const advancedTools = ['workflow', 'automation', 'orchestration', 'research'];
    const usedAdvancedTools = toolsUsed.filter(tool => 
      advancedTools.some(advanced => tool.includes(advanced))
    );
    if (usedAdvancedTools.length > 0) {
      complexityScore += 1;
    }
    
    // Factor 4: Long session (user is engaged, might need power features)
    if (sessionDuration > 10 * 60 * 1000) { // 10 minutes
      complexityScore += 1;
    }
    
    // Trigger with lower threshold for advanced detection
    const ADVANCED_THRESHOLD = 3;
    
    if (complexityScore >= ADVANCED_THRESHOLD) {
      console.log('🔍 Advanced complexity detected:', {
        message: userMessage.substring(0, 50) + '...',
        score: complexityScore,
        factors: {
          messageComplexity: COMPLEXITY_INDICATORS.filter(p => p.test(userMessage)).length,
          canvasCount,
          advancedToolsUsed: usedAdvancedTools,
          sessionMinutes: Math.round(sessionDuration / 60000)
        }
      });
      
      triggerPowerModeSuggestion();
    }
  }, [options, currentMode, triggerPowerModeSuggestion]);
};
