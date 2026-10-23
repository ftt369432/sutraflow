/**
 * 📁 Data Module Exports
 * 
 * Central export for all data definitions including personas and legal templates
 * imported from .genieflowos MCP server.
 */

// Personas
export {
    PERSONAS,
    getPersonaById,
    getActivePersonas,
    buildPersonaPrompt,
    type Persona
} from './personas';

// Legal Templates
export {
    LEGAL_TEMPLATES,
    getTemplateById,
    getTemplatesByCategory,
    fillTemplate,
    type LegalTemplate
} from './legalTemplates';