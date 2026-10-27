import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIEmployee, ApprovalItem, HighStakesAction, WorkstreamTask, ExecutiveMissionBriefing } from '../services/agents/employeeTypes';

export const DEFAULT_AI_EMPLOYEES: AIEmployee[] = [
  {
    id: 'chief-of-staff',
    name: 'Executive Conductor',
    title: 'Chief of Staff & Operational Manager',
    role: 'orchestrator',
    department: 'executive',
    avatarIcon: 'Briefcase',
    modelTier: 'frontier_reasoning',
    status: 'active',
    allowedTools: ['decompose_macro_goal', 'assign_department_task', 'compile_executive_brief', 'read_sovereign_vault'],
    requiresApprovalFor: ['contract_sign'],
    systemDirectives: 'Decompose macro objectives into atomic department workstreams. Synthesize reports and never forward raw noise to the CEO. Always require Gatekeeper verification before review.',
    metrics: { tasksCompleted: 42, passRate: 98, tokensSaved: 124800 }
  },
  {
    id: 'gatekeeper-qa',
    name: 'Rule Enforcer',
    title: 'Quality Gatekeeper & Compliance Auditor',
    role: 'verifier',
    department: 'quality',
    avatarIcon: 'ShieldCheck',
    modelTier: 'fast_verifier',
    reportsTo: 'chief-of-staff',
    status: 'active',
    allowedTools: ['audit_deliverable', 'reject_defective', 'certify_deliverable', 'verify_pii_firewall'],
    requiresApprovalFor: [],
    systemDirectives: 'Perform strict binary pass/fail verification. Catch bracketed placeholders, unredacted PII, unauthorized commercial tools, and ungrounded assertions before deliverables reach executive review.',
    metrics: { tasksCompleted: 118, passRate: 94, tokensSaved: 284000 }
  },
  {
    id: 'cro-growth',
    name: 'Revenue Hunter',
    title: 'Chief Revenue Officer & Outbound Lead',
    role: 'worker',
    department: 'revenue',
    avatarIcon: 'TrendingUp',
    modelTier: 'creative_precision',
    reportsTo: 'chief-of-staff',
    status: 'idle',
    allowedTools: ['search_web', 'prospect_contacts', 'draft_outreach_email', 'schedule_followup'],
    requiresApprovalFor: ['external_email', 'calendar_booking'],
    systemDirectives: 'Proactively generate income, discover high-value prospects, track connection follow-ups, and stage tailored outreach messaging for 1-click human approval.',
    metrics: { tasksCompleted: 29, passRate: 96, tokensSaved: 68500 }
  },
  {
    id: 'institutional-scribe',
    name: 'Vault Scribe',
    title: 'Institutional Memory & SOP Logger',
    role: 'scribe',
    department: 'memory',
    avatarIcon: 'Database',
    modelTier: 'fast_verifier',
    reportsTo: 'chief-of-staff',
    status: 'idle',
    allowedTools: ['write_sovereign_vault', 'update_client_fact_manifest', 'log_sop', 'catalog_precedent'],
    requiresApprovalFor: [],
    systemDirectives: 'Guarantee institutional learning. Log verified patterns, client facts, and operational playbooks directly into the local Sovereign Fabric Vault as Markdown records.',
    metrics: { tasksCompleted: 64, passRate: 100, tokensSaved: 153000 }
  },
  {
    id: 'senior-litigator',
    name: 'Legal Counsel',
    title: 'Senior Workers\' Comp Litigator',
    role: 'worker',
    department: 'legal',
    avatarIcon: 'Scale',
    modelTier: 'frontier_reasoning',
    reportsTo: 'chief-of-staff',
    status: 'idle',
    allowedTools: ['lookup_labor_code', 'crosswalk_8ccr_rule', 'lookup_med_legal_case', 'compile_pleading_docx', 'view_file'],
    requiresApprovalFor: ['court_filing'],
    systemDirectives: 'Relentlessly prosecute claims and statutory compliance. Quote California Labor Code and 8 CCR verbatim. Compile 28-line legal pleadings with zero placeholders.',
    metrics: { tasksCompleted: 87, passRate: 99, tokensSaved: 210000 }
  },
  {
    id: 'finance-auditor',
    name: 'Ledger Sentinel',
    title: 'Finance & Statutory Billing Specialist',
    role: 'worker',
    department: 'finance',
    avatarIcon: 'DollarSign',
    modelTier: 'deterministic_math',
    reportsTo: 'chief-of-staff',
    status: 'idle',
    allowedTools: ['run_command', 'audit_billing_ledger', 'calculate_statutory_interest', 'compute_penalty_exposure'],
    requiresApprovalFor: ['financial_transfer'],
    systemDirectives: 'Audit medical-legal billing under LC § 4622. Calculate mandatory 10% penalties and 7% annual statutory interest deterministically using verified math engines.',
    metrics: { tasksCompleted: 53, passRate: 100, tokensSaved: 95400 }
  }
];

