/**
 * 🏛️ LegalSwarmCoordinator (Phase 2 Master Legal Swarm Orchestrator)
 * 
 * Chains and coordinates the specialized legal micro-agents:
 * - Swarm 3: LegalResearchSwarmAgent (Fact extraction, Zero-PHI, Authority retrieval)
 * - Swarm 4: LegalDraftingSwarmAgent (Dual-Persona 28-Line Pleading Synthesis)
 * - Swarm 5: LegalAuditSwarmAgent (Quote Guard, Citation Linting, 28-Line Audit)
 * 
 * Provides real-time event streaming and self-correcting feedback loops.
 */

import { agentRunner } from '../engine/AgentRunner';
import { LegalPersonaType } from './LegalDraftingSwarmAgent';
import { LegalAuditReport } from './LegalAuditSwarmAgent';
import { LegalResearchFindings } from './LegalResearchSwarmAgent';
import { SwarmExecutionEvent } from '../types';

export interface LegalSwarmExecutionParams {
  objective: string;
  evidenceText: string;
  persona?: LegalPersonaType;
  onProgress?: (step: string, detail?: string) => void;
  onPartial?: (partialText: string) => void;
  onThoughtEvent?: (event: SwarmExecutionEvent) => void;
}

export interface LegalSwarmExecutionResult {
  deliverable: string;
  auditReport: LegalAuditReport;
  findings: LegalResearchFindings;
  executionTimeMs: number;
  personaUsed: LegalPersonaType;
}

export class LegalSwarmCoordinator {
  private static instance: LegalSwarmCoordinator;

  private constructor() {}

  public static getInstance(): LegalSwarmCoordinator {
    if (!LegalSwarmCoordinator.instance) {
      LegalSwarmCoordinator.instance = new LegalSwarmCoordinator();
    }
    return LegalSwarmCoordinator.instance;
  }

  /**
   * Executes the full legal agent pipeline via the sovereign LegalAgentRunner
   */
  public async executeLegalSwarm(
    params: LegalSwarmExecutionParams
  ): Promise<LegalSwarmExecutionResult> {
    const res = await agentRunner.runAgent(params);
    return res as unknown as LegalSwarmExecutionResult;
  }
}

export const legalSwarmCoordinator = LegalSwarmCoordinator.getInstance();
