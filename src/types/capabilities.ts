import type { AgentConfig } from './agent';

export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: unknown;
  enumValues?: string[];
}

// Define a type for model configuration relevant to capabilities
export type ModelConfigForCapability = Pick<AgentConfig, 'model' | 'temperature' | 'maxTokens' | 'systemPrompt'>;

export interface CapabilityContext {
  modelConfig?: ModelConfigForCapability; // Use the new type
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  category?: string;
  version?: string;
  inputParameters: ParameterDefinition[];
  outputParameters: ParameterDefinition[];
  target: {
    type: 'function' | 'agent' | 'service' | 'workflow';
    identifier: string;
  };
  execute: (input: unknown, context: CapabilityContext) => Promise<unknown>;
  preprocess?: (input: unknown, context: CapabilityContext) => Promise<unknown>;
  postprocess?: (output: unknown, context: CapabilityContext) => Promise<unknown>;
  tags?: string[];
  permissionsRequired?: string[];
  cost?: number;
  exampleUsage?: Record<string, any>;
}

export interface DocumentProcessingCapability extends Capability {
  supportedFormats: string[];
}

export interface DataAnalysisCapability extends Capability {
  supportedDataTypes: string[];
}

export interface CommunicationCapability extends Capability {
  channels: ('email' | 'chat' | 'voice')[];
}