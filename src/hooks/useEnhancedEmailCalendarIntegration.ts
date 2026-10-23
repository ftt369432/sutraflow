import { useState, useCallback, useEffect } from 'react';
import { EnhancedAutoCalendarEngine } from '../services/calendar/enhanced/EnhancedAutoCalendarEngine';
import { AutoCalendarEngineConfig, IndustryType } from '../types/autoCalendar.types';

/**
 * Enhanced Email Calendar Integration Hook
 * Replaces hardcoded email processing with configurable auto calendar engine
 * Maintains backward compatibility while adding industry-specific workflows
 */

interface EmailCalendarIntegrationOptions {
  industryType?: IndustryType;
  workflowId?: string;
  enableAutoProcessing?: boolean;
  minimumConfidence?: number;
}

interface ProcessedEmailResult {
  events: any[];
  confidence: number;
  matchedTerms: string[];
  appliedRules: string[];
  processingTime: number;
  errors?: string[];
}

export const useEnhancedEmailCalendarIntegration = (options: EmailCalendarIntegrationOptions = {}) => {
  const [autoCalendarEngine, setAutoCalendarEngine] = useState<EnhancedAutoCalendarEngine | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingHistory, setProcessingHistory] = useState<ProcessedEmailResult[]>([]);
  const [currentConfiguration, setCurrentConfiguration] = useState<any>(null);

  // Default configuration
  const defaultConfig: AutoCalendarEngineConfig = {
    id: 'enhanced-auto-calendar',
    name: 'Enhanced Auto Calendar Engine',
    enabled: true,
    defaultIndustry: options.industryType || 'legal',
    defaultWorkflowId: options.workflowId || '',
    globalSettings: {
      minimumConfidence: options.minimumConfidence || 0.5,
      enableDuplicateDetection: true,
      maxEventsPerEmail: 5,
      defaultEventDuration: 60,
      enableNotifications: true,
      requireApproval: false
    },
    processingSettings: {
      enableBackgroundProcessing: true,
      batchSize: 10,
      maxRetries: 3,
      timeoutMs: 30000
    }
  };

  // Initialize auto calendar engine
  useEffect(() => {
    try {
      const engine = new EnhancedAutoCalendarEngine(defaultConfig);
      setAutoCalendarEngine(engine);
      setCurrentConfiguration(engine.getConfigurationSummary());
    } catch (error) {
      console.error('Failed to initialize auto calendar engine:', error);
    }
  }, [options.industryType, options.workflowId]);

  /**
   * Process email content using enhanced auto calendar engine
   * Replaces the original hardcoded email processing logic
   */
  const processEmailContent = useCallback(async (
    emailContent: string,
    emailSubject: string,
    emailDate?: Date
  ): Promise<ProcessedEmailResult> => {
    if (!autoCalendarEngine) {
      throw new Error('Auto calendar engine not initialized');
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const processDate = emailDate || new Date();
      
      const result = await autoCalendarEngine.processEmailContent(
        emailContent,
        emailSubject,
        processDate
      );

      const processedResult: ProcessedEmailResult = {
        ...result,
        processingTime: Date.now() - startTime
      };

      // Add to processing history
      setProcessingHistory(prev => [processedResult, ...prev.slice(0, 49)]); // Keep last 50

      return processedResult;

    } catch (error) {
      const errorResult: ProcessedEmailResult = {
        events: [],
        confidence: 0,
        matchedTerms: [],
        appliedRules: [],
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      setProcessingHistory(prev => [errorResult, ...prev.slice(0, 49)]);
      throw error;

    } finally {
      setIsProcessing(false);
    }
  }, [autoCalendarEngine]);

  /**
   * Process multiple emails in batch
   */
  const processEmailsBatch = useCallback(async (
    emails: Array<{ content: string; subject: string; date?: Date }>
  ): Promise<ProcessedEmailResult[]> => {
    const results: ProcessedEmailResult[] = [];
    
    for (const email of emails) {
      try {
        const result = await processEmailContent(email.content, email.subject, email.date);
        results.push(result);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error processing email in batch:', error);
        results.push({
          events: [],
          confidence: 0,
          matchedTerms: [],
          appliedRules: [],
          processingTime: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }
    
    return results;
  }, [processEmailContent]);

  /**
   * Switch to different industry configuration
   */
  const switchIndustry = useCallback((industryType: IndustryType): boolean => {
    if (!autoCalendarEngine) return false;
    
    const success = autoCalendarEngine.switchIndustry(industryType);
    if (success) {
      setCurrentConfiguration(autoCalendarEngine.getConfigurationSummary());
    }
    return success;
  }, [autoCalendarEngine]);

  /**
   * Switch to different workflow within current industry
   */
  const switchWorkflow = useCallback((workflowId: string): boolean => {
    if (!autoCalendarEngine) return false;
    
    const success = autoCalendarEngine.switchWorkflow(workflowId);
    if (success) {
      setCurrentConfiguration(autoCalendarEngine.getConfigurationSummary());
    }
    return success;
  }, [autoCalendarEngine]);

  /**
   * Legacy method: Extract calendar events (maintains backward compatibility)
   * This wraps the new enhanced processing for existing code
   */
  const extractCalendarEvents = useCallback(async (
    emailContent: string,
    emailSubject: string = ''
  ): Promise<any[]> => {
    try {
      const result = await processEmailContent(emailContent, emailSubject);
      return result.events;
    } catch (error) {
      console.error('Error extracting calendar events:', error);
      return [];
    }
  }, [processEmailContent]);

  /**
   * Legacy method: Analyze email content (maintains backward compatibility)
   */
  const analyzeEmailContent = useCallback(async (
    content: string,
    subject: string = ''
  ): Promise<{
    hasCalendarEvent: boolean;
    confidence: number;
    extractedEvents: any[];
    details: any;
  }> => {
    try {
      const result = await processEmailContent(content, subject);
      
      return {
        hasCalendarEvent: result.events.length > 0,
        confidence: result.confidence,
        extractedEvents: result.events,
        details: {
          matchedTerms: result.matchedTerms,
          appliedRules: result.appliedRules,
          processingTime: result.processingTime
        }
      };
    } catch (error) {
      console.error('Error analyzing email content:', error);
      return {
        hasCalendarEvent: false,
        confidence: 0,
        extractedEvents: [],
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }, [processEmailContent]);

  /**
   * Get processing statistics
   */
  const getProcessingStats = useCallback(() => {
    const totalProcessed = processingHistory.length;
    const successfulProcesses = processingHistory.filter(p => !p.errors).length;
    const totalEvents = processingHistory.reduce((sum, p) => sum + p.events.length, 0);
    const averageConfidence = processingHistory.reduce((sum, p) => sum + p.confidence, 0) / totalProcessed || 0;
    const averageProcessingTime = processingHistory.reduce((sum, p) => sum + p.processingTime, 0) / totalProcessed || 0;

    return {
      totalProcessed,
      successfulProcesses,
      totalEvents,
      averageConfidence,
      averageProcessingTime,
      successRate: totalProcessed > 0 ? (successfulProcesses / totalProcessed) * 100 : 0
    };
  }, [processingHistory]);

  /**
   * Clear processing history
   */
  const clearProcessingHistory = useCallback(() => {
    setProcessingHistory([]);
  }, []);

  /**
   * Get current configuration details
   */
  const getConfiguration = useCallback(() => {
    return currentConfiguration;
  }, [currentConfiguration]);

  return {
    // Enhanced methods
    processEmailContent,
    processEmailsBatch,
    switchIndustry,
    switchWorkflow,
    getProcessingStats,
    clearProcessingHistory,
    getConfiguration,
    
    // Legacy methods (backward compatibility)
    extractCalendarEvents,
    analyzeEmailContent,
    
    // State
    isProcessing,
    processingHistory,
    currentConfiguration,
    
    // Engine instance (for advanced usage)
    autoCalendarEngine
  };
};
