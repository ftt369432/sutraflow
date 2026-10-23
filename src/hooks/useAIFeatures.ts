import { useState, useCallback } from 'react';
import type { Email, Task, Template, CalendarEvent } from '../types';
import { analyzeEmail, type EmailAnalysis } from '../services/ai/emailAnalyzer';
import { findOptimalTimeSlots, type ScheduleSuggestion } from '../services/ai/scheduleOptimizer';
import {
  completeTemplate,
  type TemplateVariables,
  type TemplateCompletion
} from '../services/ai/templateManager';

export function useAIFeatures() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processEmail = async (email: Email): Promise<EmailAnalysis | null> => {
    try {
      setIsAnalyzing(true);
      const analysis = await analyzeEmail(email);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze email');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizeSchedule = useCallback((
    tasks: Task[],
    events: CalendarEvent[],
    date?: Date
  ): ScheduleSuggestion[] => {
    setIsOptimizing(true);
    try {
      return findOptimalTimeSlots(tasks, events, date);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const processTemplate = useCallback((
    template: Template,
    variables: TemplateVariables
  ): TemplateCompletion => {
    setIsProcessingTemplate(true);
    try {
      return completeTemplate(template, variables);
    } finally {
      setIsProcessingTemplate(false);
    }
  }, []);

  return {
    processEmail,
    optimizeSchedule,
    processTemplate,
    error,
    isAnalyzing,
    isOptimizing,
    isProcessingTemplate,
  };
}