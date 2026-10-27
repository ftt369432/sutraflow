import { supabase } from '../../lib/supabaseClient';
import { vectorSearchService } from '../../services/vectordb/vectorSearchService';
import { Skill, CortexContext } from '../types';

/**
 * 📚 Knowledge Skill (Evolution)
 * Allows the Cortex to Read/Write its own memory (GenieDrive).
 * This is the mechanism for "Evolution" - persisting new rules/patterns.
 */
export class KnowledgeSkill implements Skill {
    id = 'knowledge_skill';
    name = 'Knowledge & Evolution';
    description = 'Read and write to long-term memory (GenieDrive/cortex).';

    async execute(context: CortexContext): Promise<void> {
        // Default behavior: Maintenance scan (can be expanded)
        console.log('📚 KnowledgeSkill: Performing memory maintenance...');
    }



    /**
     * 🧠 Learn: Save a new pattern/rule to memory.
     * Indexes it for semantic search if userId is provided.
     * Formats content with valid Sovereign Fabric Markdown YAML frontmatter.
     */
    async learn(title: string, content: string, category: string = 'general', userId?: string, teamId?: string): Promise<boolean> {
        try {
            // Ensure Sovereign Fabric compatible frontmatter
            let formattedContent = content;
            if (!content.trim().startsWith('---')) {
                const nowIso = new Date().toISOString();
                const frontmatter = [
                    '---',
                    `title: "${title.replace(/"/g, '\\"')}"`,
                    `category: "${category}"`,
                    `created_at: "${nowIso}"`,
                    `tags: [memory, cortex, ${category}]`,
                    '---',
                    '',
                    ''
                ].join('\n');
                formattedContent = frontmatter + content;
            }

            // 1. Save to Storage (Source of Truth)
            const filename = title.replace(/\s+/g, '-').toLowerCase();
            let path = `cortex/memory/${category}/${filename}.md`;

            // If teamId provided, save to team folder
            if (teamId) {
                path = `teams/${teamId}/cortex/memory/${category}/${filename}.md`;
            }

            const { error } = await supabase
                .storage
                .from('genie-drive')
                .upload(path, formattedContent, {
                    contentType: 'text/markdown',
                    upsert: true
                });

            if (error) throw error;
            console.log(`🧠 KnowledgeSkill: Learned new concept '${title}' at ${path}`);

            // 2. Index for Semantic Search (The Brain)
            if (userId) {
                try {
                    await vectorSearchService.indexDocument(
                        formattedContent,
                        title,
                        userId,
                        undefined, // no direct file_id needed, it's a memory
                        `${filename}.md`,
                        'memory',
                        path
                    );
                    console.log(`🧠 KnowledgeSkill: Indexed '${title}' for semantic search.`);
                } catch (vecError) {
                    console.warn(`🧠 KnowledgeSkill Warning: Failed to index memory '${title}'.`, vecError);
                }
            }

            return true;
        } catch (error) {
            console.error('🧠 KnowledgeSkill Error (Learn):', error);
            return false;
        }
    }

    /**
     * 🧠 Recall: Retrieve memories. 
     * If query is provided, uses Semantic Vector Search.
     * If only category is provided, lists file names.
     */
    async recall(category: string, query?: string): Promise<string[]> {
        try {
            // A. Semantic Search (The Brain)
            if (query) {
                console.log(`🧠 KnowledgeSkill: Recalling via semantic search for "${query}"...`);
                const results = await vectorSearchService.search({
                    query,
                    limit: 5,
                    // We could ideally filter by category if we indexed it as a tag
                });
                // Return the content of the relevant memories
                return results.map(r => r.document.content);
            }

            // B. Direct Memory Access (The Filesystem)
            // Lists memories in a category
            const { data, error } = await supabase
                .storage
                .from('genie-drive')
                .list(`cortex/memory/${category}`);

            if (error) throw error;

            return data.map(file => file.name);
        } catch (error) {
            console.error('🧠 KnowledgeSkill Error (Recall):', error);
            return [];
        }
    }

    /**
     * 🧠 Read: Read a specific memory.
     */
    async read(path: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .storage
                .from('genie-drive')
                .download(path);

            if (error) throw error;

            return await data.text();
        } catch (error) {
            // Silent fail for missing memory files - expected behavior
            return null;
        }
    }

    /**
     * 🔗 Wikilink Extractor (Sovereign Fabric / Markdown compatibility)
     * Extracts [[note-name]] or [[note-name|display text]] links from markdown content.
     */
    extractWikilinks(content: string): string[] {
        if (!content) return [];
        const matches = content.match(/\[\[(.*?)\]\]/g);
        if (!matches) return [];
        
        return matches.map(rawMatch => {
            const inner = rawMatch.slice(2, -2);
            // Handle piped wikilinks [[Target|Display Name]]
            const target = inner.split('|')[0].trim();
            return target;
        });
    }
}

export const knowledgeSkill = new KnowledgeSkill();
