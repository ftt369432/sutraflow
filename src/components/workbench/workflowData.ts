export interface WorkflowItem {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'petition' | 'qme' | 'trial' | 'lien' | 'audit' | 'custom' | 'strategy' | 'tax' | 'protocol' | 'regulatory' | string;
  domain?: 'legal' | 'medical' | 'accounting' | 'biotech' | 'architecture' | 'real_estate' | 'custom' | 'all' | string;
  icon: string;
  prompt: string;
  filename?: string;
  isCustom?: boolean;
}

export const BUILTIN_WORKFLOWS: WorkflowItem[] = [
  // ==========================================
  // LEGAL DOMAIN WORKFLOWS
  // ==========================================
  {
    id: 'case-fact-manifest',
    name: 'case-fact-manifest',
    title: 'Persistent Case Fact Manifest',
    description: 'Forensic extraction of party directory, 10-point ground truth, billing ledger, and UR/MPN audit into persistent Markdown.',
    category: 'audit',
    domain: 'legal',
    icon: 'brain',
    prompt: 'Conduct an exhaustive forensic case audit across all available client documents, exhibits, and billing records. Compile a dedicated, persistent Client Fact Manifest (CASE_ANALYSIS_AND_LIST_OF_FACTS_<NAME>.md) directly in the client folder with complete 10-point ground-truth facts: party directory, industrial injury profile, PTP history, medical chronology, itemized billing ledger, daisyBill/Jopari audit trail, UR compliance, MPN audit, and settlement non-binding status under Beverly Hills Multispecialty Group.',
    filename: '.agents/workflows/case-fact-manifest.md'
  },
  {
    id: 'penalty-petition-drafting',
    name: 'penalty-petition-drafting',
    title: 'Penalty Petition (LC § 4622 / § 5814)',
    description: 'Analyzes payment delays to calculate 10% penalty + 7% interest and draft 28-line petition.',
    category: 'petition',
    domain: 'legal',
    icon: 'scale',
    prompt: 'Draft a formal California 28-line Petition for Penalties and Statutory Interest under California Labor Code § 4622(a)(1) (60-day payment mandate, 10% penalty + 7% interest) and Labor Code § 5814 (unreasonable delay penalty up to $10,000), citing Colamonico v. Secure Transportation (en banc) and 8 CCR § 10786.',
    filename: '.agents/workflows/penalty-petition-drafting.md'
  },
  {
    id: 'add_pqme_procedure',
    name: 'add_pqme_procedure',
    title: 'Petition for Additional Panel QME',
    description: 'Drafts a petition requesting an additional specialty QME panel based on specialist deferrals or denials.',
    category: 'qme',
    domain: 'legal',
    icon: 'stethoscope',
    prompt: 'Draft a California 28-line Petition for Additional Panel QME under Labor Code §§ 4060, 4061, 4062 and 8 CCR § 31.5. Document all QME specialty deferrals/consultations and employer denials to compel DWC Medical Unit panel issuance without delay.',
    filename: '.agents/workflows/add_pqme_procedure.md'
  },
  {
    id: 'prior-counsel-lien-defense',
    name: 'prior-counsel-lien-defense',
    title: 'Prior Counsel Fee Lien Defense',
    description: 'Defends attorney fees against prior counsel liens using forensic audit and Quantum Meruit analysis.',
    category: 'lien',
    domain: 'legal',
    icon: 'shield-check',
    prompt: 'Draft an Objection and Trial Brief defending Attorney Fees against Prior Counsel Fee Lien under Quantum Meruit principles (Fracasse v. Brent, Lab. Code § 4903(a)). Conduct a forensic timeline audit establishing our sole procuring cause of recovery.',
    filename: '.agents/workflows/prior-counsel-lien-defense.md'
  },
  {
    id: 'generate-trial-brief',
    name: 'generate-trial-brief',
    title: 'Lien Claimant Trial Brief',
    description: 'Generates a 28-line Lien Claimant Trial Brief with 11-point fact framework and Dubon II / McCoy arguments.',
    category: 'trial',
    domain: 'legal',
    icon: 'scale',
    prompt: 'Draft a 28-line California WCAB Lien Claimant Trial Brief under 8 CCR § 10786 and Labor Code § 4600. Deploy binding authorities on substantial evidence, loss of medical control (McCoy v. IAC), and employer waiver of billing defenses.',
    filename: '.agents/workflows/generate-trial-brief.md'
  },
  {
    id: 'depo-prep',
    name: 'depo-prep',
    title: 'Deposition Question Matrix & HUD',
    description: 'Builds a cross-examination question matrix and real-time deposition strategy outline from case records.',
    category: 'trial',
    domain: 'legal',
    icon: 'clipboard-list',
    prompt: 'Generate an exhaustive Cross-Examination Deposition Matrix and Examination Outline for the upcoming deposition, analyzing applicant statements, prior medical history, mechanism of injury, and apportionment vulnerabilities.',
    filename: '.agents/workflows/depo-prep.md'
  },
  {
    id: 'attorney-fee-petition-prep',
    name: 'attorney-fee-petition-prep',
    title: 'Attorney Fee Petition ($10k+ Target)',
    description: 'Compiles a high-value Attorney Fee Petition under LC § 5710, § 5813, or § 5814.5.',
    category: 'petition',
    domain: 'legal',
    icon: 'dollar-sign',
    prompt: 'Draft a California 28-line Petition for Attorney Fees and Costs under Labor Code § 5710 (deposition appearance) and Labor Code § 5813 (bad-faith tactics), incorporating itemized time declarations, hourly rate justification ($450-$550/hr), and lodestar enhancement.',
    filename: '.agents/workflows/attorney-fee-petition-prep.md'
  },
  {
    id: 'analyze-medical-pdf',
    name: 'analyze-medical-pdf',
    title: 'Medical Chronology & Exhibit Index',
    description: 'Extracts chronological medical history, PTP/QME ratings, and generates exhibit summary table.',
    category: 'audit',
    domain: 'legal',
    icon: 'search',
    prompt: 'Analyze the attached medical records and generate a comprehensive 7-column Chronological Medical Exhibit Sheet including Date of Service, Provider, Treatment Summary, Whole Person Impairment (WPI), Work Restrictions, and Apportionment Findings.',
    filename: '.agents/workflows/analyze-medical-pdf.md'
  },
  {
    id: 'forensic-document-review-audit',
    name: 'forensic-document-review-audit',
    title: 'Forensic Fee Petition Audit',
    description: 'Audits carrier bill review explanations and payments for statutory interest/penalty triggers.',
    category: 'audit',
    domain: 'legal',
    icon: 'microscope',
    prompt: 'Conduct a Forensic Document Review Audit on all attached billing records, EORs, and check stubs. Calculate exact delinquency dates, missing 10% statutory increases under LC § 4622 / § 4603.2, and 7% annual interest.',
    filename: '.agents/workflows/forensic-document-review-audit.md'
  },
  {
    id: 'respond-to-wcj-report',
    name: 'respond-to-wcj-report',
    title: 'Rebuttal to WCJ Report (8 CCR § 10964)',
    description: 'Line-by-line rebuttal to a WCJ Report & Recommendation for Appeals Board Reconsideration.',
    category: 'petition',
    domain: 'legal',
    icon: 'scroll',
    prompt: 'Draft an Applicant Response and Rebuttal Package to the WCJ Report and Recommendation under 8 CCR § 10964. Conduct a point-by-point factual and legal rebuttal demonstrating that the findings are not supported by substantial evidence.',
    filename: '.agents/workflows/respond-to-wcj-report.md'
  },
  {
    id: 'intake-audit-and-form-fill',
    name: 'intake-audit-and-form-fill',
    title: 'Intake Audit & WCAB Form Fill',
    description: 'Auto-extracts client wage, injury, and employer data to pre-fill DWC-1 and Application for Adjudication.',
    category: 'audit',
    domain: 'legal',
    icon: 'file-text',
    prompt: 'Perform an Intake Audit on the client records: extract claimant identifiers, average weekly wage (AWW), TTD/PPD rate, specific and cumulative trauma dates, and pre-fill the WCAB Application for Adjudication of Claim.',
    filename: '.agents/workflows/intake-audit-and-form-fill.md'
  },
  {
    id: 'compile-civil-pleading',
    name: 'compile-civil-pleading',
    title: '28-Line California Pleading Paper',
    description: 'Structures any legal argument into exact California 28-line format with legal captions.',
    category: 'petition',
    domain: 'legal',
    icon: 'landmark',
    prompt: 'Format and compile the provided brief into California 28-line legal pleading paper format with Gutierrez law firm caption, table of authorities, numbered line layout, and formal prayer for relief.',
    filename: '.agents/workflows/compile-civil-pleading.md'
  },
  {
    id: 'petition-for-penalties',
    name: 'petition-for-penalties',
    title: 'Comprehensive Petition for Penalties',
    description: 'All-inclusive multi-count penalty petition (LC § 5814, § 4622, § 4603.2, § 5813).',
    category: 'petition',
    domain: 'legal',
    icon: 'scale',
    prompt: 'Draft an exhaustive Multi-Count Petition for Penalties, Interest, Costs, and Sanctions under California Labor Code §§ 5814, 4622, 4603.2, and 5813, establishing unreasonable carrier delay and bad-faith litigation tactics.',
    filename: '.agents/workflows/petition-for-penalties.md'
  },

  // ==========================================
  // ACCOUNTING & TAX DOMAIN WORKFLOWS
  // ==========================================
  {
    id: 'corporate-tax-audit',
    name: 'corporate-tax-audit',
    title: 'Entity Tax & Pass-Through Audit',
    description: 'Analyzes entity structure (LLC, S-Corp, C-Corp) for optimal deduction and self-employment tax shields.',
    category: 'tax',
    domain: 'accounting',
    icon: 'bar-chart-3',
    prompt: 'Conduct an Entity Tax Optimization Audit. Analyze 1099 vs W2 distributions, pass-through entity tax (PTET) election benefits under California AB 150, Section 179 depreciation opportunities, and reasonable salary benchmarking.',
    filename: '.agents/workflows/corporate-tax-audit.md'
  },
  {
    id: 'pnl-forensic-review',
    name: 'pnl-forensic-review',
    title: 'P&L & Balance Sheet Forensics',
    description: 'Forensic reconciliation of income statements, recurring expense leakage, and cash burn projections.',
    category: 'audit',
    domain: 'accounting',
    icon: 'trending-up',
    prompt: 'Perform a Forensic P&L and Balance Sheet Review. Identify expense anomalies, EBITDA margins, working capital ratio health, and highlight recurring leakage with actionable cost-cutting recommendations.',
    filename: '.agents/workflows/pnl-forensic-review.md'
  },
  {
    id: 'vendor-contract-reconciliation',
    name: 'vendor-contract-reconciliation',
    title: 'Vendor Contract & Invoicing Reconciliation',
    description: 'Cross-checks invoice records against statement of work covenants and fee schedules.',
    category: 'audit',
    domain: 'accounting',
    icon: 'receipt',
    prompt: 'Reconcile all attached vendor invoices against the master services agreement. Audit hourly rates, milestone completion criteria, billed expenses, and calculate any uncredited discounts or overcharges.',
    filename: '.agents/workflows/vendor-contract-reconciliation.md'
  },

  // ==========================================
  // MEDICAL / CLINICAL DOMAIN WORKFLOWS
  // ==========================================
  {
    id: 'clinical-case-fact-manifest',
    name: 'clinical-case-fact-manifest',
    title: 'Clinical Case Fact Manifest',
    description: 'Forensic clinical chronology, diagnostic imaging, PR-2 reports, and MTUS necessity in persistent Markdown.',
    category: 'audit',
    domain: 'medical',
    icon: 'brain',
    prompt: 'Conduct a comprehensive clinical record audit and generate a persistent CASE_ANALYSIS_AND_LIST_OF_FACTS_<NAME>.md in the patient directory covering complete diagnostic imaging, PR-2 reports, treatment dates of service, and MTUS/ACOEM necessity compliance.',
    filename: '.agents/workflows/case-fact-manifest.md'
  },
  {
    id: 'clinical-chronology-synthesis',
    name: 'clinical-chronology-synthesis',
    title: 'Clinical Treatment Chronology',
    description: 'Chronological timeline of diagnostic imaging, operative notes, and treatment progress.',
    category: 'audit',
    domain: 'medical',
    icon: 'building',
    prompt: 'Synthesize a comprehensive clinical treatment chronology from the medical exhibits: extract dates of examination, objective findings (MRI, EMG, ROM), diagnosis codes, prescribed modalities, and functional progress notes.',
    filename: '.agents/workflows/clinical-chronology-synthesis.md'
  },
  {
    id: 'omfs-billing-audit',
    name: 'omfs-billing-audit',
    title: 'OMFS Medical-Legal Fee Audit',
    description: 'Calculates compliant California Official Medical Fee Schedule charges (ML201–ML204).',
    category: 'audit',
    domain: 'medical',
    icon: 'stethoscope',
    prompt: 'Audit the medical-legal billing packet under 8 CCR § 9795 (OMFS). Verify page count threshold for ML201 vs ML202, complexity modifiers under ML203, and generate a conforming billing reconciliation statement.',
    filename: '.agents/workflows/omfs-billing-audit.md'
  },

  // ==========================================
  // BIOTECH & SCIENCE DOMAIN WORKFLOWS
  // ==========================================
  {
    id: 'clinical-trial-protocol',
    name: 'clinical-trial-protocol',
    title: 'Clinical Trial Protocol Audit',
    description: 'Evaluates trial design, inclusion/exclusion criteria, and primary endpoint metrics.',
    category: 'protocol',
    domain: 'biotech',
    icon: 'dna',
    prompt: 'Review the attached clinical trial protocol against FDA and ICH-GCP guidelines. Audit patient cohort size, randomized control methodology, primary/secondary endpoints, and safety monitoring checkpoints.',
    filename: '.agents/workflows/clinical-trial-protocol.md'
  },
  {
    id: 'fda-ind-checklist',
    name: 'fda-ind-checklist',
    title: 'FDA IND Regulatory Strategy',
    description: 'Assesses Investigational New Drug application requirements and preclinical documentation.',
    category: 'regulatory',
    domain: 'biotech',
    icon: 'flask-conical',
    prompt: 'Draft an FDA IND Pre-Submission Regulatory Strategy Brief. Detail pharmacology/toxicology requirements, CMC manufacturing readiness, proposed Phase 1 human trial safety protocol, and investigator brochure structure.',
    filename: '.agents/workflows/fda-ind-checklist.md'
  },

  // ==========================================
  // GENERAL & STRATEGY (AVAILABLE EVERYWHERE)
  // ==========================================
  {
    id: 'executive-strategic-brief',
    name: 'executive-strategic-brief',
    title: 'Executive Strategic Action Matrix',
    description: 'Distills complex documents into high-impact executive decision matrix with risks and next steps.',
    category: 'strategy',
    domain: 'all',
    icon: 'target',
    prompt: 'Review the attached materials and synthesize an Executive Strategic Action Matrix. Detail: 1) Core executive summary, 2) Critical opportunities & competitive advantages, 3) High-risk operational vulnerabilities, and 4) Prioritized action items with ownership and timelines.',
    filename: '.agents/workflows/executive-strategic-brief.md'
  },
  {
    id: 'forensic-document-audit',
    name: 'forensic-document-audit',
    title: 'Universal Forensic Discrepancy Audit',
    description: 'Line-by-line audit detecting mathematical errors, timeline contradictions, and missing exhibits.',
    category: 'audit',
    domain: 'all',
    icon: 'search',
    prompt: 'Conduct a thorough Forensic Discrepancy Audit across all provided documents. Cross-examine dates, dollar amounts, party statements, and identify any inconsistencies, altered figures, or missing corroborating exhibits.',
    filename: '.agents/workflows/forensic-document-audit.md'
  },
  {
    id: 'agentify-business-audit',
    name: 'agentify-business-audit',
    title: '48-Hr Business Agentification Audit',
    description: 'Forensic click-path and friction analysis to transform manual business workflows into sovereign local AI agent workforces.',
    category: 'audit',
    domain: 'custom',
    icon: 'zap',
    prompt: 'Conduct a comprehensive 48-Hour Business Agentification Audit. Analyze manual click-paths, repetitive document-heavy bottlenecks, human data entry friction, and output requirements to design turnkey, local-first agent skills and an implementation roadmap.',
    filename: '.agents/workflows/agentify_business_audit.md'
  },
  {
    id: 'agnetics-launch-roadmap',
    name: 'agnetics-launch-roadmap',
    title: 'AGNETICS Executive Launch Plan',
    description: 'Comprehensive business formation, 3-tier ATaaS service architecture, 90-day sprint, and unit economics.',
    category: 'strategy',
    domain: 'custom',
    icon: 'rocket',
    prompt: 'Load and review the master launch plan for AGNETICS (Agentic Transformation as a Service). Synthesize market positioning, client tiering (Skill Library, Skill Forge, Platform OS), and immediate 90-day sprint execution tasks.',
    filename: 'AGNETICS/AGNETICS_MASTER_PLAN.md'
  },
  {
    id: 'sovereign-dashboard-builder',
    name: 'sovereign-dashboard-builder',
    title: 'Sovereign HTML Dashboard Builder',
    description: 'Generates zero-dependency, local-storage persistent command center HTML dashboards for any business domain.',
    category: 'custom',
    domain: 'all',
    icon: 'bar-chart-3',
    prompt: 'Generate an interactive, zero-dependency, single-file HTML command center dashboard with metric cards, Kanban board, status filters, dark mode toggle, and localStorage persistence.',
    filename: 'AGNETICS/dashboards/AGNETICS_COMMAND_CENTER.html'
  }
];

