import { UserPreferences, PersonalityProfile } from '../types/personality';
// import { WeatherService } from './WeatherService'; // Commented out: File not found
import { CalendarService } from './CalendarService';
import { TaskService } from './TaskService';
import { AIService } from './ai/baseAIService'; // Added for TaskService constructor
import { GeminiService } from './gemini'; // Added for AIService default

export class MorningRoutineService {
  private userPreferences: UserPreferences;
  private personalityProfile: PersonalityProfile;
  // private weatherService: WeatherService; // Commented out
  private calendarService: CalendarService;
  private taskService: TaskService;

  constructor(
    userPreferences: UserPreferences,
    personalityProfile: PersonalityProfile,
    aiService?: AIService // Added aiService for TaskService
  ) {
    this.userPreferences = userPreferences;
    this.personalityProfile = personalityProfile;
    // this.weatherService = new WeatherService(); // Commented out
    const resolvedAIService = aiService || new GeminiService(); // Default AIService
    this.taskService = new TaskService(resolvedAIService);
    this.calendarService = new CalendarService(this.taskService, resolvedAIService);
  }

  public async generateMorningGreeting(): Promise<string> {
    const name = this.userPreferences.name;
    // const weather = await this.weatherService.getTodaysForecast(); // Commented out
    const weather = { condition: 'sunny', temperature: '25°C' }; // Mock weather data
    const mood = await this.determineMood(weather); // Pass mock weather
    
    return this.constructGreeting(name, weather, mood);
  }

  public async generateMorningSummary(): Promise<string> {
    const events = await this.calendarService.getTodaysEvents();
    const tasks = await this.taskService.getPrioritizedTasks();
    const insights = await this.generateDailyInsights();
    const quote = this.getInspirationalQuote();
    const weatherUpdate = this.formatWeatherUpdate({ condition: 'sunny', temperature: '25°C' }); // Mock weather data for formatWeatherUpdate

    return `
      Here's your morning briefing:

      ${weatherUpdate}
      
      Today's Schedule:
      ${this.formatEvents(events)}
      
      Priority Tasks:
      ${this.formatTasks(tasks)}
      
      Daily Insight:
      ${insights}
      
      ${quote}
      
      ${this.generatePersonalizedAdvice()}
    `;
  }

  private async determineMood(weather: any): Promise<string> { // Added weather param
    const sleepData = await this.getSleepData();
    const schedule = await this.calendarService.getTodaysEvents();
    // const weather = await this.weatherService.getTodaysForecast(); // Commented out
    
    if (sleepData.duration < 6) return 'energizing';
    if (schedule.length > 8) return 'supportive';
    if (weather.condition === 'rainy') return 'uplifting';
    return 'balanced';
  }

  private generatePersonalizedAdvice(): string {
    const workStyle = this.personalityProfile.workStyle;
    const peakHours = workStyle.peakProductivityHours;
    const currentHour = new Date().getHours();

    if (peakHours.includes(currentHour)) {
      return "This is typically your most productive time. Consider tackling your most important tasks now.";
    }

    return "Remember to take breaks and stay hydrated throughout your day.";
  }

  private getInspirationalQuote(): string {
    const quotes = [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        theme: "passion"
      },
      {
        text: "Small steps every day lead to massive results over time.",
        author: "Unknown",
        theme: "progress"
      },
      // Add more quotes...
    ];

    const userMood = this.assessUserMood();
    const appropriateQuotes = quotes.filter(q => this.isQuoteAppropriate(q, userMood));
    if (appropriateQuotes.length === 0) return "Stay positive and keep going!"; // Fallback quote
    return appropriateQuotes[Math.floor(Math.random() * appropriateQuotes.length)].text;
  }

  private assessUserMood(): string {
    // Implement mood assessment logic
    return 'motivated';
  }

  // Stubs for missing methods
  private constructGreeting(name: string, weather: any, mood: string): string {
    return `Good morning, ${name}! It's ${weather.condition} and ${mood}.`;
  }

  private async generateDailyInsights(): Promise<string> {
    return "Today's insight: Focus on what matters most.";
  }

  private formatWeatherUpdate(weather: any): string {
    return `Weather: ${weather.condition}, ${weather.temperature}.`;
  }

  private formatEvents(events: any[]): string {
    if (!events || events.length === 0) return "No events scheduled.";
    return events.map(e => `- ${e.title} at ${new Date(e.startTime).toLocaleTimeString()}`).join('\n');
  }

  private formatTasks(tasks: any[]): string {
    if (!tasks || tasks.length === 0) return "No priority tasks.";
    return tasks.map(t => `- ${t.title}`).join('\n');
  }

  private async getSleepData(): Promise<{ duration: number; quality: string }> {
    return { duration: 7, quality: 'good' }; // Mock sleep data
  }

  private isQuoteAppropriate(quote: { theme: string }, mood: string): boolean {
    // Simple logic: motivational quotes for most moods
    if (mood === 'uplifting' && quote.theme === 'progress') return true;
    if (quote.theme === 'passion') return true;
    return false;
  }
} 