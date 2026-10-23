import { enhancedConsciousAssistantService } from './enhancedConsciousAssistantService';
import { personalContextService } from './personalContextService';

export class StartupGreetingService {
  private static instance: StartupGreetingService;
  private hasGreetedToday = false;
  private startupInitialized = false;

  static getInstance(): StartupGreetingService {
    if (!StartupGreetingService.instance) {
      StartupGreetingService.instance = new StartupGreetingService();
    }
    return StartupGreetingService.instance;
  }

  async initializeStartupGreeting(userId?: string): Promise<{
    shouldShowGreeting: boolean;
    greetingMessage?: string;
    aspirations?: any[];
    dailyGoals?: any[];
  }> {
    try {
      if (this.startupInitialized && this.hasGreetedToday) {
        return { shouldShowGreeting: false };
      }

      this.startupInitialized = true;

      // Check if we've already greeted today
      const lastGreeting = localStorage.getItem('lastGreetingDate');
      const today = new Date().toDateString();
      
      if (lastGreeting === today) {
        this.hasGreetedToday = true;
        return { shouldShowGreeting: false };
      }

      // Generate startup greeting
      const greetingMessage = await this.generateStartupGreeting();
      
      // Get user's aspirations and daily goals
      let aspirations: any[] = [];
      let dailyGoals: any[] = [];

      try {
        if (userId) {
          aspirations = await personalContextService.getUserAspirations(userId);
          dailyGoals = await personalContextService.getDailyGoals(userId);
        }
      } catch (error) {
        console.log('Could not fetch user data (database not ready):', error.message);
      }

      // Mark as greeted for today
      localStorage.setItem('lastGreetingDate', today);
      this.hasGreetedToday = true;

      return {
        shouldShowGreeting: true,
        greetingMessage,
        aspirations,
        dailyGoals
      };

    } catch (error) {
      console.error('Error in startup greeting:', error);
      return { shouldShowGreeting: false };
    }
  }

  private async generateStartupGreeting(): Promise<string> {
    const hour = new Date().getHours();
    const userName = localStorage.getItem('userName') || 'there';
    
    let timeGreeting = '';
    let energyNote = '';
    let motivationalNote = '';

    // Time-based greeting
    if (hour < 12) {
      timeGreeting = 'Good morning';
      energyNote = "The day is fresh with possibilities! ☀️";
      motivationalNote = "What amazing things will you create today?";
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
      energyNote = "Hope your day is going wonderfully! 🌤️";
      motivationalNote = "Keep that momentum going!";
    } else {
      timeGreeting = 'Good evening';
      energyNote = "Time to wind down or power through! 🌅";
      motivationalNote = "How can I help you finish strong today?";
    }

    // Check for special occasions
    const specialNote = this.getSpecialOccasionNote();

    const greetingMessage = `${timeGreeting}, ${userName}! 👋

I'm your conscious assistant, and I'm awake and ready to help! ${energyNote}

${specialNote}

**🎯 I'm here to help you with:**
• **Navigation** - Find any feature or section in the system
• **Agent Building** - Guide you through creating powerful AI agents  
• **System Help** - Explain features and walk you through processes
• **Daily Support** - Track goals, aspirations, and provide assistance

${motivationalNote}

Just click the **notification bell** 🔔 or the **assistant button** 🤖 in the top-right corner to chat with me anytime!`;

    return greetingMessage;
  }

  private getSpecialOccasionNote(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();

    // Monday motivation
    if (dayOfWeek === 1 && hour < 12) {
      return "💪 It's Monday - time to start the week with intention and energy!";
    }

    // Friday celebration
    if (dayOfWeek === 5) {
      return "🎉 Friday vibes! Time to finish the week strong and celebrate your progress!";
    }

    // Weekend support
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "🌟 Weekend time! Perfect for reflection, planning, or pursuing personal projects!";
    }

    // Early morning boost
    if (hour < 7) {
      return "🌅 You're up early! That dedication is inspiring - let's make this day count!";
    }

    // Late night support
    if (hour > 22) {
      return "🌙 Working late? I'm here to help you stay focused and productive!";
    }

    return "✨ Ready to make today amazing together!";
  }

  async logStartupInteraction(): Promise<void> {
    try {
      // Log that the user saw the startup greeting
      const interactionData = {
        type: 'startup_greeting',
        timestamp: new Date(),
        systemStatus: 'conscious_assistant_active'
      };

      // Store in localStorage for now (could be database later)
      const existingLogs = JSON.parse(localStorage.getItem('assistantInteractionLogs') || '[]');
      existingLogs.push(interactionData);
      
      // Keep only last 50 interactions
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      localStorage.setItem('assistantInteractionLogs', JSON.stringify(existingLogs));

    } catch (error) {
      console.error('Error logging startup interaction:', error);
    }
  }

  async shouldShowDailyTips(): Promise<{
    shouldShow: boolean;
    tip?: string;
  }> {
    // Show tips for new users or every few days
    const lastTipDate = localStorage.getItem('lastTipDate');
    const daysSinceLastTip = lastTipDate 
      ? Math.floor((Date.now() - new Date(lastTipDate).getTime()) / (1000 * 60 * 60 * 24))
      : 7; // Show tip immediately for new users

    if (daysSinceLastTip >= 3) {
      const tips = [
        "💡 **Pro Tip**: Use voice input in the assistant chat by clicking the microphone icon!",
        "🤖 **Did you know?** I can read all the system manuals and help you navigate any feature!",
        "⚡ **Quick Access**: The notification bell 🔔 is your fastest way to reach me!",
        "🎯 **Agent Builder**: I can walk you through creating powerful automation agents step-by-step!",
        "📚 **Knowledge Base**: I have access to all documentation and can explain any feature in detail!",
        "🔗 **Integration**: Ask me about connecting with Alexa or mobile apps - I know the roadmap!",
        "🌟 **Personalization**: I learn your patterns and preferences to provide better assistance over time!"
      ];

      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      localStorage.setItem('lastTipDate', new Date().toISOString());

      return {
        shouldShow: true,
        tip: randomTip
      };
    }

    return { shouldShow: false };
  }

  resetDailyState(): void {
    this.hasGreetedToday = false;
    localStorage.removeItem('lastGreetingDate');
  }
}

export const startupGreetingService = StartupGreetingService.getInstance();