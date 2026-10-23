import { VoiceControl } from './VoiceControl';
import { PersonalityProfile, UserPreferences } from '../types/personality';
import { WorkflowOrchestrator } from './WorkflowOrchestrator';
import { MindfulnessService } from './MindfulnessService';
import { MorningRoutineService } from './MorningRoutineService';

export class GenieAssistant {
  private voiceControl: VoiceControl;
  private personalityProfile: PersonalityProfile;
  private isAwake: boolean = false;
  private lastInteractionTime: Date = new Date();
  private conversationContext: string[] = [];
  
  private readonly WAKE_WORDS = ['hey genie', 'ok genie', 'hi genie'];
  private readonly SLEEP_TIMEOUT = 30000; // 30 seconds of inactivity

  constructor(
    private userPreferences: UserPreferences,
    private workflowOrchestrator: WorkflowOrchestrator,
    private mindfulness: MindfulnessService,
    private morningRoutine: MorningRoutineService
  ) {
    this.voiceControl = new VoiceControl();
    this.setupWakeWordDetection();
    this.registerConversationalResponses();
  }

  private setupWakeWordDetection() {
    this.voiceControl.onSpeechDetected((transcript: string) => {
      const lowerTranscript = transcript.toLowerCase();
      
      if (this.WAKE_WORDS.some(word => lowerTranscript.includes(word))) {
        this.wake();
      } else if (this.isAwake) {
        this.handleCommand(transcript);
      }
    });
  }

  private wake() {
    this.isAwake = true;
    this.lastInteractionTime = new Date();
    
    const timeOfDay = new Date().getHours();
    const greeting = this.getTimeBasedGreeting(timeOfDay);
    
    this.voiceControl.speak(greeting);
  }

  private getTimeBasedGreeting(hour: number): string {
    const name = this.userPreferences.name;
    const greetings = {
      morning: [
        `Good morning ${name}! How can I help you start your day?`,
        `Rise and shine ${name}! What's first on our agenda?`
      ],
      afternoon: [
        `Good afternoon ${name}! Need any assistance?`,
        `Hey ${name}! How can I help you be productive?`
      ],
      evening: [
        `Good evening ${name}! How can I help you wind down?`,
        `Hi ${name}! Need help wrapping up your day?`
      ]
    };

    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const options = greetings[period];
    return options[Math.floor(Math.random() * options.length)];
  }

  private async handleCommand(transcript: string) {
    this.lastInteractionTime = new Date();
    this.updateConversationContext(transcript);

    // Natural conversation handling
    if (this.isConversationalQuery(transcript)) {
      const response = await this.generateConversationalResponse(transcript);
      this.voiceControl.speak(response);
      return;
    }

    // Email commands
    if (this.isEmailCommand(transcript)) {
      await this.handleEmailCommand(transcript);
      return;
    }

    // Quick commands
    if (this.isQuickCommand(transcript)) {
      this.handleQuickCommand(transcript);
      return;
    }

    // Workflow commands
    if (this.isWorkflowCommand(transcript)) {
      await this.handleWorkflowCommand(transcript);
      return;
    }

    // Wellness commands
    if (this.isWellnessCommand(transcript)) {
      await this.handleWellnessCommand(transcript);
      return;
    }

    // Fallback
    this.voiceControl.speak("I'm not sure about that. Could you rephrase it?");
  }

  private isConversationalQuery(transcript: string): boolean {
    const conversationalPatterns = [
      'how are you',
      'what do you think',
      'can you help me',
      'what should i',
      'do you remember'
    ];

    return conversationalPatterns.some(pattern => 
      transcript.toLowerCase().includes(pattern)
    );
  }

  private isEmailCommand(transcript: string): boolean {
    const emailPatterns = [
      'find emails',
      'search emails',
      'delete email',
      'move email',
      'archive email',
      'compose email',
      'reply to',
      'forward email',
      'create folder',
      'emails from',
      'unread emails',
      'star email'
    ];

    return emailPatterns.some(pattern => 
      transcript.toLowerCase().includes(pattern)
    );
  }

