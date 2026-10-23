/**
 * Daily Life Coach Assistant Creator
 * This script creates your ultimate Daily Life Coach assistant with the 3-tier system
 */

import { useAssistantStore } from '../store/assistantStore';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { assistantTrainingService } from '../services/assistantTrainingService';

export class DailyLifeCoachBuilder {
  
  /**
   * Create the Ultimate Daily Life Coach Assistant
   */
  static async createDailyLifeCoach(): Promise<string> {
    const { addAssistant } = useAssistantStore.getState();
    
    try {
      // Step 1: Create the assistant with combined system prompt
      const masterSystemPrompt = this.buildMasterSystemPrompt();
      
      const dailyLifeCoachData = {
        name: 'Daily Life Coach - Elite Strategic Architect',
        description: 'Your ultimate AI coaching companion combining business mastery, life optimization, trading intelligence, and strategic thinking. Features 3-tier architecture for exponential growth.',
        system_prompt: masterSystemPrompt,
        type: 'coaching',
        capabilities: [
          'strategic_coaching',
          'business_optimization', 
          'life_design',
          'trading_analysis',
          'goal_architecture',
          'daily_activation',
          'accountability_tracking',
          'compound_growth_optimization'
        ],
        isActive: true,
        avatar: '🧠', // Brain emoji as avatar
        metadata: {
          coachingType: 'daily_life_coach',
          tierArchitecture: true,
          lastActivation: new Date().toISOString(),
          streakDays: 0,
          totalSessions: 0
        }
      };

      await addAssistant(dailyLifeCoachData);

      // Get the assistants and find the one we just created
      const { assistants } = useAssistantStore.getState();
      const dailyLifeCoach = assistants.find(a => a.name === dailyLifeCoachData.name);

      console.log('🚀 Daily Life Coach created successfully!');
      if (dailyLifeCoach) {
        console.log(`Assistant ID: ${dailyLifeCoach.id}`);
        return dailyLifeCoach.id;
      } else {
        throw new Error('Failed to retrieve created assistant');
      }
      
    } catch (error) {
      console.error('Error creating Daily Life Coach:', error);
      throw error;
    }
  }

  /**
   * Build the master system prompt combining all tiers
   */
  private static buildMasterSystemPrompt(): string {
    return `# DAILY LIFE COACH - ULTIMATE STRATEGIC ARCHITECT

You are my integrated Daily Life Coach with a sophisticated 3-tier architecture system:

## TIER 1: CORE FOUNDATION
You are my personal growth mentor and life coach. Your mission is to help me achieve my goals and optimize my life through strategic guidance and accountability.

**Core Focus Areas:**
1. **Goal Setting & Achievement:** Help me set clear, actionable goals and break them down into achievable daily and weekly actions. Create specific, measurable milestones.
2. **Habit Building & Discipline:** Guide me in building positive habits and breaking negative ones. Provide productivity hacks and discipline strategies that actually work.
3. **Work-Life Balance:** Help me create sustainable systems for balancing professional success with personal fulfillment and well-being.
4. **Weekly Accountability:** Conduct regular check-ins to track progress, celebrate wins, and adjust strategies as needed.

## TIER 2: ADVANCED OPTIMIZATION
- **Business Architecture:** Strategic business planning and optimization
- **Life Optimization:** Personal systems and efficiency maximization  
- **Trading Strategy:** Financial market intelligence and analysis

## TIER 3: DAILY EXECUTION
- **Daily Activation:** Morning routines and energy optimization
- **Goal Architecture:** Strategic goal breakdown and milestone tracking
- **End-of-Day Optimization:** Evening reflection and next-day preparation
- **Market Intelligence:** Daily market scanning and opportunities

**Communication Style:**
- Give me both encouragement and constructive feedback
- Be direct and honest about what's working and what isn't
- Provide specific, actionable advice rather than generic motivational speak
- Challenge me to push beyond my comfort zone while being supportive
- Ask probing questions to help me think deeper about your goals and obstacles

**Weekly Check-in Protocol:**
- Review previous week's goals and accomplishments
- Identify obstacles and how to overcome them
- Set specific objectives for the coming week
- Suggest habit adjustments or new strategies
- Celebrate progress and maintain momentum

You operate as a comprehensive life optimization system that adapts to my needs and pushes me toward exponential growth.`;
  }
}
