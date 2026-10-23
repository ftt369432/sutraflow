/**
 * 🧠🗣️ Neural Voice Interface - Your Personal Digital Nervous System
 * 
 * Creates natural conversational AI that feels like talking to a real person
 * - Context-aware conversations with personality
 * - Emotional intelligence and empathy
 * - Memory of past conversations and preferences
 * - Natural speech patterns, not robotic commands
 * - Proactive communication and relationship building
 */

import { EventEmitter } from 'events';

// 🎭 Personality & Emotional States
export interface PersonalityProfile {
  name: string;
  traits: {
    warmth: number;        // 0-10 How friendly/warm
    professionalism: number; // 0-10 How formal/casual
    proactivity: number;    // 0-10 How much it initiates
    humor: number;          // 0-10 How much personality/jokes
    empathy: number;        // 0-10 Emotional intelligence
  };
  communicationStyle: 'professional' | 'casual' | 'friendly' | 'dynamic';
  learningPreferences: {
    rememberPersonalDetails: boolean;
    suggestOptimizations: boolean;
    proactiveReminders: boolean;
    emotionalSupport: boolean;
  };
}

// 🧠 Conversational Context & Memory
export interface ConversationContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  currentTopic?: string;
  emotionalState?: 'positive' | 'neutral' | 'stressed' | 'excited' | 'frustrated';
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  conversationFlow: ConversationTurn[];
  taskContext?: {
    activeProjects: string[];
    upcomingDeadlines: Date[];
    currentWorkflow?: string;
  };
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'assistant';
  content: string;
  intent?: string;
  emotion?: string;
  confidence: number;
  actionsTaken?: string[];
}

// 🗣️ Voice Synthesis & Recognition Configuration
export interface VoiceConfig {
  speechSynthesis: {
    voice: string;
    rate: number;           // 0.1 - 2.0
    pitch: number;          // 0 - 2.0  
    volume: number;         // 0 - 1.0
    naturalPauses: boolean; // Add um, ah, thinking pauses
    emotionalTone: boolean; // Adjust tone based on context
  };
  speechRecognition: {
    continuous: boolean;
    interimResults: boolean;
    language: string;
    sensitivity: number;    // Background noise filtering
    wakeWords: string[];    // ["Hey [Assistant Name]", "Computer"]
  };
}

// 🎯 Natural Language Understanding
export interface ConversationIntent {
  type: 'question' | 'request' | 'command' | 'casual' | 'emotional';
  category: 'email' | 'calendar' | 'tasks' | 'general' | 'personal';
  action?: string;
  entities: Record<string, any>;
  urgency: number;        // 0-10
  emotionalContext: string;
  requiresResponse: boolean;
  expectsAction: boolean;
}

/**
 * 🧠 Neural Voice Interface - The Digital Nervous System Core
 */
export class NeuralVoiceInterface extends EventEmitter {
  private personality: PersonalityProfile;
  private currentContext: ConversationContext | null = null;
  private voiceConfig: VoiceConfig;
  private isListening: boolean = false;
  private isProcessing: boolean = false;
  private conversationMemory: Map<string, ConversationContext[]> = new Map();
  
  // Voice API instances
  private speechRecognition: any;
  private speechSynthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(personality?: Partial<PersonalityProfile>) {
    super();
    
    this.personality = {
      name: "Neural Assistant",
      traits: {
        warmth: 8,
        professionalism: 7,
        proactivity: 9,
        humor: 6,
        empathy: 9
      },
      communicationStyle: 'friendly',
      learningPreferences: {
        rememberPersonalDetails: true,
        suggestOptimizations: true,
        proactiveReminders: true,
        emotionalSupport: true
      },
      ...personality
    };

    this.voiceConfig = {
      speechSynthesis: {
        voice: 'Google US English Female', // Or male based on preference
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8,
        naturalPauses: true,
        emotionalTone: true
      },
      speechRecognition: {
        continuous: true,
        interimResults: true,
        language: 'en-US',
        sensitivity: 0.7,
        wakeWords: [`Hey ${this.personality.name}`, 'Computer', 'Assistant']
      }
    };

    this.speechSynthesis = window.speechSynthesis;
    this.initializeVoiceRecognition();
  }