  private async handleEmailCommand(transcript: string) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Import email service dynamically to avoid circular dependencies
    try {
      const { EmailService } = await import('../services/email/EmailServiceAdapter');
      const { VoiceEmailActions } = await import('../services/voice/VoiceEmailActions');
      const { VoiceController } = await import('../services/voice/VoiceController');
      
      const emailService = EmailService;
      const voiceController = new VoiceController();
      const voiceActions = new VoiceEmailActions(emailService);
      
      // Parse the voice command
      const command = voiceController.parseVoiceCommand(transcript);
      
      if (command) {
        // Get current email context if available
        const currentEmails = []; // This would come from current page context
        const currentAccountId = ''; // This would come from current page context  
        const currentFolderId = 'INBOX';
        
        const result = await voiceActions.executeCommand(
          command, 
          currentEmails, 
          currentAccountId, 
          currentFolderId
        );
        
        if (result.success) {
          this.voiceControl.speak(result.message);
        } else {
          this.voiceControl.speak(`Sorry, I couldn't complete that email action: ${result.message}`);
        }
      } else {
        this.voiceControl.speak("I didn't understand that email command. Try saying something like 'find emails from John' or 'delete this email'");
      }
    } catch (error) {
      console.error('Error handling email command:', error);
      this.voiceControl.speak("Sorry, I'm having trouble with email commands right now.");
    }
  }

  private isQuickCommand(transcript: string): boolean {
    const quickPatterns = [
      'what time is it',
      'how\'s my schedule',
      'take a break'
    ];

    return quickPatterns.some(pattern => 
      transcript.toLowerCase().includes(pattern)
    );
  }

  private isWorkflowCommand(transcript: string): boolean {
    const workflowPatterns = [
      'start tracking',
      'learn my process',
      'suggest improvements'
    ];

    return workflowPatterns.some(pattern => 
      transcript.toLowerCase().includes(pattern)
    );
  }

  private isWellnessCommand(transcript: string): boolean {
    const wellnessPatterns = [
      'feeling stressed',
      'gratitude',
      'mindful break',
      'wellness check'
    ];

    return wellnessPatterns.some(pattern => 
      transcript.toLowerCase().includes(pattern)
    );
  }

  private async generateConversationalResponse(query: string): Promise<string> {
    const context = this.conversationContext.slice(-3).join(' ');
    const personality = this.personalityProfile.communicationStyle;
    
    // Generate contextual, personality-aware response
    const response = await this.generateResponse(query, context, personality);
    return response;
  }

  private async generateResponse(query: string, context: string, personality: string): Promise<string> {
    // Simple response generation - can be enhanced with AI service later
    return `Based on ${personality} style with context "${context}", here's my response to: ${query}`;
  }

  private handleQuickCommand(transcript: string) {
    const quickCommands = {
      'what time is it': () => {
        const time = new Date().toLocaleTimeString();
        this.voiceControl.speak(`It's ${time}`);
      },
      'how\'s my schedule': async () => {
        const summary = await this.morningRoutine.generateMorningSummary();
        this.voiceControl.speak(summary);
      },
      'take a break': async () => {
        const script = await this.mindfulness.generateMindfulnessScript(5);
        this.voiceControl.speak(script);
      }
    };

    for (const [command, handler] of Object.entries(quickCommands)) {
      if (transcript.toLowerCase().includes(command)) {
        handler();
        return;
      }
    }
  }

  private updateConversationContext(transcript: string) {
    this.conversationContext.push(transcript);
    if (this.conversationContext.length > 5) {
      this.conversationContext.shift();
    }
  }

  private async handleWorkflowCommand(transcript: string) {
    // Handle workflow-related commands
    if (transcript.includes('start tracking')) {
      const activity = transcript.replace('start tracking', '').trim();
      this.workflowOrchestrator.recordAction({
        type: 'tracking_start',
        timestamp: new Date(),
        context: { activity },
        metadata: { importance: 0.8, frequency: 1, duration: 0 }
      });
      this.voiceControl.speak(`I'll start tracking your ${activity}`);
    }
  }

  private async handleWellnessCommand(transcript: string) {
    if (transcript.includes('feeling stressed')) {
      const script = await this.mindfulness.generateMindfulnessScript();
      this.voiceControl.speak(script);
    } else if (transcript.includes('gratitude')) {
      const prompt = this.mindfulness.generateGratitudePrompt();
      this.voiceControl.speak(prompt);
    }
  }

  // Periodic checks
  private checkSleepTimeout() {
    setInterval(() => {
      if (this.isAwake && 
          Date.now() - this.lastInteractionTime.getTime() > this.SLEEP_TIMEOUT) {
        this.isAwake = false;
      }
    }, 5000);
  }
} 