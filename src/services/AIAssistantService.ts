import { PersonalityProfile } from '../types/personality';
// import { GENIE_ARCHETYPES, PersonalityModifiers } from '../types/geniePersonalities'; // Unused
import { WorkflowLearner } from './WorkflowLearner';
import { LearningService } from './LearningService';
// Import from '../types/assistant' is now empty or removed if UserPreferences was the only one.
import { WorkflowPattern, WorkflowSuggestion } from '../types/workflow';

type CommunicationTone = 'formal' | 'casual' | 'friendly' | 'professional';

export class AIAssistantService {
  private learningService: LearningService;
  private workflowLearner: WorkflowLearner;
  private currentContext: LocalAssistantContext = {
    recentInteractions: [],
    userState: 'neutral',
    timeOfDay: 'morning',
    activeWorkflow: null
  };

  constructor(
    private personality: PersonalityProfile
    // private _userPreferences: UserPreferences // Removed as it appears unused
  ) {
    this.learningService = new LearningService();
    this.workflowLearner = new WorkflowLearner();
    this.initializeAssistant();
  }
  
  /**
   * Update the assistant's personality based on learned adaptations
   */
  public updatePersonality(adaptations: Partial<PersonalityProfile>): void {
    if (!adaptations || Object.keys(adaptations).length === 0) {
      return;
    }
    
    console.log('Updating assistant personality with adaptations:', adaptations);
    
    // Apply adaptations to personality
    this.personality.update(adaptations);
    
    // Log the change
    console.log('Assistant personality updated successfully');
  }

  private async initializeAssistant() {
    // Load user history and patterns
    await this.loadUserContext();
    this.setupContinuousLearning();
  }

  public async processInput(input: string): Promise<LocalAssistantResponse> {
    // Update context with new input
    this.updateContext(input);

    // Analyze intent and emotion
    const intent = await this.analyzeIntent(input);
    const emotion = await this.analyzeEmotion(input);

    // Generate appropriate response
    const response = await this.generateResponse(input, intent, emotion);

    // Learn from interaction
    await this.learnFromInteraction(input, response, intent);

    return response;
  }

  private async analyzeIntent(input: string): Promise<LocalIntent> {
    // Categorize user intent
    const intents = {
      task: /create|make|do|start|schedule/i,
      query: /what|how|why|when|where/i,
      emotion: /feel|feeling|stress|happy|worried/i,
      workflow: /workflow|process|routine/i,
      system: /settings|configure|preferences/i
    };

    for (const [type, pattern] of Object.entries(intents)) {
      if (pattern.test(input)) {
        return {
          type: type as IntentType,
          confidence: this.calculateConfidence(input, pattern),
          entities: this.extractEntities(input)
        };
      }
    }

    return { type: 'unknown', confidence: 0.5, entities: [] };
  }

  private async generateResponse(
    _input: string,
    intent: LocalIntent,
    emotion: string
  ): Promise<LocalAssistantResponse> {
    // Select appropriate personality based on context
    const personality = this.selectPersonality(intent, emotion);
    
    // Generate base response
    const baseResponse = await this.craftResponse(personality, intent, this.currentContext);
    
    // Personalize the response
    const personalizedResponse = this.personalizeResponse(baseResponse, this.currentContext);

    // Generate actions and suggestions
    const actions = await this.determineActions(intent);
    const suggestions = await this.generateSuggestions(intent);

    return {
      text: personalizedResponse,
      actions,
      suggestions,
      personality
    };
  }

  private selectPersonality(intent: LocalIntent, emotion: string): PersonalityProfile {
    const timeOfDay = new Date().getHours();
    // const workContext = this.determineWorkContext(); // Removed unused variable

    // Adjust personality traits based on context
    const adjustedPersonality = {
      ...this.personality,
      communicationStyle: {
        ...this.personality.communicationStyle,
        formality: this.calculateFormality(intent, emotion),
        verbosity: this.calculateVerbosity(intent),
        tone: this.selectTone(emotion, timeOfDay)
      }
    };

    return adjustedPersonality;
  }

  private async craftResponse(
    personality: PersonalityProfile,
    intent: LocalIntent,
    _context: LocalAssistantContext
  ): Promise<string> {
    let response = '';

    switch (intent.type) {
      case 'task':
        response = await this.generateTaskResponse(intent, personality);
        break;
      case 'query':
        response = await this.generateQueryResponse(intent, personality);
        break;
      case 'emotion':
        response = this.generateEmotionalResponse(intent, personality);
        break;
      case 'workflow':
        response = await this.generateWorkflowResponse(intent, personality);
        break;
      default:
        response = this.generateDefaultResponse(personality);
    }

    return this.applyPersonalityStyle(response, personality);
  }

