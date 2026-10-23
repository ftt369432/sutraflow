import { ActionMetrics } from '../../types/workflow';
import { BehaviorSubject } from 'rxjs';
import { AIServiceFactory, SimpleAIService } from '../ai/aiServiceFactory';
import { v4 as uuidv4 } from 'uuid';
import { useAuditStore } from '../../store/auditStore';
import type { AgentCapability } from '../../types/agent';
import {
  AgentType,
  TaskStatus,
  TaskPriority,
  AgentMessage,
  AIAgentTask,
  AIAgent
} from './types';

import { AgentConfig, AgentAction as AgentActionLog } from '../../types/agent';
export type { AgentConfig };

/**
 * Action to be performed by an agent (Internal BaseAgent type)
 */
export interface AgentAction {
  type: string;
  params: Record<string, any>;
  priority?: number;
  callbackId?: string;
}

/**
 * Result of an action performed by an agent
 */
export interface AgentActionResult {
  success: boolean;
  data?: any;
  error?: string;
  action: AgentAction;
  timestamp: Date;
  message: string;
  pendingAuditId?: string;
}

export abstract class BaseAgent implements AIAgent {
  protected config: AgentConfig;
  protected ai: SimpleAIService;
  protected context: Record<string, any> = {};
  protected metrics$ = new BehaviorSubject<ActionMetrics[]>([]);
  protected isExecuting$ = new BehaviorSubject<boolean>(false);
  public id: string;
  public name: string;
  public description: string;
  public capabilities: string[];
  public type: AgentType;


  protected version: string;
  protected created: Date;
  protected lastModified: Date;
  protected status: 'active' | 'inactive' | 'training';
  protected preferences: Record<string, any>;
  protected actionLogs: any[] = [];
  protected requireConfirmation: boolean = false;

  constructor(config?: Partial<AgentConfig>) {
    // Ensure config is initialized with default values if it's undefined
    const defaultConfig: AgentConfig = {
      id: 'agent-' + uuidv4(),
      name: 'Generic Agent',
      description: 'A default agent',
      capabilities: [],
      type: AgentType.ORCHESTRATOR_AGENT,
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      status: 'active',
      preferences: {}
    };

    // Merge provided config with defaults
    this.config = config ? { ...defaultConfig, ...config } : defaultConfig;

    // Ensure all required properties exist
    this.id = this.config.id;
    this.name = this.config.name;
    this.description = this.config.description || '';
    this.capabilities = (this.config.capabilities || []).map(c => String(c));
    this.type = (this.config.type as AgentType) || AgentType.ORCHESTRATOR_AGENT;
    this.version = this.config.version || '1.0';
    this.created = this.config.created || new Date();
    this.lastModified = this.config.lastModified || new Date();
    this.status = (this.config.status as any) || 'active';
    this.preferences = this.config.preferences || {};

    // Use the factory to get a utility-optimized service (with fallback)
    this.ai = AIServiceFactory.getUtilityService();
  }

  public async executeAction(action: AgentAction): Promise<AgentActionResult> {
    this.logActionStart(action);

    // Get audit store state
    const addAuditLog = useAuditStore.getState().addAuditLog;

    // Log the start of the action
    const auditId = addAuditLog({
      actionType: action.type,
      sourceType: this.type as any,
      sourceId: this.id,
      timestamp: new Date(),
      description: this.name + ' executing ' + action.type,
      status: this.requireConfirmation ? 'pending' : 'auto_approved',
      details: {
        params: action.params,
        agentType: this.type
      }
    });

    // If confirmation is required and not auto-approved
    if (this.requireConfirmation) {
      // Return early, with indication that action is pending
      const pendingResult: AgentActionResult = {
        success: false,
        action,
        data: null,
        timestamp: new Date(),
        message: 'Action requires approval',
        pendingAuditId: auditId
      };

      this.logActionComplete(pendingResult);
      return pendingResult;
    }

    try {
      const result = await this.performAction(action);

      const completedAuditLog = useAuditStore.getState();
      completedAuditLog.markActionCompleted(auditId, {
        success: true,
        data: result
      });

      const successResult: AgentActionResult = {
        success: true,
        action,
        data: result,
        timestamp: new Date(),
        message: 'Successfully executed ' + action.type
      };

      this.logActionComplete(successResult);
      return successResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const completedAuditLog = useAuditStore.getState();
      completedAuditLog.markActionCompleted(auditId, {
        success: false,
        error: errorMessage
      });

      const errorResult: AgentActionResult = {
        success: false,
        action,
        data: null,
        error: errorMessage,
        timestamp: new Date(),
        message: errorMessage
      };

      this.logActionError(errorResult);
      return errorResult;
    }
  }

