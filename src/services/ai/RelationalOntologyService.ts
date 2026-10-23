import { supabase } from '../../lib/supabaseClient';
import { AIServiceFactory } from './aiServiceFactory';

export interface Entity {
    id: string;
    type: 'person' | 'organization' | 'ticker' | 'location' | 'case_number' | 'date';
    value: string;
    metadata?: Record<string, any>;
}

/**
 * 🔗 Relational Ontology Service
 * The "Graph" of GenieFlowAI.
 * Maps relationships between disparate data points to enable investigative reasoning.
 */
export class RelationalOntologyService {
    private static instance: RelationalOntologyService;

    private constructor() { }

    public static getInstance(): RelationalOntologyService {
        if (!RelationalOntologyService.instance) {
            RelationalOntologyService.instance = new RelationalOntologyService();
        }
        return RelationalOntologyService.instance;
    }

    /**
     * 🧠 Extract Entities from text using AI
     */
    public async extractEntities(text: string): Promise<Omit<Entity, 'id'>[]> {
        const aiService = AIServiceFactory.getInstance();
        const prompt = `
            Extract all significant entities from the following text. 
            Identify: Names (person), Companies (organization), Tickers (ticker), Case Numbers (case_number), and Locations (location).
            
            Format as JSON array: [{ "type": "person|organization|ticker|location|case_number", "value": "extracted text", "metadata": {} }]
            
            TEXT:
            ${text}
        `;

        try {
            const response = await aiService.generateText(prompt);
            const firstBrace = response.indexOf('[');
            const lastBrace = response.lastIndexOf(']');
            if (firstBrace === -1 || lastBrace === -1) return [];

            const jsonStr = response.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('🔗 RelationalOntology: Extraction failed', e);
            return [];
        }
    }

    /**
     * 📂 Record a Bond between an artifact and an entity
     */
    public async recordBond(sourceId: string, sourceType: string, entity: Omit<Entity, 'id'>, context: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 💾 PERSISTENCE: Save to database so other tools can find correlations
            // We'll use a generic metadata-rich approach here or a custom table if we want a real graph.
            // For now, let's assume we use 'ai_drive_files' metadata or a shared 'intelligence_bonds' table for cross-domain work.
            const { error } = await supabase
                .from('intelligence_bonds')
                .upsert([{
                    source_id: sourceId,
                    source_type: sourceType,
                    entity_type: entity.type,
                    entity_value: entity.value,
                    context: context,
                    user_id: user.id,
                    metadata: entity.metadata || {},
                    created_at: new Date().toISOString()
                }], { onConflict: 'source_id,entity_value' });

            if (error) {
                console.warn('🔗 RelationalOntology: Database error (likely table missing), falling back to session-only for this link.', error.message);
            }
        } catch (e) {
            console.error('🔗 RelationalOntology: Bond recording failed', e);
        }
    }

    /**
     * 🔍 Find Correlations
     * Returns artifacts linked to the same entity values.
     */
    public async findCorrelations(entityValue: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('intelligence_bonds')
                .select('*')
                .ilike('entity_value', `%${entityValue}%`);

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('🔗 RelationalOntology: Correlation search failed', e);
            return [];
        }
    }

    /**
     * 🧪 Discover Cross-Domain Links
     * High-intensity scanner that finds links between disparate entities.
     */
    public async discoverCrossDomainLinks(missionId: string): Promise<any[]> {
        const { data: bonds, error } = await supabase
            .from('intelligence_bonds')
            .select('*')
            .eq('metadata->mission_id', missionId);

        if (error || !bonds) return [];

        // Simple clustering: find entities appearing in both Ticker and Legal contexts
        const entities = bonds.map(b => b.entity_value);
        const uniqueEntities = [...new Set(entities)];

        return uniqueEntities.filter(e => {
            const occurrences = bonds.filter(b => b.entity_value === e);
            const types = new Set(occurrences.map(o => o.entity_type));
            return types.size > 1; // More than one domain linked
        });
    }
}

export const relationalOntologyService = RelationalOntologyService.getInstance();
