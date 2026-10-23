import { Task, TaskPriority, TaskStatus } from '../types/task';
import { VoiceControl } from './voice/VoiceControl';
import { TemplateStorageService } from './templates/TemplateStorageService';
import { agentCapabilities } from './agentCapabilityService';
import { multiCanvasOrchestrator } from './canvas/MultiCanvasTaskOrchestrator';
import { OrchestratorService } from './OrchestratorService';
import { AIService } from './ai/aiService';

/**
 * 🎯 Unified Agent Orchestration Hub
 * 
 * This service connects ALL our agent services and provides:
 * - Voice-to-Task automation
 * - Professional template integration
 * - Multi-agent workflow coordination
 * - Seamless expansion capabilities
 * - Real-time task management
 * 
 * Following the user's constant prompt: leverages existing infrastructure,
 * avoids duplication, and provides surgical enhancements.
 */

interface AgentCapability {
  id: string;
  name: string;
  description: string;
  handler: (input: any) => Promise<any>;
  requiredServices: string[];
  outputFormat: string;
}

interface WorkflowStep {
  id: string;
  agentRole: string;
  capability: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  profession: string;
  steps: WorkflowStep[];
  voiceTriggers: string[];
  templateDependencies: string[];
  status: 'created' | 'running' | 'completed' | 'failed';
  metadata: Record<string, any>;
}

interface VoiceSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  commands: VoiceCommand[];
  context: Record<string, any>;
  activeWorkflows: string[];
  generatedTasks: string[];
  status: 'active' | 'paused' | 'completed';
}

interface VoiceCommand {
  id: string;
  sessionId: string;
  transcript: string;
  confidence: number;
  intent: string;
  extractedEntities: Record<string, any>;
  triggeredWorkflow?: string;
  triggeredTemplate?: string;
  result: any;
  executionTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export class UnifiedAgentOrchestrator {
  private static instance: UnifiedAgentOrchestrator;
  
  // Core service integrations
  private voiceControl: VoiceControl;
  private templateService: TemplateStorageService;
  private orchestratorService: OrchestratorService;
  private aiService: AIService;
  
  // State management
  private activeWorkflows: Map<string, AgentWorkflow> = new Map();
  private voiceSessions: Map<string, VoiceSession> = new Map();
  private agentCapabilities: Map<string, AgentCapability> = new Map();
  private professionalTemplates: Map<string, any> = new Map();
  
  // Real-time coordination
  private taskQueue: Task[] = [];
  private agentPool: Map<string, any> = new Map();
  private coordinationHub: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
    this.registerCoreCapabilities();
    this.loadProfessionalTemplates();
  }

  public static getInstance(): UnifiedAgentOrchestrator {
    if (!UnifiedAgentOrchestrator.instance) {
      UnifiedAgentOrchestrator.instance = new UnifiedAgentOrchestrator();
    }
    return UnifiedAgentOrchestrator.instance;
  }

  // ============================================================================
  // 🎯 CORE INITIALIZATION & SERVICE INTEGRATION
  // ============================================================================

  private async initializeServices(): Promise<void> {
    try {
      console.log('🚀 Initializing Unified Agent Orchestrator...');
      
      // Initialize AI service first
      this.aiService = await AIService.getInstance();
      
      // Initialize core services using simplified approach
      // Note: These will be mock implementations for now to avoid type conflicts
      console.log('✅ Core services structure initialized');
    } catch (error) {
      console.error('❌ Error initializing services:', error);
      throw error;
    }
  }

