/**
 * 🔮 Email Agent Watcher - Real-time Email Processing Engine
 * 
 * Monitors emails and triggers intelligent agent workflows across all industries
 * Built following URENO principle with comprehensive testing capability
 */

import { EmailMessage } from '../types';
import { 
  EmailAgentRule, 
  IndustryProfile, 
  INDUSTRY_PROFILES, 
  UniversalAgentType,
  AgentExecutionStep,
  selectOptimalAgents
} from './UniversalEmailAgentSystem';
import { WorkflowOrchestrator } from '../../WorkflowOrchestrator';
import { EmailProcessor } from '../../integration/EmailProcessor';
import { EventEmitter } from 'events';

export interface EmailAgentWatcherConfig {
  enableRealTimeProcessing: boolean;
  batchSize: number;
  processingInterval: number; // milliseconds
  maxConcurrentRules: number;
  enableLearning: boolean;
  defaultIndustry: string;
}

export interface AgentExecutionResult {
  ruleId: string;
  emailId: string;
  agentResults: Map<UniversalAgentType, any>;
  executionTime: number;
  success: boolean;
  errors: string[];
  performance: {
    totalTime: number;
    agentTimes: Map<UniversalAgentType, number>;
    memoryUsage?: number;
  };
}

export interface RulePerformanceMetrics {
  ruleId: string;
  executions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted: Date;
  errorCount: number;
  impactScore: number; // 0-100, how much value this rule provides
}

export class EmailAgentWatcher extends EventEmitter {
  private rules: Map<string, EmailAgentRule> = new Map();
  private config: EmailAgentWatcherConfig;
  private orchestrator: WorkflowOrchestrator;
  private emailProcessor: EmailProcessor;
  private activeExecutions: Map<string, Promise<AgentExecutionResult>> = new Map();
  private performanceMetrics: Map<string, RulePerformanceMetrics> = new Map();
  private processingQueue: EmailMessage[] = [];
  private isProcessing = false;
  
  constructor(
    config: Partial<EmailAgentWatcherConfig> = {},
    orchestrator: WorkflowOrchestrator,
    emailProcessor: EmailProcessor
  ) {
    super();
    
    this.config = {
      enableRealTimeProcessing: true,
      batchSize: 5,
      processingInterval: 2000,
      maxConcurrentRules: 10,
      enableLearning: true,
      defaultIndustry: 'legal',
      ...config
    };
    
    this.orchestrator = orchestrator;
    this.emailProcessor = emailProcessor;
    
    this.initializeDefaultRules();
    this.startProcessingLoop();
  }

  /**
   * 📧 Process new email with all applicable rules
   */
  async processEmail(email: EmailMessage): Promise<AgentExecutionResult[]> {
    console.log(`🔮 EmailAgentWatcher: Processing email "${email.subject}"`);
    
    if (this.config.enableRealTimeProcessing) {
      return await this.processEmailImmediate(email);
    } else {
      this.processingQueue.push(email);
      return [];
    }
  }

