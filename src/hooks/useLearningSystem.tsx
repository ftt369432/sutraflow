import { useState, useEffect, useCallback } from 'react';
import { LearningOrchestrator } from '../services/learning/LearningOrchestrator';
import { IntelligentAssistantManager } from '../services/learning/IntelligentAssistantManager';
import { EnhancedTrainingService } from '../services/learning/EnhancedTrainingService';
import { AIDocument, AIAssistant } from '../types/ai';
import { PersonalityProfile } from '../types/personality';
import { TrainingEntry } from '../types/training';
import { DocumentProcessingUtility } from '../services/DocumentProcessingUtility';

interface LearningHookOptions {
  enableLearning?: boolean;
  collectFeedback?: boolean;
  personalityProfile?: PersonalityProfile;
  documentProcessingThreshold?: number;
}

interface LearningInsights {
  patterns: number;
  documentsTracked: number;
  topDocuments: Array<{documentId: string; usageCount: number}>;
  lastTrainingEntries: TrainingEntry[];
  improvementScore: number;
  lastProcessedAt?: Date;
  reprocessingNeeded?: boolean;
  reprocessedDocuments?: number;
}

interface DocumentProcessingOptions {
  forceReprocess?: boolean;
  onlyChanged?: boolean;
  deduplicateContent?: boolean;
}

/**
 * Hook for accessing the learning system
 */