  private calculateFormality(intent: LocalIntent, emotion: string): number {
    let formality = 0.5; // Default mid-level formality

    // Adjust based on intent
    if (intent.type === 'task' || intent.type === 'workflow') {
      formality += 0.2; // More formal for business-related intents
    }

    // Adjust based on emotion
    if (emotion === 'stressed' || emotion === 'frustrated') {
      formality -= 0.1; // Less formal when user is stressed
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, formality));
  }

  private calculateVerbosity(intent: LocalIntent): number {
    switch (intent.type) {
      case 'task':
        return 0.3; // Concise for tasks
      case 'query':
        return 0.7; // More detailed for questions
      case 'workflow':
        return 0.8; // Detailed for workflow suggestions
      default:
        return 0.5;
    }
  }

  private selectTone(emotion: string, hour: number): CommunicationTone {
    if (emotion === 'stressed') return 'friendly';
    if (emotion === 'confused') return 'professional';
    if (hour < 12) return 'friendly';
    if (hour > 20) return 'casual';
    return 'professional';
  }

  private applyPersonalityStyle(response: string, personality: PersonalityProfile): string {
    const { communicationStyle } = personality;
    
    // Apply tone modifications
    let styledResponse = this.applyTone(response, communicationStyle.tone);
    
    // Adjust verbosity
    styledResponse = this.adjustVerbosity(styledResponse, communicationStyle.verbosity);
    
    // Add personality-specific elements
    if (communicationStyle.tone === 'friendly') {
      styledResponse = this.addHumor(styledResponse);
    }

    return styledResponse;
  }

  private applyTone(response: string, _tone: string): string {
    // Implementation of tone modification
    return response;
  }

  private adjustVerbosity(response: string, _verbosity: number): string {
    // Implementation of verbosity adjustment
    return response;
  }

  private addHumor(response: string): string {
    // Implementation of humor addition
    return response;
  }

  private async determineActions(intent: LocalIntent): Promise<LocalAssistantAction[]> {
    const actions: LocalAssistantAction[] = [];

    if (intent.type === 'task') {
      actions.push({
        type: 'create_task',
        parameters: intent.entities
      });
    }

    if (intent.type === 'workflow') {
      const suggestions = await this.workflowLearner.suggestAutomation();
      actions.push({
        type: 'suggest_automation',
        parameters: { suggestions }
      });
    }

    return actions;
  }

  private async learnFromInteraction(
    input: string,
    response: LocalAssistantResponse,
    intent: LocalIntent
  ) {
    const emotion = await this.analyzeEmotion(input);

    const behaviorData = {
      type: 'interaction',
      timestamp: new Date(),
      context: { // UserBehavior.context is Record<string, any>
        userInput: input,
        userEmotion: emotion,
        intentType: intent.type,
        intentEntities: intent.entities,
        assistantResponse: response.text,
        activeWorkflow: this.currentContext.activeWorkflow,
        userState: this.currentContext.userState
      },
      metadata: { // Required field from UserBehavior in learning.ts
        frequency: 1,    // Placeholder
        importance: 0.5, // Placeholder
        duration: 0      // Placeholder
      }
    };

    this.learningService.recordBehavior(behaviorData);

    // Update personality based on learning
    const adaptations = this.learningService.suggestAdaptations(this.personality);
    if (adaptations) {
      this.personality.update(adaptations);
    }
  }

  private setupContinuousLearning() {
    // Monitor user patterns and adapt
    setInterval(async () => { // Made async just in case getPatterns or suggestAutomation becomes async
      const agentSuggestions = this.workflowLearner.suggestAutomation();
      if (agentSuggestions.length > 0) {
        const allWorkflowPatterns = this.workflowLearner.getPatterns();
        const relevantPatternIds = new Set(agentSuggestions.map(s => s.patternId));
        const patternsToImprove = allWorkflowPatterns.filter(p => relevantPatternIds.has(p.id));

        if (patternsToImprove.length > 0) {
          // Now patternsToImprove is WorkflowPattern[]
          await this.suggestWorkflowImprovements(patternsToImprove);
        }
      }
    }, 3600000); // Check every hour
  }

  private async suggestWorkflowImprovements(patterns: WorkflowPattern[]) {
    // const personality = GENIE_ARCHETYPES.WISE_MENTOR; // This was unused, consider if needed

    const newSuggestions: WorkflowSuggestion[] = patterns.map(pattern => {
      const suggestedAgentName = `${pattern.name.replace(/\s+/g, '_')}AutomationAgent`;
      // Attempt to derive capabilities from the actions in the pattern
      // This is a simplified approach; real capability detection would be more complex.
      const capabilities = pattern.actions.map(action => action.type) // Use action types as capabilities
                                       .filter((value, index, self) => self.indexOf(value) === index); // Unique

      return {
        type: 'automation', // Defaulting to automation suggestion
        description: `Based on the pattern '${pattern.name}' (you often ${pattern.description}), would you like to explore automating this sequence of actions?`,
        confidence: pattern.confidence,
        suggestedAgent: {
          name: suggestedAgentName,
          capabilities: capabilities.length > 0 ? capabilities : ['general_automation'], // Fallback capability
          autonomyLevel: 'supervised', // Default autonomy level
          triggers: [pattern.name] // Trigger based on pattern name
        }
      };
    });

    // Store suggestions for next interaction
    this.currentContext.pendingSuggestions = newSuggestions;
  }

  private async loadUserContext(): Promise<void> {
    // TODO: Load user preferences, historical interactions, learned patterns
  }

  private updateContext(input: string): void {
    this.currentContext.recentInteractions.push(input);
    // Update other context properties
  }

  private async analyzeEmotion(_input: string): Promise<string> {
    // Placeholder: Advanced emotion analysis would go here
    return 'neutral';
  }

  private calculateConfidence(_input: string, _pattern: RegExp): number {
    // Placeholder: More sophisticated confidence calculation
    return 0.8;
  }

  private extractEntities(_input: string): Array<{ type: string; value: any }> {
    // Placeholder: Named Entity Recognition (NER) logic
    return [];
  }

  private async generateSuggestions(_intent: LocalIntent): Promise<string[]> {
    // Placeholder: Suggestion generation logic
    return [];
  }

  private personalizeResponse(baseResponse: string, _context: LocalAssistantContext): string {
    // Placeholder: Personalization logic based on user history and preferences
    return baseResponse;
  }

  private async generateTaskResponse(intent: LocalIntent, personality: PersonalityProfile): Promise<string> {
    // TODO: Implement actual task response generation
    console.log(`Generating task response for intent: ${intent.type}, personality: ${personality.name}`);
    return `Placeholder response for task: ${intent.type}`;
  }

  private async generateQueryResponse(intent: LocalIntent, personality: PersonalityProfile): Promise<string> {
    // TODO: Implement actual query response generation
    console.log(`Generating query response for intent: ${intent.type}, personality: ${personality.name}`);
    return `Placeholder response for query: ${intent.type}`;
  }

  private generateEmotionalResponse(intent: LocalIntent, personality: PersonalityProfile): string {
    // TODO: Implement actual emotional response generation
    console.log(`Generating emotional response for intent: ${intent.type}, personality: ${personality.name}`);
    return `Placeholder response for emotion: ${intent.type}`;
  }

  private async generateWorkflowResponse(intent: LocalIntent, personality: PersonalityProfile): Promise<string> {
    // TODO: Implement actual workflow response generation
    console.log(`Generating workflow response for intent: ${intent.type}, personality: ${personality.name}`);
    return `Placeholder response for workflow: ${intent.type}`;
  }

  private generateDefaultResponse(personality: PersonalityProfile): string {
    // TODO: Implement actual default response generation
    console.log(`Generating default response for personality: ${personality.name}`);
    return `Placeholder default response`;
  }
}

interface LocalAssistantContext {
  recentInteractions: string[];
  userState: string;
  timeOfDay: string;
  activeWorkflow: string | null;
  pendingSuggestions?: WorkflowSuggestion[];
}

interface LocalAssistantResponse {
  text: string;
  actions: LocalAssistantAction[];
  suggestions: string[];
  personality: PersonalityProfile;
}

interface LocalAssistantAction {
  type: string;
  parameters: any;
}

interface LocalIntent {
  type: IntentType;
  confidence: number;
  entities: any[];
}

type IntentType = 'task' | 'query' | 'emotion' | 'workflow' | 'system' | 'unknown'; 