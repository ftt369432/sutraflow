export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  type: 'auth' | 'validation' | 'notification' | 'calendar' | 'email' | 'reminder' | 'custom';
  priority: number;
  isAsync: boolean;
  retryCount?: number;
  timeout?: number;
  dependencies?: string[]; // IDs of steps that must complete first
  conditions?: ProcessCondition[];
  onSuccess?: string[]; // Next step IDs to execute
  onFailure?: string[]; // Fallback step IDs
  parameters?: Record<string, any>;
}

export interface ProcessCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists' | 'custom';
  value: any;
  customValidator?: (context: ProcessContext) => boolean;
}

export interface ProcessContext {
  stepId: string;
  userId: string;
  sessionId: string;
  data: Record<string, any>;
  metadata: {
    startTime: Date;
    currentStep: number;
    totalSteps: number;
    executedSteps: string[];
    failedSteps: string[];
    retryAttempts: Record<string, number>;
  };
}

export interface ProcessResult {
  success: boolean;
  data?: any;
  error?: string;
  nextSteps?: string[];
  shouldRetry?: boolean;
  metadata?: Record<string, any>;
}

export class ProcessChainTemplate {
  private steps: Map<string, ProcessStep> = new Map();
  private chains: Map<string, string[]> = new Map(); // chainId -> stepIds
  private executionHistory: Map<string, ProcessContext[]> = new Map();

  // Template Registration
  registerStep(step: ProcessStep): void {
    this.steps.set(step.id, step);
  }

  removeStep(stepId: string): void {
    this.steps.delete(stepId);
    // Remove from all chains
    for (const [chainId, stepIds] of this.chains.entries()) {
      const filtered = stepIds.filter(id => id !== stepId);
      this.chains.set(chainId, filtered);
    }
  }

  createChain(chainId: string, stepIds: string[]): void {
    // Validate all steps exist
    const invalidSteps = stepIds.filter(id => !this.steps.has(id));
    if (invalidSteps.length > 0) {
      throw new Error(`Invalid step IDs: ${invalidSteps.join(', ')}`);
    }
    
    // Sort by dependencies and priority
    const sortedSteps = this.sortStepsByDependencies(stepIds);
    this.chains.set(chainId, sortedSteps);
  }

