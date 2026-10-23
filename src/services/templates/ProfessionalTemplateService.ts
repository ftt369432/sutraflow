// Professional Template Service - Complete Bridge Implementation
// Connects database professional_templates to Canvas and Voice system

import { supabase } from '../../lib/supabase';
import { AIDriveService } from '../drive/aiDriveService';
import { TemplateService } from '../canvas/TemplateService';

export interface ProfessionalTemplate {
  id: string;
  professional_id: string;
  template_name: string;
  template_type: string;
  profession: string;
  content: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
  voice_triggers: string[];
  ai_instructions?: string;
  usage_count: number;
  success_rate: number;
  template_source: 'manual' | 'ai_drive' | 'knowledge_base' | 'imported';
  knowledge_base_refs: string[];
  ai_drive_path?: string;
  created_at: string;
  updated_at: string;
  last_used?: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'currency' | 'selection' | 'boolean';
  description: string;
  required: boolean;
  default_value?: string;
  validation_rules: any;
  ai_extraction_hints: string[];
  common_values: string[];
}

export interface TemplateSection {
  name: string;
  description: string;
  required: boolean;
  order: number;
  content_template: string;
}

export interface VoiceTemplateContext {
  clientName?: string;
  caseNumber?: string;
  amount?: string;
  dateRequested?: string;
  profession: string;
  currentCase?: any;
}

export class ProfessionalTemplateService {
  private aiDriveService: AIDriveService;
  private canvasTemplateService: TemplateService;

  constructor() {
    this.aiDriveService = new AIDriveService(supabase);
    this.canvasTemplateService = TemplateService.getInstance();
  }

