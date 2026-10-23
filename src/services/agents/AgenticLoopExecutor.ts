/**
 * 🔄 AGENTIC LOOP EXECUTOR
 * 
 * Implements the Think → Research → Act → Reflect cycle for autonomous AI execution.
 * This is the core of agentic behavior - AI doesn't just answer, it EXECUTES.
 * 
 * Pattern: User request → Think (LLM plan) → Research (gather) → Act (execute) → Reflect (LLM assess)
 * 
 * Sprint 1 Upgrade: thinkPhase and reflectPhase now use REAL LLM reasoning
 * instead of heuristic regex. The AI literally plans before acting.
 */

import { agenticToolRegistry, ToolResult } from './ToolRegistry';
import { AIAgentTask, TaskStatus, TaskPriority, AgentType } from './types';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { v4 as uuidv4 } from 'uuid';

// 🧠 Agentic execution result
export interface AgenticExecutionResult {
  success: boolean;
  task: AIAgentTask;
  thinkingLog: string[];
  researchFindings: Array<{ tool: string; result: ToolResult }>;
  actions: Array<{ tool: string; result: ToolResult }>;
  reflections: string[];
  confidence: number;
  shouldRetry: boolean;
  finalOutput?: any;
}

// 🎯 Antigravity-style Mode Awareness
export type AgenticMode = 'PLANNING' | 'EXECUTION' | 'VERIFICATION';

export interface TaskBoundary {
  taskName: string;
  mode: AgenticMode;
  taskStatus: string;
  taskSummary: string;
  startTime: Date;
  toolCallCount: number;
  confidenceThreshold: number;
  canAutoProceed: boolean;
}

/**
 * 🤖 AGENTIC LOOP EXECUTOR
 * 
 * Autonomous AI execution engine that thinks, researches, acts, and self-corrects
 * Enhanced with Antigravity-style mode awareness and task boundary tracking.
 */
export class AgenticLoopExecutor {
  private static instance: AgenticLoopExecutor;
  private maxLoopIterations = 10; // Safety limit
  private minConfidence = 0.7; // Threshold for autonomous execution

  // 🎯 Antigravity-style Task Boundary Tracking
  private currentMode: AgenticMode = 'PLANNING';
  private currentTaskBoundary: TaskBoundary | null = null;
  private modeHistory: Array<{ mode: AgenticMode; timestamp: Date; reason: string }> = [];

  private constructor() { }

  static getInstance(): AgenticLoopExecutor {
    if (!AgenticLoopExecutor.instance) {
      AgenticLoopExecutor.instance = new AgenticLoopExecutor();
    }
    return AgenticLoopExecutor.instance;
  }