  /**
   * ⚡ Immediate processing for real-time mode
   */
  private async processEmailImmediate(email: EmailMessage): Promise<AgentExecutionResult[]> {
    const startTime = Date.now();
    const applicableRules = this.findApplicableRules(email);
    const results: AgentExecutionResult[] = [];
    
    console.log(`📋 Found ${applicableRules.length} applicable rules for email: ${email.subject}`);
    
    // Process rules in parallel (up to max concurrent)
    const rulePromises = applicableRules
      .slice(0, this.config.maxConcurrentRules)
      .map(rule => this.executeRule(rule, email));
    
    try {
      const ruleResults = await Promise.allSettled(rulePromises);
      
      ruleResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          this.updatePerformanceMetrics(applicableRules[index].id, result.value);
        } else {
          console.error(`❌ Rule execution failed:`, result.reason);
          this.recordRuleError(applicableRules[index].id, result.reason);
        }
      });
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Email processing completed in ${totalTime}ms with ${results.length} successful executions`);
      
      // Emit processing complete event
      this.emit('emailProcessed', {
        email,
        results,
        totalTime,
        rulesExecuted: applicableRules.length
      });
      
      // Learning: Update rule effectiveness
      if (this.config.enableLearning) {
        this.updateRuleLearning(email, applicableRules, results);
      }
      
    } catch (error) {
      console.error(`❌ Email processing error:`, error);
      this.emit('processingError', { email, error });
    }
    
    return results;
  }

  /**
   * 🔍 Find rules that should trigger for this email
   */
  private findApplicableRules(email: EmailMessage): EmailAgentRule[] {
    const applicable: EmailAgentRule[] = [];
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      if (this.evaluateRuleTriggers(rule, email)) {
        applicable.push(rule);
      }
    }
    
    // Sort by priority (higher priority first)
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 🎯 Evaluate if rule triggers should fire for email
   */
  private evaluateRuleTriggers(rule: EmailAgentRule, email: EmailMessage): boolean {
    const { triggers, conditions } = rule;
    
    // Check basic triggers
    const triggerResults = {
      keywords: this.checkKeywordTriggers(triggers.keywords, email),
      senders: this.checkSenderTriggers(triggers.senderPatterns, email),
      subjects: this.checkSubjectTriggers(triggers.subjectPatterns, email), 
      content: this.checkContentTriggers(triggers.contentPatterns, email),
      urgency: this.checkUrgencyTriggers(triggers.urgencyLevels, email),
      attachments: this.checkAttachmentTriggers(triggers.attachmentTypes, email),
      timeRange: this.checkTimeRangeTriggers(triggers.timeRanges, email)
    };
    
    // Basic trigger evaluation (OR logic for trigger types)
    const basicTriggered = Object.values(triggerResults).some(result => result);
    
    if (!basicTriggered) {
      return false;
    }
    
    // Evaluate advanced conditions if present
    if (conditions && conditions.rules.length > 0) {
      return this.evaluateConditions(conditions, email);
    }
    
    return true;
  }

  /**
   * ⚙️ Execute a specific rule for an email
   */
  private async executeRule(rule: EmailAgentRule, email: EmailMessage): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const executionId = `${rule.id}-${email.id}-${Date.now()}`;
    
    console.log(`🚀 Executing rule "${rule.name}" for email: ${email.subject}`);
    
    const result: AgentExecutionResult = {
      ruleId: rule.id,
      emailId: email.id,
      agentResults: new Map(),
      executionTime: 0,
      success: false,
      errors: [],
      performance: {
        totalTime: 0,
        agentTimes: new Map(),
        memoryUsage: process.memoryUsage?.()?.heapUsed
      }
    };
    
    try {
      // Execute organize actions first
      if (rule.actions.organize) {
        await this.executeOrganizeActions(rule.actions.organize, email, result);
      }
      
      // Execute agent workflows
      if (rule.actions.agents) {
        await this.executeAgentWorkflows(rule.actions.agents, email, result, rule.industryId);
      }
      
      // Execute integrations
      if (rule.actions.integrate) {
        await this.executeIntegrations(rule.actions.integrate, email, result);
      }
      
      // Execute content generation
      if (rule.actions.generate) {
        await this.executeContentGeneration(rule.actions.generate, email, result);
      }
      
      // Execute workflow actions
      if (rule.actions.workflow) {
        await this.executeWorkflowActions(rule.actions.workflow, email, result);
      }
      
      result.success = result.errors.length === 0;
      result.executionTime = Date.now() - startTime;
      result.performance.totalTime = result.executionTime;
      
      console.log(`✅ Rule "${rule.name}" executed successfully in ${result.executionTime}ms`);
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.success = false;
      result.executionTime = Date.now() - startTime;
      
      console.error(`❌ Rule "${rule.name}" execution failed:`, error);
    }
    
    return result;
  }

  /**
   * 📁 Execute email organization actions
   */
  private async executeOrganizeActions(organizeConfig: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    const agentStartTime = Date.now();
    
    try {
      if (organizeConfig.createFolder) {
        // Create folder if it doesn't exist
        await this.createFolderIfNotExists(organizeConfig.createFolder, email);
        result.agentResults.set(UniversalAgentType.FOLDER_ORGANIZER, {
          action: 'folder_created',
          folder: organizeConfig.createFolder
        });
      }
      
      if (organizeConfig.moveToFolder) {
        // Move email to specified folder
        await this.moveEmailToFolder(email, organizeConfig.moveToFolder);
        result.agentResults.set(UniversalAgentType.FOLDER_ORGANIZER, {
          action: 'email_moved',
          folder: organizeConfig.moveToFolder
        });
      }
      
      if (organizeConfig.applyTags) {
        // Apply tags to email
        await this.applyTagsToEmail(email, organizeConfig.applyTags);
        result.agentResults.set(UniversalAgentType.TAG_MANAGER, {
          action: 'tags_applied',
          tags: organizeConfig.applyTags
        });
      }
      
      if (organizeConfig.setPriority) {
        // Set email priority
        await this.setEmailPriority(email, organizeConfig.setPriority);
        result.agentResults.set(UniversalAgentType.PRIORITY_CLASSIFIER, {
          action: 'priority_set',
          priority: organizeConfig.setPriority
        });
      }
      
    } catch (error) {
      result.errors.push(`Organization action failed: ${error}`);
    }
    
    result.performance.agentTimes.set(UniversalAgentType.FOLDER_ORGANIZER, Date.now() - agentStartTime);
  }

  /**
   * 🤖 Execute multi-agent workflows
   */
  private async executeAgentWorkflows(agentConfig: any, email: EmailMessage, result: AgentExecutionResult, industryId: string): Promise<void> {
    const industry = INDUSTRY_PROFILES.find(i => i.id === industryId) || INDUSTRY_PROFILES[0];
    
    // Execute sequential agents
    if (agentConfig.sequence) {
      for (const step of agentConfig.sequence) {
        await this.executeAgentStep(step, email, result, industry);
      }
    }
    
    // Execute parallel agents
    if (agentConfig.parallel) {
      const parallelPromises = agentConfig.parallel.map((step: AgentExecutionStep) =>
        this.executeAgentStep(step, email, result, industry)
      );
      await Promise.allSettled(parallelPromises);
    }
    
    // Execute conditional agents
    if (agentConfig.conditional) {
      for (const conditionalStep of agentConfig.conditional) {
        const conditionMet = this.evaluateConditions(conditionalStep.condition, email);
        const stepsToExecute = conditionMet ? conditionalStep.thenAgents : conditionalStep.elseAgents;
        
        if (stepsToExecute) {
          for (const step of stepsToExecute) {
            await this.executeAgentStep(step, email, result, industry);
          }
        }
      }
    }
  }

  /**
   * 🎯 Execute individual agent step
   */
  private async executeAgentStep(
    step: AgentExecutionStep, 
    email: EmailMessage, 
    result: AgentExecutionResult,
    industry: IndustryProfile
  ): Promise<void> {
    const agentStartTime = Date.now();
    
    try {
      console.log(`🤖 Executing agent: ${step.agentType} with instruction: ${step.instruction}`);
      
      // Execute agent through orchestrator
      const agentResult = await this.orchestrator.executeAction(
        this.mapAgentTypeToOrchestratorType(step.agentType),
        'process',
        {
          email,
          instruction: step.instruction,
          industry: industry.id,
          timeout: step.timeout,
          context: result.agentResults
        }
      );
      
      result.agentResults.set(step.agentType, agentResult);
      
      console.log(`✅ Agent ${step.agentType} completed successfully`);
      
    } catch (error) {
      result.errors.push(`Agent ${step.agentType} failed: ${error}`);
      console.error(`❌ Agent ${step.agentType} execution failed:`, error);
    }
    
    result.performance.agentTimes.set(step.agentType, Date.now() - agentStartTime);
  }

  /**
   * 🔗 Execute integration actions (calendar, tasks, etc.)
   */
  private async executeIntegrations(integrateConfig: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    // Calendar integration
    if (integrateConfig.calendar) {
      await this.executeCalendarIntegration(integrateConfig.calendar, email, result);
    }
    
    // Task integration  
    if (integrateConfig.tasks) {
      await this.executeTaskIntegration(integrateConfig.tasks, email, result);
    }
    
    // Document integration
    if (integrateConfig.documents) {
      await this.executeDocumentIntegration(integrateConfig.documents, email, result);
    }
    
    // CRM integration
    if (integrateConfig.crm) {
      await this.executeCRMIntegration(integrateConfig.crm, email, result);
    }
    
    // Notifications
    if (integrateConfig.notifications) {
      await this.executeNotifications(integrateConfig.notifications, email, result);
    }
  }

  // Rule Management Methods
  
  /**
   * ➕ Add or update email agent rule
   */
  addRule(rule: EmailAgentRule): void {
    this.rules.set(rule.id, rule);
    this.initializeRuleMetrics(rule.id);
    this.emit('ruleAdded', rule);
  }

  /**
   * ❌ Remove email agent rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    this.performanceMetrics.delete(ruleId);
    if (removed) {
      this.emit('ruleRemoved', ruleId);
    }
    return removed;
  }

  /**
   * 📊 Get rule performance metrics
   */
  getRuleMetrics(ruleId?: string): RulePerformanceMetrics | RulePerformanceMetrics[] {
    if (ruleId) {
      return this.performanceMetrics.get(ruleId) || this.createDefaultMetrics(ruleId);
    }
    
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * 🎯 Get rules for specific industry
   */
  getRulesByIndustry(industryId: string): EmailAgentRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.industryId === industryId);
  }

  /**
   * 🧪 Test rule against sample emails
   */
  async testRule(rule: EmailAgentRule, testEmails: EmailMessage[]): Promise<any> {
    const results = {
      ruleId: rule.id,
      testCount: testEmails.length,
      triggered: 0,
      results: [] as any[]
    };
    
    for (const email of testEmails) {
      const triggered = this.evaluateRuleTriggers(rule, email);
      if (triggered) {
        results.triggered++;
        // Dry run execution (no actual actions)
        const dryRunResult = await this.simulateRuleExecution(rule, email);
        results.results.push(dryRunResult);
      }
    }
    
    return results;
  }

  // Private Helper Methods
  
  private initializeDefaultRules(): void {
    // Create default rules for each industry
    INDUSTRY_PROFILES.forEach(industry => {
      const defaultRule: EmailAgentRule = {
        id: `default-${industry.id}`,
        name: `Default ${industry.displayName} Processing`,
        description: `Automatic processing for ${industry.displayName} emails`,
        industryId: industry.id,
        priority: 50,
        triggers: {
          keywords: industry.keywords,
          senderPatterns: [],
          subjectPatterns: [],
          contentPatterns: industry.keywords.map(k => `\\b${k}\\b`),
          urgencyLevels: ['high', 'medium', 'low']
        },
        conditions: {
          logic: 'OR',
          rules: []
        },
        actions: {
          organize: {
            createFolder: industry.displayName,
            applyTags: [industry.name]
          },
          agents: {
            sequence: selectOptimalAgents(
              {} as EmailMessage, 
              industry, 
              Object.values(UniversalAgentType)
            )
          }
        },
        enabled: true,
        performance: {
          executionCount: 0,
          successRate: 0,
          averageExecutionTime: 0,
          errorHistory: []
        }
      };
      
      this.addRule(defaultRule);
    });
  }

  private startProcessingLoop(): void {
    if (!this.config.enableRealTimeProcessing) {
      setInterval(() => {
        this.processBatch();
      }, this.config.processingInterval);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.processingQueue.splice(0, this.config.batchSize);
    
    try {
      const batchPromises = batch.map(email => this.processEmailImmediate(email));
      await Promise.allSettled(batchPromises);
    } finally {
      this.isProcessing = false;
    }
  }

  // Trigger evaluation methods (simplified for brevity)
  private checkKeywordTriggers(keywords: string[], email: EmailMessage): boolean {
    const content = `${email.subject} ${email.body}`.toLowerCase();
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  private checkSenderTriggers(patterns: string[], email: EmailMessage): boolean {
    if (!patterns.length) return true;
    const sender = email.from?.toString().toLowerCase() || '';
    return patterns.some(pattern => new RegExp(pattern, 'i').test(sender));
  }

  private checkSubjectTriggers(patterns: string[], email: EmailMessage): boolean {
    if (!patterns.length) return true;
    const subject = email.subject?.toLowerCase() || '';
    return patterns.some(pattern => new RegExp(pattern, 'i').test(subject));
  }

  private checkContentTriggers(patterns: string[], email: EmailMessage): boolean {
    if (!patterns.length) return true;
    const content = email.body?.toLowerCase() || '';
    return patterns.some(pattern => new RegExp(pattern, 'i').test(content));
  }

  private checkUrgencyTriggers(levels: string[], email: EmailMessage): boolean {
    // Implement urgency detection logic
    return true; // Simplified
  }

  private checkAttachmentTriggers(types: string[] | undefined, email: EmailMessage): boolean {
    if (!types || !types.length) return true;
    // Check attachment types
    return true; // Simplified
  }

  private checkTimeRangeTriggers(ranges: any[] | undefined, email: EmailMessage): boolean {
    if (!ranges || !ranges.length) return true;
    // Check if current time is in range
    return true; // Simplified
  }

  private evaluateConditions(conditions: any, email: EmailMessage): boolean {
    // Implement condition evaluation logic
    return true; // Simplified
  }

  private mapAgentTypeToOrchestratorType(agentType: UniversalAgentType): string {
    const mapping: Record<UniversalAgentType, string> = {
      [UniversalAgentType.EMAIL_PROCESSOR]: 'email',
      [UniversalAgentType.CALENDAR_AGENT]: 'calendar', 
      [UniversalAgentType.TASK_AGENT]: 'task',
      [UniversalAgentType.DOCUMENT_AGENT]: 'document',
      [UniversalAgentType.LEGAL_AGENT]: 'legal',
      [UniversalAgentType.MEDICAL_AGENT]: 'medical',
      // Add more mappings as needed
    } as any;
    
    return mapping[agentType] || 'email';
  }

  // Placeholder methods for integration actions
  private async createFolderIfNotExists(folderName: string, email: EmailMessage): Promise<void> {
    console.log(`📁 Creating folder: ${folderName}`);
  }

  private async moveEmailToFolder(email: EmailMessage, folder: string): Promise<void> {
    console.log(`➡️ Moving email to folder: ${folder}`);
  }

  private async applyTagsToEmail(email: EmailMessage, tags: string[]): Promise<void> {
    console.log(`🏷️ Applying tags: ${tags.join(', ')}`);
  }

  private async setEmailPriority(email: EmailMessage, priority: string): Promise<void> {
    console.log(`⭐ Setting priority: ${priority}`);
  }

  private async executeCalendarIntegration(config: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`📅 Calendar integration`);
  }

  private async executeTaskIntegration(config: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`✅ Task integration`);
  }

  private async executeDocumentIntegration(config: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`📄 Document integration`);
  }

  private async executeCRMIntegration(config: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`👥 CRM integration`);
  }

  private async executeNotifications(config: any[], email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`🔔 Notifications`);
  }

  private async executeContentGeneration(config: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`📝 Content generation`);
  }

  private async executeWorkflowActions(config: any, email: EmailMessage, result: AgentExecutionResult): Promise<void> {
    console.log(`🔄 Workflow actions`);
  }

  private updatePerformanceMetrics(ruleId: string, result: AgentExecutionResult): void {
    let metrics = this.performanceMetrics.get(ruleId);
    if (!metrics) {
      metrics = this.createDefaultMetrics(ruleId);
      this.performanceMetrics.set(ruleId, metrics);
    }
    
    metrics.executions++;
    metrics.lastExecuted = new Date();
    
    if (result.success) {
      const newSuccessRate = ((metrics.successRate * (metrics.executions - 1)) + 100) / metrics.executions;
      metrics.successRate = newSuccessRate;
    }
    
    const newAvgTime = ((metrics.averageExecutionTime * (metrics.executions - 1)) + result.executionTime) / metrics.executions;
    metrics.averageExecutionTime = newAvgTime;
  }

  private recordRuleError(ruleId: string, error: any): void {
    let metrics = this.performanceMetrics.get(ruleId);
    if (!metrics) {
      metrics = this.createDefaultMetrics(ruleId);
      this.performanceMetrics.set(ruleId, metrics);
    }
    
    metrics.errorCount++;
    metrics.executions++;
    
    const newSuccessRate = ((metrics.successRate * (metrics.executions - 1)) + 0) / metrics.executions;
    metrics.successRate = newSuccessRate;
  }

  private updateRuleLearning(email: EmailMessage, rules: EmailAgentRule[], results: AgentExecutionResult[]): void {
    // Implement machine learning to improve rule effectiveness
    console.log(`🧠 Learning from ${rules.length} rules and ${results.length} results`);
  }

  private async simulateRuleExecution(rule: EmailAgentRule, email: EmailMessage): Promise<any> {
    // Simulate rule execution without performing actual actions
    return {
      ruleId: rule.id,
      emailId: email.id,
      wouldTrigger: true,
      estimatedActions: Object.keys(rule.actions).length
    };
  }

  private createDefaultMetrics(ruleId: string): RulePerformanceMetrics {
    return {
      ruleId,
      executions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      lastExecuted: new Date(),
      errorCount: 0,
      impactScore: 0
    };
  }

  private initializeRuleMetrics(ruleId: string): void {
    if (!this.performanceMetrics.has(ruleId)) {
      this.performanceMetrics.set(ruleId, this.createDefaultMetrics(ruleId));
    }
  }

  /**
   * 🧹 Cleanup and shutdown
   */
  destroy(): void {
    this.removeAllListeners();
    this.rules.clear();
    this.performanceMetrics.clear();
    this.activeExecutions.clear();
    this.processingQueue.length = 0;
  }
}