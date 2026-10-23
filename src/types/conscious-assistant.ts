// Personal Context Types for Conscious Assistant System
export interface UserAspiration {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: AspirationCategory;
  priority: 1 | 2 | 3 | 4 | 5;
  target_date?: string;
  status: AspirationStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export type AspirationCategory = 
  | 'career' 
  | 'personal' 
  | 'health' 
  | 'relationships' 
  | 'financial' 
  | 'spiritual' 
  | 'creative' 
  | 'learning';

export type AspirationStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface DailyGoal {
  id: string;
  user_id: string;
  aspiration_id?: string;
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  estimated_duration?: number; // in minutes
  scheduled_time?: string;
  status: GoalStatus;
  completion_notes?: string;
  energy_level?: 1 | 2 | 3 | 4 | 5;
  goal_date: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export type GoalStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';

export interface UserPreference {
  id: string;
  user_id: string;
  preference_type: PreferenceType;
  preference_key: string;
  preference_value: any;
  created_at: string;
  updated_at: string;
}

export type PreferenceType = 
  | 'communication_style' 
  | 'greeting_time' 
  | 'notification_frequency' 
  | 'interaction_mode'
  | 'personality_traits'
  | 'privacy_settings';

export interface EmotionalState {
  id: string;
  user_id: string;
  mood_score: number; // 1-10
  energy_level: number; // 1-10
  stress_level: number; // 1-10
  motivation_level: number; // 1-10
  notes?: string;
  context_tags: string[];
  recorded_at: string;
  metadata: Record<string, any>;
}

export interface DailyInteraction {
  id: string;
  user_id: string;
  interaction_type: InteractionType;
  interaction_content: any;
  user_response?: any;
  sentiment_score?: number; // -1 to 1
  engagement_level?: 1 | 2 | 3 | 4 | 5;
  follow_up_scheduled: boolean;
  follow_up_time?: string;
  interaction_time: string;
  metadata: Record<string, any>;
}

export type InteractionType = 
  | 'greeting' 
  | 'check_in' 
  | 'goal_update' 
  | 'aspiration_review'
  | 'mood_assessment'
  | 'progress_celebration'
  | 'motivational_message'
  | 'question_followup';

export interface PersonalContext {
  id: string;
  user_id: string;
  context_type: ContextType;
  context_key: string;
  context_value: any;
  confidence_score: number; // 0-1
  last_reinforced: string;
  reinforcement_count: number;
  created_at: string;
  updated_at: string;
}

export type ContextType = 
  | 'habit' 
  | 'pattern' 
  | 'preference' 
  | 'memory' 
  | 'behavioral_trait'
  | 'communication_style'
  | 'work_pattern'
  | 'life_context';

export interface AspirationMilestone {
  id: string;
  aspiration_id: string;
  title: string;
  description?: string;
  target_date?: string;
  completed_date?: string;
  celebration_message?: string;
  created_at: string;
}

// Conscious Assistant Interaction Types
export interface ConsciousGreeting {
  greeting_message: string;
  aspiration_reminder?: string;
  daily_goals: DailyGoal[];
  follow_up_questions: FollowUpQuestion[];
  mood_check: boolean;
  personalization_data: PersonalizationContext;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: QuestionType;
  context: string;
  expected_response_type: 'text' | 'rating' | 'selection' | 'boolean';
  options?: string[];
}

export type QuestionType = 
  | 'energy_assessment'
  | 'priority_clarification'
  | 'obstacle_identification'
  | 'motivation_check'
  | 'progress_reflection'
  | 'goal_refinement';

export interface PersonalizationContext {
  user_name?: string;
  preferred_communication_style: CommunicationStyle;
  current_emotional_state?: EmotionalState;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  recent_achievements: Achievement[];
  upcoming_priorities: DailyGoal[];
  contextual_factors: string[];
}

export type CommunicationStyle = 
  | 'professional'
  | 'friendly'
  | 'encouraging'
  | 'direct'
  | 'empathetic'
  | 'motivational'
  | 'casual';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achieved_at: string;
  celebration_level: 'small' | 'medium' | 'large';
  related_aspiration_id?: string;
}

// Reasoning Engine Types
export interface ReasoningContext {
  user_history: UserHistorySnapshot;
  current_state: CurrentUserState;
  environmental_factors: EnvironmentalFactors;
  prediction_confidence: number;
}

export interface UserHistorySnapshot {
  recent_interactions: DailyInteraction[];
  goal_completion_patterns: GoalPattern[];
  aspiration_progress_trends: ProgressTrend[];
  emotional_patterns: EmotionalPattern[];
  engagement_history: EngagementMetrics;
}

export interface CurrentUserState {
  active_aspirations: UserAspiration[];
  today_goals: DailyGoal[];
  current_mood?: EmotionalState;
  energy_level?: number;
  stress_indicators: string[];
  available_time_slots: TimeSlot[];
}

export interface EnvironmentalFactors {
  time_of_day: string;
  day_of_week: string;
  upcoming_events: CalendarEvent[];
  external_context: ExternalContext;
}

export interface GoalPattern {
  pattern_type: 'completion_time' | 'difficulty_preference' | 'energy_correlation';
  pattern_description: string;
  confidence: number;
  supporting_data_points: number;
}

export interface ProgressTrend {
  aspiration_id: string;
  trend_direction: 'improving' | 'stable' | 'declining';
  velocity: number; // rate of progress
  predicted_completion_date?: string;
  risk_factors: string[];
}

export interface EmotionalPattern {
  trigger_context: string;
  typical_response: string;
  mood_correlation: number;
  time_patterns: string[];
}

export interface EngagementMetrics {
  response_rate: number;
  interaction_frequency: number;
  goal_follow_through_rate: number;
  satisfaction_trend: number;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  energy_level_prediction: number;
  availability_confidence: number;
}

export interface CalendarEvent {
  title: string;
  start_time: string;
  end_time: string;
  type: 'meeting' | 'appointment' | 'personal' | 'work';
  stress_level_impact: number;
}

export interface ExternalContext {
  weather?: string;
  news_sentiment?: number;
  market_conditions?: string;
  social_context?: string[];
}

// Service Interface Types
export interface ConsciousAssistantService {
  generateDailyGreeting(userId: string): Promise<ConsciousGreeting>;
  processUserResponse(userId: string, response: any, interactionId: string): Promise<void>;
  updatePersonalContext(userId: string, contextUpdates: Partial<PersonalContext>[]): Promise<void>;
  analyzeUserPatterns(userId: string): Promise<UserHistorySnapshot>;
  predictOptimalInteractionTime(userId: string): Promise<string>;
  generateFollowUpQuestions(userId: string, context: string): Promise<FollowUpQuestion[]>;
  celebrateAchievement(userId: string, achievement: Achievement): Promise<string>;
  assessEmotionalState(userId: string, indicators: string[]): Promise<EmotionalState>;
}