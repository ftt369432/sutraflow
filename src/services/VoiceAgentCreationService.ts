/**
 * 🎤 Voice-Powered Agent Creation System
 * 
 * "Speak an agent flow into existence"
 * 
 * This service allows users to create complex agent workflows by simply describing
 * what they want the system to do in natural language.
 */

import { WorkflowOrchestrator } from './WorkflowOrchestrator';
import { LegalAgent, MedicalAgent, CalendarAgent as AICalendarAgent } from './agents/SpecializedAgents';
import { UniversalAgentType } from './email/agents/UniversalEmailAgentSystem';

export interface VoiceAgentRequest {
  description: string;
  industry?: string;
  keywords?: string[];
  actions?: string[];
}

export interface CreatedAgentWorkflow {
  id: string;
  name: string;
  description: string;
  industry: string;
  agents: UniversalAgentType[];
  rules: AgentRule[];
  estimatedTimeSavings: number; // minutes per week
  successRate: number; // estimated percentage
}

export interface AgentRule {
  id: string;
  trigger: string; // What triggers this rule
  conditions: string[]; // Conditions that must be met
  actions: string[]; // What actions to take
  priority: number; // 1 = highest priority
}

export class VoiceAgentCreationService {
  private orchestrator: WorkflowOrchestrator;

  constructor() {
    this.orchestrator = new WorkflowOrchestrator();
  }

  /**
   * 🎯 Parse voice description and create agent workflow
   */
  async createAgentFromVoice(request: VoiceAgentRequest): Promise<CreatedAgentWorkflow> {
    const description = request.description.toLowerCase();
    
    // Detect industry from voice description
    const industry = this.detectIndustry(description);
    
    // Extract key information from voice description
    const keywords = this.extractKeywords(description);
    const actions = this.extractActions(description);
    const agents = this.selectAgents(industry, keywords, actions);
    
    // Generate rules based on description
    const rules = this.generateRules(description, keywords, actions);
    
    // Create the workflow
    const workflow: CreatedAgentWorkflow = {
      id: `voice_agent_${Date.now()}`,
      name: this.generateWorkflowName(description, industry),
      description: request.description,
      industry,
      agents,
      rules,
      estimatedTimeSavings: this.estimateTimeSavings(rules.length, actions.length),
      successRate: this.estimateSuccessRate(industry, keywords.length)
    };

    // Register with orchestrator
    await this.registerWithOrchestrator(workflow);

    return workflow;
  }

  /**
   * 🏭 Detect industry from voice description
   */
  private detectIndustry(description: string): string {
    const industryPatterns = {
      legal: /legal|court|hearing|petition|case|attorney|lawyer|wcab|deposition|filing|lawsuit|motion|brief/,
      medical: /medical|doctor|patient|appointment|prescription|diagnosis|treatment|health|clinic|hospital/,
      business: /business|client|meeting|project|proposal|contract|deadline|sales|marketing|finance/,
      education: /student|class|assignment|grade|curriculum|school|university|teacher|professor/,
      realestate: /property|listing|buyer|seller|closing|inspection|mortgage|realtor|mls/,
      finance: /investment|portfolio|tax|audit|financial|accounting|budget|expense|revenue/,
    };

    for (const [industry, pattern] of Object.entries(industryPatterns)) {
      if (pattern.test(description)) {
        return industry;
      }
    }
    
    return 'universal'; // Default to universal if no specific industry detected
  }