const CUSTOM_WORKFLOWS_KEY = 'genieflow_custom_workflows';

export function getCustomWorkflows(): WorkflowItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_WORKFLOWS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (_e) {
    return [];
  }
}

export function getAllWorkflows(): WorkflowItem[] {
  const custom = getCustomWorkflows();
  return [...BUILTIN_WORKFLOWS, ...custom];
}

/**
 * Returns workflows filtered by active domain.
 * Includes domain-specific workflows, universal ('all') workflows, and user custom workflows.
 */
export function getWorkflowsForDomain(domain?: string): WorkflowItem[] {
  const all = getAllWorkflows();
  if (!domain || domain === 'all') return all;
  
  return all.filter(w => {
    if (w.isCustom) return true;
    if (w.domain === 'all') return true;
    if (w.domain === domain) return true;
    return false;
  });
}

export function saveCustomWorkflow(wf: WorkflowItem): WorkflowItem[] {
  const custom = getCustomWorkflows();
  const existingIndex = custom.findIndex(c => c.id === wf.id);
  let updated: WorkflowItem[];
  if (existingIndex >= 0) {
    updated = [...custom];
    updated[existingIndex] = { ...wf, isCustom: true };
  } else {
    updated = [{ ...wf, isCustom: true }, ...custom];
  }
  try {
    localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(updated));
  } catch (_e) {}
  return [...BUILTIN_WORKFLOWS, ...updated];
}

export function deleteCustomWorkflow(id: string): WorkflowItem[] {
  const custom = getCustomWorkflows().filter(c => c.id !== id);
  try {
    localStorage.setItem(CUSTOM_WORKFLOWS_KEY, JSON.stringify(custom));
  } catch (_e) {}
  return [...BUILTIN_WORKFLOWS, ...custom];
}
