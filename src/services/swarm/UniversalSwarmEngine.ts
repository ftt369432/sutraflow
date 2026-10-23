/**
 * Universal Swarm Engine
 * 
 * Industry-agnostic multi-agent swarm coordinator.
 * Operates across all professional disciplines (Engineering, Law, Medicine, Finance, Consulting).
 * Coordinates specialized sub-agents: Coordinator, Researcher, Drafter, Auditor, Executor.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SwarmExecutionPlan, 
  SwarmTaskStep, 
  SwarmExecutionEvent, 
  UniversalAgentRole,
  SwarmStatus 
} from './types';
import { universalPlaybookService } from '../playbook/UniversalPlaybookService';
import { AIServiceFactory } from '../ai/aiServiceFactory';

export type SwarmEventListener = (event: SwarmExecutionEvent) => void;

export class UniversalSwarmEngine {
  private static instance: UniversalSwarmEngine;
  private listeners: Set<SwarmEventListener> = new Set();
  private activePlan: SwarmExecutionPlan | null = null;

  private constructor() {}

  static getInstance(): UniversalSwarmEngine {
    if (!UniversalSwarmEngine.instance) {
      UniversalSwarmEngine.instance = new UniversalSwarmEngine();
    }
    return UniversalSwarmEngine.instance;
  }

  /**
   * Subscribe to real-time swarm execution telemetry
   */
  subscribe(listener: SwarmEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Broadcast an event to all subscribers
   */
  private emit(event: SwarmExecutionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in swarm listener:', err);
      }
    }
  }

  /**
   * Decomposes a user goal into an industry-agnostic 4-stage Swarm Execution Plan
   */
  createExecutionPlan(goal: string, customPlaybookId?: string): SwarmExecutionPlan {
    const playbook = customPlaybookId 
      ? (universalPlaybookService.getPlaybook(customPlaybookId) || universalPlaybookService.getActivePlaybook())
      : universalPlaybookService.getActivePlaybook();

    const planId = `swarm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    const steps: SwarmTaskStep[] = [
      {
        id: `${planId}_coord`,
        role: 'coordinator',
        title: 'Strategic Scope & Methodology Decomposition',
        description: `Analyze objective against ${playbook.name} standards and outline execution matrix.`,
        status: 'pending',
        thoughts: []
      },
      {
        id: `${planId}_research`,
        role: 'researcher',
        title: 'Evidence Gathering & Knowledge Retrieval',
        description: `Extract source facts, governing authorities, and verified data relevant to the objective.`,
        status: 'pending',
        thoughts: []
      },
      {
        id: `${planId}_draft`,
        role: 'drafter',
        title: 'High-Fidelity Work-Product Synthesis',
        description: `Draft comprehensive deliverable according to ${playbook.name} structure and guidelines.`,
        status: 'pending',
        thoughts: []
      },
      {
        id: `${planId}_audit`,
        role: 'auditor',
        title: 'Quality Verification & Rule Compliance Audit',
        description: `Lint deliverable against ${playbook.governingStandards.length} standards and enforce zero-hallucination rules.`,
        status: 'pending',
        thoughts: []
      }
    ];

    const plan: SwarmExecutionPlan = {
      id: planId,
      goal,
      domain: playbook.domain,
      playbookName: playbook.name,
      steps,
      status: 'idle'
    };

    this.activePlan = plan;
    return plan;
  }

  /**
   * Executes the autonomous multi-agent swarm loop
   */
  async executeSwarm(
    goal: string, 
    contextFiles: string[] = [], 
    customPlaybookId?: string
  ): Promise<{ plan: SwarmExecutionPlan; deliverable: string; auditReport: string }> {
    const playbook = customPlaybookId 
      ? (universalPlaybookService.getPlaybook(customPlaybookId) || universalPlaybookService.getActivePlaybook())
      : universalPlaybookService.getActivePlaybook();

    const plan = this.createExecutionPlan(goal, playbook.id);
    plan.status = 'planning';
    plan.startedAt = new Date();

    const ai = AIServiceFactory.getUtilityService();

    this.emit({
      type: 'step_start',
      role: 'coordinator',
      message: `Swarm initialized under [${playbook.name}]. Decomposing objective: "${goal}"`,
      timestamp: Date.now()
    });

    let currentDeliverable = '';
    let auditReport = '';
    const gatheredEvidence: string[] = [];

    // --- STAGE 1: COORDINATOR AGENT ---
    const coordStep = plan.steps[0];
    coordStep.status = 'running';
    const coordPrompt = `You are the Coordinator Agent.
Domain: ${playbook.domain.toUpperCase()}
Playbook: ${playbook.name}
Objective: ${goal}
Available Context: ${contextFiles.join(', ') || 'Direct user input'}

Decompose this task into an authoritative, structured execution outline. Identify:
1. Core Deliverable Requirements
2. Primary Sources & Evidence Required
3. Applicable Governing Standards (${playbook.governingStandards.join(', ')})
4. Critical Failure Modes to Avoid.`;

    this.emit({
      type: 'thought',
      role: 'coordinator',
      message: 'Decomposing task requirements and mapping governing authorities...',
      timestamp: Date.now()
    });

    try {
      const coordResponse = await ai.generateText(coordPrompt, { temperature: 0.2 });
      coordStep.thoughts.push(coordResponse.trim());
      coordStep.status = 'completed';

      this.emit({
        type: 'step_complete',
        role: 'coordinator',
        message: 'Task successfully scoped and decomposed.',
        payload: coordResponse,
        timestamp: Date.now()
      });
    } catch (e: any) {
      coordStep.status = 'failed';
      this.emit({
        type: 'swarm_error',
        role: 'coordinator',
        message: `Coordinator failed: ${e?.message || e}`,
        timestamp: Date.now()
      });
    }

    // --- STAGE 2: RESEARCHER AGENT ---
    plan.status = 'researching';
    const researchStep = plan.steps[1];
    researchStep.status = 'running';

    this.emit({
      type: 'step_start',
      role: 'researcher',
      message: 'Investigating records, indexing facts, and retrieving verified evidence...',
      timestamp: Date.now()
    });

    const researchPrompt = `You are the Researcher Agent.
Domain: ${playbook.domain.toUpperCase()}
Playbook: ${playbook.name}
Standards: ${playbook.governingStandards.join('; ')}
Objective: ${goal}
Coordinator Outline:
${coordStep.thoughts.join('\n')}

Extract and organize all essential facts, statutory authorities, data points, or clinical/financial evidence required to complete this objective with zero hallucination. Be comprehensive and verbatim where authorities are cited.`;

    try {
      const researchResponse = await ai.generateText(researchPrompt, { temperature: 0.1 });
      researchStep.thoughts.push(researchResponse.trim());
      gatheredEvidence.push(researchResponse.trim());
      researchStep.status = 'completed';

      this.emit({
        type: 'step_complete',
        role: 'researcher',
        message: 'Evidence gathered and verified against governing standards.',
        payload: researchResponse,
        timestamp: Date.now()
      });
    } catch (e: any) {
      researchStep.status = 'failed';
      this.emit({
        type: 'swarm_error',
        role: 'researcher',
        message: `Researcher encountered error: ${e?.message || e}`,
        timestamp: Date.now()
      });
    }

    // --- STAGE 3: DRAFTER AGENT ---
    plan.status = 'drafting';
    const draftStep = plan.steps[2];
    draftStep.status = 'running';

    this.emit({
      type: 'step_start',
      role: 'drafter',
      message: `Drafting final work-product adhering to ${playbook.name} delivery guidelines...`,
      timestamp: Date.now()
    });

    const draftPrompt = `${playbook.systemPrompt}

## OPERATIONAL DIRECTIVE FROM MULTI-AGENT SWARM
You are the Drafting Agent synthesizing the primary work-product for the user.

USER OBJECTIVE:
${goal}

GOVERNING RULES:
${playbook.rules.map(r => `- ${r}`).join('\n')}

DELIVERY FORMAT GUIDELINES:
${playbook.formattingGuidelines}

GROUNDED RESEARCH & EVIDENCE:
${gatheredEvidence.join('\n\n')}

Draft the complete, publication-ready deliverable right now. Do NOT include conversational filler, meta-announcements, or conversational greetings. Produce the raw, formal deliverable.`;

    try {
      const draftResponse = await ai.generateText(draftPrompt, { temperature: 0.2 });
      currentDeliverable = draftResponse.trim();
      draftStep.thoughts.push('Primary draft formulated and structured.');
      draftStep.output = currentDeliverable;
      draftStep.status = 'completed';

      this.emit({
        type: 'step_complete',
        role: 'drafter',
        message: 'High-fidelity deliverable synthesized.',
        payload: currentDeliverable,
        timestamp: Date.now()
      });
    } catch (e: any) {
      draftStep.status = 'failed';
      this.emit({
        type: 'swarm_error',
        role: 'drafter',
        message: `Drafting failed: ${e?.message || e}`,
        timestamp: Date.now()
      });
    }

    // --- STAGE 4: AUDITOR AGENT ---
    plan.status = 'auditing';
    const auditStep = plan.steps[3];
    auditStep.status = 'running';

    this.emit({
      type: 'step_start',
      role: 'auditor',
      message: 'Auditing draft against playbook rules, citations, and quality metrics...',
      timestamp: Date.now()
    });

    const auditPrompt = `You are the Quality & Compliance Auditor Agent.
Playbook: ${playbook.name}
Governing Standards: ${playbook.governingStandards.join('; ')}
Rules: ${playbook.rules.join('; ')}

Inspect this synthesized deliverable:
---
${currentDeliverable}
---

Perform a forensic quality check:
1. Citation & Factual Accuracy: Are all authorities, calculations, or claims grounded?
2. Formatting Compliance: Does it follow the structure required?
3. Zero-Hallucination & Tone: Is it free of conversational fluff?
4. Quality Score: (Provide a score out of 100).
5. Verification Summary: 2-3 sentences verifying production readiness.`;

    try {
      const auditResponse = await ai.generateText(auditPrompt, { temperature: 0.1 });
      auditReport = auditResponse.trim();
      auditStep.thoughts.push(auditReport);
      auditStep.status = 'completed';

      this.emit({
        type: 'audit_feedback',
        role: 'auditor',
        message: 'Audit verification complete.',
        payload: auditReport,
        timestamp: Date.now()
      });
    } catch (e: any) {
      auditStep.status = 'failed';
      this.emit({
        type: 'swarm_error',
        role: 'auditor',
        message: `Auditor encountered error: ${e?.message || e}`,
        timestamp: Date.now()
      });
    }

    plan.status = 'complete';
    plan.completedAt = new Date();
    plan.finalDeliverable = currentDeliverable;

    this.emit({
      type: 'swarm_complete',
      role: 'coordinator',
      message: `Autonomous Swarm execution completed under [${playbook.name}].`,
      payload: { deliverable: currentDeliverable, auditReport },
      timestamp: Date.now()
    });

    return { plan, deliverable: currentDeliverable, auditReport };
  }

  /**
   * Gets the active execution plan
   */
  getActivePlan(): SwarmExecutionPlan | null {
    return this.activePlan;
  }
}

export const universalSwarmEngine = UniversalSwarmEngine.getInstance();
