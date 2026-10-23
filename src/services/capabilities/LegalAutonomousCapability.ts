/**
 * Legal Profession Autonomous Capability
 * Demonstrates the Universal Autonomous System in action for legal professionals
 */

import { AICapability, CapabilityResult } from './types';
import { 
  AutonomousAction, 
  ProfessionalContext, 
  LegalProfessionContext,
  LegalCaseType,
  ProfessionType,
  UniversalAutonomyLevel
} from '../../types/agent';

export class LegalAutonomousCapability implements AICapability {
  name = 'legal-autonomous';
  version = '1.0.0';
  description = 'Autonomous legal profession assistant with intelligent case management';

  /**
   * Detect legal-specific intents and contexts
   */
  async detectIntent(input: string, context?: any): Promise<boolean | object> {
    const legalKeywords = [
      // Legal processes
      'case', 'client', 'court', 'hearing', 'trial', 'lawsuit', 'litigation',
      'demand', 'settlement', 'discovery', 'deposition', 'motion', 'brief',
      
      // Legal documents
      'contract', 'agreement', 'complaint', 'answer', 'subpoena', 'summons',
      'affidavit', 'declaration', 'petition', 'filing', 'pleading',
      
      // Legal deadlines and procedures
      'deadline', 'statute of limitations', 'respond', 'file', 'serve',
      'extension', 'continuance', 'calendar', 'docket',
      
      // Client management
      'retainer', 'billing', 'intake', 'consultation', 'representation',
      
      // Legal research
      'precedent', 'case law', 'statute', 'regulation', 'rule', 'citation'
    ];

    const input_lower = input.toLowerCase();
    const hasLegalKeyword = legalKeywords.some(keyword => 
      input_lower.includes(keyword)
    );

    // Legal-specific patterns
    const legalPatterns = [
      /(?:schedule|set).*(?:hearing|deposition|trial)/i,
      /(?:file|serve).*(?:motion|brief|complaint|answer)/i,
      /(?:deadline|due).*(?:response|filing|discovery)/i,
      /(?:client|case).*(?:intake|consultation|update)/i,
      /(?:demand|settlement).*(?:letter|negotiation)/i,
      /(?:research|find).*(?:case law|precedent|statute)/i,
      /(?:calendar|schedule).*(?:court|hearing|meeting)/i,
      /(?:track|monitor).*(?:deadline|case|client)/i
    ];

    const hasLegalPattern = legalPatterns.some(pattern => pattern.test(input));

    if (hasLegalKeyword || hasLegalPattern) {
      return {
        confidence: hasLegalPattern ? 0.9 : 0.7,
        intent: this.classifyLegalIntent(input),
        keywords: legalKeywords.filter(keyword => input_lower.includes(keyword)),
        caseType: this.detectCaseType(input),
        urgency: this.assessUrgency(input),
        suggestedActions: this.suggestAutonomousActions(input)
      };
    }

    return false;
  }

  /**
   * Execute legal autonomous capabilities
   */
  async execute(input: string, context?: any): Promise<CapabilityResult> {
    try {
      console.log('🏛️ [LegalAutonomousCapability] Executing legal autonomous actions...');

      const intent = await this.detectIntent(input, context);
      if (!intent || typeof intent === 'boolean') {
        return {
          success: false,
          message: 'No legal intent detected',
          data: null
        };
      }

      const intentData = intent as any;
      const legalContext = this.buildLegalContext(input, context);
      
      // Generate autonomous actions based on intent
      const autonomousActions = await this.generateAutonomousActions(intentData, legalContext);
      
      // Execute high-confidence, low-risk actions automatically
      const executedActions = await this.executeApprovedActions(autonomousActions);
      
      // Prepare response with results and suggestions
      const response = this.buildResponse(intentData, executedActions, autonomousActions);

      console.log(`✅ [LegalAutonomousCapability] Executed ${executedActions.length} autonomous actions`);
      return response;
    } catch (error) {
      console.error('❌ [LegalAutonomousCapability] Execution failed:', error);
      return {
        success: false,
        message: `Legal autonomous execution failed: ${error.message}`,
        data: null
      };
    }
  }

  // ============================================================================
  // LEGAL INTELLIGENCE METHODS
  // ============================================================================