export function useLearningSystem(assistantId: string, options: LearningHookOptions = {}) {
  const [assistantManager, setAssistantManager] = useState<IntelligentAssistantManager | null>(null);
  const [trainingService, setTrainingService] = useState<EnhancedTrainingService | null>(null);
  const [insights, setInsights] = useState<LearningInsights>({
    patterns: 0,
    documentsTracked: 0,
    topDocuments: [],
    lastTrainingEntries: [],
    improvementScore: 0,
    reprocessedDocuments: 0,
  });
  const [isLearningEnabled, setIsLearningEnabled] = useState(options.enableLearning ?? true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentContentHashes, setDocumentContentHashes] = useState<Record<string, string>>({});
  
  // Initialize the learning system
  useEffect(() => {
    // Create a proper default personality profile that matches the required interface
    const defaultPersonality: PersonalityProfile = {
      name: 'default',
      traits: {
        openness: 0.7,
        conscientiousness: 0.8,
        extraversion: 0.6,
        agreeableness: 0.8,
        neuroticism: 0.3
      },
      preferences: {
        name: 'default',
        focusPreferences: {
          ambientSound: false,
          soundType: 'none',
          checkInterval: 30
        },
        communicationStyle: {
          verbosity: 'concise',
          tone: 'casual',
          useEmoji: false
        }
      },
      learningStyle: 'visual',
      communicationStyle: {
        tone: 'friendly',
        formality: 0.5,
        verbosity: 0.5
      },
      workStyle: {
        peakProductivityHours: [9, 10, 11, 14, 15, 16],
        preferredTaskDuration: 45,
        breakFrequency: 60
      },
      update: (adaptations) => {
        // Implementation of update
        console.log('Updating personality with adaptations:', adaptations);
      }
    };
    
    const manager = new IntelligentAssistantManager(
      options.personalityProfile || defaultPersonality
    );
    
    setAssistantManager(manager);
    setTrainingService(EnhancedTrainingService.getInstance());
    
    // Enable or disable learning
    manager.setLearningEnabled(isLearningEnabled);
    
    // Clean up when unmounting
    return () => {
      manager.dispose();
    };
  }, [assistantId, options.personalityProfile]);
  
  // Update learning insights periodically
  useEffect(() => {
    if (!assistantManager || !trainingService) return;
    
    const fetchInsights = () => {
      try {
        // Use a performance-focused approach to prevent UI blocking
        // Step 1: Get only essential insights synchronously
        const lastProcessed = localStorage.getItem(`doc_last_processed_${assistantId}`);
        const lastProcessedDate = lastProcessed ? new Date(lastProcessed) : null;
        const processingThreshold = options.documentProcessingThreshold || (24 * 60 * 60 * 1000); // Default 24 hours
        const now = new Date();
        const reprocessingNeeded = !lastProcessedDate || 
          (now.getTime() - lastProcessedDate.getTime() > processingThreshold);
        
        // Step 2: Update with basic insights first to prevent UI freeze
        setInsights(prev => ({
          ...prev,
          lastProcessedAt: lastProcessedDate || undefined,
          reprocessingNeeded
        }));
        
        // Step 3: Get more expensive insights in the next event loop cycle
        setTimeout(() => {
          try {
            // Get learning insights (potentially expensive operation)
            const learningInsights = assistantManager.getLearningInsights();
            
            // Get training entries (potentially expensive if there are many)
            const trainingEntries = trainingService.getTrainingEntries(assistantId).slice(-5);
            
            // Calculate improvement score with a safer approach
            let improvementScore = 0.5; // Default value
            
            // Use a simplified calculation based on training entries
            const recentEntries = trainingService.getTrainingEntries(assistantId).slice(-10);
            if (recentEntries.length > 0) {
              // Calculate using whatever feedback data is available on the entries
              let scoreSum = 0;
              let entriesWithScore = 0;
              
              recentEntries.forEach(entry => {
                // Use any feedback property available
                const feedbackScore = 
                  (entry as any).feedback_score || 
                  (entry as any).score || 
                  (entry as any).rating || 0;
                
                if (feedbackScore) {
                  scoreSum += feedbackScore;
                  entriesWithScore++;
                }
              });
              
              if (entriesWithScore > 0) {
                improvementScore = Math.min(Math.max(0.5 + (scoreSum / (entriesWithScore * 2)), 0), 1);
              }
            }
            
            // Update with full insights
            setInsights(prev => ({
              ...prev,
              ...learningInsights,
              lastTrainingEntries: trainingEntries,
              improvementScore,
              lastProcessedAt: lastProcessedDate || undefined,
              reprocessingNeeded
            }));
          } catch (err) {
            console.warn('Error in deferred insights calculation:', err);
          }
        }, 10); // Small delay to allow UI to update
      } catch (error) {
        console.error('Error fetching learning insights:', error);
      }
    };
    
    // Initial fetch
    fetchInsights();
    
    // Set up interval to update insights
    const intervalId = setInterval(fetchInsights, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [assistantId, assistantManager, trainingService]);
  
  // Function to process user input
  const processUserInput = async (input: string, relevantDocuments: AIDocument[] = []) => {
    if (!assistantManager) {
      console.error('Assistant manager not initialized');
      return 'The learning system is not ready yet. Please try again in a moment.';
    }
    
    setIsProcessing(true);
    
    try {
      const response = await assistantManager.processUserInput(input, relevantDocuments);
      return response;
    } catch (error) {
      console.error('Error processing user input:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to add training entry
  const addTrainingEntry = async (entry: Omit<TrainingEntry, 'id' | 'assistant_id' | 'created_at'>) => {
    if (!trainingService) {
      console.error('Training service not initialized');
      return false;
    }
    
    setIsProcessing(true);
    
    try {
      const fullEntry: TrainingEntry = {
        ...entry,
        id: Date.now().toString(),
        assistant_id: assistantId,
        created_at: new Date().toISOString(),
        created_by: 'user', // Would come from auth in a real app
      };
      
      await trainingService.addTrainingEntry(assistantId, fullEntry);
      return true;
    } catch (error) {
      console.error('Error adding training entry:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to provide feedback on a message
  const provideFeedback = (messageId: string, score: number) => {
    if (!assistantManager) {
      console.error('Assistant manager not initialized');
      return;
    }
    
    assistantManager.addFeedback(messageId, score);
  };
  
  // Function to toggle learning
  const toggleLearning = (enabled: boolean) => {
    setIsLearningEnabled(enabled);
    if (assistantManager) {
      assistantManager.setLearningEnabled(enabled);
    }
  };
  
  // Function to get learning insights
  const getLearningInsights = () => {
    return insights;
  };
  
  // Function to reprocess documents to update AI knowledge without duplication
  const reprocessDocuments = useCallback(async (documents: AIDocument[], options: DocumentProcessingOptions = {}) => {
    if (!assistantManager || !trainingService) {
      console.error('Services not initialized');
      return { success: false, processed: 0, errors: ['Services not initialized'] };
    }
    
    setIsProcessing(true);
    
    try {
      // Performance optimization: Process documents in batches to avoid UI freezes
      const batchSize = 10; // Process 10 documents at a time
      const batches = [];
      
      // Split documents into batches
      for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize));
      }
      
      let totalProcessed = 0;
      let totalSkipped = 0;
      const allErrors: Array<{ documentId: string, error: string }> = [];
      
      // Process each batch with a small delay to prevent UI freezing
      for (let i = 0; i < batches.length; i++) {
        // Allow UI to update between batches
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Process the current batch
        const result = await DocumentProcessingUtility.processDocuments(batches[i], {
          deduplicateContent: options.deduplicateContent !== false, // Default to true
          forceReprocess: options.forceReprocess === true,
          assistantId: assistantId
        });
        
        // Accumulate results
        totalProcessed += result.processedDocuments.length;
        totalSkipped += result.skippedDocuments.length;
        allErrors.push(...result.errors);
        
        // Incrementally update insights to show progress
        if (result.processedDocuments.length > 0) {
          setInsights(prev => ({
            ...prev,
            lastProcessedAt: new Date(),
            reprocessingNeeded: false,
            reprocessedDocuments: (prev.reprocessedDocuments || 0) + result.processedDocuments.length
          }));
        }
      }
      
      return { 
        success: allErrors.length === 0, 
        processed: totalProcessed,
        skipped: totalSkipped,
        errors: allErrors.length > 0 ? allErrors.map(e => e.error) : undefined,
        batchCount: batches.length
      };
    } catch (error) {
      console.error('Error in document reprocessing:', error);
      return { 
        success: false, 
        processed: 0,
        errors: [`General error: ${error}`]
      };
    } finally {
      setIsProcessing(false);
    }
  }, [assistantId, assistantManager, trainingService]);
  
  // Apply training insights to an assistant
  const applyInsightsToAssistant = (assistant: AIAssistant): AIAssistant => {
    if (!trainingService) {
      return assistant;
    }
    
    return trainingService.applyTrainingInsights(assistant);
  };
  
  return {
    processUserInput,
    addTrainingEntry,
    provideFeedback,
    toggleLearning,
    isLearningEnabled,
    isProcessing,
    insights: getLearningInsights(),
    applyInsightsToAssistant,
    reprocessDocuments
  };
}
