import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface SmartTemplate {
    id: string;
    name: string;
    content: string; // The raw text with placeholders like {{Client Name}}
    variables: string[]; // Extracted variables: ["Client Name", "Date"]
    category: 'Legal' | 'Business' | 'Personal' | 'Other';
    description?: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
}

interface SmartTemplateState {
    templates: SmartTemplate[];

    // Actions
    addTemplate: (template: Omit<SmartTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'variables'>) => void;
    updateTemplate: (id: string, updates: Partial<SmartTemplate>) => void;
    removeTemplate: (id: string) => void;
    incrementUsage: (id: string) => void;

    // Variable Extraction Logic (Self-contained for now, could be AI service)
    extractVariables: (content: string) => string[];
}

export const useSmartTemplateStore = create<SmartTemplateState>()(
    persist(
        (set, get) => ({
            templates: [
                // Seed with the user's requested example
                {
                    id: 'seed-otoc',
                    name: 'OTOC Request Letter',
                    category: 'Legal',
                    content: `Re: {{Applicant Name}}\nCase No: {{Case Number}}\n\nDear Judge {{Judge Name}},\n\nPlease take this case off calendar. The dispute regarding {{Dispute Reason}} has been resolved.\n\nSincerely,\n{{Your Name}}`,
                    variables: ['Applicant Name', 'Case Number', 'Judge Name', 'Dispute Reason', 'Your Name'],
                    description: 'Request to take Off Calendar due to resolved dispute.',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0
                }
            ],

            addTemplate: (template) => {
                const variables = get().extractVariables(template.content);
                const newTemplate: SmartTemplate = {
                    ...template,
                    id: uuidv4(),
                    variables,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0
                };

                set((state) => ({ templates: [newTemplate, ...state.templates] }));
            },

            updateTemplate: (id, updates) => {
                set((state) => ({
                    templates: state.templates.map((t) => {
                        if (t.id !== id) return t;

                        // If content changed, re-extract variables
                        let variables = t.variables;
                        if (updates.content && updates.content !== t.content) {
                            variables = get().extractVariables(updates.content);
                        }

                        return {
                            ...t,
                            ...updates,
                            variables,
                            updatedAt: new Date().toISOString()
                        };
                    })
                }));
            },

            removeTemplate: (id) => {
                set((state) => ({
                    templates: state.templates.filter((t) => t.id !== id)
                }));
            },

            incrementUsage: (id) => {
                set((state) => ({
                    templates: state.templates.map((t) =>
                        t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
                    )
                }));
            },

            // Simple regex-based extraction for immediate client-side feedback
            // This matches {{Variable Name}} or [Variable Name]
            extractVariables: (content) => {
                const regex = /\{\{([^}]+)\}\}|\[([^\]]+)\]/g;
                const variables = new Set<string>();
                let match;

                while ((match = regex.exec(content)) !== null) {
                    // match[1] is {{x}}, match[2] is [x]
                    const variable = match[1] || match[2];
                    if (variable) {
                        variables.add(variable.trim());
                    }
                }

                return Array.from(variables);
            }
        }),
        {
            name: 'smart-template-storage'
        }
    )
);