  public abstract train(data: any[]): Promise<void>;

  protected async executeWithMetrics<T>(
    action: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    this.isExecuting$.next(true);

    try {
      const result = await executor();
      const endTime = Date.now();

      this.recordMetrics({
        action,
        duration: endTime - startTime,
        success: true,
        timestamp: new Date(),
        agentId: this.id
      });

      return result;
    } catch (error) {
      const endTime = Date.now();

      this.recordMetrics({
        action,
        duration: endTime - startTime,
        success: false,
        timestamp: new Date(),
        agentId: this.id,
        error: this.formatError(error)
      });

      throw error;
    } finally {
      this.isExecuting$.next(false);
    }
  }

  protected recordMetrics(metrics: ActionMetrics): void {
    const currentMetrics = this.metrics$.value;
    this.metrics$.next([...currentMetrics, metrics]);
  }

  public getMetrics(): ActionMetrics[] {
    return this.metrics$.value;
  }

  public isExecuting(): boolean {
    return this.isExecuting$.value;
  }

  protected validateAction(action: AgentCapability): void {
    if (!this.hasCapability(action)) {
      throw new Error('Agent does not have the capability to perform action: ' + action);
    }
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log('Retry attempt ' + attempt + ' after ' + delay + 'ms');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  protected async getCompletion(prompt: string, context: Record<string, any> = {}): Promise<string> {
    const systemPrompt2 = this.buildSystemPrompt(context);

    // Call the Gemini service with the proper parameters
    try {
      const completion = await this.ai.generateText(
        systemPrompt2 + '\n\n' + prompt
      );

      return completion;
    } catch (error) {
      console.error('Error getting completion:', error);
      throw error;
    }
  }

  protected buildSystemPrompt(context: Record<string, any> = {}): string {
    const basePrompt = 'You are ' + this.name + ', an AI agent designed to ' + this.description + '.\n' +
      'You have the following capabilities: ' + this.capabilities.join(', ') + '.\n' +
      'Always respond in a helpful, concise, and accurate manner.\n';

    // Add context if available
    const contextPrompt = Object.entries(context)
      .map(([key, value]) => key + ': ' + value)
      .join('\n');

    return contextPrompt ? basePrompt + '\n\nContext:\n' + contextPrompt : basePrompt;
  }

  protected validateResult(result: any): boolean {
    // Base implementation - can be overridden by derived classes
    return result !== null && result !== undefined;
  }

  // --- AIAgent Interface Implementation ---

  public isAvailable: boolean = true;

  public canHandle(task: AIAgentTask): boolean {
    // Basic implementation: check if task instruction matches any capability
    const instruction = task.instruction.toLowerCase();
    return this.capabilities.some(cap => instruction.includes(cap.toLowerCase()));
  }

  public async executeTask(task: AIAgentTask): Promise<AIAgentTask> {
    console.log('[' + this.name + '] Executing task: ' + task.title);
    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();

    try {
      // 1. Analyze Complexity / Break Down
      const subtasks = await this.breakdownTask(task);

      if (subtasks.length > 0) {
        // --- MULTI-STAGE EXECUTION ---
        console.log(`🔄 [${this.name}] Executing multi-stage plan (${subtasks.length} steps)...`);
        task.subTasks = subtasks;

        for (const subtask of subtasks) {
          console.log(`👉 [${this.name}] Running subtask: ${subtask.title}`);
          const result = await this.executeTask(subtask); // Recursive call

          if (result.status === TaskStatus.FAILED) {
            throw new Error(`Subtask failed: ${result.errorMessage}`);
          }
        }

        task.status = TaskStatus.COMPLETED;
        task.progress = 100;
        task.result = { message: "Multi-stage workflow completed", steps: subtasks.length };

      } else {
        // --- SINGLE-STAGE EXECUTION ---
        const action: AgentAction = {
          type: task.instruction,
          params: task.context || {}
        };

        const result = await this.performAction(action);

        task.status = TaskStatus.COMPLETED;
        task.progress = 100;
        task.result = result;
      }

      task.completedAt = new Date();

    } catch (error) {
      console.error(`[${this.name}] Task failed:`, error);
      task.status = TaskStatus.FAILED;
      task.errorMessage = error instanceof Error ? error.message : String(error);
    }

    return task;
  }

  public async sendMessage(message: AgentMessage): Promise<void> {
    console.log('[' + this.name + '] Sending message to ' + message.toAgent + ':', message.payload);
  }

  public async receiveMessage(message: AgentMessage): Promise<void> {
    console.log('[' + this.name + '] Received message from ' + message.fromAgent + ':', message.payload);
  }

  public async analyzeComplexity(instruction: string): Promise<AIAgentTask[]> {
    console.log('🧠 [' + this.name + '] Analyzing complexity for: "' + instruction + '"');

    const prompt = '\n' +
      '      You are an AI Agent Planner.\n' +
      '      Analyze this user request: "' + instruction + '"\n' +
      '      \n' +
      '      Determine if this is a SIMPLE single-step task or a COMPLEX multi-step workflow.\n' +
      '      \n' +
      '      EXAMPLES:\n' +
      '      - "What time is it?" -> Simple (0 steps)\n' +
      '      - "Create a canvas about X" -> Simple (0 steps, just one tool call)\n' +
      '      - "Research Labor Laws and write a summary canvas" -> Complex (2 steps: Research, then Write)\n' +
      '      - "Check my emails for meetings and put them on the calendar" -> Complex (2 steps: Check Email, then Schedule)\n' +
      '      \n' +
      '      If SIMPLE, return an empty JSON array: []\n' +
      '      If COMPLEX, return a JSON array of subtasks:\n' +
      '      [\n' +
      '        { "title": "Step 1", "instruction": "Search for...", "context": {} },\n' +
      '        { "title": "Step 2", "instruction": "Write summary...", "context": {} }\n' +
      '      ]\n' +
      '    ';

    try {
      const result = await this.ai.generateText(prompt);
      const CleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

      if (!CleanResult.startsWith('[')) return [];

      const subtasks = JSON.parse(CleanResult);
      if (Array.isArray(subtasks) && subtasks.length > 0) {
        console.log(`🧩 [${this.name}] Decomposed into ${subtasks.length} subtasks.`);
        return subtasks.map(t => ({
          ...t,
          id: uuidv4(),
          status: TaskStatus.PENDING,
          progress: 0,
          created: new Date(),
          updated: new Date()
        } as AIAgentTask));
      }

      return [];
    } catch (error) {
      console.warn(`[${this.name}] Complexity analysis failed, defaulting to single-step.`, error);
      return [];
    }
  }

  public async breakdownTask(task: AIAgentTask): Promise<AIAgentTask[]> {
    return this.analyzeComplexity(task.instruction);
  }


  protected formatError(error: any): string {
    return error instanceof Error ? error.message : String(error);
  }

  protected validateCapability(capability: AgentCapability) {
    if (!this.hasCapability(capability)) {
      throw new Error(`Agent does not have capability: ${capability}`);
    }
  }

  protected async logAction(action: string, result: any) {
    console.log('[' + this.id + '] Action: ' + action + ', Result:', result);
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCapabilities(): string[] {
    return this.capabilities;
  }

  public hasCapability(capability: AgentCapability): boolean {
    return this.capabilities.includes(capability as any);
  }

  public updateConfig(config: Partial<AgentConfig>): void {
    if (config.name) this.name = config.name;
    if (config.description) this.description = config.description;
    if (config.capabilities) this.capabilities = config.capabilities.map(c => String(c));
    if (config.version) this.version = config.version;

    if (config.status) this.status = config.status as any;
    if (config.preferences) this.preferences = { ...config.preferences };

    this.lastModified = new Date();
  }

  protected logActionStart(action: AgentAction): void {
    const logEntry = {
      type: 'action_start',
      action,
      timestamp: new Date(),
      agentId: this.id
    };

    this.actionLogs.push(logEntry);
    console.log('[' + this.name + '] Starting action: ' + action.type, action.params);
  }

  protected logActionComplete(result: AgentActionResult): void {
    const logEntry = {
      type: 'action_complete',
      result,
      timestamp: new Date(),
      agentId: this.id
    };

    this.actionLogs.push(logEntry);
    console.log('[' + this.name + '] Completed action: ' + result.action.type, result.success ? 'SUCCESS' : 'FAILURE');
  }

  protected logActionError(result: AgentActionResult): void {
    const logEntry = {
      type: 'action_error',
      result,
      timestamp: new Date(),
      agentId: this.id
    };

    this.actionLogs.push(logEntry);
    console.error('[' + this.name + '] Error in action: ' + result.action.type, result.error);
  }

  public getActionLogs(limit = 10): any[] {
    return this.actionLogs.slice(-limit);
  }

  protected abstract performAction(action: AgentAction): Promise<any>;

  protected async inferIntent(instruction: string, availableActions: string[]): Promise<string | null> {
    console.log(`🧠 [${this.name}] Inferring intent for: "${instruction}"`);

    const prompt = '\n' +
      '      You are an AI Agent\'s intent classifier. \n' +
      '      Map the following natural language instruction to one of the available action types.\n' +
      '      If there is a typo (e.g., "peititon" instead of "petition"), correct it and match the intended action.\n' +
      '      \n' +
      '      INSTRUCTION: "' + instruction + '"\n' +
      '      \n' +
      '      AVAILABLE ACTIONS:\n' +
      '      ' + availableActions.join('\n') + '\n' +
      '      \n' +
      '      Respond ONLY with the name of the most likely action type from the list above. \n' +
      '      If no action matches, respond with "null".\n' +
      '    ';

    try {
      const result = await this.ai.generateText(prompt);
      const intent = result.trim().toLowerCase();

      if (intent === 'null') return null;

      const matchedAction = availableActions.find(a => a.toLowerCase() === intent);
      if (matchedAction) {
        console.log(`🎯 [${this.name}] Inferred intent: ${matchedAction}`);
        return matchedAction;
      }

      return null;
    } catch (error) {
      console.error(`❌ [${this.name}] Intent inference failed:`, error);
      return null;
    }
  }

  public async sanitizeAndTokenize(text: string): Promise<{ content: string; variables: string[] }> {
    console.log(`[${this.name}] 🔪 Surgical Tokenization started...`);

    const prompt = '\n' +
      '      You are a Surgical Text Sanitizer.\n' +
      '      Your task is to take RAW TEXT and convert it into a REUSABLE TEMPLATE by replacing specific facts with TOKENS.\n' +
      ' \n' +
      '      RULES:\n' +
      '      1. Identify Names, Dates, Addresses, Case Numbers, Amounts, and specific Entities.\n' +
      '      2. Replace them with {{Variable Name}} tokens (e.g., {{Client Name}}, {{Hearing Date}}, {{Case Number}}).\n' +
      '      3. DO NOT change the structure, legal language, or formatting. Only swap the specific facts.\n' +
      '      4. Ensure variable names are descriptive and consistent.\n' +
      '      5. Return the result as a raw JSON object with \'content\' and \'variables\'.\n' +
      ' \n' +
      '      RAW TEXT:\n' +
      '      "' + text + '"\n' +
      ' \n' +
      '      OUTPUT FORMAT (JSON ONLY):\n' +
      '      {\n' +
      '        "content": "The text with {{Variables}} inserted...",\n' +
      '        "variables": ["Client Name", "Hearing Date"]\n' +
      '      }\n' +
      '    ';

    try {
      const rawResult = await this.ai.generateText(prompt);
      const jsonString = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(jsonString);

      if (!result.content || !Array.isArray(result.variables)) {
        throw new Error("Invalid structure returned from AI");
      }

      console.log(`[${this.name}] Tokenization complete. Found ${result.variables.length} variables.`);
      return result;

    } catch (error) {
      console.error(`❌ [${this.name}] Tokenization failed:`, error);
      return { content: text, variables: [] };
    }
  }
}