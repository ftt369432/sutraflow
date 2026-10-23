import { supabase } from '../lib/supabaseClient';

export interface DocumentTemplate {
    id: string;
    name: string;
    type: string;
    content: string;
    version: string;
    metadata?: any;
}

/**
 * 📝 TemplateService
 * Manages the Master Document Registry.
 */
export class TemplateService {
    private static instance: TemplateService;

    private constructor() { }

    public static getInstance(): TemplateService {
        if (!TemplateService.instance) {
            TemplateService.instance = new TemplateService();
        }
        return TemplateService.instance;
    }

    /**
     * 🔍 Get template by name
     */
    public async getTemplate(name: string): Promise<DocumentTemplate | null> {
        try {
            // 1. Try local data first (verbatim master)
            if (name === 'penalty_petition') {
                const modules = import.meta.glob('../data/templates/*.md', { query: '?raw', import: 'default', eager: true });
                const matchingPath = Object.keys(modules).find(path => path.includes('penalty_petition.md'));

                if (matchingPath) {
                    return {
                        id: 'template-penalty-petition',
                        name: 'Petition for Penalties',
                        type: 'legal-petition',
                        version: '1.2.0',
                        content: modules[matchingPath] as string
                    };
                }
            }

            // 2. Fallback to Supabase Document Templates
            const { data, error } = await supabase
                .from('document_templates')
                .select('*')
                .eq('name', name)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('📝 TemplateService: Failed to fetch template.', error);
            return null;
        }
    }

    /**
     * 🏗️ Fill placeholders in template
     */
    public fillTemplate(template: string, data: Record<string, string>): string {
        let result = template;
        Object.entries(data).forEach(([key, value]) => {
            const placeholder = `[[${key}]]`;
            result = result.split(placeholder).join(value);
        });
        return result;
    }
}

export const templateService = TemplateService.getInstance();