  private sortStepsByDependencies(stepIds: string[]): string[] {
    const steps = stepIds.map(id => this.steps.get(id)!);
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      
      const step = this.steps.get(stepId);
      if (!step) return;

      // Visit dependencies first
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (stepIds.includes(dep)) {
            visit(dep);
          }
        }
      }

      visited.add(stepId);
      sorted.push(stepId);
    };

    // Sort by priority first, then visit
    steps.sort((a, b) => a.priority - b.priority);
    for (const step of steps) {
      visit(step.id);
    }

    return sorted;
  }

  // Chain Modification
  insertStepInChain(chainId: string, stepId: string, position: number): void {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);
    if (!this.steps.has(stepId)) throw new Error(`Step ${stepId} not found`);

    chain.splice(position, 0, stepId);
    // Re-sort to respect dependencies
    const resorted = this.sortStepsByDependencies(chain);
    this.chains.set(chainId, resorted);
  }

  removeStepFromChain(chainId: string, stepId: string): void {
    const chain = this.chains.get(chainId);
    if (!chain) return;

    const filtered = chain.filter(id => id !== stepId);
    this.chains.set(chainId, filtered);
  }

  // Execution Engine
  async executeChain(
    chainId: string, 
    initialContext: Partial<ProcessContext>
  ): Promise<ProcessResult> {
    const chain = this.chains.get(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);

    const context: ProcessContext = {
      stepId: '',
      userId: initialContext.userId || '',
      sessionId: initialContext.sessionId || `session_${Date.now()}`,
      data: initialContext.data || {},
      metadata: {
        startTime: new Date(),
        currentStep: 0,
        totalSteps: chain.length,
        executedSteps: [],
        failedSteps: [],
        retryAttempts: {},
        ...initialContext.metadata
      }
    };

    console.log(`🚀 Starting chain execution: ${chainId} with ${chain.length} steps`);

    for (let i = 0; i < chain.length; i++) {
      const stepId = chain[i];
      const step = this.steps.get(stepId)!;
      
      context.stepId = stepId;
      context.metadata.currentStep = i + 1;

      console.log(`📋 Executing step ${i + 1}/${chain.length}: ${step.name}`);

      // Check conditions
      if (!this.checkConditions(step, context)) {
        console.log(`⏭️ Skipping step ${step.name} - conditions not met`);
        continue;
      }

      // Execute step with retry logic
      const result = await this.executeStepWithRetry(step, context);

      if (result.success) {
        context.metadata.executedSteps.push(stepId);
        context.data = { ...context.data, ...result.data };
        
        console.log(`✅ Step ${step.name} completed successfully`);
        
        // Handle onSuccess navigation
        if (result.nextSteps && result.nextSteps.length > 0) {
          // Insert next steps into current chain
          const nextSteps = result.nextSteps.filter(id => this.steps.has(id));
          chain.splice(i + 1, 0, ...nextSteps);
        }
      } else {
        context.metadata.failedSteps.push(stepId);
        console.error(`❌ Step ${step.name} failed: ${result.error}`);

        // Handle onFailure navigation
        if (step.onFailure && step.onFailure.length > 0) {
          const fallbackSteps = step.onFailure.filter(id => this.steps.has(id));
          chain.splice(i + 1, 0, ...fallbackSteps);
        } else {
          // No fallback, stop execution
          return {
            success: false,
            error: `Chain execution failed at step: ${step.name}`,
            metadata: context.metadata
          };
        }
      }
    }

    // Store execution history
    const history = this.executionHistory.get(chainId) || [];
    history.push(context);
    this.executionHistory.set(chainId, history);

    return {
      success: true,
      data: context.data,
      metadata: context.metadata
    };
  }

  private checkConditions(step: ProcessStep, context: ProcessContext): boolean {
    if (!step.conditions || step.conditions.length === 0) return true;

    return step.conditions.every(condition => {
      const value = this.getValueFromContext(condition.field, context);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater':
          return Number(value) > Number(condition.value);
        case 'less':
          return Number(value) < Number(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        case 'custom':
          return condition.customValidator ? condition.customValidator(context) : false;
        default:
          return false;
      }
    });
  }

  private getValueFromContext(field: string, context: ProcessContext): any {
    const parts = field.split('.');
    let value: any = context;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  private async executeStepWithRetry(
    step: ProcessStep, 
    context: ProcessContext
  ): Promise<ProcessResult> {
    const maxRetries = step.retryCount || 0;
    const retryKey = step.id;
    
    context.metadata.retryAttempts[retryKey] = 
      context.metadata.retryAttempts[retryKey] || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for step: ${step.name}`);
          context.metadata.retryAttempts[retryKey] = attempt;
        }

        const result = await this.executeStep(step, context);
        
        if (result.success || !result.shouldRetry) {
          return result;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } catch (error: any) {
        console.error(`💥 Error in step ${step.name}, attempt ${attempt + 1}:`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: error.message || 'Step execution failed',
            shouldRetry: false
          };
        }
      }
    }

    return {
      success: false,
      error: `Step failed after ${maxRetries + 1} attempts`,
      shouldRetry: false
    };
  }

  private async executeStep(step: ProcessStep, context: ProcessContext): Promise<ProcessResult> {
    // This is where individual step executors are called
    // Will be implemented by step-specific handlers
    const executor = ProcessStepExecutor.getExecutor(step.type);
    
    if (!executor) {
      throw new Error(`No executor found for step type: ${step.type}`);
    }

    return await executor.execute(step, context);
  }

  // Introspection and Management
  getChain(chainId: string): ProcessStep[] {
    const stepIds = this.chains.get(chainId) || [];
    return stepIds.map(id => this.steps.get(id)!).filter(Boolean);
  }

  getExecutionHistory(chainId: string): ProcessContext[] {
    return this.executionHistory.get(chainId) || [];
  }

  getAvailableSteps(): ProcessStep[] {
    return Array.from(this.steps.values());
  }

  getStepsByType(type: ProcessStep['type']): ProcessStep[] {
    return Array.from(this.steps.values()).filter(step => step.type === type);
  }

  cloneChain(sourceChainId: string, targetChainId: string): void {
    const sourceSteps = this.chains.get(sourceChainId);
    if (!sourceSteps) throw new Error(`Source chain ${sourceChainId} not found`);
    
    this.chains.set(targetChainId, [...sourceSteps]);
  }

  exportChain(chainId: string): any {
    const stepIds = this.chains.get(chainId);
    if (!stepIds) throw new Error(`Chain ${chainId} not found`);

    const steps = stepIds.map(id => this.steps.get(id)!);
    
    return {
      chainId,
      steps,
      metadata: {
        createdAt: new Date(),
        version: '1.0'
      }
    };
  }

  importChain(chainData: any): void {
    const { chainId, steps } = chainData;
    
    // Register all steps
    for (const step of steps) {
      this.registerStep(step);
    }
    
    // Create chain
    const stepIds = steps.map((step: ProcessStep) => step.id);
    this.createChain(chainId, stepIds);
  }
}

// Step Executor Registry
export class ProcessStepExecutor {
  private static executors: Map<string, StepExecutor> = new Map();

  static registerExecutor(type: string, executor: StepExecutor): void {
    this.executors.set(type, executor);
  }

  static getExecutor(type: string): StepExecutor | undefined {
    return this.executors.get(type);
  }
}

export interface StepExecutor {
  execute(step: ProcessStep, context: ProcessContext): Promise<ProcessResult>;
}

// Export singleton instance
export const processChainTemplate = new ProcessChainTemplate();
