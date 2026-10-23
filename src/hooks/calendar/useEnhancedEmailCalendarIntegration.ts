import { useState, useCallback, useMemo } from 'react';
import { EmailMessage } from '../../services/email/types';
import { EnhancedAutoCalendarEngine } from '../../services/calendar/EnhancedAutoCalendarEngine';
import { EmailEventAnalyzerFactory } from '../../services/calendar/EmailEventAnalyzer';
import { 
  legalAutoCalendarWorkflow, 
  medicalAutoCalendarWorkflow, 
  mortgageAutoCalendarWorkflow,
  industryWorkflows
} from '../../services/calendar/autoCalendarConfigs';
import { AutoCalendarWorkflow, EmailEventExtractionResult } from '../../types/autoCalendar.types';

export interface EnhancedEmailCalendarIntegrationHook {
  // Core processing
  processEmailContent: (email: EmailMessage) => Promise<EmailEventExtractionResult | null>;
  
  // Industry switching
  switchIndustry: (industry: 'legal' | 'medical' | 'mortgage') => void;
  currentIndustry: 'legal' | 'medical' | 'mortgage';
  
  // Workflow management
  getCurrentWorkflow: () => AutoCalendarWorkflow;
  updateWorkflowConfig: (config: Partial<AutoCalendarWorkflow>) => void;
  
  // Statistics
  getProcessingStats: () => {
    totalProcessed: number;
    successfulExtractions: number;
    currentWorkflow: string;
    averageConfidence: number;
  };
  
  // Legacy compatibility
  extractCalendarEvents: (email: EmailMessage) => any; // Original hard-coded method
  
  // Configuration
  isEnhancedMode: boolean;
  setEnhancedMode: (enabled: boolean) => void;
}

export function useEnhancedEmailCalendarIntegration(): EnhancedEmailCalendarIntegrationHook {
  // State management
  const [currentIndustry, setCurrentIndustry] = useState<'legal' | 'medical' | 'mortgage'>('legal');
  const [isEnhancedMode, setIsEnhancedMode] = useState(true);
  const [processingStats, setProcessingStats] = useState({
    totalProcessed: 0,
    successfulExtractions: 0,
    averageConfidence: 0,
    confidenceSum: 0
  });

  // Initialize engines
  const enhancedEngine = useMemo(() => {
    const workflow = industryWorkflows[currentIndustry];
    return new EnhancedAutoCalendarEngine(workflow, { debugMode: process.env.NODE_ENV === 'development' });
  }, [currentIndustry]);

  // Legacy analyzer for backward compatibility
  const legacyAnalyzer = useMemo(() => {
    return EmailEventAnalyzerFactory.createWCABAnalyzer();
  }, []);

  /**
   * Process email content using the enhanced configurable engine
   */
  const processEmailContent = useCallback(async (email: EmailMessage): Promise<EmailEventExtractionResult | null> => {
    try {
      console.log(`🔧 Processing email with enhanced engine (${currentIndustry} mode)`);
      
      const result = await enhancedEngine.processEmailContent(email);
      
      // Update statistics
      setProcessingStats(prev => {
        const newTotal = prev.totalProcessed + 1;
        const newSuccessful = result ? prev.successfulExtractions + 1 : prev.successfulExtractions;
        const newConfidenceSum = result ? prev.confidenceSum + result.confidence : prev.confidenceSum;
        const newAverageConfidence = newSuccessful > 0 ? newConfidenceSum / newSuccessful : 0;
        
        return {
          totalProcessed: newTotal,
          successfulExtractions: newSuccessful,
          averageConfidence: newAverageConfidence,
          confidenceSum: newConfidenceSum
        };
      });

      if (result) {
        console.log(`✅ Enhanced extraction successful: ${result.title} (confidence: ${result.confidence})`);
      } else {
        console.log(`❌ Enhanced extraction failed for email: ${email.subject}`);
      }

      return result;
    } catch (error) {
      console.error('🔧 Enhanced processing error:', error);
      return null;
    }
  }, [enhancedEngine, currentIndustry]);

  /**
   * Switch to a different industry workflow
   */
  const switchIndustry = useCallback((industry: 'legal' | 'medical' | 'mortgage') => {
    console.log(`🔄 Switching from ${currentIndustry} to ${industry} workflow`);
    setCurrentIndustry(industry);
    
    // Update the engine with new workflow
    const newWorkflow = industryWorkflows[industry];
    enhancedEngine.updateWorkflow(newWorkflow);
    
    console.log(`✅ Switched to ${industry} workflow: ${newWorkflow.name}`);
  }, [currentIndustry, enhancedEngine]);

  /**
   * Get current workflow configuration
   */
  const getCurrentWorkflow = useCallback(() => {
    return enhancedEngine.getCurrentWorkflow();
  }, [enhancedEngine]);

  /**
   * Update workflow configuration
   */
  const updateWorkflowConfig = useCallback((configUpdate: Partial<AutoCalendarWorkflow>) => {
    const currentWorkflow = enhancedEngine.getCurrentWorkflow();
    const updatedWorkflow = {
      ...currentWorkflow,
      ...configUpdate,
      lastUpdated: new Date()
    };
    
    enhancedEngine.updateWorkflow(updatedWorkflow);
    console.log(`🔧 Updated ${currentIndustry} workflow configuration`);
  }, [enhancedEngine, currentIndustry]);

  /**
   * Get processing statistics
   */
  const getProcessingStats = useCallback(() => {
    return {
      totalProcessed: processingStats.totalProcessed,
      successfulExtractions: processingStats.successfulExtractions,
      currentWorkflow: getCurrentWorkflow().name,
      averageConfidence: Math.round(processingStats.averageConfidence * 100) / 100
    };
  }, [processingStats, getCurrentWorkflow]);

  /**
   * Legacy method for backward compatibility
   * Uses the original hard-coded WCAB analyzer
   */
  const extractCalendarEvents = useCallback((email: EmailMessage) => {
    console.log('🏛️ Using legacy hard-coded calendar extraction');
    return legacyAnalyzer.extractEventDetails(email);
  }, [legacyAnalyzer]);

  return {
    // Core processing
    processEmailContent,
    
    // Industry switching
    switchIndustry,
    currentIndustry,
    
    // Workflow management
    getCurrentWorkflow,
    updateWorkflowConfig,
    
    // Statistics
    getProcessingStats,
    
    // Legacy compatibility
    extractCalendarEvents,
    
    // Configuration
    isEnhancedMode,
    setEnhancedMode: setIsEnhancedMode
  };
}
