import { personalContextService } from './personalContextService';
import type {
  ConsciousGreeting,
  FollowUpQuestion,
  PersonalizationContext,
  UserAspiration,
  DailyGoal,
  EmotionalState,
  Achievement,
  CommunicationStyle,
  InteractionType
} from '../types/conscious-assistant';

class ConsciousAssistantService {
  private greetingTemplates = {
    morning: {
      professional: "Good morning, {name}! Ready to tackle today's priorities with focus and determination?",
      friendly: "Hey {name}! Hope you're feeling energized for another amazing day! 🌟",
      encouraging: "Good morning, {name}! Today is full of possibilities - let's make it count! 💪",
      direct: "Morning, {name}. Here's what we need to accomplish today:",
      empathetic: "Good morning, {name}. How are you feeling as we start this new day?",
      motivational: "Rise and shine, {name}! Today is your canvas - let's paint something beautiful! 🎨"
    },
    afternoon: {
      professional: "Good afternoon, {name}. Let's review your progress and plan the rest of your day.",
      friendly: "Hey there, {name}! How's your day going so far? 😊",
      encouraging: "Afternoon check-in, {name}! You're doing great - keep that momentum going!",
      direct: "Afternoon, {name}. Status update on today's goals:",
      empathetic: "How are you holding up this afternoon, {name}? Remember to take care of yourself.",
      motivational: "Afternoon power hour, {name}! This is when champions are made! 🚀"
    },
    evening: {
      professional: "Good evening, {name}. Time to reflect on today's accomplishments and prepare for tomorrow.",
      friendly: "Evening, {name}! Ready to wind down and celebrate today's wins? 🌙",
      encouraging: "Great work today, {name}! Let's appreciate what you've achieved.",
      direct: "Evening review, {name}. Here's what happened today:",
      empathetic: "How are you feeling at the end of this day, {name}? You've done well.",
      motivational: "Evening reflection time, {name}! Every champion reviews their victories! 🏆"
    }
  };

  private aspirationReminders = {
    career: "Your career aspiration '{title}' is {progress}% complete. Today's focus can move you closer to that promotion/goal!",
    health: "Remember your health goal '{title}'? Small daily actions create big transformations!",
    personal: "Your personal growth journey '{title}' is progressing beautifully. Keep investing in yourself!",
    relationships: "Nurturing relationships is a journey. Your '{title}' aspiration shows you care about meaningful connections.",
    financial: "Financial freedom through '{title}' - every smart decision today builds your future security!",
    spiritual: "Your spiritual path '{title}' brings deeper meaning to everything you do.",
    creative: "Your creative aspiration '{title}' adds beauty and innovation to the world!",
    learning: "Knowledge is power! Your learning goal '{title}' is expanding your horizons daily."
  };

  async generateDailyGreeting(userId: string): Promise<ConsciousGreeting> {
    // Gather all personal context
    const [aspirations, todayGoals, preferences, recentMood] = await Promise.all([
      personalContextService.getUserAspirations(userId),
      personalContextService.getTodayGoals(userId),
      personalContextService.getUserPreferences(userId),
      this.getRecentMood(userId)
    ]);

    const personalization = await this.buildPersonalizationContext(
      userId, preferences, recentMood, aspirations, todayGoals
    );

    // Generate greeting based on time and style
    const timeOfDay = this.getTimeOfDay();
    const communicationStyle = this.getCommunicationStyle(preferences);
    const greetingMessage = this.buildGreetingMessage(personalization, timeOfDay, communicationStyle);

    // Select aspiration to highlight
    const aspirationReminder = this.selectAspirationReminder(aspirations);

    // Generate contextual follow-up questions
    const followUpQuestions = await this.generateFollowUpQuestions(
      userId, personalization, aspirations, todayGoals
    );

    // Record this interaction
    await personalContextService.recordInteraction({
      user_id: userId,
      interaction_type: 'greeting',
      interaction_content: {
        greeting_message: greetingMessage,
        aspiration_reminder: aspirationReminder,
        goals_count: todayGoals.length,
        time_of_day: timeOfDay
      },
      follow_up_scheduled: followUpQuestions.length > 0,
      metadata: { communication_style: communicationStyle }
    });

    return {
      greeting_message: greetingMessage,
      aspiration_reminder: aspirationReminder,
      daily_goals: todayGoals,
      follow_up_questions: followUpQuestions,
      mood_check: this.shouldCheckMood(recentMood),
      personalization_data: personalization
    };
  }