interface AIEmployeeState {
  employees: AIEmployee[];
  activeBriefing: ExecutiveMissionBriefing | null;
  approvalQueue: ApprovalItem[];
  selectedEmployeeId: string | null;

  // Employee Management Actions
  updateEmployee: (id: string, updates: Partial<AIEmployee>) => void;
  renameEmployee: (id: string, newName: string) => void;
  addEmployee: (employee: Omit<AIEmployee, 'metrics'>) => void;
  deleteEmployee: (id: string) => void;
  resetToDefaults: () => void;
  setSelectedEmployeeId: (id: string | null) => void;

  // Mission & Workstream Actions
  setActiveBriefing: (briefing: ExecutiveMissionBriefing | null) => void;
  updateWorkstreamStatus: (taskId: string, status: WorkstreamTask['status'], draftContent?: string) => void;

  // 1-Click Human Approval Actions
  stageApprovalItem: (item: Omit<ApprovalItem, 'id' | 'stagedAt' | 'status'>) => void;
  authorizeApprovalItem: (id: string) => void;
  rejectApprovalItem: (id: string) => void;
}

export const useAIEmployeeStore = create<AIEmployeeState>()(
  persist(
    (set) => ({
      employees: DEFAULT_AI_EMPLOYEES,
      activeBriefing: null,
      approvalQueue: [
        {
          id: 'approval_init_1',
          taskId: 'task_cro_demo',
          employeeId: 'cro-growth',
          employeeName: 'Revenue Hunter',
          actionType: 'external_email',
          title: 'Direct Outreach to Third-Party Administrator Claims Director',
          recipientOrTarget: 'claims-director@gallagherbassett.example.com',
          previewContent: 'Subject: Formal Meet-and-Confer: Outstanding LC § 4622 Penalties on ADJ Claims\n\nDear Claims Director,\n\nOur audit reflects $14,850.00 in delinquent medical-legal billing past the 60-day statutory window. We request immediate tender to avoid formal penalty and attorney fee petitions under Labor Code § 4622(a)(1).',
          stagedAt: new Date().toISOString(),
          status: 'pending'
        }
      ],
      selectedEmployeeId: 'chief-of-staff',

      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...updates } : emp
          )
        })),

      renameEmployee: (id, newName) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, name: newName.trim() } : emp
          )
        })),

      addEmployee: (employee) =>
        set((state) => ({
          employees: [
            ...state.employees,
            {
              ...employee,
              metrics: { tasksCompleted: 0, passRate: 100, tokensSaved: 0 }
            }
          ]
        })),

      deleteEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id)
        })),

      resetToDefaults: () =>
        set({ employees: DEFAULT_AI_EMPLOYEES }),

      setSelectedEmployeeId: (id) =>
        set({ selectedEmployeeId: id }),

      setActiveBriefing: (briefing) =>
        set({ activeBriefing: briefing }),

      updateWorkstreamStatus: (taskId, status, draftContent) =>
        set((state) => {
          if (!state.activeBriefing) return state;
          const updatedWorkstreams = state.activeBriefing.workstreams.map((task) =>
            task.id === taskId
              ? { ...task, status, ...(draftContent ? { draftContent } : {}) }
              : task
          );
          return {
            activeBriefing: {
              ...state.activeBriefing,
              workstreams: updatedWorkstreams,
              allWorkstreamsCertified: updatedWorkstreams.every((t) => t.status === 'verified' || t.status === 'approved')
            }
          };
        }),

      stageApprovalItem: (item) =>
        set((state) => ({
          approvalQueue: [
            {
              ...item,
              id: `approval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              stagedAt: new Date().toISOString(),
              status: 'pending'
            },
            ...state.approvalQueue
          ]
        })),

      authorizeApprovalItem: (id) =>
        set((state) => ({
          approvalQueue: state.approvalQueue.map((item) =>
            item.id === id ? { ...item, status: 'authorized' } : item
          )
        })),

      rejectApprovalItem: (id) =>
        set((state) => ({
          approvalQueue: state.approvalQueue.map((item) =>
            item.id === id ? { ...item, status: 'rejected' } : item
          )
        }))
    }),
    {
      name: 'sutraflow_ai_employees_vault',
      partialize: (state) => ({
        employees: state.employees,
        approvalQueue: state.approvalQueue
      })
    }
  )
);
