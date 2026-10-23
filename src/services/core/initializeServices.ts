import { AIService as BaseAIServiceInterface } from '../ai/baseAIService'; // Renamed import for clarity
import { TaskService } from '../TaskService';
import { CalendarService } from '../CalendarService';
import { WorkflowOrchestrator } from '../WorkflowOrchestrator';
import { AgentCreationService } from '../AgentCreationService';
import { VoiceControl } from '../VoiceControl';
import { AIAssistantService } from '../AIAssistantService';
import { geminiSimplifiedService as geminiService } from '../gemini-simplified'; // Primary AI Service

class ServiceContainer {
  private static instance: ServiceContainer;
  
  // Core Services
  public aiService: BaseAIServiceInterface; // This will be an instance of GeminiService
  public taskService: TaskService;
  public calendarService: CalendarService;
  public workflowOrchestrator: WorkflowOrchestrator;
  public agentCreationService: AgentCreationService;
  public voiceControl: VoiceControl;
  public aiAssistant: AIAssistantService;

  private constructor() {
    // Initialize AI provider
    this.aiService = this.initializePrimaryAIService();
    
    // Initialize core services that depend on the primary AI Service
    this.taskService = new TaskService(this.aiService);
    this.calendarService = new CalendarService(this.taskService, this.aiService);
    this.workflowOrchestrator = new WorkflowOrchestrator();
    this.agentCreationService = new AgentCreationService();
    this.voiceControl = new VoiceControl();
    
    // Initialize AI Assistant with default configuration
    const defaultPersonality = {
      name: 'Genie',
      traits: {
        openness: 0.8,
        conscientiousness: 0.9,
        extraversion: 0.7,
        agreeableness: 0.8,
        neuroticism: 0.3
      },
      preferences: {
        name: 'Default',
        focusPreferences: {
          ambientSound: false,
          soundType: 'nature',
          checkInterval: 30
        },
        communicationStyle: {
          verbosity: 'concise' as const,
          tone: 'formal' as const,
          useEmoji: false
        }
      },
      learningStyle: 'visual' as const,
      communicationStyle: {
        tone: 'formal' as const,
        verbosity: 0.7,
        formality: 0.8
      },
      workStyle: {
        peakProductivityHours: [9, 10, 11, 14, 15, 16],
        preferredTaskDuration: 45,
        breakFrequency: 90
      },
      update: () => {} // Add required update method
    };

    this.aiAssistant = new AIAssistantService(defaultPersonality);
  }

  private initializePrimaryAIService(): BaseAIServiceInterface {
    // console.log('Initializing AI Service: Using Google Gemini as primary provider.');
    return geminiService; // geminiService already implements BaseAIServiceInterface
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const services = ServiceContainer.getInstance();

// Export individual services for convenience
export const {
  aiService, // This is now geminiService
  taskService,
  calendarService,
  workflowOrchestrator,
  agentCreationService,
  voiceControl,
  aiAssistant
} = services;