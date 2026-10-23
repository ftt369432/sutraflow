/**
 * Universal AI Capability Manager
 * Enhanced with Autonomous Decision-Making and Cross-Agent Learning
 * Manages all AI capabilities that can be hooked into any AI system
 * This is the "base layer" that provides universal functionality
 */

import { AICapability, CapabilityManager, CapabilityResult } from './types';
import { DocumentCapability } from './DocumentCapability';
import { ExportCapability } from './ExportCapability';
import { AdvancedAICapability } from './AdvancedAICapability';
import { ImageGenerationCapability } from './ImageGenerationCapability';
import { CalendarCapability } from './CalendarCapability';
import { TaskCapability } from './TaskCapability';
import { LegalAutonomousCapability } from './LegalAutonomousCapability';
import { 
  AutonomousAction, 
  AutonomousDecision, 
  UserBehaviorPattern, 
  ProfessionalContext,
  ProfessionType,
  UniversalAutonomyLevel,
  RiskAssessment 
} from '../../types/agent';

export class UniversalCapabilityManager implements CapabilityManager {
  private capabilities: Map<string, AICapability> = new Map();
  private static instance: UniversalCapabilityManager;
  
  // Autonomous enhancement properties
  private userBehaviorPatterns: Map<string, UserBehaviorPattern[]> = new Map();
  private autonomousDecisions: AutonomousDecision[] = [];
  private crossAgentLearning: Map<string, any> = new Map();
  private currentProfession: ProfessionType = ProfessionType.UNIVERSAL;
  private autonomyLevel: UniversalAutonomyLevel = UniversalAutonomyLevel.MEDIUM_RISK_AUTO;

  constructor() {
    this.initializeDefaultCapabilities();
  }

  /**
   * Singleton pattern - ensures one capability manager across the app
   */
  static getInstance(): UniversalCapabilityManager {
    if (!UniversalCapabilityManager.instance) {
      UniversalCapabilityManager.instance = new UniversalCapabilityManager();
    }
    return UniversalCapabilityManager.instance;
  }

  /**
   * Initialize default capabilities that every AI should have
   */
  private initializeDefaultCapabilities(): void {
    // Document generation capability - works for ANY profession
    this.registerCapability(new DocumentCapability());
    
    // Export capability - PDF, DOC, MD, etc.
    this.registerCapability(new ExportCapability());
    
    // Advanced AI integration - access to enhanced AI models
    this.registerCapability(new AdvancedAICapability());
    
    // Image generation - DALL-E and other AI image services
    this.registerCapability(new ImageGenerationCapability());
    
    // Calendar capability - auto-navigation and calendar management
    this.registerCapability(new CalendarCapability());
    
    // Task capability - auto-navigation and task management
    this.registerCapability(new TaskCapability());
    
    // Legal autonomous capability - intelligent legal profession assistance
    this.registerCapability(new LegalAutonomousCapability());
    
    // Future capabilities can be added here:
    // this.registerCapability(new EmailCapability());
    // this.registerCapability(new LearningCapability());
    // this.registerCapability(new VoiceCapability());
    // this.registerCapability(new TranslationCapability());
    // this.registerCapability(new CodeGenerationCapability());
    // this.registerCapability(new ResearchCapability());
  }

  /**
   * Register a new capability
   */
  registerCapability(capability: AICapability): void {
    console.log(`🔌 Registering capability: ${capability.name} v${capability.version}`);
    this.capabilities.set(capability.name, capability);
  }

  /**
   * Unregister a capability
   */
  unregisterCapability(name: string): void {
    console.log(`🔌 Unregistering capability: ${name}`);
    this.capabilities.delete(name);
  }

