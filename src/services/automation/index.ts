/**
 * 🤖 Automation Services & Components Index
 * 
 * Centralized exports for autonomous automation system
 */

// Core Services
export { NotesParserService, notesParserService } from './NotesParserService';
export { MultiAgentCanvasOrchestrator, multiAgentCanvasOrchestrator } from './MultiAgentCanvasOrchestrator';

// Types
export type { 
  ParsedTask, 
  NotesParsingResult, 
  SwarmSuggestion, 
  ExecutionStep 
} from './NotesParserService';

export type { 
  CanvasOrchestrationRequest, 
  CanvasOrchestrationResult, 
  CanvasCreationResult 
} from './MultiAgentCanvasOrchestrator';