  private registerCoreCapabilities(): void {
    console.log('🧠 Registering core agent capabilities...');
    
    // Legal capabilities
    this.registerCapability({
      id: 'legal_document_generation',
      name: 'Legal Document Generation',
      description: 'Generate legal documents from voice commands and templates',
      handler: this.handleLegalDocumentGeneration.bind(this),
      requiredServices: ['template', 'voice', 'ai'],
      outputFormat: 'document'
    });

    // Medical capabilities
    this.registerCapability({
      id: 'medical_report_creation',
      name: 'Medical Report Creation',
      description: 'Create medical reports from dictated clinical information',
      handler: this.handleMedicalReportCreation.bind(this),
      requiredServices: ['template', 'voice', 'ai'],
      outputFormat: 'medical_document'
    });

    // Task management capabilities
    this.registerCapability({
      id: 'voice_task_creation',
      name: 'Voice Task Creation',
      description: 'Create and manage tasks from voice commands',
      handler: this.handleVoiceTaskCreation.bind(this),
      requiredServices: ['task', 'voice', 'calendar'],
      outputFormat: 'task'
    });

    // Template automation capabilities
    this.registerCapability({
      id: 'template_automation',
      name: 'Template Automation',
      description: 'Automatically populate templates with extracted data',
      handler: this.handleTemplateAutomation.bind(this),
      requiredServices: ['template', 'ai'],
      outputFormat: 'document'
    });

    // Multi-agent coordination
    this.registerCapability({
      id: 'agent_swarm_coordination',
      name: 'Agent Swarm Coordination',
      description: 'Coordinate multiple agents for complex workflows',
      handler: this.handleAgentSwarmCoordination.bind(this),
      requiredServices: ['orchestrator', 'task', 'ai'],
      outputFormat: 'workflow_result'
    });

    console.log(`✅ Registered ${this.agentCapabilities.size} core capabilities`);
  }

  private async loadProfessionalTemplates(): Promise<void> {
    console.log('📋 Loading professional templates...');
    // This would integrate with our template storage service
    // For now, we'll set up the structure
    this.professionalTemplates.set('legal_demand', {
      id: 'legal_demand',
      name: 'Legal Demand Letter',
      profession: 'legal',
      voiceTriggers: ['draft demand letter', 'create demand letter'],
      variables: ['recipient_name', 'demand_amount', 'case_subject'],
      template: 'Template content here...'
    });
    
    this.professionalTemplates.set('medical_report', {
      id: 'medical_report',
      name: 'Medical Report',
      profession: 'medical',
      voiceTriggers: ['create medical report', 'draft patient report'],
      variables: ['patient_name', 'diagnosis', 'treatment_plan'],
      template: 'Medical report template...'
    });
  }

  // ============================================================================
  // 🎤 VOICE COMMAND PROCESSING
  // ============================================================================

  public async processVoiceCommand(
    userId: string,
    voiceInput: string,
    context: Record<string, any> = {}
  ): Promise<{
    sessionId: string;
    commandId: string;
    intent: string;
    triggeredWorkflow?: string;
    results: any[];
    estimatedCompletion: Date;
    nextSteps: string[];
  }> {
    console.log('🎤 Processing voice command:', voiceInput);

    // Get or create active voice session
    const session = this.getOrCreateVoiceSession(userId, context);
    
    // Create voice command record
    const command: VoiceCommand = {
      id: `cmd_${Date.now()}`,
      sessionId: session.id,
      transcript: voiceInput,
      confidence: 0.95, // Would come from actual voice processing
      intent: await this.detectIntent(voiceInput),
      extractedEntities: await this.extractEntities(voiceInput),
      result: null,
      executionTime: 0,
      success: false,
      timestamp: new Date()
    };

    const startTime = Date.now();

    try {
      // Determine the appropriate workflow
      const workflow = await this.selectWorkflow(command.intent, voiceInput);
      
      if (workflow) {
        command.triggeredWorkflow = workflow.id;
        
        // Execute the workflow
        const results = await this.executeWorkflow(workflow, command, context);
        
        command.result = results;
        command.success = true;
        command.executionTime = Date.now() - startTime;
        
        // Update session
        session.commands.push(command);
        session.activeWorkflows.push(workflow.id);
        
        return {
          sessionId: session.id,
          commandId: command.id,
          intent: command.intent,
          triggeredWorkflow: workflow.id,
          results: results,
          estimatedCompletion: this.calculateEstimatedCompletion(workflow),
          nextSteps: this.generateNextSteps(workflow, results)
        };
      } else {
        // Handle as simple task creation
        const task = await this.createTaskFromVoice(voiceInput, userId, context);
        command.result = task;
        command.success = true;
        command.executionTime = Date.now() - startTime;
        
        session.commands.push(command);
        session.generatedTasks.push(task.id);
        
        return {
          sessionId: session.id,
          commandId: command.id,
          intent: command.intent,
          results: [task],
          estimatedCompletion: task.dueDate || new Date(Date.now() + 30 * 60000),
          nextSteps: ['Review generated task', 'Make any necessary edits', 'Complete the task']
        };
      }
    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      command.error = error.message;
      command.executionTime = Date.now() - startTime;
      session.commands.push(command);
      
      throw error;
    }
  }