  /**
   * 🔄 Execute Agentic Loop
   * 
   * Main entry point - runs the full Think → Research → Act → Reflect cycle
   */
  async executeAgenticLoop(
    userRequest: string,
    userId: string,
    context?: Record<string, any>
  ): Promise<AgenticExecutionResult> {

    const result: AgenticExecutionResult = {
      success: false,
      task: this.createInitialTask(userRequest, userId),
      thinkingLog: [],
      researchFindings: [],
      actions: [],
      reflections: [],
      confidence: 0,
      shouldRetry: false
    };

    console.log('🔄 AGENTIC LOOP START:', userRequest);

    let iteration = 0;
    let currentConfidence = 0;

    while (iteration < this.maxLoopIterations && currentConfidence < 0.95) {
      iteration++;
      console.log(`\n🔁 Loop Iteration ${iteration}/${this.maxLoopIterations}`);

      // PHASE 1: THINK
      const thinkingResult = await this.thinkPhase(userRequest, context, result);
      result.thinkingLog.push(...thinkingResult.thoughts);
      console.log('💭 THINK:', thinkingResult.plan);

      // PHASE 2: RESEARCH
      const researchResult = await this.researchPhase(thinkingResult.plan, context);
      result.researchFindings.push(...researchResult.findings);
      console.log('🔍 RESEARCH:', researchResult.findings.length, 'findings');

      // PHASE 3: ACT
      const actionResult = await this.actPhase(thinkingResult.plan, researchResult, context);
      result.actions.push(...actionResult.actions);
      console.log('⚡ ACT:', actionResult.actions.length, 'actions executed');

      // PHASE 4: REFLECT
      const reflectionResult = await this.reflectPhase(
        userRequest,
        researchResult,
        actionResult,
        context
      );
      result.reflections.push(...reflectionResult.reflections);
      currentConfidence = reflectionResult.confidence;
      result.confidence = currentConfidence;

      console.log('🤔 REFLECT: Confidence =', (currentConfidence * 100).toFixed(1) + '%');

      // Check if we're done
      if (reflectionResult.isComplete) {
        result.success = true;
        result.finalOutput = actionResult.output;
        result.task.status = TaskStatus.COMPLETED;
        result.task.progress = 100;
        console.log('✅ AGENTIC LOOP COMPLETE: Success!');
        break;
      }

      // Check if we should retry
      if (reflectionResult.shouldRetry && iteration < this.maxLoopIterations) {
        result.shouldRetry = true;
        console.log('🔄 Self-correction triggered - retrying with improved approach');
        // Update context with learnings
        context = { ...context, learnings: reflectionResult.improvements };
      } else if (currentConfidence < this.minConfidence) {
        console.log('⚠️ Confidence below threshold - escalating to user');
        result.task.status = TaskStatus.AGENT_HANDOFF;
        break;
      }
    }

    // Final status
    if (!result.success && iteration >= this.maxLoopIterations) {
      console.log('⚠️ Max iterations reached - partial completion');
      result.task.status = TaskStatus.IN_PROGRESS;
      result.task.progress = Math.min(90, currentConfidence * 100);
    }

    return result;
  }

  /**
   * 💭 PHASE 1: THINK (LLM-Powered)
   * 
   * Sprint 1: Replaced heuristic regex with real LLM reasoning.
   * The AI generates a structured JSON execution plan for the given request.
   * Falls back to heuristic detection if LLM call fails or JSON parse fails.
   */
  private async thinkPhase(
    userRequest: string,
    context?: Record<string, any>,
    previousResult?: AgenticExecutionResult
  ): Promise<{
    thoughts: string[];
    plan: {
      intent: string;
      documentType?: string;
      requiredTools: string[];
      researchNeeded: string[];
      expectedOutput: string;
      confidence: number;
    };
  }> {
    const thoughts: string[] = [];
    thoughts.push(`🧠 LLM Planner analyzing: "${userRequest}"`);

    // Available tools for the LLM to choose from
    const availableTools = [
      'search_knowledge_base', 'find_template', 'search_legal_codes', 'get_historical_context',
      'create_canvas_document', 'generate_from_template', 'validate_document', 'create_task',
      'schedule_event', 'get_calendar', 'read_emails', 'auto_calendar', 'analyze_email',
      'update_canvas', 'create_folder', 'move_document', 'search_web', 'fetch_webpage',
      'navigate_browser', 'open_panel', 'fetch_market_intelligence', 'research_therapeutics'
    ];

    // Previous attempt context for self-correction
    const prevContext = previousResult?.reflections?.length
      ? `\nPrevious attempt failed with: ${previousResult.reflections.slice(-2).join('; ')}\nImprove on these issues.`
      : '';

    const plannerPrompt = `You are the GenieFlow Agentic Planner. Your job is to analyze a user request and produce a precise JSON execution plan.

User Request: "${userRequest}"
Context: ${JSON.stringify(context || {})}
Available Tools: ${availableTools.join(', ')}${prevContext}

Respond ONLY with a valid JSON object (no markdown, no explanation, just JSON):
{
  "intent": "<one of: document_creation | document_modification | knowledge_search | analysis | schedule_event | email_action | task_creation | web_research | general_request>",
  "documentType": "<optional: demand_letter | petition | contract | settlement_agreement | complaint | motion | report | email | task | null>",
  "requiredTools": ["<tool1>", "<tool2>"],
  "researchNeeded": ["<search query 1>", "<search query 2>"],
  "expectedOutput": "<one sentence describing what success looks like>",
  "confidence": <0.0-1.0>
}`;

    try {
      const ai = AIServiceFactory.getUtilityService();
      const rawPlan = await ai.generateText(plannerPrompt, {
        _trackerSource: 'AgenticLoopExecutor.thinkPhase',
        _trackerCategory: 'agentic'
      });

      // Strip any markdown code fences if present
      const cleaned = rawPlan.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const plan = JSON.parse(cleaned);

      // Validate the plan structure
      if (!plan.intent || !Array.isArray(plan.requiredTools)) {
        throw new Error('Invalid plan structure from LLM');
      }

      thoughts.push(`✅ Intent classified: ${plan.intent}`);
      if (plan.documentType) thoughts.push(`📄 Document type: ${plan.documentType}`);
      thoughts.push(`🔧 Tools selected: ${plan.requiredTools.join(', ')}`);
      thoughts.push(`🔍 Research needed: ${(plan.researchNeeded || []).join(', ')}`);
      thoughts.push(`🎯 Expected output: ${plan.expectedOutput}`);
      thoughts.push(`📊 Plan confidence: ${((plan.confidence || 0.8) * 100).toFixed(0)}%`);

      console.log('🧠 LLM Planner produced plan:', plan);

      return {
        thoughts,
        plan: {
          intent: plan.intent,
          documentType: plan.documentType || undefined,
          requiredTools: plan.requiredTools || [],
          researchNeeded: plan.researchNeeded || [],
          expectedOutput: plan.expectedOutput || 'Completed task',
          confidence: plan.confidence || 0.8
        }
      };
    } catch (err) {
      // Fallback to heuristic detection if LLM fails
      console.warn('⚠️ LLM planner failed, falling back to heuristic detection:', err);
      thoughts.push('⚠️ LLM planner unavailable — using heuristic fallback');

      const intent = this.heuristicAnalyzeIntent(userRequest);
      const documentType = this.heuristicDetectDocumentType(userRequest);
      const researchNeeded = this.heuristicPlanResearch(userRequest, documentType);
      const requiredTools = this.heuristicSelectTools(intent, documentType);
      const expectedOutput = this.heuristicPredictOutput(intent, documentType);

      thoughts.push(`Fallback intent: ${intent}`);
      if (documentType) thoughts.push(`Fallback doc type: ${documentType}`);
      thoughts.push(`Fallback tools: ${requiredTools.join(', ')}`);

      return {
        thoughts,
        plan: { intent, documentType, requiredTools, researchNeeded, expectedOutput, confidence: 0.6 }
      };
    }
  }

