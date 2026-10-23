/**
 * AI Chat Integration Hook
 * This hooks universal capabilities into any AI chat system
 * Making capabilities available to ALL AI interactions, not just specific assistants
 */

import { universalCapabilities } from './UniversalCapabilityManager';
import { CapabilityResult } from './types';

export interface ChatCapabilityIntegration {
  // Check if user input should trigger capabilities
  detectAndExecuteCapabilities(input: string, context?: any): Promise<ChatCapabilityResponse>;
  
  // Get capability suggestions for user
  getSuggestedCapabilities(input: string): Promise<string[]>;
  
  // Execute specific capability
  executeSpecificCapability(capabilityName: string, input: string, context?: any): Promise<CapabilityResult>;
}

export interface ChatCapabilityResponse {
  hasCapabilities: boolean;
  capabilities: string[];
  results: CapabilityResult[];
  shouldBypassNormalChat?: boolean;
  suggestedActions?: string[];
}

/**
 * Universal AI Chat Capability Hook
 * This can be integrated into ANY AI chat system
 */
export class UniversalChatCapabilityHook implements ChatCapabilityIntegration {
  
  /**
   * Main integration point - call this from your AI chat before normal processing
   */
  async detectAndExecuteCapabilities(input: string, context?: any): Promise<ChatCapabilityResponse> {
    try {
      // Detect applicable capabilities
      const capabilities = await universalCapabilities.detectCapabilities(input, context);
      
      if (capabilities.length === 0) {
        return {
          hasCapabilities: false,
          capabilities: [],
          results: []
        };
      }

      // Execute all applicable capabilities
      const results = await universalCapabilities.autoExecute(input, context);
      
      // Determine if this should bypass normal chat
      const shouldBypass = this.shouldBypassNormalChat(capabilities, results);
      
      return {
        hasCapabilities: true,
        capabilities: capabilities.map(cap => cap.name),
        results,
        shouldBypassNormalChat: shouldBypass,
        suggestedActions: this.getSuggestedActionsFromResults(results)
      };
      
    } catch (error) {
      console.error('❌ Error in capability detection:', error);
      return {
        hasCapabilities: false,
        capabilities: [],
        results: [],
        suggestedActions: ['Continue with normal AI chat']
      };
    }
  }

  /**
   * Get capability suggestions without executing
   */
  async getSuggestedCapabilities(input: string): Promise<string[]> {
    const capabilities = await universalCapabilities.detectCapabilities(input);
    return capabilities.map(cap => `${cap.name}: ${cap.description}`);
  }

  /**
   * Execute a specific capability by name
   */
  async executeSpecificCapability(capabilityName: string, input: string, context?: any): Promise<CapabilityResult> {
    return universalCapabilities.executeCapability(capabilityName, { userInput: input }, context);
  }

  /**
   * Determine if capability results should bypass normal AI chat
   */
  private shouldBypassNormalChat(capabilities: any[], results: CapabilityResult[]): boolean {
    // If document generation was successful, bypass normal chat and show Canvas
    const hasDocumentGeneration = capabilities.some(cap => cap.name === 'document-generation');
    const documentGenerationSuccessful = results.some(result => result.success && result.documentContent);
    
    return hasDocumentGeneration && documentGenerationSuccessful;
  }

  /**
   * Extract suggested actions from capability results
   */
  private getSuggestedActionsFromResults(results: CapabilityResult[]): string[] {
    const actions: string[] = [];
    
    results.forEach(result => {
      if (result.success) {
        // Document generation suggestions
        if (result.suggestedNextSteps) {
          actions.push(...result.suggestedNextSteps);
        }
        
        // Add generic suggestions based on result type
        if (result.documentContent) {
          actions.push('Open in Canvas for editing');
          actions.push('Download document');
          actions.push('Share with team');
        }
      }
    });
    
    return actions.length > 0 ? actions : ['Continue with AI chat'];
  }
}

/**
 * Global instance that can be used anywhere
 */
export const chatCapabilityHook = new UniversalChatCapabilityHook();