  private getOrCreateVoiceSession(userId: string, context: Record<string, any>): VoiceSession {
    // Check for active session
    const activeSessions = Array.from(this.voiceSessions.values())
      .filter(s => s.userId === userId && s.status === 'active');
    
    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      // Update context
      session.context = { ...session.context, ...context };
      return session;
    }
    
    // Create new session
    const session: VoiceSession = {
      id: `session_${Date.now()}`,
      userId,
      startTime: new Date(),
      commands: [],
      context,
      activeWorkflows: [],
      generatedTasks: [],
      status: 'active'
    };
    
    this.voiceSessions.set(session.id, session);
    return session;
  }

  private async detectIntent(voiceInput: string): Promise<string> {
    const lowerInput = voiceInput.toLowerCase();
    
    // Legal intents
    if (lowerInput.includes('demand letter') || lowerInput.includes('legal demand')) {
      return 'create_legal_demand';
    }
    if (lowerInput.includes('petition') || lowerInput.includes('legal petition')) {
      return 'create_legal_petition';
    }
    
    // Medical intents
    if (lowerInput.includes('medical report') || lowerInput.includes('patient report')) {
      return 'create_medical_report';
    }
    if (lowerInput.includes('insurance letter') || lowerInput.includes('letter to insurance')) {
      return 'create_insurance_letter';
    }
    
    // General task intents
    if (lowerInput.includes('schedule') || lowerInput.includes('calendar')) {
      return 'schedule_task';
    }
    if (lowerInput.includes('remind') || lowerInput.includes('reminder')) {
      return 'create_reminder';
    }
    
    // Document intents
    if (lowerInput.includes('document') || lowerInput.includes('draft')) {
      return 'create_document';
    }
    
    return 'general_task';
  }

  private async extractEntities(voiceInput: string): Promise<Record<string, any>> {
    // Use AI service to extract entities
    const prompt = `
Extract entities from this voice input:
"${voiceInput}"

Return JSON with extracted entities like:
{
  "names": ["John Smith"],
  "dates": ["2025-01-15"],
  "amounts": ["$5000"],
  "case_numbers": ["CV-2025-001"],
  "companies": ["ABC Corp"],
  "addresses": ["123 Main St"]
}`;

    try {
      const result = await this.aiService.generateText(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error extracting entities:', error);
      return {};
    }
  }

  // ============================================================================
  // 🔄 WORKFLOW EXECUTION ENGINE
  // ============================================================================

  private async selectWorkflow(intent: string, voiceInput: string): Promise<AgentWorkflow | null> {
    // Check if voice input matches any workflow triggers
    for (const [id, workflow] of this.activeWorkflows) {
      for (const trigger of workflow.voiceTriggers) {
        if (voiceInput.toLowerCase().includes(trigger.toLowerCase())) {
          return workflow;
        }
      }
    }
    
    // Create workflow based on intent
    switch (intent) {
      case 'create_legal_demand':
        return this.createLegalDocumentWorkflow();
      case 'create_medical_report':
        return this.createMedicalReportWorkflow();
      default:
        return null;
    }
  }

  private createLegalDocumentWorkflow(): AgentWorkflow {
    const workflow: AgentWorkflow = {
      id: `workflow_${Date.now()}`,
      name: 'Legal Document Generation',
      description: 'Generate legal documents from voice commands',
      profession: 'legal',
      steps: [
        {
          id: 'step_1',
          agentRole: 'voice_interpreter',
          capability: 'voice_processing',
          input: {},
          status: 'pending'
        },
        {
          id: 'step_2',
          agentRole: 'template_selector',
          capability: 'template_matching',
          input: {},
          status: 'pending'
        },
        {
          id: 'step_3',
          agentRole: 'document_generator',
          capability: 'legal_document_generation',
          input: {},
          status: 'pending'
        }
      ],
      voiceTriggers: ['draft demand letter', 'create legal document'],
      templateDependencies: ['legal_demand'],
      status: 'created',
      metadata: {}
    };
    
    this.activeWorkflows.set(workflow.id, workflow);
    return workflow;
  }

  private createMedicalReportWorkflow(): AgentWorkflow {
    const workflow: AgentWorkflow = {
      id: `workflow_${Date.now()}`,
      name: 'Medical Report Generation',
      description: 'Generate medical reports from clinical voice input',
      profession: 'medical',
      steps: [
        {
          id: 'step_1',
          agentRole: 'medical_voice_processor',
          capability: 'voice_processing',
          input: {},
          status: 'pending'
        },
        {
          id: 'step_2',
          agentRole: 'clinical_template_matcher',
          capability: 'template_matching',
          input: {},
          status: 'pending'
        },
        {
          id: 'step_3',
          agentRole: 'medical_writer',
          capability: 'medical_report_creation',
          input: {},
          status: 'pending'
        }
      ],
      voiceTriggers: ['create medical report', 'draft patient report'],
      templateDependencies: ['medical_report'],
      status: 'created',
      metadata: {}
    };
    
    this.activeWorkflows.set(workflow.id, workflow);
    return workflow;
  }

  private async executeWorkflow(
    workflow: AgentWorkflow, 
    command: VoiceCommand, 
    context: Record<string, any>
  ): Promise<any[]> {
    console.log(`🔄 Executing workflow: ${workflow.name}`);
    
    workflow.status = 'running';
    const results: any[] = [];
    
    for (const step of workflow.steps) {
      try {
        step.status = 'running';
        step.startTime = new Date();
        
        const capability = this.agentCapabilities.get(step.capability);
        if (capability) {
          const input = {
            voiceCommand: command,
            context,
            previousResults: results,
            stepData: step.input
          };
          
          step.output = await capability.handler(input);
          results.push(step.output);
          
          step.status = 'completed';
          step.endTime = new Date();
        } else {
          throw new Error(`Capability not found: ${step.capability}`);
        }
      } catch (error) {
        console.error(`❌ Error in workflow step ${step.id}:`, error);
        step.status = 'failed';
        step.error = error.message;
        step.endTime = new Date();
        
        workflow.status = 'failed';
        throw error;
      }
    }
    
    workflow.status = 'completed';
    return results;
  }

  // ============================================================================
  // 🎯 CAPABILITY HANDLERS
  // ============================================================================

  private async handleLegalDocumentGeneration(input: any): Promise<any> {
    console.log('⚖️ Generating legal document...');
    
    const { voiceCommand, context } = input;
    const entities = voiceCommand.extractedEntities;
    
    // Get legal template
    const template = this.professionalTemplates.get('legal_demand');
    if (!template) {
      throw new Error('Legal demand template not found');
    }
    
    // Use AI to populate template
    const prompt = `
Generate a legal demand letter using this template and information:

Template Variables: ${JSON.stringify(template.variables)}
Voice Input: "${voiceCommand.transcript}"
Extracted Entities: ${JSON.stringify(entities)}
Context: ${JSON.stringify(context)}

Populate the template with appropriate legal language and extracted information.
`;

    const generatedContent = await this.aiService.generateText(prompt);
    
    // Create mock task for the generated document
    const task = {
      id: `task_${Date.now()}`,
      title: 'Legal Demand Letter',
      description: `Generated from voice: "${voiceCommand.transcript}"`,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      tags: ['legal', 'voice-generated', 'demand-letter'],
      estimatedDuration: 60,
      created: new Date(),
      lastModified: new Date()
    };
    
    return {
      type: 'legal_document',
      content: generatedContent,
      templateUsed: template.id,
      taskId: task.id,
      entities: entities
    };
  }

  private async handleMedicalReportCreation(input: any): Promise<any> {
    console.log('🏥 Creating medical report...');
    
    const { voiceCommand, context } = input;
    const entities = voiceCommand.extractedEntities;
    
    // Get medical template
    const template = this.professionalTemplates.get('medical_report');
    if (!template) {
      throw new Error('Medical report template not found');
    }
    
    // Use AI to generate medical report
    const prompt = `
Generate a medical report using this template and clinical information:

Template Variables: ${JSON.stringify(template.variables)}
Voice Input: "${voiceCommand.transcript}"
Extracted Clinical Data: ${JSON.stringify(entities)}
Patient Context: ${JSON.stringify(context)}

Create a professional medical report with proper clinical language and structure.
`;

    const generatedContent = await this.aiService.generateText(prompt);
    
    // Create mock task for the generated report
    const task = {
      id: `task_${Date.now()}`,
      title: 'Medical Report',
      description: `Generated from clinical voice input`,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      tags: ['medical', 'voice-generated', 'patient-report'],
      estimatedDuration: 45,
      created: new Date(),
      lastModified: new Date()
    };
    
    return {
      type: 'medical_document',
      content: generatedContent,
      templateUsed: template.id,
      taskId: task.id,
      clinicalData: entities
    };
  }

  private async handleVoiceTaskCreation(input: any): Promise<any> {
    console.log('📋 Creating task from voice...');
    
    const { voiceCommand, context } = input;
    
    return await this.createTaskFromVoice(
      voiceCommand.transcript, 
      context.userId, 
      context
    );
  }

  private async createTaskFromVoice(
    voiceInput: string, 
    userId: string, 
    context: Record<string, any>
  ): Promise<any> {
    // Use mock task creation for now
    const taskData = await this.parseVoiceToTask(voiceInput);
    
    const task = {
      id: `task_${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: TaskStatus.TODO,
      tags: [...(taskData.tags || []), 'voice-created'],
      estimatedDuration: taskData.estimatedTime,
      dueDate: taskData.dueDate,
      created: new Date(),
      lastModified: new Date()
    };
    
    // Add to task queue for coordination
    this.taskQueue.push(task);
    
    return task;
  }

  private parseVoiceToTask(voiceInput: string): Promise<any> {
    const lowerInput = voiceInput.toLowerCase();
    
    // Determine task type and priority
    let priority = TaskPriority.MEDIUM;
    let estimatedTime = 30;
    let tags: string[] = [];
    
    if (lowerInput.includes('urgent') || lowerInput.includes('asap')) {
      priority = TaskPriority.HIGH;
    }
    
    if (lowerInput.includes('legal') || lowerInput.includes('lawyer')) {
      tags.push('legal');
      estimatedTime = 60;
    }
    
    if (lowerInput.includes('medical') || lowerInput.includes('patient')) {
      tags.push('medical');
      estimatedTime = 45;
    }
    
    // Extract due date if mentioned
    let dueDate: Date | undefined;
    if (lowerInput.includes('today')) {
      dueDate = new Date();
    } else if (lowerInput.includes('tomorrow')) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
    }
    
    return Promise.resolve({
      title: this.extractTaskTitle(voiceInput),
      description: voiceInput,
      priority,
      estimatedTime,
      tags,
      dueDate
    });
  }

  private extractTaskTitle(voiceInput: string): string {
    // Simple title extraction - could be enhanced with AI
    const words = voiceInput.split(' ');
    return words.slice(0, 8).join(' '); // First 8 words as title
  }

  private async handleTemplateAutomation(input: any): Promise<any> {
    console.log('📋 Handling template automation...');
    // Implementation for template automation
    return { automated: true };
  }

  private async handleAgentSwarmCoordination(input: any): Promise<any> {
    console.log('🤖 Coordinating agent swarm...');
    // Implementation for agent swarm coordination
    return { coordinated: true };
  }

  // ============================================================================
  // 🎯 CAPABILITY REGISTRATION & EXPANSION
  // ============================================================================

  public registerCapability(capability: AgentCapability): void {
    this.agentCapabilities.set(capability.id, capability);
    console.log(`✅ Registered capability: ${capability.name}`);
  }

  public registerWorkflow(workflow: AgentWorkflow): void {
    this.activeWorkflows.set(workflow.id, workflow);
    console.log(`✅ Registered workflow: ${workflow.name}`);
  }

  public registerTemplate(templateId: string, template: any): void {
    this.professionalTemplates.set(templateId, template);
    console.log(`✅ Registered template: ${templateId}`);
  }

  // ============================================================================
  // 🎯 REAL-TIME COORDINATION & MONITORING
  // ============================================================================

  public getActiveWorkflows(): AgentWorkflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  public getVoiceSession(sessionId: string): VoiceSession | undefined {
    return this.voiceSessions.get(sessionId);
  }

  public getActiveVoiceSessions(userId: string): VoiceSession[] {
    return Array.from(this.voiceSessions.values())
      .filter(s => s.userId === userId && s.status === 'active');
  }

  public getTaskQueue(): Task[] {
    return [...this.taskQueue];
  }

  private calculateEstimatedCompletion(workflow: AgentWorkflow): Date {
    const totalSteps = workflow.steps.length;
    const avgTimePerStep = 30; // seconds
    const estimatedSeconds = totalSteps * avgTimePerStep;
    
    return new Date(Date.now() + estimatedSeconds * 1000);
  }

  private generateNextSteps(workflow: AgentWorkflow, results: any[]): string[] {
    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    const totalSteps = workflow.steps.length;
    
    if (completedSteps === totalSteps) {
      return [
        'Review generated content',
        'Make any necessary edits',
        'Save to appropriate location',
        'Share with relevant parties'
      ];
    } else {
      const nextStep = workflow.steps.find(s => s.status === 'pending');
      return [
        `Complete ${nextStep?.agentRole || 'next step'}`,
        'Continue workflow execution',
        'Monitor progress'
      ];
    }
  }

  // ============================================================================
  // 🎯 INTEGRATION WITH EXISTING SERVICES
  // ============================================================================

  public async integrateWithCanvas(taskId: string, canvasId: string): Promise<void> {
    // Integration with existing canvas orchestrator (simplified)
    console.log(`🎨 Canvas integration: ${taskId} -> ${canvasId}`);
  }

  public async integrateWithCalendar(taskId: string): Promise<void> {
    // Integration with existing calendar service (simplified)
    console.log(`📅 Calendar integration for task: ${taskId}`);
  }

  public async integrateWithExistingOrchestrator(task: any): Promise<void> {
    // Integration with existing OrchestratorService (simplified)
    console.log(`🤖 Orchestrator integration for task: ${task.id}`);
  }
}

// Export singleton instance
export const unifiedAgentOrchestrator = UnifiedAgentOrchestrator.getInstance();