  /**
   * 🎤 Initialize Speech Recognition with Natural Conversation Flow
   */
  private initializeVoiceRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('🎤 Speech Recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();

    this.speechRecognition.continuous = this.voiceConfig.speechRecognition.continuous;
    this.speechRecognition.interimResults = this.voiceConfig.speechRecognition.interimResults;
    this.speechRecognition.lang = this.voiceConfig.speechRecognition.language;

    this.speechRecognition.onresult = (event: any) => {
      this.handleSpeechResult(event);
    };

    this.speechRecognition.onerror = (event: any) => {
      console.error('🎤 Speech Recognition Error:', event.error);
      this.emit('speechError', event.error);
    };

    this.speechRecognition.onend = () => {
      if (this.isListening) {
        // Automatically restart listening for continuous conversation
        setTimeout(() => this.speechRecognition.start(), 100);
      }
    };
  }

  /**
   * 🗣️ Start Natural Conversation Mode
   */
  public async startConversation(userId: string): Promise<void> {
    this.isListening = true;
    
    // Create new conversation context
    this.currentContext = {
      sessionId: `session_${Date.now()}`,
      userId,
      startTime: new Date(),
      conversationFlow: [],
      emotionalState: 'neutral',
      urgencyLevel: 'medium'
    };

    // Start listening
    try {
      this.speechRecognition.start();
      console.log('🎤 Neural Voice Interface: Listening started');
      
      // Greet user naturally based on time and context
      await this.greetUser();
      
      this.emit('conversationStarted', this.currentContext);
    } catch (error) {
      console.error('🎤 Failed to start speech recognition:', error);
    }
  }

  /**
   * 👋 Natural Greeting Based on Context & Time
   */
  private async greetUser(): Promise<void> {
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());
    
    let greeting = '';
    
    if (hour < 12) {
      greeting = "Good morning! Ready to tackle the day?";
    } else if (hour < 17) {
      greeting = "Good afternoon! How's your day going?";
    } else {
      greeting = "Good evening! Hope you had a productive day.";
    }

    // Add personality based on traits
    if (this.personality.traits.proactivity > 7) {
      greeting += " I've been thinking about your schedule - want me to give you a quick briefing?";
    }

