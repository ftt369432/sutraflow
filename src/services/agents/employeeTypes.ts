/**
 * 🏛️ AI EMPLOYEE & MULTI-AGENT ORG CHART TYPES
 * ============================================================================
 * Strongly-typed definitions for sovereign AI employees, supervisory hierarchy,
 * gatekeeper verification, and human-in-the-loop approval workflows.
 * ============================================================================
 */

export type EmployeeRole = 'orchestrator' | 'verifier' | 'scribe' | 'worker';
export type DepartmentType = 'executive' | 'quality' | 'memory' | 'revenue' | 'legal' | 'finance' | 'custom';
export type ModelTier = 'frontier_reasoning' | 'fast_verifier' | 'creative_precision' | 'deterministic_math';
export type HighStakesAction = 'external_email' | 'financial_transfer' | 'court_filing' | 'contract_sign' | 'calendar_booking';

export interface AIEmployee {
  id: string;
  name: string; // User-customizable name (e.g., "Commander", "Sentinel", "Oracle", "Hunter")
  title: string; // e.g., "Chief of Staff", "Quality Gatekeeper", "Chief Revenue Officer"
  role: EmployeeRole;
  department: DepartmentType;
  avatarIcon: string; // Lucide icon identifier
  modelTier: ModelTier;
  reportsTo?: string; // ID of supervising employee (default: 'chief-of-staff')
  status: 'active' | 'idle' | 'working' | 'auditing';
  allowedTools: string[];
  requiresApprovalFor: HighStakesAction[];
  systemDirectives: string;
  isCustom?: boolean;
  metrics: {
    tasksCompleted: number;
    passRate: number; // 0 - 100%
    tokensSaved: number;
  };
}

export interface GatekeeperVerificationReport {
  pass: boolean;
  score: number; // 0 - 100
  timestamp: string;
  verifiedBy: string; // Name of the Gatekeeper employee
  violations: string[];
  passedChecks: string[];
  certifiedBadge?: string;
}

export interface WorkstreamTask {
  id: string;
  department: DepartmentType;
  title: string;
  description: string;
  assignedEmployeeId: string;
  requiredModelTier: ModelTier;
  status: 'pending' | 'in_progress' | 'drafted' | 'auditing' | 'verified' | 'rejected' | 'approved' | 'staged_for_approval';
  draftContent?: string;
  auditReport?: GatekeeperVerificationReport;
  pendingAction?: {
    actionType: HighStakesAction;
    recipientOrTarget?: string;
    payloadPreview: string;
  };
}

export interface ApprovalItem {
  id: string;
  taskId: string;
  employeeId: string;
  employeeName: string;
  actionType: HighStakesAction;
  title: string;
  previewContent: string;
  recipientOrTarget?: string;
  stagedAt: string;
  status: 'pending' | 'authorized' | 'rejected';
}

export interface ExecutiveMissionBriefing {
  id: string;
  macroGoal: string;
  generatedAt: string;
  conductorSummary: string;
  workstreams: WorkstreamTask[];
  allWorkstreamsCertified: boolean;
  tokensSaved: number;
}
