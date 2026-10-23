/**
 * 📜 Legal Document Templates
 * 
 * Imported from .genieflowos MCP server CORE_ENGINE.
 * These are production-ready legal document templates for California Workers' Compensation.
 */

export interface LegalTemplate {
    id: string;
    name: string;
    category: 'trial' | 'petition' | 'motion' | 'letter' | 'discovery';
    description: string;
    variables: string[];
    content: string;
}

import { loadTemplatesFromFiles } from '../services/TemplateLoader';

export const LEGAL_TEMPLATES: LegalTemplate[] = loadTemplatesFromFiles();

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): LegalTemplate | undefined {
    return LEGAL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: LegalTemplate['category']): LegalTemplate[] {
    return LEGAL_TEMPLATES.filter(t => t.category === category);
}

/**
 * Fill template variables with actual values
 */
export function fillTemplate(template: LegalTemplate, values: Record<string, string>): string {
    let filled = template.content;
    for (const [key, value] of Object.entries(values)) {
        const regex = new RegExp(`\\[${key}\\]`, 'g');
        filled = filled.replace(regex, value);
    }
    return filled;
}

export default LEGAL_TEMPLATES;
