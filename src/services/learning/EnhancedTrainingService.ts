import { TrainingEntry, EffectivenessMetrics, UsageTrend } from '../../types/training';
import { LearningService } from '../LearningService';
import { LearningPattern, UserBehavior } from '../../types/learning';
import { AIAssistant } from '../../types/ai';

/**
 * Enhanced Training Service
 * 
 * This service connects the training components with the learning systems,
 * ensuring that training data is used to improve assistant performance.
 */
export class EnhancedTrainingService {
  private static instance: EnhancedTrainingService;
  private learningService: LearningService;
  private trainingEntries = new Map<string, TrainingEntry[]>(); // assistantId -> entries
  private effectivenessMetrics = new Map<string, EffectivenessMetrics[]>(); // assistantId -> metrics
  
  private constructor() {
    this.learningService = new LearningService();
  }
  
  public static getInstance(): EnhancedTrainingService {
    if (!EnhancedTrainingService.instance) {
      EnhancedTrainingService.instance = new EnhancedTrainingService();
    }
    return EnhancedTrainingService.instance;
  }
  
  /**
   * Add a training entry and convert it to learning behavior
   * 
   * @param assistantId - ID of the assistant
   * @param entry - Training entry to add
   */
  public async addTrainingEntry(assistantId: string, entry: TrainingEntry): Promise<void> {
    // Store the entry
    const entries = this.trainingEntries.get(assistantId) || [];
    entries.push(entry);
    this.trainingEntries.set(assistantId, entries);
    
    // Convert to a learning behavior
    const behavior: UserBehavior = {
      type: 'training',
      timestamp: new Date(),
      context: {
        assistantId,
        question: entry.question,
        answer: entry.answer,
        entryType: entry.entry_type || 'example_conversation'
      },
      metadata: {
        frequency: 1,
        importance: 0.8, // Training entries are important
        duration: 0
      }
    };
    
    // Record in the learning service
    this.learningService.recordBehavior(behavior);
    
    console.log(`Training entry added for assistant ${assistantId}`);
    
    // Update effectiveness metrics
    await this.updateEffectivenessMetrics(assistantId, entry);
  }
  
  /**
   * Update effectiveness metrics for an assistant
   */
  private async updateEffectivenessMetrics(assistantId: string, entry: TrainingEntry): Promise<void> {
    const now = new Date();
    const metrics: EffectivenessMetrics = {
      id: now.getTime().toString(),
      assistant_id: assistantId,
      date: now.toISOString(),
      entry_id: entry.id,
      accuracy: entry.effectiveness_score || 0.7,
      response_time_ms: 500, // Placeholder
      scenario_complexity: this.calculateComplexity(entry.question),
      improvement_from_baseline: 0.1 // Placeholder
    };
    
    const currentMetrics = this.effectivenessMetrics.get(assistantId) || [];
    currentMetrics.push(metrics);
    this.effectivenessMetrics.set(assistantId, currentMetrics);
  }
  
  /**
   * Calculate the complexity of a training query
   */
  private calculateComplexity(text: string): number {
    // Simple complexity calculation based on text length and question marks
    const length = text.length;
    const questionMarks = (text.match(/\?/g) || []).length;
    
    // Complexity from 0 to 1
    return Math.min(1, (length / 200) * 0.7 + (questionMarks / 3) * 0.3);
  }
  
  /**
   * Get training entries for an assistant
   */
  public getTrainingEntries(assistantId: string): TrainingEntry[] {
    return this.trainingEntries.get(assistantId) || [];
  }
  
  /**
   * Get effectiveness metrics for an assistant
   */
  public getEffectivenessMetrics(assistantId: string): EffectivenessMetrics[] {
    return this.effectivenessMetrics.get(assistantId) || [];
  }
  
