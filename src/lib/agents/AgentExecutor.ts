import type { AgentConfig, AgentAction } from '../../types/agent';
import type { Capability, CapabilityContext } from '../../types/capabilities';
import { DocumentProcessor } from './capabilities/documentProcessing';
import { DataAnalyzer } from './capabilities/dataAnalysis';
import { useAgentStore, AgentState } from '../../store/agentStore';

interface ExecutionContext {
  agentId: string;
  input: any;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface ExecutionResult {
  output: any;
  error?: string;
  metadata?: Record<string, any>;
}

export class AgentExecutor {
  private config: AgentConfig;
  private store: AgentState;

  constructor(config: AgentConfig, store: AgentState) {
    this.config = config;
    this.store = store;
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const actionId = await this.store.startAction(context.agentId, 'execute');

    try {
      // Initialize capabilities based on agent configuration
      const capabilities = this.initializeCapabilities();

      // Process input through capabilities pipeline
      const processedInput = await this.preprocessInput(context.input, capabilities);

      // Execute main agent logic
      const result = await this.executeCore(processedInput, capabilities, context);

      // Post-process output
      const processedOutput = await this.postprocessOutput(result, capabilities);

      await this.store.completeAction(actionId);

      return {
        output: processedOutput,
        metadata: {
          executionTime: Date.now(),
          capabilities: this.config.capabilities,
          model: this.config.modelConfig.model,
          ...context.metadata
        }
      };
    } catch (error) {
      await this.store.failAction(actionId, error.message);
      return {
        output: null,
        error: error.message,
        metadata: {
          errorTime: Date.now(),
          errorType: error.name,
          ...context.metadata
        }
      };
    }
  }

  private async preprocessInput(input: any, capabilities: any[]): Promise<any> {
    let processedInput = input;

    for (const capability of capabilities) {
      if (capability.preprocess) {
        processedInput = await capability.preprocess(processedInput);
      }
    }

    return processedInput;
  }

  private async executeCore(input: any, capabilities: any[], context: ExecutionContext): Promise<any> {
    // Apply custom instructions if available
    const prompt = this.config.customInstructions || this.config.systemPrompt
      ? `${this.config.customInstructions || this.config.systemPrompt}\n\nInput: ${JSON.stringify(input)}`
      : JSON.stringify(input);

    // Execute based on agent type and capabilities
    let result = input;
    for (const capability of capabilities) {
      if (capability.execute) {
        result = await capability.execute(result, {
          modelConfig: this.config.modelConfig || { model: this.config.model || 'gemini-1.5-flash' },
          sessionId: context.sessionId,
          metadata: context.metadata
        });
      }
    }

    return result;
  }

  private async postprocessOutput(output: any, capabilities: any[]): Promise<any> {
    let processedOutput = output;

    for (const capability of capabilities) {
      if (capability.postprocess) {
        processedOutput = await capability.postprocess(processedOutput);
      }
    }

    return processedOutput;
  }

  private initializeCapabilities(): Capability[] {
    const capabilityMap = {
      'document-processing': () => new DocumentProcessor(),
      'data-analysis': () => new DataAnalyzer(),
    };

    return this.config.capabilities
      .map(id => capabilityMap[id]?.())
      .filter(Boolean);
  }
} 