  private async getRecentMood(userId: string): Promise<EmotionalState | null> {
    const recentStates = await personalContextService.getRecentEmotionalState(userId, 1);
    return recentStates.length > 0 ? recentStates[0] : null;
  }

  private async buildPersonalizationContext(
    userId: string,
    preferences: any[],
    recentMood: EmotionalState | null,
    aspirations: UserAspiration[],
    goals: DailyGoal[]
  ): Promise<PersonalizationContext> {
    // Extract user name from preferences or use default
    const namePreference = preferences.find(p => p.preference_key === 'display_name');
    const userName = namePreference?.preference_value || 'there';

    // Determine communication style
    const stylePreference = preferences.find(p => p.preference_key === 'communication_style');
    const communicationStyle = stylePreference?.preference_value || 'friendly';

    // Get recent achievements
    const recentAchievements = await this.getRecentAchievements(userId);

    // Identify upcoming priorities
    const upcomingPriorities = goals
      .filter(g => g.status === 'pending')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);

    // Contextual factors
    const contextualFactors = this.identifyContextualFactors(recentMood, goals, aspirations);

    return {
      user_name: userName,
      preferred_communication_style: communicationStyle,
      current_emotional_state: recentMood || undefined,
      time_of_day: this.getTimeOfDay(),
      recent_achievements: recentAchievements,
      upcoming_priorities: upcomingPriorities,
      contextual_factors: contextualFactors
    };
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private getCommunicationStyle(preferences: any[]): CommunicationStyle {
    const stylePreference = preferences.find(p => p.preference_key === 'communication_style');
    return stylePreference?.preference_value || 'friendly';
  }

  private buildGreetingMessage(
    personalization: PersonalizationContext,
    timeOfDay: string,
    style: CommunicationStyle
  ): string {
    const template = this.greetingTemplates[timeOfDay as keyof typeof this.greetingTemplates]?.[style] 
                  || this.greetingTemplates.morning.friendly;
    
    return template.replace('{name}', personalization.user_name || 'there');
  }

  private selectAspirationReminder(aspirations: UserAspiration[]): string | undefined {
    if (aspirations.length === 0) return undefined;

    // Select highest priority active aspiration
    const topAspiration = aspirations
      .filter(a => a.status === 'active')
      .sort((a, b) => b.priority - a.priority)[0];

    if (!topAspiration) return undefined;

    const template = this.aspirationReminders[topAspiration.category] || 
                    "Your aspiration '{title}' is important to you. Let's make progress today!";

    return template
      .replace('{title}', topAspiration.title)
      .replace('{progress}', topAspiration.progress_percentage.toString());
  }