  /**
   * Load all professional templates for a user
   */
  async loadProfessionalTemplates(userId: string, profession?: string): Promise<ProfessionalTemplate[]> {
    try {
      let query = supabase
        .from('professional_templates')
        .select('*')
        .eq('professional_id', userId)
        .order('usage_count', { ascending: false });

      if (profession) {
        query = query.eq('profession', profession);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data?.map(this.formatTemplate) || [];
    } catch (error) {
      console.error('Error loading professional templates:', error);
      throw error;
    }
  }

  /**
   * Get templates by voice trigger
   */
  async getTemplatesByVoiceTrigger(voiceCommand: string, userId: string): Promise<ProfessionalTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('professional_templates')
        .select('*')
        .eq('professional_id', userId)
        .contains('voice_triggers', [voiceCommand.toLowerCase()]);

      if (error) throw error;

      return data?.map(this.formatTemplate) || [];
    } catch (error) {
      console.error('Error finding templates by voice trigger:', error);
      throw error;
    }
  }

  /**
   * Create professional template from AI Drive file
   */
  async createTemplateFromAIDrive(
    userId: string, 
    aiDriveFileId: string, 
    templateType: string,
    profession: string,
    voiceTriggers: string[] = []
  ): Promise<ProfessionalTemplate> {
    try {
      // Load content from AI Drive
      const { file, content } = await this.aiDriveService.loadCanvasDocument(aiDriveFileId);
      
      // Extract variables and sections from content
      const variables = this.extractVariablesFromContent(content);
      const sections = this.extractSectionsFromContent(content);
      
      // Create professional template record
      const { data, error } = await supabase
        .from('professional_templates')
        .insert({
          professional_id: userId,
          template_name: file.name.replace('.md', ''),
          template_type: templateType,
          profession,
          content,
          variables,
          sections,
          voice_triggers: voiceTriggers,
          template_source: 'ai_drive',
          ai_drive_path: file.ai_metadata?.path || file.name,
          ai_instructions: `Professional ${profession} template for ${templateType}. Auto-generated from AI Drive file.`
        })
        .select()
        .single();

      if (error) throw error;

      // Create sync record
      await this.createAIDriveSync(data.id, aiDriveFileId, file.name);

      // Add to canvas template service for immediate use
      await this.addToCanvasTemplateService(data);

      return this.formatTemplate(data);
    } catch (error) {
      console.error('Error creating template from AI Drive:', error);
      throw error;
    }
  }

  /**
   * Process voice command to template activation
   */
  async processVoiceToTemplate(
    voiceCommand: string, 
    userId: string, 
    context: VoiceTemplateContext = { profession: 'legal' }
  ): Promise<{ template: ProfessionalTemplate; variables: Record<string, any>; canvasDocument: any }> {
    try {
      // Find matching templates by voice trigger
      const templates = await this.getTemplatesByVoiceTrigger(voiceCommand, userId);
      
      if (templates.length === 0) {
        // Try fuzzy matching
        const allTemplates = await this.loadProfessionalTemplates(userId, context.profession);
        const fuzzyMatch = this.findFuzzyMatch(voiceCommand, allTemplates);
        if (fuzzyMatch) {
          templates.push(fuzzyMatch);
        }
      }

      if (templates.length === 0) {
        throw new Error(`No template found for voice command: "${voiceCommand}"`);
      }

      // Use the highest usage template
      const template = templates[0];

      // Extract variables from voice command and context
      const extractedVariables = await this.extractVariablesFromVoice(voiceCommand, template, context);

      // Populate template with variables
      const populatedContent = this.populateTemplate(template.content, extractedVariables);

      // Create canvas document
      const canvasDocument = {
        id: `template_${template.id}_${Date.now()}`,
        title: `${template.template_name} - ${new Date().toLocaleDateString()}`,
        content: populatedContent,
        contentType: this.mapTemplateTypeToCanvasType(template.template_type),
        templateId: template.id,
        lastModified: new Date(),
        originalSource: 'template' as const
      };

      // Update usage statistics
      await this.updateTemplateUsage(template.id);

      // Log voice command success
      await this.logVoiceCommand(userId, voiceCommand, template.id, true);

      return {
        template,
        variables: extractedVariables,
        canvasDocument
      };
    } catch (error) {
      console.error('Error processing voice to template:', error);
      
      // Log voice command failure
      await this.logVoiceCommand(userId, voiceCommand, null, false, error.message);
      
      throw error;
    }
  }

  /**
   * Import AI Drive file as professional template
   */
  async importAIDriveFileAsTemplate(
    userId: string,
    aiDriveFileId: string,
    templateConfig: {
      templateType: string;
      profession: string;
      voiceTriggers: string[];
      aiInstructions?: string;
    }
  ): Promise<ProfessionalTemplate> {
    return this.createTemplateFromAIDrive(
      userId,
      aiDriveFileId,
      templateConfig.templateType,
      templateConfig.profession,
      templateConfig.voiceTriggers
    );
  }

  /**
   * Sync template changes back to AI Drive
   */
  async syncTemplateToAIDrive(templateId: string): Promise<boolean> {
    try {
      // Get template and sync record
      const { data: template } = await supabase
        .from('professional_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      const { data: syncRecord } = await supabase
        .from('template_ai_drive_sync')
        .select('*')
        .eq('template_id', templateId)
        .single();

      if (!template || !syncRecord) {
        return false;
      }

      // Update AI Drive file
      await this.aiDriveService.updateCanvasDocument(
        syncRecord.ai_drive_file_id,
        template.content,
        template.template_name,
        'document'
      );

      // Update sync record
      await supabase
        .from('template_ai_drive_sync')
        .update({ 
          last_sync: new Date().toISOString(),
          sync_status: 'synced'
        })
        .eq('id', syncRecord.id);

      return true;
    } catch (error) {
      console.error('Error syncing template to AI Drive:', error);
      return false;
    }
  }

  /**
   * Extract variables from content using AI patterns
   */
  private extractVariablesFromContent(content: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variablePattern);

    if (matches) {
      matches.forEach(match => {
        const variableName = match.replace(/[{}]/g, '');
        const variable: TemplateVariable = {
          name: variableName,
          type: this.guessVariableType(variableName),
          description: this.generateVariableDescription(variableName),
          required: true,
          validation_rules: {},
          ai_extraction_hints: this.generateExtractionHints(variableName),
          common_values: []
        };
        variables.push(variable);
      });
    }

    return variables;
  }

  /**
   * Extract sections from content
   */
  private extractSectionsFromContent(content: string): TemplateSection[] {
    const sections: TemplateSection[] = [];
    const sectionPattern = /^#+\s+(.+)$/gm;
    let match;
    let order = 1;

    while ((match = sectionPattern.exec(content)) !== null) {
      sections.push({
        name: match[1],
        description: `Section: ${match[1]}`,
        required: true,
        order: order++,
        content_template: match[1]
      });
    }

    return sections;
  }

  /**
   * Extract variables from voice command using AI
   */
  private async extractVariablesFromVoice(
    voiceCommand: string, 
    template: ProfessionalTemplate, 
    context: VoiceTemplateContext
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};

    // Basic entity extraction patterns
    const patterns = {
      client_name: /for ([A-Z][a-z]+ [A-Z][a-z]+)/i,
      amount: /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      case_number: /case (?:number |#)?(\d+)/i,
      date: /(?:on |by |dated )(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})/i
    };

    // Extract from voice command
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = voiceCommand.match(pattern);
      if (match) {
        variables[key] = match[1];
      }
    }

    // Use context to fill in missing variables
    if (context.clientName && !variables.client_name) {
      variables.client_name = context.clientName;
    }
    if (context.caseNumber && !variables.case_number) {
      variables.case_number = context.caseNumber;
    }
    if (context.amount && !variables.amount) {
      variables.amount = context.amount;
    }

    // Add default values for missing required variables
    template.variables.forEach(templateVar => {
      if (templateVar.required && !variables[templateVar.name]) {
        variables[templateVar.name] = templateVar.default_value || `[${templateVar.name.toUpperCase()}]`;
      }
    });

    return variables;
  }

  /**
   * Populate template with variables
   */
  private populateTemplate(content: string, variables: Record<string, any>): string {
    let populatedContent = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      populatedContent = populatedContent.replace(pattern, value.toString());
    }

    return populatedContent;
  }

  /**
   * Helper methods
   */
  private formatTemplate(data: any): ProfessionalTemplate {
    return {
      ...data,
      variables: data.variables || [],
      sections: data.sections || [],
      voice_triggers: data.voice_triggers || [],
      knowledge_base_refs: data.knowledge_base_refs || []
    };
  }

  private guessVariableType(variableName: string): TemplateVariable['type'] {
    const name = variableName.toLowerCase();
    if (name.includes('date')) return 'date';
    if (name.includes('amount') || name.includes('fee') || name.includes('cost')) return 'currency';
    if (name.includes('count') || name.includes('number')) return 'number';
    if (name.includes('yes') || name.includes('no') || name.includes('agree')) return 'boolean';
    return 'text';
  }

  private generateVariableDescription(variableName: string): string {
    const descriptions: Record<string, string> = {
      client_name: 'Client or patient full name',
      case_number: 'Case or file number',
      amount: 'Monetary amount (e.g., damages, fees)',
      date: 'Relevant date for the document',
      attorney_name: 'Attorney or professional name',
      firm_name: 'Law firm or practice name'
    };
    return descriptions[variableName] || `Variable: ${variableName}`;
  }

  private generateExtractionHints(variableName: string): string[] {
    const hints: Record<string, string[]> = {
      client_name: ['for', 'representing', 'client', 'patient'],
      amount: ['$', 'dollars', 'amount', 'damages', 'fee'],
      case_number: ['case', 'file', 'number', '#'],
      date: ['on', 'by', 'dated', 'due']
    };
    return hints[variableName] || [];
  }

  private findFuzzyMatch(voiceCommand: string, templates: ProfessionalTemplate[]): ProfessionalTemplate | null {
    const command = voiceCommand.toLowerCase();
    
    for (const template of templates) {
      if (template.template_name.toLowerCase().includes(command) ||
          command.includes(template.template_name.toLowerCase()) ||
          template.template_type.toLowerCase().includes(command)) {
        return template;
      }
    }
    
    return null;
  }

  private mapTemplateTypeToCanvasType(templateType: string): string {
    const mapping: Record<string, string> = {
      legal_petition: 'legal_petition',
      legal_demand: 'formal_letter',
      legal_qme: 'medical_report',
      medical_report: 'medical_report',
      business_proposal: 'business_plan',
      business_contract: 'legal_contract'
    };
    return mapping[templateType] || 'custom_document';
  }

  private async createAIDriveSync(templateId: string, aiDriveFileId: string, aiDrivePath: string): Promise<void> {
    await supabase
      .from('template_ai_drive_sync')
      .insert({
        template_id: templateId,
        ai_drive_file_id: aiDriveFileId,
        ai_drive_path: aiDrivePath,
        sync_status: 'synced'
      });
  }

  private async addToCanvasTemplateService(template: any): Promise<void> {
    // Add template to canvas template service for immediate availability
    await this.canvasTemplateService.createTemplateFromContent(
      template.content,
      {
        description: template.ai_instructions || `Professional ${template.profession} template`
      },
      this.mapTemplateTypeToCanvasType(template.template_type),
      template.professional_id
    );
  }

  private async updateTemplateUsage(templateId: string): Promise<void> {
    await supabase.rpc('increment_template_usage', { template_id: templateId });
  }

  private async logVoiceCommand(
    userId: string, 
    voiceCommand: string, 
    templateId: string | null, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    await supabase
      .from('professional_voice_commands')
      .insert({
        professional_id: userId,
        command_text: voiceCommand,
        intent_detected: templateId ? 'template_activation' : 'template_search',
        template_triggered: templateId,
        action_taken: success ? 'template_activated' : 'template_search_failed',
        success,
        error_message: errorMessage
      });
  }
}

// Export singleton instance - lazy initialization to avoid Supabase client issues
let professionalTemplateServiceInstance: ProfessionalTemplateService | null = null;

export const professionalTemplateService = {
  getInstance(): ProfessionalTemplateService {
    if (!professionalTemplateServiceInstance) {
      professionalTemplateServiceInstance = new ProfessionalTemplateService();
    }
    return professionalTemplateServiceInstance;
  }
};