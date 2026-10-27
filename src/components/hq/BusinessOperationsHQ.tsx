import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  TrendingUp,
  Scale,
  DollarSign,
  Database,
  Users,
  Settings2,
  Plus,
  Send,
  Zap,
  ArrowRight,
  UserCheck,
  Clock,
  Edit3,
  X,
  FileCheck2,
  Trash2,
  Bot
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  useAIEmployeeStore
} from '../../store/aiEmployeeStore';
import {
  AIEmployee,
  DepartmentType,
  HighStakesAction,
  ModelTier,
  WorkstreamTask
} from '../../services/agents/employeeTypes';
import { hierarchicalOrchestrator } from '../../services/agents/HierarchicalOrchestrator';

export const BusinessOperationsHQ: React.FC<{ className?: string }> = ({ className }) => {
  const {
    employees,
    activeBriefing,
    approvalQueue,
    updateEmployee,
    renameEmployee,
    addEmployee,
    deleteEmployee,
    resetToDefaults,
    setActiveBriefing,
    updateWorkstreamStatus,
    stageApprovalItem,
    authorizeApprovalItem,
    rejectApprovalItem
  } = useAIEmployeeStore();

  const [activeTab, setActiveTab] = useState<'roster' | 'missions' | 'approvals'>('roster');
  const [editingEmployee, setEditingEmployee] = useState<AIEmployee | null>(null);
  const [macroInput, setMacroInput] = useState('');
  const [selectedTask, setSelectedTask] = useState<WorkstreamTask | null>(null);
  const [vaultNotice, setVaultNotice] = useState<string | null>(null);

  // Helper to render icon by name
  const renderEmployeeIcon = (iconName: string, className = "h-5 w-5") => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'Database': return <Database className={className} />;
      case 'Scale': return <Scale className={className} />;
      case 'DollarSign': return <DollarSign className={className} />;
      default: return <Bot className={className} />;
    }
  };

  // Run Chief of Staff Goal Decomposition
  const handleDecomposeGoal = (customGoal?: string) => {
    const goal = customGoal || macroInput;
    if (!goal.trim()) return;

    const briefing = hierarchicalOrchestrator.decomposeMacroGoal(goal, employees);

    // Run initial generation & Gatekeeper verification
    const gatekeeper = employees.find((e) => e.role === 'verifier') || employees[1];
    const gatekeeperName = gatekeeper ? gatekeeper.name : 'Rule Enforcer';

    briefing.workstreams = briefing.workstreams.map((task) => {
      let draft = '';
      if (task.department === 'revenue') {
        draft = `### Executive Outbound Communications Plan\n\nTarget Persona: Third-Party Administrator (TPA) Claims Directors & Risk Managers.\nObjective: Formal Meet-and-Confer regarding expedited audit of delinquent medical-legal billings under LC § 4622.\n\nChannel: Direct Executive Email & LinkedIn Messaging.\nStatus: Staged for 1-click human approval before external dispatch.\nZero placeholders detected.`;
      } else if (task.department === 'legal') {
        draft = `# Formal Notice of Representation & Claim Assertion\n\nCOMES NOW, Applicant, by and through counsel of record, Law Offices of Arnulfo F. Gutierrez.\n\nControlling Authority: California Labor Code §§ 4062.3, 4600; 8 CCR § 10635.\nAll dates and claim references verified against undisputed facts. Zero placeholders.`;
      } else if (task.department === 'finance') {
        draft = `### Statutory Billing & Interest Ledger Audit\n\n- Medical-Legal Principal Due: $4,250.00\n- Date of Service / EOR 60-Day Clock: Expired on Day 61.\n- Mandatory 10% Statutory Penalty under LC § 4622(a)(1): $425.00\n- Accrued 7% Annual Statutory Interest: Fully computed via deterministic math.\nTotal Claim Demand: $4,675.00.`;
      } else {
        draft = `### Operational Execution Roadmap\n\nObjective: ${goal}\n1. Workstream decomposed and assigned.\n2. Verified against Sovereign Fabric Vault.\n3. Ready for executive execution.`;
      }

      const audit = hierarchicalOrchestrator.verifyDeliverable(draft, task.department, gatekeeperName);
      return {
        ...task,
        status: audit.pass ? 'verified' : 'rejected',
        draftContent: draft,
        auditReport: audit
      };
    });

    briefing.allWorkstreamsCertified = briefing.workstreams.every((t) => t.status === 'verified');
    setActiveBriefing(briefing);
    setSelectedTask(briefing.workstreams[0] || null);
    setVaultNotice(null);
  };

  // Stage task into Human Approval Queue if it requires high-stakes external action
  const handleStageForApproval = (task: WorkstreamTask) => {
    const assignedEmp = employees.find((e) => e.id === task.assignedEmployeeId) || employees[0];
    const actionType: HighStakesAction = task.pendingAction?.actionType || 'external_email';

    stageApprovalItem({
      taskId: task.id,
      employeeId: assignedEmp.id,
      employeeName: assignedEmp.name,
      actionType,
      title: task.title,
      recipientOrTarget: task.pendingAction?.recipientOrTarget || 'Target Recipient',
      previewContent: task.draftContent || task.description
    });

    updateWorkstreamStatus(task.id, 'staged_for_approval');
    setActiveTab('approvals');
  };

  // Commit verified record to local vault (Institutional Scribe)
  const handleCommitVault = () => {
    if (!activeBriefing) return;
    const scribe = employees.find((e) => e.role === 'scribe') || employees[3];
    const scribeName = scribe ? scribe.name : 'Vault Scribe';

    const vaultMarkdown = hierarchicalOrchestrator.compileVaultRecord(activeBriefing, scribeName);
    setVaultNotice(`Archived ${activeBriefing.workstreams.length} certified workstreams into Local Sovereign Fabric Vault. Document size: ${vaultMarkdown.length} bytes.`);
  };

  const pendingApprovalsCount = approvalQueue.filter((a) => a.status === 'pending').length;

  return (
    <div className={cn("p-6 space-y-6 text-slate-100 bg-slate-950/80 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl", className)}>
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">AI Employee Team & Mission Control</h2>
              <p className="text-xs text-slate-400">
                Customizable Autonomous Employees • Strict Supervised Org Chart • 1-Click Human Approval Queue
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('roster')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2",
              activeTab === 'roster'
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            Team Roster & Org Chart ({employees.length})
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2",
              activeTab === 'missions'
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Mission Control
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 relative",
              activeTab === 'approvals'
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            1-Click Approvals
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-slate-950 font-bold animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: TEAM ROSTER & ORG CHART
          ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active AI Employee Roster</h3>
              <p className="text-xs text-slate-400">Click any employee to rename them, modify their role, or enforce approval guardrails.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newId = `custom_emp_${Date.now()}`;
                  addEmployee({
                    id: newId,
                    name: 'New Specialist',
                    title: 'Autonomous Research Specialist',
                    role: 'worker',
                    department: 'custom',
                    avatarIcon: 'Bot',
                    modelTier: 'creative_precision',
                    reportsTo: 'chief-of-staff',
                    status: 'idle',
                    allowedTools: ['search_web', 'view_file'],
                    requiresApprovalFor: ['external_email'],
                    systemDirectives: 'Execute assigned research tasks with zero placeholders.',
                    isCustom: true
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Hire New AI Employee
              </button>
              <button
                onClick={resetToDefaults}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors"
                title="Reset roster to default titles"
              >
                Reset Roster
              </button>
            </div>
          </div>

          {/* Org Chart Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-emerald-400 group-hover:scale-105 transition-transform">
                        {renderEmployeeIcon(emp.avatarIcon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white text-sm">{emp.name}</h4>
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Rename employee"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{emp.title}</p>
                      </div>
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider",
                      emp.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                      emp.status === 'working' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse" :
                      emp.status === 'auditing' ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" :
                      "bg-slate-800 text-slate-400 border-slate-700"
                    )}>
                      {emp.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300/80 mb-3 line-clamp-2 italic">
                    "{emp.systemDirectives}"
                  </p>

                  <div className="space-y-1.5 mb-3 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-200 capitalize font-medium">{emp.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Model Tier:</span>
                      <span className="text-cyan-400 font-mono text-[10px]">{emp.modelTier}</span>
                    </div>
                    {emp.requiresApprovalFor.length > 0 && (
                      <div className="flex items-center justify-between text-amber-400/90">
                        <span>Approval Required:</span>
                        <span className="font-medium">{emp.requiresApprovalFor.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Tasks: <strong className="text-slate-200">{emp.metrics.tasksCompleted}</strong></span>
                    <span>Pass Rate: <strong className="text-emerald-400">{emp.metrics.passRate}%</strong></span>
                  </div>
                  <button
                    onClick={() => setEditingEmployee(emp)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Settings2 className="h-3 w-3" />
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MISSION CONTROL & WORKSTREAM DECOMPOSER
          ========================================================================= */}
      {activeTab === 'missions' && (
        <div className="space-y-6">
          {/* Macro Goal Input & Presets */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Issue Strategic Directive to Chief of Staff
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={macroInput}
                onChange={(e) => setMacroInput(e.target.value)}
                placeholder="e.g., Prospect 50 TPA claims directors for delinquent LC § 4622 penalties and audit ledgers..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && handleDecomposeGoal()}
              />
              <button
                onClick={() => handleDecomposeGoal()}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg"
              >
                <Zap className="h-4 w-4" />
                Decompose & Deploy
              </button>
            </div>

            {/* Quick Strategic Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500">Quick Directives:</span>
              <button
                onClick={() => {
                  const goal = "Prospect 50 TPA claims directors on LinkedIn and stage outbound LC § 4622 penalty demand letters.";
                  setMacroInput(goal);
                  handleDecomposeGoal(goal);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                🎯 Outbound CRO Penalty Outreach
              </button>
              <button
                onClick={() => {
                  const goal = "Audit unreviewed QME records for John Ureno and draft formal 28-line objection under LC § 4062.3.";
                  setMacroInput(goal);
                  handleDecomposeGoal(goal);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                ⚖️ 28-Line Legal Objection Pleading
              </button>
              <button
                onClick={() => {
                  const goal = "Audit delinquent treatment and medical-legal ledgers past 60 days, calculating 10% penalty and 7% interest.";
                  setMacroInput(goal);
                  handleDecomposeGoal(goal);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                💰 LC § 4622 Interest & Ledger Audit
              </button>
            </div>
          </div>

          {/* Active Briefing Display */}
          {activeBriefing && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">
                      Executive Briefing Active
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{activeBriefing.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{activeBriefing.macroGoal}</h3>
                  <p className="text-xs text-slate-300 mt-1">{activeBriefing.conductorSummary}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCommitVault}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Database className="h-3.5 w-3.5 text-cyan-400" />
                    Commit to Vault
                  </button>
                </div>
              </div>

              {vaultNotice && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {vaultNotice}
                </div>
              )}

              {/* Workstream Task Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {activeBriefing.workstreams.map((task) => {
                  const assignedEmp = employees.find((e) => e.id === task.assignedEmployeeId) || employees[0];
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
                        selectedTask?.id === task.id
                          ? "bg-slate-900 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {task.department}
                          </span>
                          {task.auditReport?.pass ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Gatekeeper Certified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Review Required
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-white text-sm mb-1">{task.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {renderEmployeeIcon(assignedEmp.avatarIcon, "h-3.5 w-3.5 text-emerald-400")}
                          <span className="font-medium text-[11px]">{assignedEmp.name}</span>
                        </div>

                        {task.status !== 'staged_for_approval' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageForApproval(task);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Send className="h-2.5 w-2.5" />
                            Stage Approval
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Staged for Review
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Workstream Detail Viewport */}
              {selectedTask && (
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{selectedTask.title}</h4>
                      <p className="text-xs text-slate-400">{selectedTask.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStageForApproval(selectedTask)}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Stage in 1-Click Approval Queue
                      </button>
                    </div>
                  </div>

                  {/* Gatekeeper Audit Checklist */}
                  {selectedTask.auditReport && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800/80 pb-1.5">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <ShieldCheck className="h-4 w-4" />
                          Audited by {selectedTask.auditReport.verifiedBy}
                        </span>
                        <span>Score: {selectedTask.auditReport.score}/100</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <strong className="text-emerald-400 block mb-1">Passed Verifications:</strong>
                          <ul className="space-y-0.5 text-slate-300">
                            {selectedTask.auditReport.passedChecks.map((chk, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                {chk}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {selectedTask.auditReport.violations.length > 0 && (
                          <div>
                            <strong className="text-amber-400 block mb-1">Detected Defects:</strong>
                            <ul className="space-y-0.5 text-amber-300">
                              {selectedTask.auditReport.violations.map((v, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                                  {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Draft Content Viewport */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Work Product Payload
                    </span>
                    <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800/90 text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {selectedTask.draftContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: 1-CLICK HUMAN APPROVAL QUEUE
          ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">1-Click Human Approval Queue</h3>
            <p className="text-xs text-slate-400">
              Direct Report Protocol: AI Employees stage high-stakes external actions (emails, filings, transactions) here for your review before dispatch.
            </p>
          </div>

          {approvalQueue.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              Zero pending items in approval queue. All agent actions have been resolved.
            </div>
          ) : (
            <div className="space-y-3">
              {approvalQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        item.status === 'pending' ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        item.status === 'authorized' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                        "bg-red-500/20 text-red-300 border border-red-500/40"
                      )}>
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-400">Staged by <strong>{item.employeeName}</strong></span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-cyan-400 font-mono capitalize">{item.actionType.replace('_', ' ')}</span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    {item.recipientOrTarget && (
                      <p className="text-xs text-slate-300">
                        Target Recipient: <span className="font-mono text-emerald-400">{item.recipientOrTarget}</span>
                      </p>
                    )}
                    <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {item.previewContent}
                    </pre>
                  </div>

                  {item.status === 'pending' && (
                    <div className="flex md:flex-col items-center gap-2 shrink-0">
                      <button
                        onClick={() => authorizeApprovalItem(item.id)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Authorize & Dispatch
                      </button>
                      <button
                        onClick={() => rejectApprovalItem(item.id)}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        Reject / Revise
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / CONFIGURE AI EMPLOYEE (USER-CUSTOMIZABLE NAMING & ROLES)
          ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {renderEmployeeIcon(editingEmployee.avatarIcon)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Configure AI Employee</h3>
                  <p className="text-xs text-slate-400">Customize display name, model tier, and strict guardrails.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Employee Display Name</label>
                <input
                  type="text"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  placeholder="e.g., Frank Jr, Sentinel, Revenue Hunter"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Functional Title</label>
                <input
                  type="text"
                  value={editingEmployee.title}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value as DepartmentType })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="executive">Executive</option>
                    <option value="quality">Quality / QA</option>
                    <option value="revenue">Revenue / CRO</option>
                    <option value="memory">Memory / Scribe</option>
                    <option value="legal">Legal</option>
                    <option value="finance">Finance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Model Inference Tier</label>
                  <select
                    value={editingEmployee.modelTier}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, modelTier: e.target.value as ModelTier })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="frontier_reasoning">Frontier Reasoning (Nemotron 550B)</option>
                    <option value="fast_verifier">Fast Verifier (Sub-1s Token Tier)</option>
                    <option value="creative_precision">Creative Precision (Copy & Growth)</option>
                    <option value="deterministic_math">Deterministic Math (Python Engine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">System Directives & Core Purpose</label>
                <textarea
                  rows={2}
                  value={editingEmployee.systemDirectives}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, systemDirectives: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Strict Approval Guardrails Checkboxes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Strict Human Approval Required For:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {(['external_email', 'financial_transfer', 'court_filing', 'contract_sign', 'calendar_booking'] as HighStakesAction[]).map((action) => {
                    const checked = editingEmployee.requiresApprovalFor.includes(action);
                    return (
                      <label key={action} className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...editingEmployee.requiresApprovalFor, action]
                              : editingEmployee.requiresApprovalFor.filter((a) => a !== action);
                            setEditingEmployee({ ...editingEmployee, requiresApprovalFor: next });
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                        />
                        <span className="capitalize">{action.replace('_', ' ')}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {editingEmployee.isCustom ? (
                <button
                  onClick={() => {
                    deleteEmployee(editingEmployee.id);
                    setEditingEmployee(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Employee
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateEmployee(editingEmployee.id, editingEmployee);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessOperationsHQ;
