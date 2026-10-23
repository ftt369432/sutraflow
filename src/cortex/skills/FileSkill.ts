import { Skill, CortexContext } from '../types';
import { supabase } from '../../lib/supabaseClient';

/**
 * 📂 File Skill (Agentic Workspace)
 * The "Hands" that allow Cortex to manipulate files in GenieDrive.
 */
export class FileSkill implements Skill {
    id = 'file_skill';
    name = 'File Management';
    description = 'Create, read, and delete files in GenieDrive.';

    async execute(context: CortexContext): Promise<void> {
        // Default behavior: Check for new file drops or changes?
        // For now, no active background task.
    }

    /**
     * 📝 Create or Overwrite File
     */
    async createFile(path: string, content: string | Blob, options: { upsert?: boolean, contentType?: string } = {}): Promise<string | null> {
        try {
            const { data, error } = await supabase.storage
                .from('genie-drive')
                .upload(path, content, {
                    contentType: options.contentType || 'text/plain',
                    upsert: options.upsert !== false
                });

            if (error) throw error;
            console.log(`📂 FileSkill: Created file at ${path}`);
            return data?.path || path;
        } catch (error) {
            console.error('📂 FileSkill Error (Create):', error);
            return null;
        }
    }

    /**
     * 📖 Read File
     */
    async readFile(path: string): Promise<string | null> {
        try {
            const { data, error } = await supabase.storage
                .from('genie-drive')
                .download(path);

            if (error) throw error;
            return await data.text();
        } catch (error) {
            console.error('📂 FileSkill Error (Read):', error);
            return null;
        }
    }

    /**
     * 📋 List Files
     */
    async listFiles(path: string): Promise<any[]> {
        try {
            const { data, error } = await supabase.storage
                .from('genie-drive')
                .list(path);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('📂 FileSkill Error (List):', error);
            return [];
        }
    }

    /**
     * 🗑️ Delete File
     */
    async deleteFile(path: string): Promise<boolean> {
        try {
            const { error } = await supabase.storage
                .from('genie-drive')
                .remove([path]);

            if (error) throw error;
            console.log(`📂 FileSkill: Deleted file at ${path}`);
            return true;
        } catch (error) {
            console.error('📂 FileSkill Error (Delete):', error);
            return false;
        }
    }
}

export const fileSkill = new FileSkill();
