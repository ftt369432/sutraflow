/**
 * 🎯 SutraFlow OS MCP Index
 * 
 * Entry point for all MCP servers.
 * Exports both Legal and Medical MCP servers for use with Gemini/Groq.
 */

export { createLegalMCPServer, LEGAL_TOOLS } from './LegalMCPServer';
export { createMedicalMCPServer, MEDICAL_TOOLS } from './MedicalMCPServer';

// Re-export types for consumers
export type { Tool } from '@modelcontextprotocol/sdk/types.js';