  /**
   * Get usage trends for an assistant
   */
  public getUsageTrends(assistantId: string, timeframe = '30 days'): UsageTrend[] {
    // Generate mock usage trends for now
    const trends: UsageTrend[] = [];
    const days = timeframe === '7 days' ? 7 : timeframe === '30 days' ? 30 : 90;
    
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        id: date.getTime().toString(),
        date: date.toISOString().split('T')[0],
        assistant_id: assistantId,
        query_count: Math.floor(Math.random() * 20),
        success_rate: 0.7 + Math.random() * 0.3,
        avg_response_time_ms: 300 + Math.random() * 200,
        user_satisfaction: 0.6 + Math.random() * 0.4
      });
    }
    
    // Sort by date ascending
    return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  /**
   * Apply training insights to an assistant
   */
  public applyTrainingInsights(assistant: AIAssistant): AIAssistant {
    const entries = this.getTrainingEntries(assistant.id!);
    
    if (!entries || entries.length === 0) {
      return assistant;
    }
    
    // Analyze entries to extract patterns
    const patterns = this.analyzeTrainingPatterns(entries);
    
    // Enhanced system prompt based on training patterns
    let enhancedPrompt = assistant.system_prompt || '';
    
    // Add examples from high-performing training entries
    const examples = this.getTopPerformingExamples(entries, 3);
    if (examples.length > 0) {
      enhancedPrompt += '\n\nHere are examples of how to respond to specific questions:\n\n';
      
      for (const example of examples) {
        enhancedPrompt += `User: ${example.question}\nAssistant: ${example.answer}\n\n`;
      }
    }
    
    // Add detected areas of expertise
    const expertiseAreas = this.extractExpertiseAreas(entries);
    if (expertiseAreas.length > 0) {
      enhancedPrompt += `\nYou have particular expertise in these areas: ${expertiseAreas.join(', ')}.`;
    }
    
    // Update the assistant with enhanced prompt
    return {
      ...assistant,
      system_prompt: enhancedPrompt,
      updatedAt: new Date(),
      trainingStatus: {
        entriesCount: entries.length,
        lastTrainedAt: new Date(),
        patternsDetected: patterns.length,
        improvementScore: this.calculateImprovementScore(entries)
      }
    };
  }
  
  /**
   * Analyze training entries to extract patterns
   */
  private analyzeTrainingPatterns(entries: TrainingEntry[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    
    // Group entries by type
    const entryGroups = new Map<string, TrainingEntry[]>();
    
    entries.forEach(entry => {
      const type = entry.entry_type || 'example_conversation';
      const group = entryGroups.get(type) || [];
      group.push(entry);
      entryGroups.set(type, group);
    });
    
    // Create patterns for each group
    entryGroups.forEach((groupEntries, type) => {
      if (groupEntries.length >= 3) {
        patterns.push({
          id: `training-${type}-${Date.now()}`,
          type: 'behavior',
          confidence: groupEntries.length / entries.length,
          frequency: groupEntries.length,
          context: { type, category: 'training' },
          metadata: {
            lastObserved: new Date(),
            sampleSize: groupEntries.length
          }
        });
      }
    });
    
    return patterns;
  }
  
  /**
   * Get the top performing examples from training entries
   */
  private getTopPerformingExamples(entries: TrainingEntry[], count: number): TrainingEntry[] {
    return entries
      .filter(entry => entry.effectiveness_score !== undefined)
      .sort((a, b) => (b.effectiveness_score || 0) - (a.effectiveness_score || 0))
      .slice(0, count);
  }
  
  /**
   * Extract areas of expertise from training entries
   */
  private extractExpertiseAreas(entries: TrainingEntry[]): string[] {
    const areas = new Map<string, number>();
    
    // Extract keywords from training entries
    entries.forEach(entry => {
      const keywords = this.extractKeywords(entry.question + ' ' + entry.answer);
      
      keywords.forEach(keyword => {
        const count = areas.get(keyword) || 0;
        areas.set(keyword, count + 1);
      });
    });
    
    // Sort areas by frequency and take top 5
    return Array.from(areas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area]) => area);
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Very simple keyword extraction
    const words = text.toLowerCase().split(/\W+/);
    
    // Filter out common words and short words
    const stopWords = new Set(['the', 'and', 'or', 'of', 'to', 'a', 'in', 'that', 'have', 'it', 'for', 'with', 'as', 'be', 'by']);
    const filteredWords = words.filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count word frequency
    const wordCounts = new Map<string, number>();
    filteredWords.forEach(word => {
      const count = wordCounts.get(word) || 0;
      wordCounts.set(word, count + 1);
    });
    
    // Return top keywords
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  /**
   * Calculate improvement score based on training entries
   */
  private calculateImprovementScore(entries: TrainingEntry[]): number {
    if (entries.length === 0) return 0;
    
    // Calculate average effectiveness score
    const effectivenessScores = entries
      .filter(entry => entry.effectiveness_score !== undefined)
      .map(entry => entry.effectiveness_score || 0);
    
    if (effectivenessScores.length === 0) return 0.5; // Default
    
    const avgEffectiveness = effectivenessScores.reduce((sum, score) => sum + score, 0) / effectivenessScores.length;
    
    return Math.min(1, Math.max(0, avgEffectiveness));
  }
}