  /**
   * Detect which capabilities can handle a user request
   */
  async detectCapabilities(input: string, context?: any): Promise<AICapability[]> {
    const applicableCapabilities: AICapability[] = [];

    for (const [name, capability] of this.capabilities) {
      try {
        if (capability.detectIntent) {
          const intent = await capability.detectIntent(input, context);
          
          // Different capabilities might have different intent detection formats
          const hasIntent = this.evaluateIntent(intent);
          
          if (hasIntent) {
            console.log(`🎯 Capability detected: ${name} can handle "${input.substring(0, 50)}..."`);
            applicableCapabilities.push(capability);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error detecting intent for capability ${name}:`, error);
      }
    }

    return applicableCapabilities;
  }

  /**
   * Execute a specific capability
   */
  async executeCapability(name: string, request: any, context?: any): Promise<CapabilityResult> {
    const capability = this.capabilities.get(name);
    
    if (!capability) {
      return {
        success: false,
        message: `Capability '${name}' not found`
      };
    }

    try {
      if (capability.process) {
        return await capability.process(request, context);
      } else {
        return {
          success: false,
          message: `Capability '${name}' does not support processing`
        };
      }
    } catch (error) {
      console.error(`❌ Error executing capability ${name}:`, error);
      return {
        success: false,
        message: `Capability execution failed: ${error.message}`
      };
    }
  }

  /**
   * Auto-detect and execute the best capability for a request
   */
  async autoExecute(input: string, context?: any): Promise<CapabilityResult[]> {
    const capabilities = await this.detectCapabilities(input, context);
    const results: CapabilityResult[] = [];

    for (const capability of capabilities) {
      try {
        const result = await this.executeCapability(capability.name, { userInput: input }, context);
        results.push(result);
      } catch (error) {
        console.error(`❌ Auto-execution failed for ${capability.name}:`, error);
        results.push({
          success: false,
          message: `Auto-execution failed: ${error.message}`
        });
      }
    }

    return results;
  }

  /**
   * Get all registered capabilities
   */
  getCapabilities(): AICapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Get capability by name
   */
  getCapability(name: string): AICapability | undefined {
    return this.capabilities.get(name);
  }

  /**
   * Evaluate different intent detection formats
   */
  private evaluateIntent(intent: any): boolean {
    if (typeof intent === 'boolean') return intent;
    if (intent && typeof intent === 'object') {
      // Document capability format
      if ('isDocument' in intent) return intent.isDocument;
      // Generic format
      if ('hasIntent' in intent) return intent.hasIntent;
      if ('confidence' in intent) return intent.confidence > 0.5;
    }
    return false;
  }

  // ============================================================================
  // AUTONOMOUS ENHANCEMENT METHODS
  // ============================================================================

  /**
   * Set profession context for intelligent decision-making
   */
  setProfessionContext(profession: ProfessionType, context?: ProfessionalContext): void {
    this.currentProfession = profession;
    console.log(`🎯 [UniversalCapabilityManager] Profession context set to: ${profession}`);
  }

  /**
   * Set autonomy level for automatic execution
   */
  setAutonomyLevel(level: UniversalAutonomyLevel): void {
    this.autonomyLevel = level;
    console.log(`🤖 [UniversalCapabilityManager] Autonomy level set to: ${level}`);
  }

  /**
   * Record user behavior pattern for learning
   */
  recordUserBehavior(userId: string, pattern: UserBehaviorPattern): void {
    if (!this.userBehaviorPatterns.has(userId)) {
      this.userBehaviorPatterns.set(userId, []);
    }
    
    const userPatterns = this.userBehaviorPatterns.get(userId)!;
    userPatterns.push(pattern);
    
    // Keep only the last 100 patterns per user
    if (userPatterns.length > 100) {
      userPatterns.shift();
    }
    
    console.log(`📊 [UniversalCapabilityManager] Recorded behavior pattern for user ${userId}`);
  }

  /**
   * Make autonomous decision based on context and patterns
   */
  async makeAutonomousDecision(
    input: string, 
    context: ProfessionalContext,
    userId?: string
  ): Promise<AutonomousDecision | null> {
    console.log(`🧠 [UniversalCapabilityManager] Making autonomous decision...`);

    // Get available capabilities
    const capabilities = await this.detectCapabilities(input, context);
    if (capabilities.length === 0) {
      return null;
    }

    // Get user patterns
    const userPatterns = userId ? this.userBehaviorPatterns.get(userId) || [] : [];

    // Generate potential actions
    const availableActions: AutonomousAction[] = [];
    for (const capability of capabilities) {
      const action: AutonomousAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: capability.name,
        description: `Execute ${capability.description}`,
        confidence: 0.8,
        riskLevel: this.assessActionRisk(capability.name, context),
        expectedOutcome: `Successful execution of ${capability.name}`,
        requiredApprovals: this.getRequiredApprovals(capability.name),
        dependencies: [],
        timeEstimate: 5,
        rollbackPossible: true,
        metadata: { capability: capability.name, input }
      };
      availableActions.push(action);
    }

    if (availableActions.length === 0) {
      return null;
    }

    // Select best action based on confidence and risk
    const selectedAction = this.selectBestAction(availableActions, userPatterns);
    
    // Create decision
    const decision: AutonomousDecision = {
      id: `decision_${Date.now()}`,
      context,
      userPatterns,
      availableActions,
      selectedAction,
      confidence: selectedAction.confidence,
      reasoning: `Selected ${selectedAction.type} based on ${userPatterns.length} user patterns`,
      expectedOutcome: selectedAction.expectedOutcome,
      riskAssessment: {
        overall: 0.3,
        categories: [],
        mitigations: [],
        acceptableThreshold: 0.7
      },
      timestamp: new Date(),
      executionPlan: [{
        id: `step_1`,
        action: selectedAction.type,
        parameters: { input, context },
        expectedDuration: selectedAction.timeEstimate,
        checkpoints: ['input_validation', 'execution'],
        rollbackActions: ['revert_changes']
      }]
    };

    // Store decision for learning
    this.autonomousDecisions.push(decision);

    console.log(`✅ [UniversalCapabilityManager] Autonomous decision made: ${selectedAction.type}`);
    return decision;
  }

  /**
   * Execute autonomous decision if approved
   */
  async executeAutonomousDecision(decision: AutonomousDecision): Promise<CapabilityResult> {
    console.log(`🚀 [UniversalCapabilityManager] Executing autonomous decision: ${decision.selectedAction.type}`);

    try {
      // Execute the selected action
      const result = await this.executeCapability(
        decision.selectedAction.type, 
        decision.selectedAction.metadata, 
        decision.context
      );

      return result;
    } catch (error) {
      console.error(`❌ [UniversalCapabilityManager] Autonomous execution failed:`, error);
      
      return {
        success: false,
        message: `Autonomous execution failed: ${error.message}`,
        data: { decision }
      };
    }
  }

  // Private helper methods
  private assessActionRisk(capabilityName: string, context: ProfessionalContext): 'low' | 'medium' | 'high' | 'critical' {
    const mediumRiskCapabilities = ['document', 'export'];
    if (mediumRiskCapabilities.includes(capabilityName)) return 'medium';
    return 'low';
  }

  private getRequiredApprovals(capabilityName: string): string[] {
    const criticalCapabilities = ['document', 'export'];
    if (criticalCapabilities.includes(capabilityName)) {
      return ['user_confirmation'];
    }
    return [];
  }

  private selectBestAction(actions: AutonomousAction[], patterns: UserBehaviorPattern[]): AutonomousAction {
    // Score actions based on confidence and user patterns
    let bestAction = actions[0];
    let bestScore = 0;

    for (const action of actions) {
      let score = action.confidence;
      
      // Increase score for user pattern matches
      const patternMatch = patterns.find(p => p.predictedNextAction.type === action.type);
      if (patternMatch) {
        score += patternMatch.confidence * 0.2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }
}

/**
 * Global capability manager instance
 * This can be imported and used anywhere in the app
 */
export const universalCapabilities = UniversalCapabilityManager.getInstance();