  /**
   * 🔍 PHASE 2: RESEARCH
   * 
   * Gather knowledge from KB, templates, and legal codes
   */
  private async researchPhase(
    plan: { researchNeeded: string[]; documentType?: string },
    context?: Record<string, any>
  ): Promise<{
    findings: Array<{ tool: string; result: ToolResult }>;
    templates: any[];
    knowledge: any[];
  }> {

    const findings: Array<{ tool: string; result: ToolResult }> = [];
    const templates: any[] = [];
    const knowledge: any[] = [];

    // Execute research tools in parallel
    const researchPromises = plan.researchNeeded.map(async (query) => {
      // Search knowledge base
      const kbResult = await agenticToolRegistry.executeTool('search_knowledge_base', {
        query,
        limit: 5
      });
      if (kbResult.success && kbResult.data) {
        findings.push({ tool: 'search_knowledge_base', result: kbResult });
        knowledge.push(...(kbResult.data as any[]));
      }

      return kbResult;
    });

    // Find template if document creation
    if (plan.documentType) {
      const templateResult = await agenticToolRegistry.executeTool('find_template', {
        docType: plan.documentType
      });
      if (templateResult.success && templateResult.data) {
        findings.push({ tool: 'find_template', result: templateResult });
        templates.push(templateResult.data);
      }
    }

    await Promise.all(researchPromises);

    console.log('🔍 Research complete:', {
      totalFindings: findings.length,
      templatesFound: templates.length,
      knowledgeItems: knowledge.length
    });

    return { findings, templates, knowledge };
  }

