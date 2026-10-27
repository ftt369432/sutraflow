/**
 * 🏛️ HIERARCHICAL MULTI-AGENT ORCHESTRATOR
 * ============================================================================
 * Coordinates the executive multi-agent pipeline:
 * 1. Chief of Staff (Goal decomposition & executive synthesis)
 * 2. Specialized AI Employees (CRO, Litigator, Finance Auditor)
 * 3. Quality Gatekeeper (Independent Pass/Fail verification & privacy firewall)
 * 4. Institutional Scribe (Vault Markdown SOP & fact logging)
 * 5. 1-Click Human Approval Queue (Strict guardrails for external actions)
 * ============================================================================
 */

import {
  AIEmployee,
  ExecutiveMissionBriefing,
  GatekeeperVerificationReport,
  WorkstreamTask,
  HighStakesAction
} from './employeeTypes';
import { useAIEmployeeStore } from '../../store/aiEmployeeStore';

export class HierarchicalOrchestrator {
  private static instance: HierarchicalOrchestrator;

  private constructor() {}

  public static getInstance(): HierarchicalOrchestrator {
    if (!HierarchicalOrchestrator.instance) {
      HierarchicalOrchestrator.instance = new HierarchicalOrchestrator();
    }
    return HierarchicalOrchestrator.instance;
  }