  /**
   * Classify the type of legal intent
   */
  private classifyLegalIntent(input: string): string {
    const intentClassifications = {
      'case_management': ['new case', 'case update', 'case status', 'case file'],
      'deadline_tracking': ['deadline', 'due date', 'calendar', 'schedule', 'remind'],
      'document_generation': ['draft', 'create', 'generate', 'write', 'letter', 'motion'],
      'client_communication': ['contact client', 'update client', 'call client', 'email client'],
      'court_filing': ['file', 'serve', 'submit', 'court', 'clerk'],
      'legal_research': ['research', 'precedent', 'case law', 'statute', 'rule'],
      'discovery_management': ['discovery', 'deposition', 'interrogatory', 'document request'],
      'settlement_negotiation': ['settlement', 'demand', 'negotiate', 'offer', 'mediation']
    };

    const input_lower = input.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intentClassifications)) {
      if (keywords.some(keyword => input_lower.includes(keyword))) {
        return intent;
      }
    }

    return 'general_legal';
  }

  /**
   * Detect the type of legal case
   */
  private detectCaseType(input: string): LegalCaseType {
    const caseTypePatterns = {
      [LegalCaseType.PERSONAL_INJURY]: ['personal injury', 'accident', 'injury', 'negligence'],
      [LegalCaseType.WORKERS_COMP]: ['workers comp', 'workplace injury', 'work accident', 'wcab'],
      [LegalCaseType.CRIMINAL_DEFENSE]: ['criminal', 'arrest', 'charges', 'defense', 'dui'],
      [LegalCaseType.CIVIL_LITIGATION]: ['civil', 'lawsuit', 'litigation', 'dispute'],
      [LegalCaseType.FAMILY_LAW]: ['divorce', 'custody', 'family', 'marriage', 'adoption'],
      [LegalCaseType.CORPORATE]: ['business', 'corporate', 'contract', 'commercial'],
      [LegalCaseType.IMMIGRATION]: ['immigration', 'visa', 'green card', 'deportation'],
      [LegalCaseType.BANKRUPTCY]: ['bankruptcy', 'debt', 'creditor', 'chapter']
    };

    const input_lower = input.toLowerCase();
    
    for (const [caseType, keywords] of Object.entries(caseTypePatterns)) {
      if (keywords.some(keyword => input_lower.includes(keyword))) {
        return caseType as LegalCaseType;
      }
    }

    return LegalCaseType.CIVIL_LITIGATION; // Default
  }

  /**
   * Assess urgency level of the request
   */
  private assessUrgency(input: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgencyIndicators = {
      'critical': ['emergency', 'urgent', 'asap', 'immediately', 'today', 'now'],
      'high': ['soon', 'priority', 'important', 'deadline tomorrow', 'this week'],
      'medium': ['next week', 'moderate', 'standard', 'routine'],
      'low': ['when possible', 'no rush', 'low priority', 'future']
    };

    const input_lower = input.toLowerCase();
    
    for (const [urgency, indicators] of Object.entries(urgencyIndicators)) {
      if (indicators.some(indicator => input_lower.includes(indicator))) {
        return urgency as any;
      }
    }

    return 'medium'; // Default
  }

  /**
   * Suggest autonomous actions based on input
   */
  private suggestAutonomousActions(input: string): string[] {
    const suggestions: string[] = [];
    const input_lower = input.toLowerCase();

    if (input_lower.includes('deadline') || input_lower.includes('due')) {
      suggestions.push('Create calendar reminders with buffer time');
      suggestions.push('Set up deadline tracking system');
    }

    if (input_lower.includes('client')) {
      suggestions.push('Update client file and communication log');
      suggestions.push('Schedule follow-up communications');
    }

    if (input_lower.includes('document') || input_lower.includes('draft')) {
      suggestions.push('Generate document templates');
      suggestions.push('Set up document review workflow');
    }

    if (input_lower.includes('court') || input_lower.includes('hearing')) {
      suggestions.push('Add court date to calendar with preparation reminders');
      suggestions.push('Generate preparation checklist');
    }

    return suggestions;
  }

  /**
   * Build legal professional context
   */
  private buildLegalContext(input: string, context?: any): LegalProfessionContext {
    return {
      profession: ProfessionType.LEGAL,
      caseType: this.detectCaseType(input),
      courtJurisdiction: context?.jurisdiction || 'Superior Court',
      clients: context?.clients || [],
      opponents: context?.opponents || [],
      deadlines: context?.deadlines || [],
      hearings: context?.hearings || [],
      documents: context?.documents || [],
      precedents: context?.precedents || [],
      specialization: context?.specialization,
      currentCase: context?.currentCase,
      activeProjects: context?.activeProjects || [],
      urgentItems: context?.urgentItems || [],
      clientContext: context?.clientContext,
      regulations: context?.regulations || [],
      templates: context?.templates || []
    };
  }

  /**
   * Generate autonomous actions based on legal intent
   */
  private async generateAutonomousActions(
    intent: any, 
    context: LegalProfessionContext
  ): Promise<AutonomousAction[]> {
    const actions: AutonomousAction[] = [];
    const baseId = Date.now();

    switch (intent.intent) {
      case 'deadline_tracking':
        actions.push({
          id: `legal_action_${baseId}_1`,
          type: 'create_deadline_tracker',
          description: 'Create automated deadline tracking with calendar integration',
          confidence: 0.9,
          riskLevel: 'low',
          expectedOutcome: 'Deadlines tracked with automatic reminders',
          requiredApprovals: [],
          dependencies: [],
          timeEstimate: 3,
          rollbackPossible: true,
          metadata: { caseType: context.caseType, urgency: intent.urgency }
        });
        break;

      case 'case_management':
        actions.push({
          id: `legal_action_${baseId}_2`,
          type: 'setup_case_file',
          description: 'Create comprehensive case file structure with templates',
          confidence: 0.8,
          riskLevel: 'low',
          expectedOutcome: 'Organized case file ready for work',
          requiredApprovals: [],
          dependencies: [],
          timeEstimate: 5,
          rollbackPossible: true,
          metadata: { caseType: context.caseType }
        });
        break;

      case 'client_communication':
        actions.push({
          id: `legal_action_${baseId}_3`,
          type: 'schedule_client_communication',
          description: 'Schedule and template client communication workflow',
          confidence: 0.85,
          riskLevel: 'medium',
          expectedOutcome: 'Client communication automated and tracked',
          requiredApprovals: ['user_confirmation'],
          dependencies: [],
          timeEstimate: 4,
          rollbackPossible: true,
          metadata: { urgency: intent.urgency }
        });
        break;

      case 'document_generation':
        actions.push({
          id: `legal_action_${baseId}_4`,
          type: 'generate_legal_document',
          description: 'Generate legal document from appropriate template',
          confidence: 0.75,
          riskLevel: 'medium',
          expectedOutcome: 'Draft legal document ready for review',
          requiredApprovals: ['user_confirmation'],
          dependencies: [],
          timeEstimate: 8,
          rollbackPossible: true,
          metadata: { caseType: context.caseType, documentType: 'demand_letter' }
        });
        break;

      default:
        actions.push({
          id: `legal_action_${baseId}_5`,
          type: 'legal_workflow_setup',
          description: 'Set up general legal workflow optimization',
          confidence: 0.7,
          riskLevel: 'low',
          expectedOutcome: 'Legal workflow enhanced and automated',
          requiredApprovals: [],
          dependencies: [],
          timeEstimate: 6,
          rollbackPossible: true,
          metadata: { intent: intent.intent }
        });
    }

    return actions;
  }

  /**
   * Execute approved autonomous actions
   */
  private async executeApprovedActions(actions: AutonomousAction[]): Promise<AutonomousAction[]> {
    const executed: AutonomousAction[] = [];

    for (const action of actions) {
      // Only execute low-risk actions without required approvals
      if (action.riskLevel === 'low' && action.requiredApprovals.length === 0) {
        try {
          console.log(`🤖 [LegalAutonomousCapability] Auto-executing: ${action.description}`);
          
          // Simulate action execution
          await this.simulateActionExecution(action);
          executed.push(action);
          
          console.log(`✅ [LegalAutonomousCapability] Successfully executed: ${action.type}`);
        } catch (error) {
          console.error(`❌ [LegalAutonomousCapability] Failed to execute ${action.type}:`, error);
        }
      }
    }

    return executed;
  }

  /**
   * Simulate action execution (in real implementation, this would perform actual tasks)
   */
  private async simulateActionExecution(action: AutonomousAction): Promise<void> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (action.type) {
      case 'create_deadline_tracker':
        console.log('📅 Created deadline tracking system with calendar integration');
        break;
      case 'setup_case_file':
        console.log('📁 Set up organized case file structure');
        break;
      case 'schedule_client_communication':
        console.log('📞 Scheduled client communication workflow');
        break;
      case 'generate_legal_document':
        console.log('📄 Generated legal document template');
        break;
      case 'legal_workflow_setup':
        console.log('⚙️ Optimized legal workflow processes');
        break;
    }
  }

  /**
   * Build comprehensive response
   */
  private buildResponse(
    intent: any, 
    executedActions: AutonomousAction[], 
    allActions: AutonomousAction[]
  ): CapabilityResult {
    const pendingActions = allActions.filter(action => 
      !executedActions.includes(action)
    );

    let message = `🏛️ **Legal Autonomous Assistant Activated**\n\n`;
    
    if (executedActions.length > 0) {
      message += `**✅ Automatically Completed (${executedActions.length} actions):**\n`;
      executedActions.forEach(action => {
        message += `• ${action.description}\n`;
      });
      message += '\n';
    }

    if (pendingActions.length > 0) {
      message += `**🔄 Ready for Approval (${pendingActions.length} actions):**\n`;
      pendingActions.forEach(action => {
        message += `• ${action.description} (${action.riskLevel} risk)\n`;
      });
      message += '\n';
    }

    if (intent.suggestedActions && intent.suggestedActions.length > 0) {
      message += `**💡 Additional Suggestions:**\n`;
      intent.suggestedActions.forEach((suggestion: string) => {
        message += `• ${suggestion}\n`;
      });
    }

    return {
      success: true,
      message,
      data: {
        intent: intent.intent,
        caseType: intent.caseType,
        urgency: intent.urgency,
        executedActions: executedActions.length,
        pendingActions: pendingActions.length,
        autonomouslyCompleted: executedActions.map(a => a.type),
        awaitingApproval: pendingActions.map(a => ({ type: a.type, risk: a.riskLevel }))
      },
      navigationTriggered: false
    };
  }
}