  /**
   * ⚡ PHASE 3: ACT
   * 
   * Execute tools to create/modify documents
   */
  private async actPhase(
    plan: { documentType?: string; requiredTools: string[] },
    research: { templates: any[]; knowledge: any[] },
    context?: Record<string, any>
  ): Promise<{
    actions: Array<{ tool: string; result: ToolResult }>;
    output: any;
  }> {

    const actions: Array<{ tool: string; result: ToolResult }> = [];
    let output: any = null;

    // If we have a template, use it
    if (research.templates.length > 0) {
      const template = research.templates[0];

      // Generate from template with variables from context
      const generateResult = await agenticToolRegistry.executeTool('generate_from_template', {
        templateId: template.id,
        variables: context?.variables || {}
      });

      if (generateResult.success) {
        actions.push({ tool: 'generate_from_template', result: generateResult });
        output = generateResult.data;
      }
    }

    // Execute remaining required tools
    for (const toolName of plan.requiredTools) {
      if (toolName === 'create_canvas_document' && output) {
        const createResult = await agenticToolRegistry.executeTool('create_canvas_document', {
          title: context?.title || 'Generated Document',
          content: output.content || output,
          metadata: { source: 'agentic_loop', ...context?.metadata }
        });

        if (createResult.success) {
          actions.push({ tool: 'create_canvas_document', result: createResult });
          output = createResult.data;
        }
      }
    }

    return { actions, output };
  }

  /**
   * 🤔 PHASE 4: REFLECT (LLM-Powered Self-Assessment)
   * 
   * Sprint 1: Replaced heuristic scoring with real LLM self-assessment.
   * The AI critiques its own output and decides if it needs to retry.
   * Falls back to heuristic scoring if LLM is unavailable.
   */
  private async reflectPhase(
    userRequest: string,
    research: { templates: any[]; knowledge: any[] },
    actions: { output: any },
    context?: Record<string, any>
  ): Promise<{
    reflections: string[];
    confidence: number;
    isComplete: boolean;
    shouldRetry: boolean;
    improvements: string[];
  }> {
    // Check if output exists at all
    if (!actions.output) {
      return {
        reflections: ['❌ No output generated — task produced no result'],
        confidence: 0.1,
        isComplete: false,
        shouldRetry: true,
        improvements: ['Ensure at least one action tool produced output']
      };
    }

    const content = typeof actions.output === 'string'
      ? actions.output
      : (actions.output.content || JSON.stringify(actions.output));

    // LLM self-assessment
    const reflectPrompt = `You are a critical quality reviewer for GenieFlow AI. Assess whether this task was completed successfully.

Original User Request: "${userRequest}"

Generated Output (first 1500 chars):
${content.substring(0, 1500)}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "score": <0.0-1.0>,
  "isComplete": <true|false>,
  "shouldRetry": <true|false>,
  "assessment": "<one sentence verdict>",
  "improvements": ["<specific fix 1>", "<specific fix 2>"]
}

Rules:
- score >= 0.85 means task is DONE (set isComplete: true, shouldRetry: false)
- score 0.5-0.84 means partial (isComplete: false, shouldRetry: true)
- score < 0.5 means failed (isComplete: false, shouldRetry: true)`;

    try {
      const ai = AIServiceFactory.getUtilityService();
      const rawAssessment = await ai.generateText(reflectPrompt, {
        _trackerSource: 'AgenticLoopExecutor.reflectPhase',
        _trackerCategory: 'agentic'
      });

      const cleaned = rawAssessment.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const assessment = JSON.parse(cleaned);

      const reflections = [
        `🔍 LLM Assessment: ${assessment.assessment}`,
        `📊 Quality Score: ${((assessment.score || 0) * 100).toFixed(0)}%`,
        assessment.isComplete ? '✅ Task marked COMPLETE by self-review' : '⚠️ Task needs improvement'
      ];

      console.log('🤔 LLM Reflect assessment:', assessment);

      return {
        reflections,
        confidence: assessment.score || 0.6,
        isComplete: assessment.isComplete || false,
        shouldRetry: assessment.shouldRetry || false,
        improvements: assessment.improvements || []
      };
    } catch (err) {
      // Fallback to heuristic scoring
      console.warn('⚠️ LLM reflect failed, using heuristic fallback:', err);
      const qualityScore = this.heuristicAssessQuality(content);
      const hasStructure = this.heuristicValidateStructure(content, context?.documentType);
      const confidence = hasStructure ? qualityScore : qualityScore * 0.7;
      return {
        reflections: [
          hasStructure ? '✅ Structure valid (heuristic)' : '⚠️ Structure incomplete (heuristic)',
          `📊 Quality score: ${(qualityScore * 100).toFixed(0)}% (heuristic)`
        ],
        confidence,
        isComplete: confidence >= 0.8,
        shouldRetry: confidence < 0.8 && confidence > 0.3,
        improvements: confidence < 0.9 ? ['Enhance content quality and completeness'] : []
      };
    }
  }