  /**
   * 🔍 Extract keywords from voice description
   */
  private extractKeywords(description: string): string[] {
    const keywords: string[] = [];
    
    // Common automation keywords
    const keywordPatterns = [
      /hearing/g,
      /deadline/g,
      /appointment/g,
      /meeting/g,
      /urgent/g,
      /important/g,
      /wcab/g,
      /court/g,
      /doctor/g,
      /client/g,
      /schedule/g,
      /reminder/g,
      /follow.?up/g,
      /task/g,
      /calendar/g,
      /email/g,
    ];

    keywordPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    });

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * ⚡ Extract actions from voice description
   */
  private extractActions(description: string): string[] {
    const actions: string[] = [];
    
    const actionPatterns = {
      'create_calendar_event': /create.*calendar|schedule.*event|add.*calendar|calendar.*event/,
      'create_task': /create.*task|add.*task|task|remind|follow.?up/,
      'send_email': /send.*email|email.*notification|notify|alert/,
      'tag_email': /tag|label|categorize|organize/,
      'move_to_folder': /move.*folder|organize.*folder|file|archive/,
      'extract_info': /extract|find|search|analyze|process/,
      'generate_document': /create.*document|generate.*document|draft|write/,
      'set_reminder': /remind|reminder|alert|notification/,
    };

    for (const [action, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(description)) {
        actions.push(action);
      }
    }

    return actions;
  }

  /**
   * 🤖 Select appropriate agents based on industry and requirements
   */
  private selectAgents(industry: string, keywords: string[], actions: string[]): UniversalAgentType[] {
    const agents: UniversalAgentType[] = [];

    // Always include core processing agents
    agents.push(UniversalAgentType.EMAIL_PROCESSOR);

    // Add industry-specific agents
    switch (industry) {
      case 'legal':
        agents.push(UniversalAgentType.LEGAL_AGENT);
        break;
      case 'medical':
        agents.push(UniversalAgentType.MEDICAL_AGENT);
        break;
      case 'business':
        agents.push(UniversalAgentType.BUSINESS_AGENT);
        break;
      case 'finance':
        agents.push(UniversalAgentType.FINANCE_AGENT);
        break;
    }

    // Add action-specific agents
    if (actions.includes('create_calendar_event') || keywords.includes('schedule')) {
      agents.push(UniversalAgentType.CALENDAR_AGENT);
    }
    
    if (actions.includes('create_task') || actions.includes('set_reminder')) {
      agents.push(UniversalAgentType.TASK_AGENT);
    }

    if (actions.includes('generate_document')) {
      agents.push(UniversalAgentType.DOCUMENT_AGENT);
    }

    if (actions.includes('tag_email') || actions.includes('move_to_folder')) {
      agents.push(UniversalAgentType.FOLDER_ORGANIZER);
    }

    return [...new Set(agents)]; // Remove duplicates
  }

  /**
   * 📋 Generate automation rules from voice description
   */
  private generateRules(description: string, keywords: string[], actions: string[]): AgentRule[] {
    const rules: AgentRule[] = [];

    // Create rules based on keywords and actions
    keywords.forEach((keyword, index) => {
      const rule: AgentRule = {
        id: `rule_${keyword}_${Date.now()}_${index}`,
        trigger: `Email contains "${keyword}"`,
        conditions: [
          `Email subject or body contains "${keyword}"`,
          'Email is not processed yet'
        ],
        actions: actions.length > 0 ? actions : ['extract_info', 'create_task'],
        priority: keywords.includes('urgent') || keywords.includes('important') ? 1 : 2
      };
      rules.push(rule);
    });

    // If no specific rules generated, create a general rule
    if (rules.length === 0) {
      rules.push({
        id: `general_rule_${Date.now()}`,
        trigger: 'Any email matching description',
        conditions: ['Email matches voice description pattern'],
        actions: actions.length > 0 ? actions : ['extract_info', 'create_task'],
        priority: 2
      });
    }

    return rules;
  }

  /**
   * 📛 Generate a descriptive name for the workflow
   */
  private generateWorkflowName(description: string, industry: string): string {
    // Extract key action words
    const actionWords = description.match(/\b(create|schedule|send|organize|process|handle|manage)\b/gi) || [];
    const objectWords = description.match(/\b(email|calendar|task|hearing|appointment|client|document)\b/gi) || [];
    
    const action = actionWords[0] || 'Process';
    const object = objectWords[0] || 'Items';
    
    return `${action} ${object} - ${industry.charAt(0).toUpperCase() + industry.slice(1)} Automation`;
  }

  /**
   * ⏱️ Estimate time savings per week
   */
  private estimateTimeSavings(ruleCount: number, actionCount: number): number {
    // Base calculation: more rules and actions = more time saved
    const baseTimeSavings = ruleCount * 15; // 15 minutes per rule per week
    const actionMultiplier = actionCount * 0.5; // Additional 30 seconds per action
    
    return Math.round(baseTimeSavings * (1 + actionMultiplier));
  }

  /**
   * 📊 Estimate success rate based on complexity
   */
  private estimateSuccessRate(industry: string, keywordCount: number): number {
    let baseSuccessRate = 85; // Base 85% success rate
    
    // Industry-specific adjustments
    const industryBonus = {
      legal: 5,   // Legal patterns are well-defined
      medical: 3, // Medical patterns are moderately defined
      business: 0, // Business patterns vary widely
      universal: -5 // Universal patterns are less specific
    };

    baseSuccessRate += industryBonus[industry as keyof typeof industryBonus] || 0;
    
    // More keywords = better pattern matching
    const keywordBonus = Math.min(keywordCount * 2, 10);
    
    return Math.min(baseSuccessRate + keywordBonus, 95);
  }

  /**
   * 🔗 Register workflow with orchestrator
   */
  private async registerWithOrchestrator(workflow: CreatedAgentWorkflow): Promise<void> {
    // In a real implementation, this would register the workflow 
    // with your orchestration system
    console.log('🤖 Registering voice-created agent workflow:', workflow);
    
    // You could store this in a database, register event listeners, etc.
  }

  /**
   * 🎯 Example voice commands this system can handle
   */
  static getExampleCommands(): string[] {
    return [
      "Create an agent that finds WCAB hearing notices and automatically schedules them in my calendar",
      "Build me an agent that processes client emails and creates follow-up tasks",
      "I want an agent that finds appointment emails from doctors and adds them to my calendar",
      "Make an agent that organizes legal emails into case folders and creates deadline reminders",
      "Create an automation that processes urgent emails and sends me notifications",
      "Build an agent that finds contract deadlines and creates calendar events with reminders",
      "I need an agent that processes medical referrals and schedules appointments",
      "Make an agent that finds project deadlines in emails and creates tasks for my team"
    ];
  }
}

// Export singleton instance
export const voiceAgentCreationService = new VoiceAgentCreationService();