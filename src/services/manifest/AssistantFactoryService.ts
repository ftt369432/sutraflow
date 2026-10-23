import { AIAssistant } from '../../types/ai';
import { supabase } from '../../lib/supabaseClient';
import { ParsedManifest } from './ManifestParserService';

export class AssistantFactoryService {
  /**
   * Injects cardinal rules and template information from the parsed manifest
   * into the system prompt of the assistant.
   */
  static generateEnhancedSystemPrompt(
    basePrompt: string,
    manifest: ParsedManifest
  ): string {
    const rulesSection = `
# 🚨 CARDINAL SYSTEM RULES (ANTIGRAVITY MANIFEST)
${manifest.cardinalRules.map((rule, idx) => `${idx + 1}. **${rule}**`).join('\n')}

# 📋 AVAILABLE WORKSPACE TEMPLATES
The following standardized templates are available in your AI Drive/Knowledge Base. You MUST refer to these paths and load their contents when drafting or reviewing these specific legal documents:
${manifest.files
  .filter(f => f.category === 'template')
  .map(f => `- **${f.name}**: Path: \`${f.relativePath}\``)
  .join('\n')}
`;

    // Make sure we don't double inject
    const cleanBasePrompt = basePrompt.split('# 🚨 CARDINAL SYSTEM RULES (ANTIGRAVITY MANIFEST)')[0].trim();
    return `${cleanBasePrompt}\n\n${rulesSection.trim()}`;
  }

  /**
   * Enhances an existing assistant's prompt in the database
   */
  static async enhanceAssistant(
    assistantId: string,
    manifest: ParsedManifest
  ): Promise<boolean> {
    try {
      const { data: assistant, error } = await supabase
        .from('assistants')
        .select('system_prompt, name')
        .eq('id', assistantId)
        .single();

      if (error || !assistant) {
        console.error('Error fetching assistant for enhancement:', error);
        return false;
      }

      const enhancedPrompt = this.generateEnhancedSystemPrompt(
        assistant.system_prompt || '',
        manifest
      );

      const { error: updateError } = await supabase
        .from('assistants')
        .update({
          system_prompt: enhancedPrompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', assistantId);

      if (updateError) {
        console.error('Error updating assistant system prompt:', updateError);
        return false;
      }

      console.log(`🤖 Enhanced system prompt for assistant: ${assistant.name}`);
      return true;
    } catch (e) {
      console.error('Failed to enhance assistant:', e);
      return false;
    }
  }
}
