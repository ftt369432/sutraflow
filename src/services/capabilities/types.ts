/**
 * Universal AI Capability System
 * Base types for all AI capabilities that can be hooked into any AI system
 */

export interface CapabilityResult {
  success: boolean;
  message?: string;
  data?: any;
  documentContent?: string;
  suggestedNextSteps?: string[];
  navigationTriggered?: boolean;
}

export interface AICapability {
  name: string;
  description: string;
  version: string;
  
  // Every capability can detect if it should handle a user request
  detectIntent?(input: string, context?: any): Promise<any>;
  
  // Every capability can process requests
  process?(request: any, context?: any): Promise<CapabilityResult>;
}

export interface CapabilityManager {
  registerCapability(capability: AICapability): void;
  unregisterCapability(name: string): void;
  detectCapabilities(input: string, context?: any): Promise<AICapability[]>;
  executeCapability(name: string, request: any, context?: any): Promise<CapabilityResult>;
}
