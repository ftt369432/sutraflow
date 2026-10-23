import type { VoiceCommand } from '../types/voice';
import type { PersonalityProfile } from '../types/voice';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface Task {
  id: string;
  description: string;
  priority: number;
  dueDate?: Date;
}

interface VoicePreferences extends Record<string, any> {
  name: string;
  focusPreferences: {
    ambientSound: boolean;
    soundType: string;
    checkInterval: number;
  };
  enabled: boolean;
  language: string;
  volume: number;
  speed: number;
}

export class VoiceControl {
  private recognition: any;
  private synthesis: any;
  private commandHandlers: Map<string, (params: any) => void> = new Map();
  private personalityProfile: PersonalityProfile;
  private userPreferences: VoicePreferences;
  private isAvailable: boolean = false;
  private isListening: boolean = false;
  private isEnabled: boolean = false;
  
  constructor() {
    this.userPreferences = {
      name: 'User',
      focusPreferences: {
        ambientSound: false,
        soundType: 'nature',
        checkInterval: 30
      },
      enabled: true,
      language: 'en-US',
      volume: 0.8,
      speed: 1.0,
      pitch: 1,
      rate: 1
    };
    
    // Check if speech recognition is available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.isAvailable = true;
      // Only log this if we're not in a hot reload development environment
      if (!window['voiceControlInitialized']) {
        console.log('Voice Control initialized and available');
        window['voiceControlInitialized'] = true;
      }
    } else {
      console.warn('Speech Recognition not available in this browser');
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn('Speech synthesis is not supported in this browser');
      this.synthesis = null;
    }
    
    // Initialize personality profile
    this.personalityProfile = {
      name: 'Default',
      traits: {
        formality: 0.5,
        empathy: 0.7,
        humor: 0.3
      },
      preferences: {
        voiceType: 'default',
        speechRate: 1,
        pitch: 1,
        volume: 1,
        language: 'en-US'
      }
    };
    