  // ==================== HELPER METHODS ====================

  private createInitialTask(userRequest: string, userId: string): AIAgentTask {
    return {
      id: uuidv4(),
      title: userRequest.substring(0, 50),
      description: userRequest,
      instruction: userRequest,
      subTasks: [],
      depth: 0,
      status: TaskStatus.ANALYZING,
      priority: TaskPriority.MEDIUM,
      assignedAgent: AgentType.ORCHESTRATOR_AGENT,
      dependsOn: [],
      triggers: [],
      canExecuteInParallel: false,
      agentMessages: [],
      progress: 0,
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      thoughts: [] // Thinking log for agentic execution
    };
  }

  // ==================== HEURISTIC FALLBACK METHODS ====================
  // These are used only when LLM calls in thinkPhase/reflectPhase fail.

  private heuristicAnalyzeIntent(userRequest: string): string {
    const lower = userRequest.toLowerCase();
    if (/create|draft|generate|write/.test(lower)) return 'document_creation';
    if (/edit|modify|change|update/.test(lower)) return 'document_modification';
    if (/search|find|lookup/.test(lower)) return 'knowledge_search';
    if (/schedule|book|meeting|calendar|event/.test(lower)) return 'schedule_event';
    if (/email|inbox|message/.test(lower)) return 'email_action';
    if (/task|todo|remind/.test(lower)) return 'task_creation';
    if (/analyze|review|assess/.test(lower)) return 'analysis';
    return 'general_request';
  }

  private heuristicDetectDocumentType(userRequest: string): string | undefined {
    const lower = userRequest.toLowerCase();
    if (/demand\s+letter/.test(lower)) return 'demand_letter';
    if (/petition/.test(lower)) return 'petition';
    if (/contract|agreement/.test(lower)) return 'contract';
    if (/settlement/.test(lower)) return 'settlement_agreement';
    if (/complaint/.test(lower)) return 'complaint';
    if (/motion/.test(lower)) return 'motion';
    return undefined;
  }

  private heuristicPlanResearch(userRequest: string, documentType?: string): string[] {
    const research: string[] = [];
    if (documentType) {
      research.push(`${documentType} template`);
      research.push(`${documentType} examples`);
    }
    const terms = userRequest.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    research.push(...terms.slice(0, 3).map(term => term.toLowerCase()));
    return research;
  }

  private heuristicSelectTools(intent: string, documentType?: string): string[] {
    const tools: string[] = [];
    if (intent === 'document_creation') {
      tools.push('search_knowledge_base', 'find_template');
      if (documentType) tools.push('generate_from_template', 'create_canvas_document', 'validate_document');
    } else if (intent === 'schedule_event') {
      tools.push('get_calendar', 'schedule_event');
    } else if (intent === 'email_action') {
      tools.push('read_emails', 'analyze_email');
    } else if (intent === 'task_creation') {
      tools.push('create_task');
    } else if (intent === 'knowledge_search') {
      tools.push('search_knowledge_base');
    }
    return tools;
  }

  private heuristicPredictOutput(intent: string, documentType?: string): string {
    if (intent === 'document_creation' && documentType) return `Complete ${documentType.replace(/_/g, ' ')} ready for use`;
    if (intent === 'schedule_event') return 'Calendar event created';
    if (intent === 'task_creation') return 'Task created in task manager';
    if (intent === 'email_action') return 'Email action completed';
    return 'Processed result based on request';
  }