  private async generateFollowUpQuestions(
    userId: string,
    personalization: PersonalizationContext,
    aspirations: UserAspiration[],
    goals: DailyGoal[]
  ): Promise<FollowUpQuestion[]> {
    const questions: FollowUpQuestion[] = [];

    // Energy assessment (morning)
    if (personalization.time_of_day === 'morning') {
      questions.push({
        id: `energy_${Date.now()}`,
        question: "How's your energy level this morning? This helps me suggest the best tasks for you!",
        type: 'energy_assessment',
        context: 'morning_energy_check',
        expected_response_type: 'rating',
        options: ['Low (1-3)', 'Medium (4-6)', 'High (7-10)']
      });
    }

    // Priority clarification if many goals
    if (goals.length > 3) {
      questions.push({
        id: `priority_${Date.now()}`,
        question: "You have several goals today. Which one would you like to tackle first?",
        type: 'priority_clarification',
        context: 'goal_prioritization',
        expected_response_type: 'selection',
        options: goals.slice(0, 3).map(g => g.title)
      });
    }

    // Mood check if no recent emotional data
    if (!personalization.current_emotional_state) {
      questions.push({
        id: `mood_${Date.now()}`,
        question: "How are you feeling today? Your mood helps me provide better support!",
        type: 'energy_assessment',
        context: 'mood_assessment',
        expected_response_type: 'rating',
        options: ['Stressed', 'Neutral', 'Good', 'Great', 'Amazing']
      });
    }

    // Aspiration progress check (weekly)
    const shouldCheckAspiration = Math.random() < 0.3; // 30% chance
    if (shouldCheckAspiration && aspirations.length > 0) {
      const topAspiration = aspirations[0];
      questions.push({
        id: `aspiration_${Date.now()}`,
        question: `How do you feel about your progress on "${topAspiration.title}"? Any obstacles I should know about?`,
        type: 'progress_reflection',
        context: 'aspiration_progress',
        expected_response_type: 'text'
      });
    }

    return questions.slice(0, 2); // Limit to 2 questions to avoid overwhelming
  }

  private shouldCheckMood(recentMood: EmotionalState | null): boolean {
    if (!recentMood) return true;

    const hoursAgo = (Date.now() - new Date(recentMood.recorded_at).getTime()) / (1000 * 60 * 60);
    return hoursAgo > 24; // Check mood if it's been more than 24 hours
  }

  private async getRecentAchievements(userId: string): Promise<Achievement[]> {
    // Get completed goals from last 7 days as achievements
    const recent = await personalContextService.getRecentGoals(userId, 7);
    const completed = recent.filter(g => g.status === 'completed');

    return completed.map(goal => ({
      id: goal.id,
      title: `Completed: ${goal.title}`,
      description: goal.completion_notes || 'Goal successfully completed!',
      achieved_at: goal.updated_at,
      celebration_level: goal.priority >= 4 ? 'large' : goal.priority >= 3 ? 'medium' : 'small',
      related_aspiration_id: goal.aspiration_id
    }));
  }

  private identifyContextualFactors(
    mood: EmotionalState | null,
    goals: DailyGoal[],
    aspirations: UserAspiration[]
  ): string[] {
    const factors: string[] = [];

    // Mood-based factors
    if (mood) {
      if (mood.mood_score <= 4) factors.push('low_mood');
      if (mood.stress_level >= 7) factors.push('high_stress');
      if (mood.energy_level <= 3) factors.push('low_energy');
      if (mood.motivation_level >= 8) factors.push('high_motivation');
    }

    // Goal-based factors
    if (goals.length === 0) factors.push('no_daily_goals');
    if (goals.length > 5) factors.push('many_goals');
    if (goals.filter(g => g.priority >= 4).length > 0) factors.push('high_priority_goals');

    // Aspiration-based factors
    const highProgressAspirations = aspirations.filter(a => a.progress_percentage >= 80);
    if (highProgressAspirations.length > 0) factors.push('near_aspiration_completion');

    // Time-based factors
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1) factors.push('monday_motivation');
    if (dayOfWeek === 5) factors.push('friday_wrap_up');
    if (dayOfWeek === 0 || dayOfWeek === 6) factors.push('weekend');