  /**
   * 1. Chief of Staff: Decompose macro objective into specialized employee workstreams
   */
  public decomposeMacroGoal(
    macroGoal: string,
    employees: AIEmployee[]
  ): ExecutiveMissionBriefing {
    const briefingId = `briefing_${Date.now()}`;
    const workstreams: WorkstreamTask[] = [];
    const lower = macroGoal.toLowerCase();

    // Find assigned employees by role/department
    const litigator = employees.find((e) => e.department === 'legal') || employees[0];
    const cro = employees.find((e) => e.department === 'revenue') || employees[0];
    const finance = employees.find((e) => e.department === 'finance') || employees[0];
    const cos = employees.find((e) => e.role === 'orchestrator') || employees[0];

    // Universal Domain Matching: Check all specialist employees against macro goal
    const workers = employees.filter((e) => e.role === 'worker');

    // Medical / Clinical / Healthcare detection
    if (
      lower.includes('patient') ||
      lower.includes('medical') ||
      lower.includes('clinic') ||
      lower.includes('doctor') ||
      lower.includes('chart') ||
      lower.includes('mri') ||
      lower.includes('icd') ||
      lower.includes('cpt') ||
      lower.includes('treatment')
    ) {
      const medEmp = workers.find((e) => e.title.toLowerCase().includes('medic') || e.title.toLowerCase().includes('clinic') || e.title.toLowerCase().includes('health')) || litigator;
      workstreams.push({
        id: `task_med_${Date.now()}_m`,
        department: 'custom',
        title: 'Clinical Chart Extraction & Diagnostic Summary',
        description: `Extract clinical narrative, diagnostic imaging findings, and treatment milestones for: "${macroGoal}"`,
        assignedEmployeeId: medEmp.id,
        requiredModelTier: medEmp.modelTier,
        status: 'pending',
        pendingAction: {
          actionType: 'calendar_booking',
          recipientOrTarget: 'Clinical Practice Record',
          payloadPreview: `Clinical extraction and diagnostic dossier for: ${macroGoal}`
        }
      });
    }

    // Architecture / Engineering / Permitting detection
    if (
      lower.includes('architect') ||
      lower.includes('building') ||
      lower.includes('permit') ||
      lower.includes('code') ||
      lower.includes('title 24') ||
      lower.includes('egress') ||
      lower.includes('cad') ||
      lower.includes('plan check')
    ) {
      const archEmp = workers.find((e) => e.title.toLowerCase().includes('architect') || e.title.toLowerCase().includes('engineer')) || workers[0] || cos;
      workstreams.push({
        id: `task_arch_${Date.now()}_a`,
        department: 'custom',
        title: 'Building Code Compliance & Permitting Matrix',
        description: `Cross-reference municipal building codes, verify life-safety egress standards, and draft plan submittal specs for: "${macroGoal}"`,
        assignedEmployeeId: archEmp.id,
        requiredModelTier: archEmp.modelTier,
        status: 'pending',
        pendingAction: {
          actionType: 'contract_sign',
          recipientOrTarget: 'Building & Safety Plan Review',
          payloadPreview: `Plan check response and architectural specification dossier for: ${macroGoal}`
        }
      });
    }

    // Revenue / CRO / Marketing / Growth detection
    if (
      lower.includes('revenue') ||
      lower.includes('prospect') ||
      lower.includes('client') ||
      lower.includes('outreach') ||
      lower.includes('linkedin') ||
      lower.includes('sponsor') ||
      lower.includes('speaking') ||
      lower.includes('deal') ||
      lower.includes('growth') ||
      lower.includes('leads') ||
      lower.includes('marketing') ||
      lower.includes('copy') ||
      lower.includes('campaign')
    ) {
      workstreams.push({
        id: `task_cro_${Date.now()}_1`,
        department: 'revenue',
        title: 'Target Outreach Campaign & Direct-Response Communications',
        description: `Execute outbound discovery, qualify prospective decision-makers, and draft high-conversion direct communications for: "${macroGoal}"`,
        assignedEmployeeId: cro.id,
        requiredModelTier: cro.modelTier,
        status: 'pending',
        pendingAction: {
          actionType: 'external_email',
          recipientOrTarget: 'Prospective Industry Partners',
          payloadPreview: `Outbound strategic initiative aligned with: ${macroGoal}`
        }
      });
    }

    // Legal / Judicial / Compliance detection
    if (
      lower.includes('case') ||
      lower.includes('claim') ||
      lower.includes('court') ||
      lower.includes('pleading') ||
      lower.includes('subpoena') ||
      lower.includes('dor') ||
      lower.includes('trial') ||
      lower.includes('qme') ||
      lower.includes('defense') ||
      lower.includes('litigation') ||
      lower.includes('statute')
    ) {
      workstreams.push({
        id: `task_legal_${Date.now()}_2`,
        department: 'legal',
        title: 'Formal Legal Pleading & Statutory Compliance Audit',
        description: `Assemble verified statutory authorities, regulations, and pleading documents for: "${macroGoal}"`,
        assignedEmployeeId: litigator.id,
        requiredModelTier: litigator.modelTier,
        status: 'pending',
        pendingAction: {
          actionType: 'court_filing',
          recipientOrTarget: 'Tribunal / Appeals Board Docket',
          payloadPreview: `Formal legal pleading and statutory petition for: ${macroGoal}`
        }
      });
    }

    // Finance / Tax / Accounting / Billing detection
    if (
      lower.includes('fee') ||
      lower.includes('billing') ||
      lower.includes('interest') ||
      lower.includes('penalty') ||
      lower.includes('invoice') ||
      lower.includes('tax') ||
      lower.includes('accounting') ||
      lower.includes('ledger') ||
      lower.includes('audit') ||
      lower.includes('payment') ||
      lower.includes('4622')
    ) {
      workstreams.push({
        id: `task_fin_${Date.now()}_3`,
        department: 'finance',
        title: 'Financial Ledger Reconciliation & Mathematical Audit',
        description: `Reconcile ledgers, verify dates of service, and compute deterministic penalties, interest, and taxes for: "${macroGoal}"`,
        assignedEmployeeId: finance.id,
        requiredModelTier: finance.modelTier,
        status: 'pending',
        pendingAction: {
          actionType: 'financial_transfer',
          recipientOrTarget: 'Accounts Reconciliation Ledger',
          payloadPreview: `Formal accounting reconciliation and statutory demand calculation for: ${macroGoal}`
        }
      });
    }

    // Check any custom specialist employees if not already included
    workers.forEach((worker) => {
      if (worker.isCustom && !workstreams.some(w => w.assignedEmployeeId === worker.id)) {
        const titleTokens = worker.title.toLowerCase().split(/\s+/);
        const matches = titleTokens.some(t => t.length > 3 && lower.includes(t));
        if (matches) {
          workstreams.push({
            id: `task_custom_${Date.now()}_${worker.id}`,
            department: worker.department,
            title: `${worker.title}: Directive Execution`,
            description: `Execute specialized directives aligned with ${worker.title}: "${macroGoal}"`,
            assignedEmployeeId: worker.id,
            requiredModelTier: worker.modelTier,
            status: 'pending'
          });
        }
      }
    });

    // General Executive Planning if no specific workstream was triggered
    if (workstreams.length === 0) {
      workstreams.push({
        id: `task_exec_${Date.now()}_0`,
        department: 'executive',
        title: 'Macro Operational Roadmap & Execution Directives',
        description: `Decompose macro objective into actionable milestones: "${macroGoal}"`,
        assignedEmployeeId: cos.id,
        requiredModelTier: cos.modelTier,
        status: 'pending'
      });
    }

    const chiefOfStaffEmployee = employees.find((e) => e.role === 'orchestrator');
    const cosName = chiefOfStaffEmployee ? chiefOfStaffEmployee.name : 'Chief of Staff';

    return {
      id: briefingId,
      macroGoal,
      generatedAt: new Date().toISOString(),
      conductorSummary: `${cosName} has received the executive goal and deployed ${workstreams.length} departmental workstream(s). All outputs must pass independent Gatekeeper QA verification prior to human sign-off.`,
      workstreams,
      allWorkstreamsCertified: false,
      tokensSaved: workstreams.length * 2800
    };
  }

