/**
 * 🏛️ BUSINESS OPERATIONS SUITE (AGENT HEADQUARTERS & MISSION CONTROL)
 * 
 * Implements the 4-tier Sovereign Multi-Agent Hierarchy:
 * 1. Human Sovereign CEO (Only sees vetted work / 1-click approvals)
 * 2. Chief of Staff (Frontier Reasoning: Macro objective decomposition & workstream routing)
 * 3. The Gatekeeper QA (Fast Token Tier: Ruthless binary pass/fail verification & privacy firewall)
 * 4. Specialized Departmental Sub-Agents (Legal Litigator, Marketing Growth, Finance Operations)
 * 5. Institutional Scribe (Vault Memory & SOP Logger)
 */

export interface WorkstreamTask {
  id: string;
  department: 'legal' | 'marketing' | 'finance' | 'operations';
  title: string;
  description: string;
  assignedPersona: string;
  requiredModelTier: 'frontier_reasoning' | 'creative_precision' | 'deterministic_math' | 'fast_verifier';
  status: 'pending' | 'in_progress' | 'drafted' | 'auditing' | 'verified' | 'rejected' | 'approved';
  draftContent?: string;
  auditReport?: GatekeeperAuditReport;
}

export interface GatekeeperAuditReport {
  pass: boolean;
  score: number; // 0 - 100
  timestamp: string;
  violations: string[];
  passedChecks: string[];
  certifiedBadge?: string;
}

export interface ExecutiveBriefing {
  id: string;
  macroGoal: string;
  generatedAt: string;
  chiefOfStaffSummary: string;
  workstreams: WorkstreamTask[];
  allWorkstreamsCertified: boolean;
  estimatedTokensSaved: number; // Tokens saved by running Gatekeeper first
  oneClickActions: {
    label: string;
    actionKey: string;
    payload: Record<string, any>;
  }[];
}

export class BusinessOperationsSuite {
  private static instance: BusinessOperationsSuite;

  private constructor() {}

  public static getInstance(): BusinessOperationsSuite {
    if (!BusinessOperationsSuite.instance) {
      BusinessOperationsSuite.instance = new BusinessOperationsSuite();
    }
    return BusinessOperationsSuite.instance;
  }

  /**
   * 1. Chief of Staff: Decompose macro goal into atomic departmental workstreams
   */
  public decomposeMacroGoal(macroGoal: string): ExecutiveBriefing {
    const briefingId = `briefing_${Date.now()}`;
    const workstreams: WorkstreamTask[] = [];

    const lower = macroGoal.toLowerCase();

    // Legal Workstream detection
    if (lower.includes('case') || lower.includes('claim') || lower.includes('dor') || lower.includes('trial') || lower.includes('deposition') || lower.includes('pleading') || lower.includes('lien')) {
      workstreams.push({
        id: `task_legal_${Date.now()}_1`,
        department: 'legal',
        title: 'Statutory Pleading & Case Law Synthesis',
        description: `Execute legal research, statutory citations, and draft 28-line legal document for objective: "${macroGoal}"`,
        assignedPersona: 'street-litigator',
        requiredModelTier: 'frontier_reasoning',
        status: 'pending'
      });
    }

    // Finance / Ledger Workstream detection
    if (lower.includes('fee') || lower.includes('billing') || lower.includes('interest') || lower.includes('penalty') || lower.includes('invoice') || lower.includes('4622') || lower.includes('5814') || lower.includes('money')) {
      workstreams.push({
        id: `task_finance_${Date.now()}_2`,
        department: 'finance',
        title: 'Statutory Interest & Ledger Audit',
        description: 'Reconcile billing ledger, calculate LC § 4622 10% penalties and 7% annual statutory interest with deterministic math.',
        assignedPersona: 'finance-operations',
        requiredModelTier: 'deterministic_math',
        status: 'pending'
      });
    }

    // Marketing / Content Repurposing Workstream
    if (lower.includes('transcript') || lower.includes('article') || lower.includes('client') || lower.includes('outreach') || lower.includes('marketing') || lower.includes('growth') || lower.includes('announcement')) {
      workstreams.push({
        id: `task_mktg_${Date.now()}_3`,
        department: 'marketing',
        title: 'Authority Asset & Outreach Packaging',
        description: 'Repurpose underlying legal insight or operational milestone into actionable client updates and authority carousels.',
        assignedPersona: 'marketing-growth',
        requiredModelTier: 'creative_precision',
        status: 'pending'
      });
    }

    // Default Operational Task if none matched specifically
    if (workstreams.length === 0) {
      workstreams.push({
        id: `task_ops_${Date.now()}_0`,
        department: 'operations',
        title: 'Operational Strategy & Execution Blueprint',
        description: `Formulate step-by-step sovereign workflow for: "${macroGoal}"`,
        assignedPersona: 'chief-of-staff',
        requiredModelTier: 'frontier_reasoning',
        status: 'pending'
      });
    }

    return {
      id: briefingId,
      macroGoal,
      generatedAt: new Date().toISOString(),
      chiefOfStaffSummary: `Macro objective received. Chief of Staff has allocated ${workstreams.length} departmental workstream(s). All workstreams are bound to Gatekeeper QA inspection prior to CEO review.`,
      workstreams,
      allWorkstreamsCertified: false,
      estimatedTokensSaved: workstreams.length * 2400,
      oneClickActions: [
        {
          label: 'Approve & Execute All Workstreams',
          actionKey: 'execute_all',
          payload: { briefingId }
        },
        {
          label: 'Stage for Selective Review',
          actionKey: 'stage_selective',
          payload: { briefingId }
        }
      ]
    };
  }