    return factors;
  }

  async processUserResponse(
    userId: string, 
    response: any, 
    interactionId: string
  ): Promise<void> {
    // Update the interaction with user response
    await personalContextService.updateInteractionResponse(
      interactionId, 
      response, 
      this.analyzeSentiment(response)
    );

    // Extract insights and update personal context
    await this.extractInsightsFromResponse(userId, response);

    // Generate follow-up if appropriate
    await this.handleFollowUpLogic(userId, response);
  }

  private analyzeSentiment(response: any): number {
    // Simple sentiment analysis - can be enhanced with AI
    if (typeof response === 'string') {
      const positiveWords = ['great', 'good', 'excellent', 'amazing', 'wonderful', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'stressed', 'overwhelmed'];
      
      const text = response.toLowerCase();
      const positiveMatches = positiveWords.filter(word => text.includes(word)).length;
      const negativeMatches = negativeWords.filter(word => text.includes(word)).length;
      
      return Math.max(-1, Math.min(1, (positiveMatches - negativeMatches) * 0.3));
    }
    
    return 0;
  }

  private async extractInsightsFromResponse(userId: string, response: any): Promise<void> {
    // Extract different types of insights based on response
    
    // Energy level insights
    if (typeof response === 'object' && response.energy_level) {
      await personalContextService.updatePersonalContext(
        userId,
        'pattern',
        'morning_energy_typical',
        response.energy_level,
        0.7
      );
    }

    // Communication preferences
    if (typeof response === 'string' && response.length > 50) {
      await personalContextService.updatePersonalContext(
        userId,
        'preference',
        'detailed_responses',
        true,
        0.6
      );
    }

    // Mood patterns
    if (typeof response === 'object' && response.mood) {
      await personalContextService.recordEmotionalState({
        user_id: userId,
        mood_score: this.parseMoodToNumber(response.mood),
        energy_level: response.energy_level || 5,
        stress_level: response.stress_level || 5,
        motivation_level: response.motivation_level || 5,
        context_tags: ['user_reported'],
        metadata: { source: 'conscious_assistant_response' }
      });
    }
  }

  private parseMoodToNumber(mood: string): number {
    const moodMap: Record<string, number> = {
      'stressed': 2,
      'neutral': 5,
      'good': 7,
      'great': 8,
      'amazing': 10
    };
    return moodMap[mood.toLowerCase()] || 5;
  }

  private async handleFollowUpLogic(userId: string, response: any): Promise<void> {
    // Determine if we need to schedule follow-up interactions
    
    // If user expressed stress or low mood, schedule a check-in
    if (this.analyzeSentiment(response) < -0.3) {
      await this.scheduleFollowUp(userId, 'mood_support', 4); // 4 hours later
    }

    // If user completed a major goal, schedule celebration
    if (typeof response === 'object' && response.goal_completed && response.priority >= 4) {
      await this.scheduleFollowUp(userId, 'celebration', 1); // 1 hour later
    }
  }

  private async scheduleFollowUp(
    userId: string, 
    type: 'mood_support' | 'celebration' | 'progress_check', 
    hoursLater: number
  ): Promise<void> {
    const followUpTime = new Date(Date.now() + hoursLater * 60 * 60 * 1000);
    
    // For now, just record the intention - would need a job queue system for actual scheduling
    await personalContextService.updatePersonalContext(
      userId,
      'memory',
      `scheduled_followup_${type}_${Date.now()}`,
      {
        type,
        scheduled_for: followUpTime.toISOString(),
        status: 'pending'
      },
      1.0
    );
  }

  async celebrateAchievement(userId: string, achievement: Achievement): Promise<string> {
    const celebrations = {
      small: [
        "Nice work! 🎉",
        "You did it! ✨", 
        "Another win! 💪",
        "Progress made! 🌟"
      ],
      medium: [
        "Fantastic achievement! 🎊",
        "You're crushing it! 🚀",
        "Excellent progress! 🏆",
        "So proud of you! 🌟"
      ],
      large: [
        "INCREDIBLE ACHIEVEMENT! 🎆🎉🏆",
        "You're absolutely amazing! This is huge! 🚀✨",
        "WOW! This deserves a real celebration! 🎊🎈🎯",
        "You've outdone yourself! This is inspiring! 💫⭐"
      ]
    };

    const messages = celebrations[achievement.celebration_level] || celebrations.medium;
    const celebrationMessage = messages[Math.floor(Math.random() * messages.length)];

    // Record this achievement celebration
    await personalContextService.recordInteraction({
      user_id: userId,
      interaction_type: 'progress_celebration',
      interaction_content: {
        achievement: achievement,
        celebration_message: celebrationMessage
      },
      engagement_level: 5,
      metadata: { achievement_level: achievement.celebration_level }
    });

    return celebrationMessage;
  }
}

export const consciousAssistantService = new ConsciousAssistantService();