  private heuristicValidateStructure(content: string, documentType?: string): boolean {
    const hasHeader = /^#|^[A-Z\s]+$/m.test(content);
    const hasSections = content.split('\n\n').length >= 3;
    return hasHeader && hasSections;
  }

  private heuristicAssessQuality(content: string): number {
    let score = 0.5;
    if (content.length > 500) score += 0.2;
    if (content.length > 1000) score += 0.1;
    if (/^#/m.test(content)) score += 0.1;
    if (content.includes('\n\n')) score += 0.1;
    return Math.min(1.0, score);
  }

  // ==================== ANTIGRAVITY-STYLE MODE MANAGEMENT ====================

  /**
   * 🎯 Set Task Boundary - Antigravity-style mode awareness
   * 
   * Similar to how Antigravity tracks PLANNING → EXECUTION → VERIFICATION
   */
  public setTaskBoundary(params: {
    taskName: string;
    mode: AgenticMode;
    taskStatus: string;
    taskSummary: string;
    predictedTaskSize?: number;
  }): TaskBoundary {
    const boundary: TaskBoundary = {
      taskName: params.taskName,
      mode: params.mode,
      taskStatus: params.taskStatus,
      taskSummary: params.taskSummary,
      startTime: new Date(),
      toolCallCount: 0,
      confidenceThreshold: params.mode === 'EXECUTION' ? 0.8 : 0.6,
      canAutoProceed: params.mode === 'VERIFICATION'
    };

    // Track mode transition
    if (this.currentMode !== params.mode) {
      this.modeHistory.push({
        mode: params.mode,
        timestamp: new Date(),
        reason: `Transitioned from ${this.currentMode} to ${params.mode}`
      });
      this.currentMode = params.mode;
    }

    this.currentTaskBoundary = boundary;
    console.log(`🎯 TASK BOUNDARY: [${params.mode}] ${params.taskName}`);
    console.log(`   Status: ${params.taskStatus}`);

    return boundary;
  }

  /**
   * 📊 Get Current Mode
   */
  public getCurrentMode(): AgenticMode {
    return this.currentMode;
  }

  /**
   * 📋 Get Current Task Boundary
   */
  public getCurrentTaskBoundary(): TaskBoundary | null {
    return this.currentTaskBoundary;
  }

  /**
   * 🔄 Transition Mode
   * 
   * Explicitly transition between PLANNING → EXECUTION → VERIFICATION
   */
  public transitionMode(newMode: AgenticMode, reason: string): void {
    if (this.currentMode === newMode) {
      console.log(`⚠️ Already in ${newMode} mode`);
      return;
    }

    console.log(`🔄 MODE TRANSITION: ${this.currentMode} → ${newMode}`);
    console.log(`   Reason: ${reason}`);

    this.modeHistory.push({
      mode: newMode,
      timestamp: new Date(),
      reason
    });

    this.currentMode = newMode;

    if (this.currentTaskBoundary) {
      this.currentTaskBoundary.mode = newMode;
    }
  }

  /**
   * 📈 Increment Tool Call Count
   */
  public incrementToolCallCount(): number {
    if (this.currentTaskBoundary) {
      this.currentTaskBoundary.toolCallCount++;
      return this.currentTaskBoundary.toolCallCount;
    }
    return 0;
  }

  /**
   * ✅ Check If Can Auto-Proceed
   * 
   * Determines if confidence is high enough to proceed without user input
   */
  public canAutoProceed(currentConfidence: number): boolean {
    if (!this.currentTaskBoundary) return false;

    const threshold = this.currentTaskBoundary.confidenceThreshold;
    const canProceed = currentConfidence >= threshold;

    console.log(`🎯 Auto-proceed check: ${currentConfidence.toFixed(2)} >= ${threshold} ? ${canProceed}`);
    return canProceed;
  }

  /**
   * 📜 Get Mode History
   */
  public getModeHistory(): Array<{ mode: AgenticMode; timestamp: Date; reason: string }> {
    return [...this.modeHistory];
  }
}

// Export singleton instance
export const agenticLoopExecutor = AgenticLoopExecutor.getInstance();

// Expose globally for testing
if (typeof window !== 'undefined') {
  (window as any).agenticLoopExecutor = agenticLoopExecutor;
}
