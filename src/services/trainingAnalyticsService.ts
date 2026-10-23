import { supabase } from '@/lib/supabaseClient';
import { TrainingEntry } from '@/types/training';

export interface TrainingAnalytics {
  total_entries: number;
  conversation_examples: number;
  knowledge_facts: number;
  behavioral_prompts: number;
  capability_demos: number;
  avg_effectiveness: number;
  total_uses: number;
  last_entry_date: string;
}

/**
 * Service for analyzing and improving assistant training data
 */
class TrainingAnalyticsService {
  private static instance: TrainingAnalyticsService;

  private constructor() {}

  public static getInstance(): TrainingAnalyticsService {
    if (!TrainingAnalyticsService.instance) {
      TrainingAnalyticsService.instance = new TrainingAnalyticsService();
    }
    return TrainingAnalyticsService.instance;
  }

  /**
   * Find similar training entries to avoid duplicates
   */
  async findSimilarEntries(assistantId: string, searchText: string): Promise<TrainingEntry[]> {
    const { data, error } = await supabase.functions.invoke('training-analytics', {
      body: {
        action: 'similar',
        assistant_id: assistantId,
        search_text: searchText,
      }
    });

    if (error) {
      console.error('Error finding similar entries:', error);
      throw error;
    }

    return data?.entries || [];
  }

  /**
   * Get the most effective training entries
   */
  async getEffectiveEntries(assistantId: string, minUsageCount = 5): Promise<TrainingEntry[]> {
    const { data, error } = await supabase.functions.invoke('training-analytics', {
      body: {
        action: 'effective',
        assistant_id: assistantId,
        min_usage_count: minUsageCount,
      }
    });

    if (error) {
      console.error('Error getting effective entries:', error);
      throw error;
    }

    return data?.entries || [];
  }

  /**
   * Get analytics for an assistant's training data
   */
  async getAnalytics(assistantId: string): Promise<TrainingAnalytics> {
    const { data, error } = await supabase.functions.invoke('training-analytics', {
      body: {
        action: 'analytics',
        assistant_id: assistantId
      }
    });

    if (error) {
      console.error('Error getting training analytics:', error);
      throw error;
    }

    return data?.analytics || {
      total_entries: 0,
      conversation_examples: 0,
      knowledge_facts: 0,
      behavioral_prompts: 0,
      capability_demos: 0,
      avg_effectiveness: 0,
      total_uses: 0,
      last_entry_date: new Date().toISOString()
    };
  }

  /**
   * Update the effectiveness score for a training entry
   */
  async updateEffectiveness(entryId: string, successScore: number): Promise<void> {
    const { error } = await supabase.functions.invoke('training-analytics', {
      body: {
        action: 'update-effectiveness',
        entry_id: entryId,
        success_score: successScore,
      }
    });

    if (error) {
      console.error('Error updating effectiveness:', error);
      throw error;
    }
  }

  /**
   * Get usage history for training entries
   */
  async getUsageHistory(assistantId: string, timeframe = '30 days'): Promise<{ date: string; count: number }[]> {
    const { data, error } = await supabase.functions.invoke('training-analytics', {
      body: {
        action: 'usage-history',
        assistant_id: assistantId,
        timeframe,
      }
    });

    if (error) {
      console.error('Error getting usage history:', error);
      throw error;
    }

    return data?.usageHistory || [];
  }

  /**
   * Export analytics data
   */
  async exportData(assistantId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const { data, error } = await supabase.functions.invoke('training-analytics', {
      body: {
        action: 'export',
        assistant_id: assistantId,
        format,
      }
    });

    if (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }

    const content = format === 'json' ? JSON.stringify(data, null, 2) : (data || '');
    return new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });
  }
}

// Export singleton instance
export const trainingAnalytics = TrainingAnalyticsService.getInstance();
