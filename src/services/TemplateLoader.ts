import { LegalTemplate } from '../data/legalTemplates';

/**
 * Loads all Markdown templates from the src/templates/legal directory.
 * Uses Vite's import.meta.glob feature for file system access at build/runtime.
 */
export function loadTemplatesFromFiles(): LegalTemplate[] {
    const modules = import.meta.glob('../templates/legal/*.md', { query: '?raw', import: 'default', eager: true });
    const templates: LegalTemplate[] = [];

    for (const path in modules) {
        const content = modules[path] as string;
        try {
            const template = parseMarkdown(content, path);
            if (template) {
                templates.push(template);
            }
        } catch (e) {
            console.error(`Failed to parse template ${path}:`, e);
        }
    }
    return templates;
}

/**
 * Parses a Markdown file with YAML Frontmatter into a LegalTemplate object.
 */
function parseMarkdown(content: string, path: string): LegalTemplate | null {
    // Normalize line endings
    const normalized = content.replace(/\r\n/g, '\n');

    // Regex for Frontmatter
    const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
        console.warn(`Skipping template ${path}: Missing or invalid Frontmatter (must start/end with ---)`);
        return null;
    }

    const [_, yamlRaw, bodyRaw] = match;
    const metadata = parseYaml(yamlRaw);

    // Initial validation
    if (!metadata.id || !metadata.name || !metadata.category) {
        console.warn(`Skipping template ${path}: Missing required metadata (id, name, category)`);
        return null;
    }

    return {
        id: metadata.id,
        name: metadata.name,
        category: metadata.category as any,
        description: metadata.description || '',
        variables: Array.isArray(metadata.variables) ? metadata.variables : [],
        content: bodyRaw.trim()
    };
}

/**
 * Lightweight YAML parser for Frontmatter.
 * Supports string keys and list arrays.
 */
function parseYaml(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yaml.split('\n');

    let currentKey: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) continue;

        // Check for array item "- Value"
        if (trimmed.startsWith('- ')) {
            if (currentKey) {
                if (!Array.isArray(result[currentKey])) {
                    result[currentKey] = [];
                }
                const value = trimmed.substring(2).trim();
                result[currentKey].push(value);
            }
            continue;
        }

        // Check for "Key: Value" or "Key:"
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();

            result[key] = value;
            currentKey = key;

            // If value is empty, it might be the start of a list
            if (!value) {
                // Prepared for next lines to be list items
            }
        }
    }
    return result;
}
