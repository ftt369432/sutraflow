import { useState, useEffect, useCallback } from 'react';
import { 
  VoiceTrigger, 
  getAllAssistantTriggers, 
  processVoiceTranscription,
  addAssistantTrigger,
  updateAssistantTrigger,
  removeAssistantTrigger,
  getDefaultVoiceTrigger
} from '../utils/location';

interface UseAssistantTriggersReturn {
  // Data
  triggers: VoiceTrigger[];
  isLoading: boolean;
  activeAssistant: {
    assistantId: string;
    assistantType: string;
    response: string;
  } | null;
  
  // Actions
  loadTriggers: () => Promise<void>;
  processTranscription: (text: string) => Promise<boolean>;
  addTrigger: (assistantType: string, customSettings?: Partial<VoiceTrigger>) => Promise<boolean>;
  updateTrigger: (assistantId: string, updates: Partial<VoiceTrigger>) => Promise<boolean>;
  removeTrigger: (assistantId: string) => Promise<boolean>;
  resetActiveAssistant: () => void;
  
  // Helpers
  getDefaultTriggerFor: (assistantType: string) => VoiceTrigger;
  getAssistantById: (id: string) => VoiceTrigger | undefined;
  getAssistantByType: (type: string) => VoiceTrigger | undefined;
}

/**
 * Custom hook for working with assistant-specific voice triggers
 * Provides methods for managing triggers and processing voice input
 */
const useAssistantTriggers = (): UseAssistantTriggersReturn => {
  const [triggers, setTriggers] = useState<VoiceTrigger[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeAssistant, setActiveAssistant] = useState<{
    assistantId: string;
    assistantType: string;
    response: string;
  } | null>(null);

  // Load all assistant triggers
  const loadTriggers = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedTriggers = await getAllAssistantTriggers();
      setTriggers(loadedTriggers);
    } catch (error) {
      console.error('Error loading assistant triggers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadTriggers();
  }, [loadTriggers]);

  /**
   * Process voice transcription to detect triggers
   * @param {string} transcription - The voice transcription to check
   * @returns {Promise<boolean>} - Whether a trigger was detected
   */
  const processTranscription = useCallback(async (transcription: string): Promise<boolean> => {
    const result = await processVoiceTranscription(transcription);
    
    if (result) {
      setActiveAssistant(result);
      return true;
    }
    
    return false;
  }, []);

  /**
   * Add a new assistant trigger
   * @param {string} assistantType - Type of assistant
   * @param {Partial<VoiceTrigger>} customSettings - Optional custom settings
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const addTrigger = useCallback(async (
    assistantType: string, 
    customSettings?: Partial<VoiceTrigger>
  ): Promise<boolean> => {
    const assistantId = `assistant-${Date.now()}`;
    const result = await addAssistantTrigger(assistantId, assistantType, customSettings);
    
    if (result) {
      await loadTriggers();
    }
    
    return result;
  }, [loadTriggers]);

  /**
   * Update an existing assistant trigger
   * @param {string} assistantId - ID of the assistant to update
   * @param {Partial<VoiceTrigger>} updates - Properties to update
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const updateTrigger = useCallback(async (
    assistantId: string, 
    updates: Partial<VoiceTrigger>
  ): Promise<boolean> => {
    const result = await updateAssistantTrigger(assistantId, updates);
    
    if (result) {
      await loadTriggers();
    }
    
    return result;
  }, [loadTriggers]);

  /**
   * Remove an assistant trigger
   * @param {string} assistantId - ID of the assistant to remove
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const removeTrigger = useCallback(async (assistantId: string): Promise<boolean> => {
    const result = await removeAssistantTrigger(assistantId);
    
    if (result) {
      await loadTriggers();
    }
    
    return result;
  }, [loadTriggers]);

  /**
   * Reset active assistant state
   */
  const resetActiveAssistant = useCallback(() => {
    setActiveAssistant(null);
  }, []);

  /**
   * Get default trigger settings for a specific assistant type
   * @param {string} assistantType - Type of assistant
   * @returns {VoiceTrigger} - Default trigger settings
   */
  const getDefaultTriggerFor = useCallback((assistantType: string): VoiceTrigger => {
    return getDefaultVoiceTrigger(undefined, assistantType);
  }, []);

  /**
   * Find an assistant by ID
   * @param {string} id - ID of the assistant to find
   * @returns {VoiceTrigger | undefined} - The assistant trigger or undefined if not found
   */
  const getAssistantById = useCallback((id: string): VoiceTrigger | undefined => {
    return triggers.find(trigger => trigger.assistantId === id);
  }, [triggers]);

  /**
   * Find an assistant by type
   * @param {string} type - Type of the assistant to find
   * @returns {VoiceTrigger | undefined} - The assistant trigger or undefined if not found
   */
  const getAssistantByType = useCallback((type: string): VoiceTrigger | undefined => {
    return triggers.find(trigger => trigger.assistantType === type);
  }, [triggers]);

  return {
    // Data
    triggers,
    isLoading,
    activeAssistant,
    
    // Actions
    loadTriggers,
    processTranscription,
    addTrigger,
    updateTrigger,
    removeTrigger,
    resetActiveAssistant,
    
    // Helpers
    getDefaultTriggerFor,
    getAssistantById,
    getAssistantByType
  };
};

export default useAssistantTriggers;