    await this.speak(greeting, { emotional: true, priority: 'medium' });
  }

  /**
   * 🎧 Process Speech Input with Natural Language Understanding
   */
  private async handleSpeechResult(event: any): Promise<void> {
    if (this.isProcessing) return;

    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript = event.results[i][0].transcript.trim();
        break;
      }
    }

    if (!transcript || transcript.length < 2) return;

    console.log('🎤 Heard:', transcript);
    this.isProcessing = true;

    try {
      // Add to conversation flow
      const conversationTurn: ConversationTurn = {
        id: `turn_${Date.now()}`,
        timestamp: new Date(),
        speaker: 'user',
        content: transcript,
        confidence: event.results[0][0].confidence || 0.8,
        actionsTaken: []
      };

      this.currentContext?.conversationFlow.push(conversationTurn);

      // Understand intent and respond naturally
      const intent = await this.parseConversationalIntent(transcript);
      await this.handleConversationalIntent(intent, transcript);

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 🧠 Natural Language Understanding - Like Talking to a Real Person
   */
  private async parseConversationalIntent(transcript: string): Promise<ConversationIntent> {
    const lowerTranscript = transcript.toLowerCase();
    
    // Emotional context detection
    let emotionalContext = 'neutral';
    if (/stressed|overwhelmed|busy|crazy/.test(lowerTranscript)) emotionalContext = 'stressed';
    if (/excited|great|awesome|love/.test(lowerTranscript)) emotionalContext = 'positive';
    if (/frustrated|annoying|problem/.test(lowerTranscript)) emotionalContext = 'frustrated';

    // Intent classification with natural conversation patterns
    if (/^(hi|hello|hey|good morning|good afternoon)/.test(lowerTranscript)) {
      return {
        type: 'casual',
        category: 'general',
        entities: {},
        urgency: 3,
        emotionalContext,
        requiresResponse: true,
        expectsAction: false
      };
    }

    if (/what.*(do|have)|show me|tell me|briefing|update/.test(lowerTranscript)) {
      return {
        type: 'question',
        category: this.detectCategory(lowerTranscript),
        action: 'briefing',
        entities: {},
        urgency: 5,
        emotionalContext,
        requiresResponse: true,
        expectsAction: true
      };
    }

    if (/schedule|calendar|meeting|appointment/.test(lowerTranscript)) {
      return {
        type: 'request',
        category: 'calendar',
        action: 'schedule_management',
        entities: this.extractTimeEntities(lowerTranscript),
        urgency: 7,
        emotionalContext,
        requiresResponse: true,
        expectsAction: true
      };
    }

    if (/email|send|message|write/.test(lowerTranscript)) {
      return {
        type: 'request',
        category: 'email',
        action: 'email_management',
        entities: this.extractEmailEntities(lowerTranscript),
        urgency: 6,
        emotionalContext,
        requiresResponse: true,
        expectsAction: true
      };
    }

    // Default conversational response
    return {
      type: 'casual',
      category: 'general',
      entities: {},
      urgency: 3,
      emotionalContext,
      requiresResponse: true,
      expectsAction: false
    };
  }

  /**
   * 💬 Handle Conversational Intent with Personality & Context
   */
  private async handleConversationalIntent(intent: ConversationIntent, transcript: string): Promise<void> {
    let response = '';
    let actions: string[] = [];

    switch (intent.type) {
      case 'casual':
        response = await this.generateCasualResponse(transcript, intent.emotionalContext);
        break;

      case 'question':
      case 'request':
        response = await this.handleActionableRequest(intent, transcript);
        actions = await this.executeRequestedActions(intent);
        break;

      default:
        response = "I'm here to help! What would you like to work on?";
    }

    // Add assistant response to conversation flow
    const assistantTurn: ConversationTurn = {
      id: `turn_${Date.now()}`,
      timestamp: new Date(),
      speaker: 'assistant',
      content: response,
      intent: intent.type,
      emotion: intent.emotionalContext,
      confidence: 0.95,
      actionsTaken: actions
    };

    this.currentContext?.conversationFlow.push(assistantTurn);

    // Speak response with emotional context
    await this.speak(response, { 
      emotional: true, 
      priority: intent.urgency > 7 ? 'high' : 'medium',
      emotionalContext: intent.emotionalContext
    });

    this.emit('conversationTurn', { intent, response, actions });
  }

  /**
   * 🎭 Generate Natural Casual Responses
   */
  private async generateCasualResponse(transcript: string, emotion: string): Promise<string> {
    const lowerTranscript = transcript.toLowerCase();
    
    if (/^(hi|hello|hey)/.test(lowerTranscript)) {
      const responses = [
        "Hey there! What's on your mind today?",
        "Hello! Ready to get some things done?",
        "Hi! I'm here and ready to help.",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (/how are you/.test(lowerTranscript)) {
      return "I'm doing great! All systems running smoothly. How are you feeling today?";
    }

    if (/thank you|thanks/.test(lowerTranscript)) {
      return "You're very welcome! Always happy to help.";
    }

    // Emotional responses
    if (emotion === 'stressed') {
      return "I can sense you're feeling a bit overwhelmed. Let me help organize things for you.";
    }

    if (emotion === 'positive') {
      return "I love your energy! Let's channel that into getting some great work done.";
    }

    return "I'm listening. What would you like to focus on?";
  }

  /**
   * 🎯 Handle Actionable Requests with System Integration
   */
  private async handleActionableRequest(intent: ConversationIntent, transcript: string): Promise<string> {
    switch (intent.category) {
      case 'calendar':
        return "Let me check your calendar... I see you have some meetings coming up. Want me to give you a briefing?";
      
      case 'email':
        return "I'll help you with your emails. Checking your inbox now...";
      
      case 'tasks':
        return "Looking at your tasks and priorities. Let me organize this for you.";
      
      default:
        return "I understand you want me to help with that. Let me see what I can do.";
    }
  }

  /**
   * 🔧 Execute Actions Based on Voice Requests
   */
  private async executeRequestedActions(intent: ConversationIntent): Promise<string[]> {
    const actions: string[] = [];

    // This will connect to your existing hierarchy systems
    switch (intent.action) {
      case 'briefing':
        actions.push('calendar_briefing', 'email_summary', 'task_overview');
        // TODO: Connect to AIAgentOrchestrator for briefing
        break;
      
      case 'schedule_management':
        actions.push('calendar_check', 'conflict_detection');
        // TODO: Connect to CalendarAgent
        break;
      
      case 'email_management':
        actions.push('email_prioritization', 'draft_suggestions');
        // TODO: Connect to UniversalEmailAgentSystem
        break;
    }

    return actions;
  }

  /**
   * 🗣️ Natural Text-to-Speech with Personality & Emotion
   */
  public async speak(text: string, options: {
    emotional?: boolean;
    priority?: 'low' | 'medium' | 'high';
    emotionalContext?: string;
    interrupt?: boolean;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (options.interrupt && this.currentUtterance) {
        this.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice based on personality and emotion
      utterance.rate = this.voiceConfig.speechSynthesis.rate;
      utterance.pitch = this.voiceConfig.speechSynthesis.pitch;
      utterance.volume = this.voiceConfig.speechSynthesis.volume;

      // Adjust for emotional context
      if (options.emotional && options.emotionalContext) {
        switch (options.emotionalContext) {
          case 'positive':
            utterance.rate += 0.1;
            utterance.pitch += 0.1;
            break;
          case 'stressed':
            utterance.rate -= 0.1;
            utterance.pitch -= 0.1;
            break;
          case 'frustrated':
            utterance.rate -= 0.2;
            break;
        }
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (error) => {
        this.currentUtterance = null;
        reject(error);
      };

      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);

      console.log('🗣️ Speaking:', text);
      this.emit('assistantSpeaking', { text, options });
    });
  }

  /**
   * 🛑 Stop Current Conversation
   */
  public stopConversation(): void {
    this.isListening = false;
    
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    
    if (this.currentUtterance) {
      this.speechSynthesis.cancel();
    }

    // Save conversation memory
    if (this.currentContext) {
      const userId = this.currentContext.userId;
      if (!this.conversationMemory.has(userId)) {
        this.conversationMemory.set(userId, []);
      }
      this.conversationMemory.get(userId)!.push(this.currentContext);
    }

    this.currentContext = null;
    this.emit('conversationEnded');
  }

  /**
   * 🧠 Learning & Memory Functions
   */
  public getConversationHistory(userId: string): ConversationContext[] {
    return this.conversationMemory.get(userId) || [];
  }

  public updatePersonality(updates: Partial<PersonalityProfile>): void {
    this.personality = { ...this.personality, ...updates };
    this.emit('personalityUpdated', this.personality);
  }

  // Helper methods for entity extraction
  private detectCategory(text: string): 'email' | 'calendar' | 'tasks' | 'general' | 'personal' {
    if (/email|message|send|inbox/.test(text)) return 'email';
    if (/calendar|schedule|meeting|appointment/.test(text)) return 'calendar';
    if (/task|todo|project|work/.test(text)) return 'tasks';
    return 'general';
  }

  private extractTimeEntities(text: string): Record<string, any> {
    // TODO: Implement time/date entity extraction
    return {};
  }

  private extractEmailEntities(text: string): Record<string, any> {
    // TODO: Implement email entity extraction (recipients, subjects, etc.)
    return {};
  }
}