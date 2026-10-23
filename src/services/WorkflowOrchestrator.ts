import { WorkflowLearner } from './WorkflowLearner';
import { VoiceControl } from './VoiceControl';
import { AgentCreationService } from './AgentCreationService';
import type { UserAction, WorkflowPattern, AgentConfig, AgentSuggestion, AgentExecutionResult } from '../types/workflow';
import { BehaviorSubject, Observable } from 'rxjs';
import { EmailAgent, CalendarAgent, DocumentAgent, TaskAgent } from './agents';
import { AgentAction } from './agents/BaseAgent';

export class WorkflowOrchestrator {
  private workflowLearner: WorkflowLearner;
  private voiceControl: VoiceControl;
  private agentCreationService: AgentCreationService;
  private emailAgent: EmailAgent;
  private calendarAgent: CalendarAgent;
  private documentAgent: DocumentAgent;
  private taskAgent: TaskAgent;
  
  private patterns$ = new BehaviorSubject<WorkflowPattern[]>([]);
  private activeAgents$ = new BehaviorSubject<AgentConfig[]>([]);
  private agentExecutions$ = new BehaviorSubject<Record<string, boolean>>({});
  private agentResults$ = new BehaviorSubject<Record<string, AgentExecutionResult[]>>({});
  public suggestions$ = new BehaviorSubject<AgentSuggestion[]>([]);

  constructor() {
    this.workflowLearner = new WorkflowLearner();
    this.voiceControl = new VoiceControl();
    this.agentCreationService = new AgentCreationService();
    
    // Initialize specialized agents with proper configs
    this.emailAgent = new EmailAgent();
    this.calendarAgent = new CalendarAgent();
    this.documentAgent = new DocumentAgent();
    this.taskAgent = new TaskAgent();

    this.setupVoiceCommands();
    this.initializePatternSubscription();
  }

  private initializePatternSubscription(): void {
    this.workflowLearner.patterns$.subscribe(patterns => {
      this.patterns$.next(patterns);
      this.updateSuggestions();
    });
  }

  private updateSuggestions(): void {
    const suggestions = this.workflowLearner.suggestAutomations();
    this.suggestions$.next(suggestions);
  }

  private setupVoiceCommands(): void {
    this.voiceControl.registerCommand('analyze workflow', () => {
      this.analyzeWorkflow();
    });

    this.voiceControl.registerCommand('create agent from pattern', (params) => {
      const patternId = params.patternId;
      const pattern = this.patterns$.value.find(p => p.id === patternId);
      if (pattern) {
        this.createAgentFromPattern(pattern);
      }
    });

    this.voiceControl.registerCommand('show patterns', () => {
      const patterns = this.patterns$.value;
      if (patterns.length === 0) {
        this.voiceControl.speak('No workflow patterns detected yet');
      } else {
        this.voiceControl.speak(`Found ${patterns.length} workflow patterns`);
      }
    });
  }

  public recordAction(action: UserAction): void {
    this.workflowLearner.recordAction(action);
    this.updatePatterns();
  }

  private updatePatterns(): void {
    const suggestions = this.workflowLearner.suggestAutomation();
    if (suggestions.length > 0) {
      this.voiceControl.speak(`Found ${suggestions.length} new automation opportunities`);
    }
    this.patterns$.next(this.workflowLearner.getPatterns());
  }

  public async createAgentFromPattern(pattern: WorkflowPattern): Promise<AgentConfig | null> {
    try {
      const agent = this.agentCreationService.createAgentFromPattern(pattern);
      const currentAgents = this.activeAgents$.value;
      this.activeAgents$.next([...currentAgents, agent]);

      this.voiceControl.speak(`Created new ${agent.name}. Would you like me to explain its capabilities?`);

      // Start training if needed
      if (pattern.type === 'learning') {
        await this.trainAgent(agent.id, pattern.actions);
      }

      return agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      this.voiceControl.speak('Sorry, I encountered an error while creating the agent');
      return null;
    }
  }

  public getPatterns(): Observable<WorkflowPattern[]> {
    return this.patterns$.asObservable();
  }

  public getActiveAgents(): Observable<AgentConfig[]> {
    return this.activeAgents$.asObservable();
  }

  public startVoiceControl(): void {
    this.voiceControl.startListening();
  }

  public stopVoiceControl(): void {
    this.voiceControl.stopListening();
  }

  private analyzeWorkflow(): void {
    this.voiceControl.speak('Analyzing your workflow patterns');
    this.workflowLearner.analyzePatterns();
    this.updatePatterns();
  }

