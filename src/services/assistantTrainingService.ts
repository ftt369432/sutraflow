import { supabase } from '@/lib/supabaseClient';
import { AIAssistant } from '@/types/ai';
import type { TrainingEntry } from '@/types/training';

class AssistantTrainingService {
  private static instance: AssistantTrainingService;

  private constructor() {}

  public static getInstance(): AssistantTrainingService {
    if (!AssistantTrainingService.instance) {
      AssistantTrainingService.instance = new AssistantTrainingService();
    }
    return AssistantTrainingService.instance;
  }
  /**
   * Fetch training entries for an assistant using the database function approach 
   * to avoid CORS issues with Edge Functions
   */
  async getTrainingEntries(assistantId: string): Promise<TrainingEntry[]> {
    try {
      console.log('Fetching training entries for assistant:', assistantId);

      // Use the correct RPC endpoint to call the database function
      const { data, error } = await supabase
        .rpc('get_effective_training_entries', { 
          assistant_id_param: assistantId,
          min_usage_count: 0 // Get all entries, including new ones
        });
      
      if (error) {
        console.error('Error from get_effective_training_entries RPC:', error);
        throw error;
      }
      
      console.log('Training entries retrieved:', data?.length || 0);
      
      // Convert the response to match our TrainingEntry interface
      const trainingEntries: TrainingEntry[] = (data || []).map((entry: any) => ({
        id: entry.id,
        text_content: entry.text_content,
        entry_type: entry.entry_type,
        effectiveness_score: entry.effectiveness_score,
        usage_count: entry.usage_count,
        // Add any other required fields with default values
        assistant_id: assistantId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      return trainingEntries;
    } catch (error) {
      console.error('Error getting training entries:', error);
      // Return empty array on error to prevent UI crashes
      return []; 
    }
  }
  /**
   * Add a new training entry for an assistant using a database function
   */
  async addTrainingEntry(
    assistantId: string,
    question: string,
    answer: string
  ): Promise<TrainingEntry> {
    try {
      console.log('Adding training entry for assistant:', assistantId);

      // Use the RPC endpoint to call the database function
      const { data, error } = await supabase
        .rpc('create_assistant_training', { 
          assistant_id: assistantId,
          question: question,
          answer: answer
        });
      
      if (error) {
        console.error('Error from create_assistant_training RPC:', error);
        throw error;
      }
      
      console.log('Training entry created:', data);
      return data as unknown as TrainingEntry;
    } catch (error) {
      console.error('Error adding training entry:', error);
      throw error;
    }
  }

  /**
   * Get relevant training data for an AI response
   * This method will be called by the chat service when generating responses
   */
  async getRelevantTrainingData(
    assistant: AIAssistant
  ): Promise<{ entries: TrainingEntry[]; context: string }> {
    // Fetch all training entries for the assistant
    const entries = await this.getTrainingEntries(assistant.id);
    
    // For now, we'll use all entries, but in a real implementation,
    // you might want to:
    // 1. Use semantic search to find relevant entries
    // 2. Limit the number of entries to fit within context window
    // 3. Order by relevance/importance
    
    // Convert entries into a context string
    const context = entries
      .map((entry) => {
        switch (entry.entry_type) {
          case 'example_conversation':
            return `Example Conversation:\n${entry.text_content}`;
          case 'knowledge_fact':
            return `Known Fact: ${entry.text_content}`;
          case 'behavioral_prompt':
            return `Behavior Guide: ${entry.text_content}`;
          case 'capability_demo':
            return `Capability: ${entry.text_content}`;
          default:
            return entry.text_content;
        }
      })
      .join('\n\n');

    return { entries, context };
  }  /**
   * Update an existing training entry
   */
  async updateTrainingEntry(
    entryId: string,
    question?: string,
    answer?: string
  ): Promise<TrainingEntry> {
    try {
      console.log('Updating training entry:', entryId);

      // Use the RPC endpoint to call the database function
      const { data, error } = await supabase
        .rpc('update_assistant_training', { 
          entry_id: entryId,
          question: question,
          answer: answer
        });
      
      if (error) {
        console.error('Error from update_assistant_training RPC:', error);
        throw error;
      }
      
      console.log('Training entry updated:', data);
      return data as unknown as TrainingEntry;
    } catch (error) {
      console.error('Error updating training entry:', error);
      throw error;
    }
  }

  /**
   * Delete a training entry
   */
  async deleteTrainingEntry(entryId: string): Promise<boolean> {
    try {
      console.log('Deleting training entry:', entryId);

      // Use the RPC endpoint to call the database function
      const { data, error } = await supabase
        .rpc('delete_assistant_training', { entry_id: entryId });
      
      if (error) {
        console.error('Error from delete_assistant_training RPC:', error);
        throw error;
      }
      
      console.log('Training entry deleted:', data);
      return data as boolean;
    } catch (error) {
      console.error('Error deleting training entry:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    try {
      const { data, error } = await supabase.rpc('test_db_connection');
      
      if (error) {
        console.error('Error testing database connection:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error in testDatabaseConnection:', error);
      return { success: false, error: 'Connection failed' };
    }
  }

  /**
   * Alias for database connection test
   */
  async testConnection() {
    return this.testDatabaseConnection();
  }
}

export const assistantTrainingService = AssistantTrainingService.getInstance();

// Re-export types for convenience
export type { TrainingEntry } from '@/types/training';
