import { useCanvasStore } from '../../stores/canvasStore';

export interface DocumentTemplate {
  id: string;
  name: string;
  contentType: string;
  category: 'legal' | 'medical' | 'architectural' | 'business' | 'real-estate' | 'creative' | 'academic' | 'personal' | 'technical' | 'financial';
  structure: TemplateSection[];
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  learningData: TemplateLearningData;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  averageRating: number;
  // Enhanced AI-powered fields
  content?: string; // Full template content for simple templates
  description?: string; // AI-generated description
  tags?: string[]; // AI-extracted tags
  profession?: string; // Auto-detected profession
  industry?: string; // Auto-detected industry
  aiMetadata?: {
    confidence: number; // AI confidence in template quality (0-1)
    qualityScore: number; // AI-assessed template quality (0-100)
    factPatterns: string[]; // Detected content patterns
    argumentStructure: string[]; // Document structure flow
    sourceDocument?: string; // Original document used to create template
    learningInsights?: string[]; // AI insights about usage patterns
    profession?: string; // Detected profession context
    industry?: string; // Detected industry context
  };
  usage?: {
    count: number;
    lastUsed: Date;
    contexts: string[]; // Different contexts where template was used
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  content: string;
  isRequired: boolean;
  order: number;
  hints: string[];
  examples: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'select' | 'multiline';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select type
  defaultValue?: string;
}

export interface TemplateMetadata {
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  jurisdiction?: string; // for legal docs
  lastUsedBy?: string;
  averageCompletionTime?: number;
}

export interface TemplateLearningData {
  commonModifications: Array<{
    section: string;
    modification: string;
    frequency: number;
  }>;
  userPatterns: Array<{
    userId: string;
    preferredSections: string[];
    commonVariables: Record<string, string>;
    completionTime: number;
  }>;
  successMetrics: {
    completionRate: number;
    userSatisfaction: number;
    timeToComplete: number;
  };
  suggestedImprovements: string[];
}

export class TemplateService {
  private static instance: TemplateService;
  private templates: Map<string, DocumentTemplate> = new Map();
  private userUsageHistory: Map<string, any[]> = new Map();

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  constructor() {
    this.loadDefaultTemplates();
    this.loadUserTemplates();
  }

