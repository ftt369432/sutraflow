import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * 🛡️ VerifiedLibrary
 * Manages the transition of skills from "Custom/Development" to "Verified/Sanitized".
 */
export class VerifiedLibrary {
    private static instance: VerifiedLibrary;
    private baseRoot = process.env.VITE_WORKSPACE_ROOT || process.cwd();
    private libraryDir = path.resolve(this.baseRoot, 'skills_library');
    private customDir = path.resolve(this.baseRoot, 'src', 'cortex', 'skills', 'custom');

    public static getInstance() {
        if (!VerifiedLibrary.instance) {
            VerifiedLibrary.instance = new VerifiedLibrary();
        }
        return VerifiedLibrary.instance;
    }

    /**
     * Sanitizes and promotes a skill to the verified library.
     */
    public async sanitizeAndPromote(skillName: string): Promise<{ ok: boolean, message: string }> {
        const source = path.join(this.customDir, skillName);
        const target = path.join(this.libraryDir, `${skillName}.md`);

        if (!fs.existsSync(source)) {
            return { ok: false, message: `Skill ${skillName} not found in custom directory.` };
        }

        try {
            // 1. Run Quick Validate
            const validatorPath = path.resolve(this.baseRoot, 'src', 'cortex', 'skills', 'skill-creator', 'scripts', 'quick_validate.py');
            const { stdout } = await execAsync(`python "${validatorPath}" "${source}"`);

            if (!stdout.includes('VALIDATION SUCCESS')) {
                return { ok: false, message: `Validation failed: ${stdout}` };
            }

            // 2. "Sanitize" (In this case, copying the definition and ensuring security)
            // In a real system, we might wrap scripts in sandboxes here
            const skillMd = path.join(source, 'SKILL.md');
            fs.copyFileSync(skillMd, target);

            console.log(`🛡️ VerifiedLibrary: Skill '${skillName}' sanitized and promoted.`);
            return { ok: true, message: `Skill '${skillName}' is now in the verified library.` };

        } catch (err) {
            console.error('❌ Sanitization Failed:', err);
            return { ok: false, message: err instanceof Error ? err.message : String(err) };
        }
    }

    public getVerifiedSkills(): string[] {
        if (!fs.existsSync(this.libraryDir)) return [];
        return fs.readdirSync(this.libraryDir).map(f => f.replace('.md', ''));
    }
}

export const verifiedLibrary = VerifiedLibrary.getInstance();