    this.registerAllCommands();
  }



  private registerAllCommands() {
    // Personal Assistant Commands
    this.registerCommand('good morning', () => {
      const greeting = this.generateMorningGreeting();
      this.speak(greeting);
      this.provideDailySummary();
    });

    this.registerCommand('daily summary', () => {
      this.provideDailySummary();
    });

    this.registerCommand('set reminder', (params) => {
      const { time, task } = params;
      this.createReminder(time, task);
      this.speak(`I'll remind you to ${task} at ${time}`);
    });

    this.registerCommand('gratitude moment', () => {
      this.speak(this.generateGratitudePrompt());
    });

    // Workflow Learning Commands
    this.registerCommand('start interview', () => {
      this.startPersonalityInterview();
    });

    this.registerCommand('learn my process', (params) => {
      const { activity } = params;
      this.speak(`I'll observe and learn how you handle ${activity}`);
      this.startProcessLearning(activity);
    });

    this.registerCommand('suggest improvements', () => {
      this.provideWorkflowSuggestions();
    });

    // Task Management
    this.registerCommand('prioritize tasks', () => {
      this.prioritizeAndSuggestTasks();
    });

    this.registerCommand('start focus session', (params) => {
      const { duration } = params;
      this.startFocusSession(duration);
    });

    // Email Commands
    this.registerCommand('find emails from', (params) => {
      const { sender } = params;
      this.speak(`Looking for emails from ${sender}...`);
      // Trigger email search event
      this.triggerEmailCommand('search', { from: sender });
    });

    this.registerCommand('delete email', () => {
      this.speak('Deleting selected email...');
      this.triggerEmailCommand('delete');
    });

    this.registerCommand('compose email', () => {
      this.speak('Opening email composer...');
      this.triggerEmailCommand('compose');
    });

    this.registerCommand('archive email', () => {
      this.speak('Archiving selected email...');
      this.triggerEmailCommand('archive');
    });

    this.registerCommand('move email to folder', (params) => {
      const { folder } = params;
      this.speak(`Moving email to ${folder} folder...`);
      this.triggerEmailCommand('move', { folder });
    });

    // Wellness & Mindfulness
    this.registerCommand('mindful break', () => {
      this.startMindfulnessSession();
    });

    this.registerCommand('wellness check', () => {
      this.performWellnessCheck();
    });

    // Personality & Learning
    this.registerCommand('adapt personality', (params) => {
      const { style } = params;
      this.adaptCommunicationStyle(style);
    });

    this.registerCommand('share insight', () => {
      this.sharePersonalizedInsight();
    });
  }

  private async startPersonalityInterview() {
    const questions = [
      {
        category: 'work-style',
        question: 'How do you prefer to organize your tasks?',
        followUp: 'What time of day are you most productive?'
      },
      {
        category: 'communication',
        question: 'Do you prefer direct or detailed communication?',
        followUp: 'How often would you like me to check in with you?'
      },
      {
        category: 'wellness',
        question: 'What are your main stress triggers at work?',
        followUp: 'How can I help you maintain work-life balance?'
      },
      {
        category: 'goals',
        question: 'What are your top priorities for the next month?',
        followUp: 'How can I help you achieve these goals?'
      }
    ];

    for (const q of questions) {
      await this.askInterviewQuestion(q);
    }

    this.finalizePersonalityProfile();
  }

  private async provideDailySummary() {
    const summary = await this.generatePersonalizedSummary();
    const tasks = await this.getPrioritizedTasks();
    const insights = await this.getPersonalizedInsights();

    const script = `
      Good morning ${this.userPreferences.name}!
      ${summary}
      
      Your top priorities for today are:
      ${tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}
      
      ${insights}
      
      ${this.generateMotivationalMessage()}
    `;

    this.speak(script);
  }

  private async startFocusSession(duration: number) {
    const preferences = this.userPreferences.focusPreferences;
    
    this.speak(`Starting a ${duration} minute focus session. I'll help you stay on track.`);

    if (preferences.ambientSound) {
      this.playAmbientSound(preferences.soundType);
    }

    // Set up focus monitoring
    this.monitorFocusSession({
      duration,
      checkInterval: preferences.checkInterval,
      onDistraction: () => this.provideFocusReminder(),
      onComplete: () => this.completeFocusSession()
    });
  }

  private async startMindfulnessSession() {
    const script = await this.generateMindfulnessScript();
    this.speak(script, { rate: 0.8, pitch: 1.0 });
  }

  private generateMotivationalMessage(): string {
    const messages = [
      `Remember, every step forward is progress.`,
      `You've got this! Let's make today count.`,
      `I believe in your ability to handle today's challenges.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  private async generateMindfulnessScript(): Promise<string> {
    return `
      Let's take a moment to center ourselves.
      Take a deep breath in... and out...
      Focus on the present moment...
    `;
  }

  private async analyzeUserPatterns(): Promise<any> {
    // TODO: Implement user pattern analysis
    return {
      workHours: [9, 17],
      productivePeriods: ['morning'],
      commonTasks: ['coding', 'meetings']
    };
  }

  private generateInsightFromPatterns(patterns: any): string {
    // TODO: Implement insight generation
    return `Based on your patterns, you're most productive in the ${patterns.productivePeriods[0]}.`;
  }

  private adaptCommunicationStyle(userResponses: any) {
    // Update preferences instead of profile
    this.userPreferences = {
      ...this.userPreferences,
      verbosity: userResponses.preferredDetail,
      tone: userResponses.preferredTone,
      formality: userResponses.formalityLevel,
      humorLevel: userResponses.humorPreference
    };

    if (this.synthesis) {
      this.synthesis.pitch = this.userPreferences.pitch || 1;
      this.synthesis.rate = this.userPreferences.rate || 1;
    }
  }

  private async sharePersonalizedInsight() {
    const patterns = await this.analyzeUserPatterns();
    const insight = this.generateInsightFromPatterns(patterns);
    
    this.speak(insight);
  }

  public registerCommand(phrase: string, handler: (params: any) => void) {
    this.commandHandlers.set(phrase, handler);
  }

  private triggerEmailCommand(action: string, params?: any) {
    // Dispatch a custom event that the email page can listen to
    const event = new CustomEvent('voiceEmailCommand', {
      detail: { action, params }
    });
    window.dispatchEvent(event);
  }

  private parseVoiceCommand(transcript: string): VoiceCommand {
    const commands = Array.from(this.commandHandlers.keys());
    let bestMatch = {
      command: '',
      confidence: 0,
      parameters: {}
    };

    for (const command of commands) {
      const confidence = this.calculateSimilarity(transcript, command);
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          command,
          confidence,
          parameters: this.extractParameters(transcript, command)
        };
      }
    }

    return {
      action: bestMatch.command,
      parameters: bestMatch.parameters,
      confidence: bestMatch.confidence
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str1.length + 1).fill(null).map(() => 
      Array(str2.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[str1.length][str2.length];
  }

  private extractParameters(transcript: string, command: string): Record<string, any> {
    const params: Record<string, any> = {};
    const words = transcript.split(' ');
    const commandWords = command.split(' ');

    // Extract parameters after the command
    const paramString = words.slice(commandWords.length).join(' ');
    
    // Look for common parameter patterns
    const nameMatch = paramString.match(/(?:called|named) ([\w\s]+)/);
    if (nameMatch) params.name = nameMatch[1].trim();

    const timeMatch = paramString.match(/(?:at|every) (\d{1,2}(?::\d{2})?(?: ?[ap]m)?)/);
    if (timeMatch) params.time = timeMatch[1];

    const typeMatch = paramString.match(/type (\w+)/);
    if (typeMatch) params.type = typeMatch[1];

    return params;
  }

  private handleCommand(command: VoiceCommand) {
    const handler = this.commandHandlers.get(command.action);
    if (handler) {
      handler(command.parameters);
      this.speak(`Executing command: ${command.action}`);
    } else {
      this.speak("I'm sorry, I don't know how to handle that command.");
    }
  }

  public startListening() {
    if (!this.isEnabled || this.isListening) return;
    if (!this.isAvailable) {
      console.warn('Voice control is not available in this browser');
      return;
    }

    if (this.isListening) {
      console.warn('Voice recognition is already active');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.speak("I'm listening");
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      this.isListening = false;
    }
  }

  public stopListening() {
    if (!this.isAvailable || !this.isListening) return;
    
    try {
      this.recognition.stop();
      this.isListening = false;
      this.speak("Voice control deactivated");
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  public speak(text: string, options: { rate?: number; pitch?: number } = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis is not available');
      return;
    }
    console.log('Speaking:', text);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      this.synthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking:', error);
    }
  }

  private generateMorningGreeting(): string {
    const greetings = [
      'Good morning! Ready to start the day?',
      'Rise and shine! Let\'s make today great!',
      'Good morning! Hope you had a restful night.'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private createReminder(time: string, task: string): void {
    // TODO: Implement reminder creation
    console.log(`Creating reminder for ${task} at ${time}`);
  }

  private generateGratitudePrompt(): string {
    const prompts = [
      'What are you grateful for today?',
      'Let\'s take a moment to appreciate something positive.',
      'What made you smile today?'
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  private startProcessLearning(activity: string): void {
    // TODO: Implement process learning
    console.log(`Learning process for: ${activity}`);
  }

  private provideWorkflowSuggestions(): void {
    // TODO: Implement workflow suggestions
    console.log('Analyzing workflow and generating suggestions...');
  }

  private prioritizeAndSuggestTasks(): void {
    // TODO: Implement task prioritization
    console.log('Analyzing and prioritizing tasks...');
  }

  private performWellnessCheck(): void {
    // TODO: Implement wellness check
    console.log('Performing wellness check...');
  }

  private async askInterviewQuestion(question: { category: string; question: string; followUp: string }): Promise<void> {
    // TODO: Implement interview question handling
    console.log(`Asking ${question.category} question: ${question.question}`);
  }

  private finalizePersonalityProfile(): void {
    // TODO: Implement personality profile finalization
    console.log('Finalizing personality profile...');
  }

  private async generatePersonalizedSummary(): Promise<string> {
    // TODO: Implement personalized summary generation
    return 'Here is your personalized summary for today...';
  }

  private async getPrioritizedTasks(): Promise<Task[]> {
    // TODO: Implement task prioritization
    return [
      { id: '1', description: 'Sample task 1', priority: 1 },
      { id: '2', description: 'Sample task 2', priority: 2 }
    ];
  }

  private async getPersonalizedInsights(): Promise<string> {
    // TODO: Implement personalized insights
    return 'Here are your personalized insights...';
  }

  private playAmbientSound(soundType: string): void {
    // TODO: Implement ambient sound playback
    console.log(`Playing ${soundType} ambient sound...`);
  }

  private monitorFocusSession(_config: {
    duration: number;
    checkInterval: number;
    onDistraction: () => void;
    onComplete: () => void;
  }): void {
    // TODO: Implement focus session monitoring
    console.log('Monitoring focus session...');
  }

  private provideFocusReminder(): void {
    // TODO: Implement focus reminder
    this.speak('Remember to stay focused on your task.');
  }

  private completeFocusSession(): void {
    // TODO: Implement focus session completion
    this.speak('Great job! Focus session complete.');
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  public isVoiceEnabled(): boolean {
    return this.isEnabled;
  }

  public getPersonalityProfile(): PersonalityProfile {
    return this.personalityProfile;
  }

  public updatePersonalityProfile(updates: Partial<PersonalityProfile>): void {
    this.personalityProfile = { ...this.personalityProfile, ...updates };
  }
} 