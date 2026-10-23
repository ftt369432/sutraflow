import { supabase } from '../lib/supabase';
import type {
  UserAspiration,
  DailyGoal,
  UserPreference,
  EmotionalState,
  DailyInteraction,
  PersonalContext,
  AspirationMilestone,
  ConsciousGreeting,
  FollowUpQuestion,
  PersonalizationContext,
  ReasoningContext,
  Achievement
} from '../types/conscious-assistant';

class PersonalContextService {
  // ===== ASPIRATIONS =====
  async getUserAspirations(userId: string): Promise<UserAspiration[]> {
    const { data, error } = await supabase
      .from('user_aspirations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAspiration(aspiration: Omit<UserAspiration, 'id' | 'created_at' | 'updated_at'>): Promise<UserAspiration> {
    const { data, error } = await supabase
      .from('user_aspirations')
      .insert(aspiration)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAspirationProgress(aspirationId: string, progress: number, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('user_aspirations')
      .update({ 
        progress_percentage: progress,
        metadata: { last_progress_note: notes }
      })
      .eq('id', aspirationId);

    if (error) throw error;
  }

  // ===== DAILY GOALS =====
  async getTodayGoals(userId: string): Promise<DailyGoal[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', today)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createDailyGoal(goal: Omit<DailyGoal, 'id' | 'created_at' | 'updated_at'>): Promise<DailyGoal> {
    const { data, error } = await supabase
      .from('daily_goals')
      .insert(goal)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGoalStatus(goalId: string, status: DailyGoal['status'], notes?: string): Promise<void> {
    const { error } = await supabase
      .from('daily_goals')
      .update({ 
        status,
        completion_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId);

    if (error) throw error;
  }

  // ===== USER PREFERENCES =====
  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async setUserPreference(
    userId: string, 
    type: UserPreference['preference_type'], 
    key: string, 
    value: any
  ): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_type: type,
        preference_key: key,
        preference_value: value
      });

    if (error) throw error;
  }

  // ===== EMOTIONAL STATE =====
  async recordEmotionalState(state: Omit<EmotionalState, 'id' | 'recorded_at'>): Promise<EmotionalState> {
    const { data, error } = await supabase
      .from('emotional_states')
      .insert(state)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRecentEmotionalState(userId: string, days: number = 7): Promise<EmotionalState[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('emotional_states')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== INTERACTIONS =====
  async recordInteraction(interaction: Omit<DailyInteraction, 'id' | 'interaction_time'>): Promise<DailyInteraction> {
    const { data, error } = await supabase
      .from('daily_interactions')
      .insert(interaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateInteractionResponse(
    interactionId: string, 
    response: any, 
    sentiment?: number
  ): Promise<void> {
    const { error } = await supabase
      .from('daily_interactions')
      .update({
        user_response: response,
        sentiment_score: sentiment
      })
      .eq('id', interactionId);

    if (error) throw error;
  }

  // ===== PERSONAL CONTEXT =====
  async updatePersonalContext(
    userId: string,
    contextType: PersonalContext['context_type'],
    contextKey: string,
    contextValue: any,
    confidence: number = 0.8
  ): Promise<void> {
    const { error } = await supabase
      .from('personal_context')
      .upsert({
        user_id: userId,
        context_type: contextType,
        context_key: contextKey,
        context_value: contextValue,
        confidence_score: confidence,
        last_reinforced: new Date().toISOString(),
        reinforcement_count: 1
      });

    if (error) throw error;
  }

  async getPersonalContext(userId: string, contextType?: string): Promise<PersonalContext[]> {
    let query = supabase
      .from('personal_context')
      .select('*')
      .eq('user_id', userId);

    if (contextType) {
      query = query.eq('context_type', contextType);
    }

    const { data, error } = await query.order('confidence_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== ACHIEVEMENTS =====
  async recordAchievement(achievement: Omit<Achievement, 'id'>): Promise<Achievement> {
    // Store in personal_context as achievement record
    await this.updatePersonalContext(
      achievement.achieved_at, // Will need user_id parameter
      'memory',
      `achievement_${Date.now()}`,
      achievement,
      1.0
    );

    return { ...achievement, id: `ach_${Date.now()}` };
  }

  // ===== ANALYSIS METHODS =====
  async analyzeUserPatterns(userId: string): Promise<any> {
    // Get recent interactions for pattern analysis
    const [interactions, goals, emotionalStates] = await Promise.all([
      this.getRecentInteractions(userId, 30),
      this.getRecentGoals(userId, 30),
      this.getRecentEmotionalState(userId, 30)
    ]);

    return {
      interaction_patterns: this.analyzeInteractionPatterns(interactions),
      goal_completion_patterns: this.analyzeGoalPatterns(goals),
      emotional_patterns: this.analyzeEmotionalPatterns(emotionalStates),
      engagement_metrics: this.calculateEngagementMetrics(interactions, goals)
    };
  }

  private async getRecentInteractions(userId: string, days: number): Promise<DailyInteraction[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_interactions')
      .select('*')
      .eq('user_id', userId)
      .gte('interaction_time', startDate.toISOString())
      .order('interaction_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getRecentGoals(userId: string, days: number): Promise<DailyGoal[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .gte('goal_date', startDate.toISOString().split('T')[0])
      .order('goal_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private analyzeInteractionPatterns(interactions: DailyInteraction[]): any {
    const hourlyActivity = new Map<number, number>();
    const responseRates = new Map<string, { responded: number; total: number }>();

    interactions.forEach(interaction => {
      const hour = new Date(interaction.interaction_time).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);

      const type = interaction.interaction_type;
      const current = responseRates.get(type) || { responded: 0, total: 0 };
      current.total++;
      if (interaction.user_response) current.responded++;
      responseRates.set(type, current);
    });

    return {
      most_active_hours: Array.from(hourlyActivity.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => hour),
      response_rates: Object.fromEntries(
        Array.from(responseRates.entries()).map(([type, data]) => [
          type,
          data.total > 0 ? data.responded / data.total : 0
        ])
      )
    };
  }

  private analyzeGoalPatterns(goals: DailyGoal[]): any {
    const completionByPriority = new Map<number, { completed: number; total: number }>();
    const completionByTimeOfDay = new Map<string, { completed: number; total: number }>();

    goals.forEach(goal => {
      // Priority analysis
      const priority = goal.priority;
      const priorityData = completionByPriority.get(priority) || { completed: 0, total: 0 };
      priorityData.total++;
      if (goal.status === 'completed') priorityData.completed++;
      completionByPriority.set(priority, priorityData);

      // Time analysis
      if (goal.scheduled_time) {
        const hour = parseInt(goal.scheduled_time.split(':')[0]);
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        const timeData = completionByTimeOfDay.get(timeSlot) || { completed: 0, total: 0 };
        timeData.total++;
        if (goal.status === 'completed') timeData.completed++;
        completionByTimeOfDay.set(timeSlot, timeData);
      }
    });

    return {
      completion_by_priority: Object.fromEntries(completionByPriority),
      completion_by_time: Object.fromEntries(completionByTimeOfDay),
      overall_completion_rate: goals.length > 0 
        ? goals.filter(g => g.status === 'completed').length / goals.length 
        : 0
    };
  }

  private analyzeEmotionalPatterns(states: EmotionalState[]): any {
    if (states.length === 0) return { average_mood: 5, trend: 'stable' };

    const avgMood = states.reduce((sum, state) => sum + state.mood_score, 0) / states.length;
    const recent = states.slice(0, 7);
    const older = states.slice(7, 14);
    
    const recentAvg = recent.length > 0 
      ? recent.reduce((sum, state) => sum + state.mood_score, 0) / recent.length 
      : avgMood;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, state) => sum + state.mood_score, 0) / older.length 
      : avgMood;

    const trend = recentAvg > olderAvg + 0.5 ? 'improving' : 
                  recentAvg < olderAvg - 0.5 ? 'declining' : 'stable';

    return {
      average_mood: avgMood,
      recent_trend: trend,
      mood_range: [
        Math.min(...states.map(s => s.mood_score)),
        Math.max(...states.map(s => s.mood_score))
      ]
    };
  }

  private calculateEngagementMetrics(interactions: DailyInteraction[], goals: DailyGoal[]): any {
    const totalInteractions = interactions.length;
    const responsiveInteractions = interactions.filter(i => i.user_response).length;
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    return {
      response_rate: totalInteractions > 0 ? responsiveInteractions / totalInteractions : 0,
      goal_completion_rate: totalGoals > 0 ? completedGoals / totalGoals : 0,
      interaction_frequency: totalInteractions / 30, // per day over 30 days
      engagement_trend: this.calculateEngagementTrend(interactions)
    };
  }

  private calculateEngagementTrend(interactions: DailyInteraction[]): string {
    if (interactions.length < 14) return 'insufficient_data';

    const recent = interactions.slice(0, 7);
    const older = interactions.slice(7, 14);

    const recentEngagement = recent.reduce((sum, i) => sum + (i.engagement_level || 3), 0) / recent.length;
    const olderEngagement = older.reduce((sum, i) => sum + (i.engagement_level || 3), 0) / older.length;

    return recentEngagement > olderEngagement + 0.3 ? 'increasing' :
           recentEngagement < olderEngagement - 0.3 ? 'decreasing' : 'stable';
  }
}

export const personalContextService = new PersonalContextService();