  public async executeAgentAction(
    agentId: string,
    action: string,
    params: any = {}
  ): Promise<any> {
    try {
      this.agentExecutions$.next({
        ...this.agentExecutions$.value,
        [agentId]: true
      });

      const agent = this.activeAgents$.value.find(a => a.id === agentId);
      if (!agent) throw new Error('Agent not found');

      const result = await this.executeAction(agent.type, action, params);
      
      // Store result
      const currentResults = this.agentResults$.value[agentId] || [];
      this.agentResults$.next({
        ...this.agentResults$.value,
        [agentId]: [...currentResults, { 
          action, 
          result, 
          timestamp: new Date(),
          error: null 
        }]
      });

      this.voiceControl.speak(`${agent.name} completed ${action}`);
      return result;

    } catch (error) {
      console.error(`Agent execution error:`, error);
      this.voiceControl.speak(`Error executing ${action}`);

      // Store error result
      const currentResults = this.agentResults$.value[agentId] || [];
      this.agentResults$.next({
        ...this.agentResults$.value,
        [agentId]: [...currentResults, { 
          action, 
          result: null, 
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      });

      throw error;
    } finally {
      this.agentExecutions$.next({
        ...this.agentExecutions$.value,
        [agentId]: false
      });
    }
  }

  public executeAction(agentType: string, action: string, params: any): any {
    console.log(`Executing action ${action} with ${agentType} agent`, params);
    
    // Create an AgentAction object
    const agentAction: AgentAction = {
      type: action,
      params: params
    };

    try {
      switch (agentType) {
        case 'email':
          return this.emailAgent.executeAction(agentAction);
        case 'document':
          // Call the agent's executeAction method with the AgentAction object
          return this.executeDocumentAction(agentAction);
        case 'task':
          // Call the agent's executeAction method with the AgentAction object
          return this.executeTaskAction(agentAction);
        case 'calendar':
          return this.calendarAgent.executeAction(agentAction);
        case 'workflow':
          return this.executeWorkflowAction(agentAction);
        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action} with ${agentType} agent:`, error);
      throw error;
    }
  }

  private executeDocumentAction(action: AgentAction): any {
    // The document agent has a protected executeAction method, so we need
    // to call specific public methods based on the action type
    return this.documentAgent.handleAction(action);
  }

  private executeTaskAction(action: AgentAction): any {
    // The task agent has a protected executeAction method, so we need
    // to call specific public methods based on the action type
    return this.taskAgent.handleAction(action);
  }

  private executeWorkflowAction(action: AgentAction): any {
    switch (action.type) {
      case 'record_action':
        // Convert params to a proper UserAction
        const userAction: UserAction = {
          type: action.params.type || 'unknown',
          payload: action.params.payload || {},
          timestamp: new Date(),
          userId: action.params.userId || 'current-user'
        };
        return this.workflowLearner.recordAction(userAction);
      case 'suggest_automations':
        return this.workflowLearner.suggestAutomations();
      case 'get_patterns':
        return this.workflowLearner.getPatterns();
      case 'analyze_patterns':
        return this.workflowLearner.analyzePatterns();
      default:
        throw new Error(`Unknown workflow action: ${action.type}`);
    }
  }

  public getAgentMetrics(agentId: string): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecution: Date | null;
  } {
    const results = this.agentResults$.value[agentId] || [];
    return {
      totalExecutions: results.length,
      successRate: results.filter(r => !r.error).length / (results.length || 1),
      averageExecutionTime: this.calculateAverageExecutionTime(results),
      lastExecution: results[results.length - 1]?.timestamp || null
    };
  }

  private calculateAverageExecutionTime(results: AgentExecutionResult[]): number {
    if (results.length < 2) return 0;
    const times = results.map(r => r.timestamp.getTime());
    const intervals = times.slice(1).map((time, i) => time - times[i]);
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  public async trainAgent(agentId: string, trainingData: any[]): Promise<void> {
    const agent = this.activeAgents$.value.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    this.voiceControl.speak(`Starting training for ${agent.name}`);
    
    try {
      switch (agent.type) {
        case 'email':
          await this.emailAgent.train(trainingData);
          break;
        case 'calendar':
          await this.calendarAgent.train(trainingData);
          break;
        case 'document':
          await this.documentAgent.train(trainingData);
          break;
        case 'task':
          await this.taskAgent.train(trainingData);
          break;
        default:
          throw new Error(`Cannot train agent of unknown type: ${agent.type}`);
      }
      
      this.voiceControl.speak(`Training completed for ${agent.name}`);
    } catch (error) {
      console.error(`Training error for agent ${agentId}:`, error);
      this.voiceControl.speak(`Error during training for ${agent.name}`);
      throw error;
    }
  }

  public async observeUserActions(action: UserAction): Promise<void> {
    this.workflowLearner.analyzeActions([action]);
    const suggestions = this.workflowLearner.suggestAutomations();
    
    if (suggestions.length > this.suggestions$.value.length) {
      this.voiceControl.speak(`Found ${suggestions.length} new automation opportunities`);
    }
    
    this.suggestions$.next(suggestions);
  }
} 