  // Load built-in templates
  private loadDefaultTemplates() {
    const defaultTemplates: DocumentTemplate[] = [
      {
        id: 'legal-petition',
        name: 'Workers Compensation Petition',
        contentType: 'petition',
        category: 'legal',
        structure: [
          {
            id: 'header',
            name: 'Case Header',
            content: `WORKERS' COMPENSATION APPEALS BOARD
STATE OF CALIFORNIA

{{clientName}}, Applicant
vs.
{{defendantName}}, Defendant

Case No. {{caseNumber}}`,
            isRequired: true,
            order: 1,
            hints: ['Include full legal names', 'Verify case number format'],
            examples: ['JOHN DOE, Applicant vs. ABC COMPANY, Defendant']
          },
          {
            id: 'petition-title',
            name: 'Petition Title',
            content: `PETITION FOR {{petitionType}}`,
            isRequired: true,
            order: 2,
            hints: ['Be specific about the type of relief sought'],
            examples: ['PETITION FOR RECONSIDERATION', 'PETITION FOR REMOVAL']
          },
          {
            id: 'statement-of-facts',
            name: 'Statement of Facts',
            content: `TO THE WORKERS' COMPENSATION APPEALS BOARD:

{{factualBackground}}

The following facts are relevant to this petition:

1. {{fact1}}
2. {{fact2}}
3. {{fact3}}`,
            isRequired: true,
            order: 3,
            hints: ['State facts chronologically', 'Include only relevant facts', 'Be concise but complete'],
            examples: ['Applicant sustained an industrial injury on [date]']
          },
          {
            id: 'legal-basis',
            name: 'Legal Basis',
            content: `LEGAL BASIS FOR PETITION

This petition is brought pursuant to {{legalAuthority}}.

{{legalArgument}}`,
            isRequired: true,
            order: 4,
            hints: ['Cite specific Labor Code sections', 'Reference applicable regulations'],
            examples: ['Labor Code Section 5900', 'California Code of Regulations Section 10957']
          },
          {
            id: 'prayer',
            name: 'Prayer for Relief',
            content: `WHEREFORE, Petitioner respectfully requests that this Board:

1. {{relief1}}
2. {{relief2}}
3. Grant such other and further relief as this Board deems just and proper.

Dated: {{date}}

Respectfully submitted,

{{attorneyName}}
{{attorneyTitle}}
State Bar No. {{barNumber}}
{{firmName}}
{{address}}
{{phone}}
{{email}}

Attorney for {{party}}`,
            isRequired: true,
            order: 5,
            hints: ['Be specific about relief sought', 'Include all necessary attorney information'],
            examples: ['Grant the petition for reconsideration']
          }
        ],
        variables: [
          { name: 'clientName', type: 'text', label: 'Client Name', required: true },
          { name: 'defendantName', type: 'text', label: 'Defendant Name', required: true },
          { name: 'caseNumber', type: 'text', label: 'Case Number', required: true },
          { name: 'petitionType', type: 'select', label: 'Petition Type', required: true, 
            options: ['RECONSIDERATION', 'REMOVAL', 'DISQUALIFICATION', 'WRIT OF REVIEW'] },
          { name: 'factualBackground', type: 'multiline', label: 'Factual Background', required: true },
          { name: 'fact1', type: 'text', label: 'Key Fact 1', required: true },
          { name: 'fact2', type: 'text', label: 'Key Fact 2', required: false },
          { name: 'fact3', type: 'text', label: 'Key Fact 3', required: false },
          { name: 'legalAuthority', type: 'text', label: 'Legal Authority', required: true },
          { name: 'legalArgument', type: 'multiline', label: 'Legal Argument', required: true },
          { name: 'relief1', type: 'text', label: 'Primary Relief Sought', required: true },
          { name: 'relief2', type: 'text', label: 'Additional Relief', required: false },
          { name: 'date', type: 'date', label: 'Date', required: true },
          { name: 'attorneyName', type: 'text', label: 'Attorney Name', required: true },
          { name: 'attorneyTitle', type: 'text', label: 'Attorney Title', required: true },
          { name: 'barNumber', type: 'text', label: 'State Bar Number', required: true },
          { name: 'firmName', type: 'text', label: 'Firm Name', required: true },
          { name: 'address', type: 'multiline', label: 'Address', required: true },
          { name: 'phone', type: 'text', label: 'Phone', required: true },
          { name: 'email', type: 'text', label: 'Email', required: true },
          { name: 'party', type: 'text', label: 'Party Represented', required: true }
        ],
        metadata: {
          description: 'Comprehensive template for Workers Compensation petitions',
          tags: ['workers comp', 'petition', 'legal', 'california'],
          difficulty: 'intermediate',
          estimatedTime: 45,
          jurisdiction: 'California'
        },
        learningData: {
          commonModifications: [],
          userPatterns: [],
          successMetrics: {
            completionRate: 0.85,
            userSatisfaction: 0,
            timeToComplete: 0
          },
          suggestedImprovements: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        averageRating: 0
      },
      {
        id: 'legal-brief',
        name: 'Legal Brief Template',
        contentType: 'legal-brief',
        category: 'legal',
        structure: [
          {
            id: 'caption',
            name: 'Case Caption',
            content: `{{courtName}}

{{plaintiff}} v. {{defendant}}

Case No. {{caseNumber}}`,
            isRequired: true,
            order: 1,
            hints: ['Use proper court name format'],
            examples: ['Superior Court of California, County of Los Angeles']
          },
          {
            id: 'introduction',
            name: 'Introduction',
            content: `INTRODUCTION

{{briefIntroduction}}`,
            isRequired: true,
            order: 2,
            hints: ['Briefly state the purpose of the brief'],
            examples: ['This brief addresses the motion for summary judgment filed by defendant.']
          },
          {
            id: 'statement-of-facts',
            name: 'Statement of Facts',
            content: `STATEMENT OF FACTS

{{factualStatement}}`,
            isRequired: true,
            order: 3,
            hints: ['Present facts in chronological order', 'Include only material facts'],
            examples: []
          },
          {
            id: 'argument',
            name: 'Argument',
            content: `ARGUMENT

I. {{argumentHeading1}}

{{argument1}}

II. {{argumentHeading2}}

{{argument2}}`,
            isRequired: true,
            order: 4,
            hints: ['Structure arguments logically', 'Support with legal authority'],
            examples: []
          },
          {
            id: 'conclusion',
            name: 'Conclusion',
            content: `CONCLUSION

{{conclusion}}

Respectfully submitted,

{{signature}}`,
            isRequired: true,
            order: 5,
            hints: ['Summarize key points', 'State desired outcome clearly'],
            examples: []
          }
        ],
        variables: [
          { name: 'courtName', type: 'text', label: 'Court Name', required: true },
          { name: 'plaintiff', type: 'text', label: 'Plaintiff', required: true },
          { name: 'defendant', type: 'text', label: 'Defendant', required: true },
          { name: 'caseNumber', type: 'text', label: 'Case Number', required: true },
          { name: 'briefIntroduction', type: 'multiline', label: 'Brief Introduction', required: true },
          { name: 'factualStatement', type: 'multiline', label: 'Statement of Facts', required: true },
          { name: 'argumentHeading1', type: 'text', label: 'First Argument Heading', required: true },
          { name: 'argument1', type: 'multiline', label: 'First Argument', required: true },
          { name: 'argumentHeading2', type: 'text', label: 'Second Argument Heading', required: false },
          { name: 'argument2', type: 'multiline', label: 'Second Argument', required: false },
          { name: 'conclusion', type: 'multiline', label: 'Conclusion', required: true },
          { name: 'signature', type: 'text', label: 'Attorney Signature Block', required: true }
        ],
        metadata: {
          description: 'General legal brief template for court filings',
          tags: ['brief', 'legal', 'court', 'filing'],
          difficulty: 'advanced',
          estimatedTime: 90,
          jurisdiction: 'General'
        },
        learningData: {
          commonModifications: [],
          userPatterns: [],
          successMetrics: {
            completionRate: 0.75,
            userSatisfaction: 0,
            timeToComplete: 0
          },
          suggestedImprovements: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        averageRating: 0
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Load user-created templates from storage
  private loadUserTemplates() {
    try {
      const savedTemplates = localStorage.getItem('canvas-user-templates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        parsed.forEach((template: DocumentTemplate) => {
          this.templates.set(template.id, template);
        });
      }
    } catch (error) {
      console.error('Failed to load user templates:', error);
    }
  }

  // Save templates to storage
  private saveTemplates() {
    try {
      const userTemplates = Array.from(this.templates.values())
        .filter(t => !t.id.startsWith('legal-') && !t.id.startsWith('business-'));
      localStorage.setItem('canvas-user-templates', JSON.stringify(userTemplates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  // Get all templates or filter by category
  getTemplates(category?: string, contentType?: string): DocumentTemplate[] {
    let templates = Array.from(this.templates.values());
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    if (contentType) {
      templates = templates.filter(t => t.contentType === contentType);
    }
    
    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  // Get a specific template
  getTemplate(id: string): DocumentTemplate | null {
    return this.templates.get(id) || null;
  }

  // Create a new template from user content
  async createTemplateFromContent(
    content: string, 
    metadata: Partial<TemplateMetadata>,
    contentType: string,
    userId?: string
  ): Promise<DocumentTemplate> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Analyze content to create structure
    const structure = this.analyzeContentStructure(content);
    const variables = this.extractVariables(content);
    
    const template: DocumentTemplate = {
      id,
      name: metadata.description || `Custom ${contentType} Template`,
      contentType,
      category: this.inferCategory(content, contentType),
      structure,
      variables,
      metadata: {
        description: metadata.description || 'User-created template',
        tags: metadata.tags || [],
        difficulty: metadata.difficulty || 'intermediate',
        estimatedTime: metadata.estimatedTime || 30,
        jurisdiction: metadata.jurisdiction
      },
      learningData: {
        commonModifications: [],
        userPatterns: userId ? [{
          userId,
          preferredSections: structure.map(s => s.id),
          commonVariables: {},
          completionTime: 0
        }] : [],
        successMetrics: {
          completionRate: 1.0,
          userSatisfaction: 0,
          timeToComplete: 0
        },
        suggestedImprovements: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 1,
      averageRating: 0
    };

    this.templates.set(id, template);
    this.saveTemplates();
    
    return template;
  }

  // Learn from user modifications
  async learnFromUsage(
    templateId: string,
    modifications: Array<{ section: string; change: string }>,
    completionTime: number,
    userRating: number,
    userId?: string
  ) {
    const template = this.templates.get(templateId);
    if (!template) return;

    // Update usage statistics
    template.usageCount++;
    template.averageRating = (template.averageRating + userRating) / 2;
    template.updatedAt = new Date();

    // Learn from modifications
    modifications.forEach(mod => {
      const existing = template.learningData.commonModifications.find(
        cm => cm.section === mod.section && cm.modification === mod.change
      );
      
      if (existing) {
        existing.frequency++;
      } else {
        template.learningData.commonModifications.push({
          section: mod.section,
          modification: mod.change,
          frequency: 1
        });
      }
    });

    // Update user patterns
    if (userId) {
      let userPattern = template.learningData.userPatterns.find(up => up.userId === userId);
      if (!userPattern) {
        userPattern = {
          userId,
          preferredSections: [],
          commonVariables: {},
          completionTime: 0
        };
        template.learningData.userPatterns.push(userPattern);
      }
      
      userPattern.completionTime = (userPattern.completionTime + completionTime) / 2;
    }

    // Update success metrics
    template.learningData.successMetrics.timeToComplete = 
      (template.learningData.successMetrics.timeToComplete + completionTime) / 2;
    template.learningData.successMetrics.userSatisfaction = 
      (template.learningData.successMetrics.userSatisfaction + userRating) / 2;

    // Generate improvement suggestions
    this.generateImprovementSuggestions(template);

    this.saveTemplates();
  }

  // Auto-improve templates based on learning data
  private generateImprovementSuggestions(template: DocumentTemplate) {
    const suggestions: string[] = [];
    
    // Analyze common modifications
    const frequentMods = template.learningData.commonModifications
      .filter(cm => cm.frequency >= 3)
      .sort((a, b) => b.frequency - a.frequency);

    frequentMods.forEach(mod => {
      suggestions.push(`Consider updating ${mod.section}: "${mod.modification}" (used ${mod.frequency} times)`);
    });

    // Analyze completion time
    if (template.learningData.successMetrics.timeToComplete > template.metadata.estimatedTime * 1.5) {
      suggestions.push('Template may be too complex - consider simplifying or breaking into smaller sections');
    }

    // Analyze user satisfaction
    if (template.learningData.successMetrics.userSatisfaction < 3.5) {
      suggestions.push('Low user satisfaction - review template structure and clarity');
    }

    template.learningData.suggestedImprovements = suggestions;
  }

  // Analyze content to create structure
  private analyzeContentStructure(content: string): TemplateSection[] {
    const sections: TemplateSection[] = [];
    const lines = content.split('\n');
    let currentSection: Partial<TemplateSection> | null = null;
    let order = 1;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Detect section headers (all caps, standalone lines)
      if (trimmed.length > 0 && trimmed === trimmed.toUpperCase() && 
          !trimmed.includes('{{') && trimmed.length < 100) {
        
        // Save previous section
        if (currentSection && currentSection.content) {
          sections.push({
            id: currentSection.id || `section-${order}`,
            name: currentSection.name || `Section ${order}`,
            content: currentSection.content.trim(),
            isRequired: true,
            order: order++,
            hints: [],
            examples: []
          });
        }

        // Start new section
        currentSection = {
          id: trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: trimmed,
          content: ''
        };
      } else if (currentSection) {
        currentSection.content = (currentSection.content || '') + line + '\n';
      } else {
        // No section header yet, create a default section
        currentSection = {
          id: 'content',
          name: 'Document Content',
          content: line + '\n'
        };
      }
    });

    // Don't forget the last section
    if (currentSection && currentSection.content) {
      sections.push({
        id: currentSection.id || `section-${order}`,
        name: currentSection.name || `Section ${order}`,
        content: currentSection.content.trim(),
        isRequired: true,
        order: order++,
        hints: [],
        examples: []
      });
    }

    return sections;
  }

  // Extract variables from content
  private extractVariables(content: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const found = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!found.has(varName)) {
        found.add(varName);
        
        variables.push({
          name: varName,
          type: this.inferVariableType(varName),
          label: this.generateLabel(varName),
          required: true
        });
      }
    }

    return variables;
  }

  // Infer variable type from name
  private inferVariableType(varName: string): TemplateVariable['type'] {
    const lower = varName.toLowerCase();
    
    if (lower.includes('date')) return 'date';
    if (lower.includes('number') || lower.includes('amount') || lower.includes('count')) return 'number';
    if (lower.includes('type') || lower.includes('category') || lower.includes('status')) return 'select';
    if (lower.includes('description') || lower.includes('statement') || lower.includes('argument') || 
        lower.includes('background') || lower.includes('facts')) return 'multiline';
    
    return 'text';
  }

  // Generate human-readable label
  private generateLabel(varName: string): string {
    return varName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  // Infer category from content - Universal for all professions
  private inferCategory(content: string, contentType: string): DocumentTemplate['category'] {
    const lower = content.toLowerCase();
    
    // Legal documents
    if (lower.includes('petition') || lower.includes('court') || lower.includes('legal') || 
        lower.includes('attorney') || lower.includes('plaintiff') || lower.includes('defendant') ||
        lower.includes('brief') || lower.includes('motion') || lower.includes('litigation')) {
      return 'legal';
    }
    
    // Medical documents
    if (lower.includes('patient') || lower.includes('doctor') || lower.includes('medical') ||
        lower.includes('diagnosis') || lower.includes('treatment') || lower.includes('healthcare') ||
        lower.includes('prescription') || lower.includes('clinic') || lower.includes('hospital')) {
      return 'medical';
    }
    
    // Architectural documents
    if (lower.includes('architect') || lower.includes('blueprint') || lower.includes('construction') ||
        lower.includes('building') || lower.includes('design') || lower.includes('floor plan') ||
        lower.includes('specification') || lower.includes('structural') || lower.includes('engineering')) {
      return 'architectural';
    }
    
    // Real Estate documents
    if (lower.includes('property') || lower.includes('real estate') || lower.includes('listing') ||
        lower.includes('mls') || lower.includes('realtor') || lower.includes('lease') ||
        lower.includes('rental') || lower.includes('mortgage') || lower.includes('appraisal')) {
      return 'real-estate';
    }
    
    // Creative/Writing documents
    if (lower.includes('manuscript') || lower.includes('story') || lower.includes('novel') ||
        lower.includes('poem') || lower.includes('script') || lower.includes('creative') ||
        lower.includes('author') || lower.includes('publisher') || lower.includes('article')) {
      return 'creative';
    }
    
    // Academic documents
    if (lower.includes('research') || lower.includes('thesis') || lower.includes('academic') ||
        lower.includes('university') || lower.includes('study') || lower.includes('professor') ||
        lower.includes('dissertation') || lower.includes('journal') || lower.includes('citation')) {
      return 'academic';
    }
    
    // Technical documents
    if (lower.includes('technical') || lower.includes('specification') || lower.includes('manual') ||
        lower.includes('documentation') || lower.includes('procedure') || lower.includes('protocol') ||
        lower.includes('standard') || lower.includes('guideline') || lower.includes('process')) {
      return 'technical';
    }
    
    // Financial documents
    if (lower.includes('financial') || lower.includes('budget') || lower.includes('accounting') ||
        lower.includes('invoice') || lower.includes('billing') || lower.includes('payment') ||
        lower.includes('expense') || lower.includes('revenue') || lower.includes('investment')) {
      return 'financial';
    }
    
    // Business documents (default for business-related content)
    if (lower.includes('business') || lower.includes('company') || lower.includes('corporate') ||
        lower.includes('management') || lower.includes('strategy') || lower.includes('proposal') ||
        lower.includes('contract') || lower.includes('agreement') || lower.includes('report')) {
      return 'business';
    }
    
    return 'personal';
  }

  // Get template suggestions based on user history
  getSuggestedTemplates(userId?: string, contentType?: string): DocumentTemplate[] {
    if (!userId) return this.getTemplates().slice(0, 5);

    const userHistory = this.userUsageHistory.get(userId) || [];
    const userTemplates = Array.from(this.templates.values())
      .filter(t => {
        // Filter by content type if specified
        if (contentType && t.contentType !== contentType) return false;
        
        // Check if user has patterns with this template
        return t.learningData.userPatterns.some(up => up.userId === userId);
      })
      .sort((a, b) => {
        // Sort by user familiarity and usage
        const aPattern = a.learningData.userPatterns.find(up => up.userId === userId);
        const bPattern = b.learningData.userPatterns.find(up => up.userId === userId);
        
        return (bPattern?.completionTime || 0) - (aPattern?.completionTime || 0);
      });

    // If user has no history, return popular templates
    if (userTemplates.length === 0) {
      return this.getTemplates(undefined, contentType).slice(0, 5);
    }

    return userTemplates.slice(0, 5);
  }

  // Apply template to create document content
  applyTemplate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) return '';

    let content = template.structure
      .sort((a, b) => a.order - b.order)
      .map(section => section.content)
      .join('\n\n');

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(placeholder, value);
    });

    return content;
  }

  // Delete a template
  deleteTemplate(templateId: string): boolean {
    if (this.templates.has(templateId)) {
      this.templates.delete(templateId);
      this.saveTemplates();
      return true;
    }
    return false;
  }

  // Enhanced AI-powered template search
  searchTemplates(userRequest: string, contentType?: string): DocumentTemplate[] {
    const allTemplates = this.getTemplates(undefined, contentType);
    
    // Score templates based on relevance to user request
    const scoredTemplates = allTemplates.map(template => {
      let score = 0;
      const request = userRequest.toLowerCase();
      
      // Content type match (highest priority)
      if (template.contentType === contentType) {
        score += 100;
      }
      
      // Keywords in template name/description
      const templateText = `${template.name} ${template.description || ''} ${template.metadata?.description || ''}`.toLowerCase();
      const requestWords = request.split(/\s+/);
      
      requestWords.forEach(word => {
        if (templateText.includes(word)) {
          score += 10;
        }
      });
      
      // Tags match
      template.metadata?.tags?.forEach(tag => {
        if (request.includes(tag.toLowerCase())) {
          score += 15;
        }
      });
      
      // AI metadata fact patterns match
      template.aiMetadata?.factPatterns?.forEach(pattern => {
        if (request.includes(pattern.toLowerCase())) {
          score += 20;
        }
      });
      
      // Usage count and quality boost
      score += template.usageCount || 0;
      score += (template.aiMetadata?.qualityScore || 50) / 10;
      
      // Penalty for low confidence
      if (template.aiMetadata?.confidence && template.aiMetadata.confidence < 0.7) {
        score -= 10;
      }
      
      return { template, score };
    });
    
    // Sort by score and return top matches
    return scoredTemplates
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.template)
      .slice(0, 10);
  }

  // Create template from uploaded document with AI analysis
  async createTemplate(templateData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const template: DocumentTemplate = {
      ...templateData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: templateData.usage?.count || 0,
      averageRating: 0
    };
    
    this.templates.set(id, template);
    this.saveTemplates();
    
    return template;
  }

  // Export templates for backup
  exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2);
  }

  // Import templates from backup
  importTemplates(templatesJson: string): number {
    try {
      const templates: DocumentTemplate[] = JSON.parse(templatesJson);
      let imported = 0;
      
      templates.forEach(template => {
        // Generate new ID to avoid conflicts
        template.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        template.createdAt = new Date();
        template.updatedAt = new Date();
        
        this.templates.set(template.id, template);
        imported++;
      });
      
      this.saveTemplates();
      return imported;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return 0;
    }
  }
}

export const templateService = TemplateService.getInstance();
