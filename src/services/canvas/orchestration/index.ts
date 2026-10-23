/**
 * Canvas Orchestration System - Main Exports
 * 
 * Centralized exports for the Canvas orchestration system.
 * Use this file to import orchestration components.
 */

// Import for local singleton usage
import { CanvasOrchestrator } from './CanvasOrchestrator';

// Core Orchestration System
export { CanvasOrchestrator } from './CanvasOrchestrator';
export type { 
  CanvasOperationResult, 
  DocumentContext
} from './CanvasOrchestrator';

// Routing System
export { CanvasRoutingEngine } from './CanvasRoutingEngine';
export type { 
  EditingInstruction,
  RoutingDecision, 
  DocumentAnalysis as RoutingDocumentAnalysis 
} from './CanvasRoutingEngine';

// Document Analysis
export { DocumentAnalyzer } from './DocumentAnalyzer';
export type { DocumentAnalysis } from './DocumentAnalyzer';

// Canvas Operations
export { CanvasService } from './CanvasService';
export type { CanvasContent, CanvasState } from './CanvasService';

// Testing Suite

// Main orchestrator instance (singleton)
let orchestratorInstance: CanvasOrchestrator | null = null;

/**
 * Gets the global Canvas Orchestrator instance
 * Creates one if it doesn't exist (singleton pattern)
 */
export function getCanvasOrchestrator(): CanvasOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new CanvasOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Resets the global orchestrator instance (useful for testing)
 */
export function resetCanvasOrchestrator(): void {
  orchestratorInstance = null;
}