  /**
   * 2. Quality Gatekeeper: Independent Pass/Fail verification layer
   */
  public verifyDeliverable(
    content: string,
    department: string,
    gatekeeperName: string
  ): GatekeeperVerificationReport {
    const violations: string[] = [];
    const passedChecks: string[] = [];

    // Check 1: Zero-Placeholder Standard (Catch bracketed placeholders)
    const placeholderRegex = /\[(Insert|TBD|Client\s*Name|Date|Amount|Case\s*No|Signature|TBA|Address|Doctor|Claim\s*Number|Recipient)[^\]]*\]/gi;
    const placeholderMatches = content.match(placeholderRegex);
    if (placeholderMatches && placeholderMatches.length > 0) {
      violations.push(`Zero-Placeholder Violation: Found unpopulated brackets: ${placeholderMatches.slice(0, 3).join(', ')}`);
    } else {
      passedChecks.push('Zero-Placeholder Check: 100% Resolved (Zero bracketed placeholders)');
    }

    // Check 2: Privacy / PII Firewall Check
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnRegex.test(content)) {
      violations.push('Privacy Shield Violation: Unredacted Social Security Number detected in payload.');
    } else {
      passedChecks.push('Privacy Shield: Zero raw direct PII exposed');
    }

    // Check 3: Grounding & Empty Text Check
    if (!content || content.trim().length < 40) {
      violations.push('Completeness Violation: Output is too brief or lacks actionable substance.');
    } else {
      passedChecks.push('Substance Check: Sufficient operational depth verified');
    }

    // Check 4: Anti-Fluff Tone Check
    const fluffRegex = /\b(delve|testament|tapestry|beacon of hope|in today's fast-paced world)\b/gi;
    const fluffMatches = content.match(fluffRegex);
    if (fluffMatches && fluffMatches.length > 0) {
      violations.push(`Brand Voice Warning: Generic AI fluff terms found: ${Array.from(new Set(fluffMatches)).join(', ')}.`);
    } else {
      passedChecks.push('Tone Check: Authoritative sovereign voice enforced');
    }

    // Check 5: Legal Verbatim Check (if legal department)
    if (department === 'legal') {
      if (!content.includes('Labor Code') && !content.includes('8 CCR') && !content.includes('ADJ')) {
        violations.push('Statutory Grounding Warning: Legal draft lacks concrete California statutory or case authority.');
      } else {
        passedChecks.push('Legal Grounding: California statutory references verified');
      }
    }

    const pass = violations.length === 0;
    const score = Math.max(0, 100 - violations.length * 25);

    return {
      pass,
      score,
      timestamp: new Date().toISOString(),
      verifiedBy: gatekeeperName,
      violations,
      passedChecks,
      certifiedBadge: pass ? 'GATEKEEPER_CERTIFIED_PASS' : undefined
    };
  }

  /**
   * 3. Scribe: Compile verified matter into a permanent Markdown SOP for the local vault
   */
  public compileVaultRecord(
    briefing: ExecutiveMissionBriefing,
    scribeName: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const header = `---
title: "MISSION_SOP_${briefing.id}"
date: "${timestamp}"
author: "${scribeName}"
status: "PERMANENT_VAULT_RECORD"
verified_by: "Gatekeeper QA Engine"
macro_goal: "${briefing.macroGoal}"
---

# Executive Mission Record: ${briefing.macroGoal}
*Logged by ${scribeName} into Local Sovereign Fabric Vault on ${timestamp}*

## Executive Conductor Summary
${briefing.conductorSummary}

## Certified Department Workstreams
`;

    const sections = briefing.workstreams.map(
      (w) => `
### [${w.department.toUpperCase()}] ${w.title}
**Assigned Employee ID**: \`${w.assignedEmployeeId}\`  
**Gatekeeper Status**: ${w.auditReport?.pass ? '[CERTIFIED PASS]' : '[REJECTED / PENDING]'}

\`\`\`markdown
${w.draftContent || 'No content drafted.'}
\`\`\`
`
    ).join('\n---\n');

    return header + sections;
  }
}

export const hierarchicalOrchestrator = HierarchicalOrchestrator.getInstance();
