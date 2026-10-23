import { supabase } from '@/lib/supabaseClient'

export interface TrainingInsights {
  quality: {
    category: string
    score: number
    findings: string[]
    recommendations: string[]
  }[]
  insights: {
    assistant_id: string
    assistant_name: string
    entry_type_stats: Record<string, {
      count: number
      effectiveness: number
      usage: number
      last_updated: string
    }>
    entries_last_7d: number
    entries_last_30d: number
    used_last_7d: number
    status: 'active' | 'stale' | 'inactive'
  }
}

export interface TrainingRecommendation {
  priority: number
  category: string
  recommendation: string
  action_items: string[]
  impact_score: number
}

export interface SemanticMatch {
  id: string
  text_content: string
  entry_type: string
  similarity: number
}

class TrainingInsightsService {
  /**
   * Get semantic search results for training entries
   */
  async semanticSearch(
    assistantId: string,
    query: string,
    options: {
      threshold?: number
      limit?: number
    } = {}
  ): Promise<SemanticMatch[]> {
    const { data, error } = await supabase.functions.invoke('training-insights', {
      body: {
        action: 'semantic-search',
        query,
        assistantId,
        threshold: options.threshold ?? 0.7,
        limit: options.limit ?? 5
      }
    })

    if (error) {
      console.error('Error in semantic search:', error)
      throw error
    }

    return data?.matches || []
  }

  /**
   * Get comprehensive training analysis
   */
  async getAnalysis(assistantId: string): Promise<TrainingInsights> {
    const { data, error } = await supabase.functions.invoke('training-insights', {
      body: { 
        action: 'analyze',
        assistantId 
      }
    })

    if (error) {
      console.error('Error getting training analysis:', error)
      throw error
    }

    return data || { quality: [], insights: { 
      assistant_id: assistantId, 
      assistant_name: '', 
      entry_type_stats: {}, 
      entries_last_7d: 0, 
      entries_last_30d: 0, 
      used_last_7d: 0, 
      status: 'inactive' 
    }}
  }

  /**
   * Get prioritized recommendations for improving training
   */
  async getRecommendations(assistantId: string): Promise<TrainingRecommendation[]> {
    const { data, error } = await supabase.functions.invoke('training-insights', {
      body: { 
        action: 'recommendations',
        assistantId 
      }
    })

    if (error) {
      console.error('Error getting recommendations:', error)
      throw error
    }

    return data?.recommendations || []
  }

  /**
   * Update embeddings for semantic search
   */
  async updateEmbeddings(entryId: string, content: string): Promise<void> {
    const { error } = await supabase.functions.invoke('training-insights', {
      body: { 
        action: 'update-embeddings',
        entryId, 
        content 
      }
    })

    if (error) {
      console.error('Error updating embeddings:', error)
      throw error
    }
  }

  /**
   * Get training effectiveness over time
   */
  async getEffectivenessHistory(
    assistantId: string,
    timeframe = '30 days'
  ): Promise<{ date: string; effectiveness: number }[]> {
    const { data, error } = await supabase
      .from('assistant_training_entries')
      .select('effectiveness_score, created_at')
      .eq('assistant_id', assistantId)
      .gte('created_at', `now() - interval '${timeframe}'`)
      .order('created_at')

    if (error) throw error

    // Group by date and calculate average effectiveness
    const dailyEffectiveness = data.reduce((acc: Record<string, number[]>, entry) => {
      const date = new Date(entry.created_at).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = []
      if (entry.effectiveness_score !== null) {
        acc[date].push(entry.effectiveness_score)
      }
      return acc
    }, {})

    return Object.entries(dailyEffectiveness).map(([date, scores]) => ({
      date,
      effectiveness: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
  }

  /**
   * Get training entry version history
   */
  async getVersionHistory(entryId: string): Promise<{
    version: number
    content: string
    effectiveness: number
    created_at: string
  }[]> {
    const { data, error } = await supabase
      .from('assistant_training_entry_versions')
      .select('*')
      .eq('entry_id', entryId)
      .order('version', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Generate automated improvement suggestions
   */
  async generateImprovements(entryId: string): Promise<{
    current_content: string
    suggestions: string[]
    rationale: string
  }> {
    const { data, error } = await supabase.functions.invoke('training-insights', {
      body: { 
        action: 'generate-improvements',
        entryId 
      }
    })

    if (error) {
      console.error('Error generating improvements:', error)
      throw error
    }

    return data || { current_content: '', suggestions: [], rationale: '' }
  }

  /**
   * Detect potential conflicts or redundancies
   */
  async detectConflicts(assistantId: string): Promise<{
    conflicts: {
      entries: string[]
      type: 'contradiction' | 'redundancy'
      severity: 'low' | 'medium' | 'high'
      explanation: string
    }[]
  }> {
    const { data, error } = await supabase.functions.invoke('training-insights', {
      body: { 
        action: 'detect-conflicts',
        assistantId 
      }
    })

    if (error) {
      console.error('Error detecting conflicts:', error)
      throw error
    }

    return data || { conflicts: [] }
  }
}

export const trainingInsights = new TrainingInsightsService()