  /**
   * 2. The Gatekeeper: Ruthless Binary Verification & Security Audit
   */
  public auditDeliverable(content: string, department: string = 'general'): GatekeeperAuditReport {
    const violations: string[] = [];
    const passedChecks: string[] = [];

    // Check 1: Zero Placeholders Standard
    const placeholderRegex = /\[(Insert|TBD|Client\s*Name|Date|Amount|Case\s*No|Signature|TBA|Address|Doctor|Claim\s*Number)[^\]]*\]/gi;
    const placeholderMatches = content.match(placeholderRegex);
    if (placeholderMatches && placeholderMatches.length > 0) {
      violations.push(`Zero-Placeholder Violation: Detected bracketed placeholders: ${placeholderMatches.slice(0, 3).join(', ')}`);
    } else {
      passedChecks.push('Zero-Placeholder Audit: 100% Resolved (Zero brackets detected)');
    }

    // Check 2: Privacy / PII Firewall Check
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnRegex.test(content)) {
      violations.push('Privacy Shield Violation: Raw unredacted SSN detected in draft text.');
    } else {
      passedChecks.push('Privacy Firewall: Zero raw SSNs exposed');
    }

    // Check 3: Third-Party Sanitization Check
    const thirdPartyRegex = /\b(obsidian|notion|salesforce|clio|zapier)\b/gi;
    const thirdPartyMatches = content.match(thirdPartyRegex);
    if (thirdPartyMatches && thirdPartyMatches.length > 0) {
      violations.push(`Third-Party Brand Violation: Found unauthorized commercial references: ${Array.from(new Set(thirdPartyMatches)).join(', ')}. Use internal Sovereign Fabric terminology.`);
    } else {
      passedChecks.push('Sovereign Purity: Zero third-party lock-in references');
    }

    // Check 4: Anti-Fluff Brand Voice Check
    const fluffRegex = /\b(delve|testament|tapestry|in summary, it is important to|beacon of hope)\b/gi;
    const fluffMatches = content.match(fluffRegex);
    if (fluffMatches && fluffMatches.length > 0) {
      violations.push(`Brand Voice Warning: Generic AI fluff terms found: ${Array.from(new Set(fluffMatches)).join(', ')}.`);
    } else {
      passedChecks.push('Tone Quality: Authoritative Sovereign Voice');
    }

    // Check 5: Legal Verbatim Requirements (if legal)
    if (department === 'legal') {
      if (!content.includes('Labor Code') && !content.includes('8 CCR') && !content.includes('ADJ') && !content.includes('WCAB')) {
        violations.push('Statutory Grounding Warning: Legal draft lacks concrete California statutory or regulatory anchors.');
      } else {
        passedChecks.push('Statutory Grounding: California statutory references verified');
      }
    }

    const pass = violations.length === 0;
    const score = Math.max(0, 100 - (violations.length * 25));

    return {
      pass,
      score,
      timestamp: new Date().toISOString(),
      violations,
      passedChecks,
      certifiedBadge: pass ? 'GATEKEEPER_CERTIFIED_PASS' : undefined
    };
  }

  /**
   * 3. Institutional Scribe: Commit verified playbook to Sovereign Fabric Vault
   */
  public generateVaultManifest(
    title: string,
    objective: string,
    deliverables: { taskTitle: string; content: string }[]
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const header = `---
title: "${title}"
date: "${timestamp}"
author: "Institutional Scribe"
pack: "business-operations"
verified_by: "The Gatekeeper QA"
status: "PERMANENT_RECORD"
---

# ${title}
*Archived into Sovereign Fabric Vault on ${timestamp}*

## Macro Objective
${objective}

## Departmental Deliverables & Playbooks
`;

    const sections = deliverables.map(d => `
### ${d.taskTitle}
\`\`\`markdown
${d.content}
\`\`\`
`).join('\n---\n');

    return header + sections;
  }
}

export const businessSuite = BusinessOperationsSuite.getInstance();
