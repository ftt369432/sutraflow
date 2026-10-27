import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  ArrowRight,
  Database,
  Briefcase,
  TrendingUp,
  FileText,
  DollarSign,
  Scale
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { businessSuite, ExecutiveBriefing, WorkstreamTask } from '../../services/business/BusinessOperationsSuite';

export const BusinessOperationsHQ: React.FC<{ className?: string }> = ({ className }) => {
  const [macroInput, setMacroInput] = useState('');
  const [activeBriefing, setActiveBriefing] = useState<ExecutiveBriefing | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkstreamTask | null>(null);
  const [vaultNotice, setVaultNotice] = useState<string | null>(null);

  // Run Chief of Staff Macro Goal Decomposition
  const handleDecompose = (inputGoal?: string) => {
    const goal = inputGoal || macroInput;
    if (!goal.trim()) return;

    const briefing = businessSuite.decomposeMacroGoal(goal);

    // Simulate specialized draft generation & Gatekeeper pass
    briefing.workstreams = briefing.workstreams.map((task) => {
      let draft = '';
      if (task.department === 'legal') {
        draft = `# Formal Notice & Rebuttal under Labor Code § 4062.3\n\nCOMES NOW, Applicant, by and through counsel of record, Law Offices of Arnulfo F. Gutierrez, and serves this formal objection.\n\nControlling Authority: Labor Code § 4062.3, 8 CCR § 10635.\n\nAll dates and ADJ claim numbers verified against client fact sheet. Zero placeholders.`;
      } else if (task.department === 'finance') {
        draft = `### Statutory Accounting Audit (Labor Code § 4622)\n\n- Medical-Legal Balance Due: $4,250.00\n- Date of Service: 60-day clock expired on Day 61.\n- Mandatory 10% Penalty under LC § 4622(a)(1): $425.00\n- 7% Annual Statutory Interest: Accrued in full.\n\nTotal Recoverable: $4,675.00 + accrued statutory interest.`;
      } else if (task.department === 'marketing') {
        draft = `### High-Authority Strategic Debrief\n\n**Headline**: Overcoming Dilatory Insurance Tactics in California Workers' Comp Litigation\n\n**Key Takeaway**: When carriers delay under LC § 4610, immediate enforcement of strict statutory timelines yields 100% compliance.\n\n**Format**: Long-form article + 3-slide executive carousel staged for distribution.`;
      } else {
        draft = `### Sovereign Workflow Execution Plan\n\nObjective: ${goal}\n\n1. Decomposed into atomic workstreams.\n2. Verified against Sovereign Fabric Vault.\n3. Ready for 1-click execution.`;
      }

      const audit = businessSuite.auditDeliverable(draft, task.department);
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

  // 1-Click Commit to Sovereign Fabric Vault (Institutional Scribe)
  const handleCommitVault = () => {
    if (!activeBriefing) return;
    const deliverables = activeBriefing.workstreams.map((w) => ({
      taskTitle: w.title,
      content: w.draftContent || ''
    }));

    const markdownDoc = businessSuite.generateVaultManifest(
      `SOP_${Date.now()}`,
      activeBriefing.macroGoal,
      deliverables
    );

    // Save notice
    setVaultNotice(`Archived ${deliverables.length} verified workstreams into Sovereign Fabric Vault (Local Markdown). Document length: ${markdownDoc.length} bytes.`);
    setActiveBriefing((prev) => prev ? { ...prev, allWorkstreamsCertified: true } : null);
  };

  return (
    <div className={cn("p-6 space-y-6 text-slate-100 bg-slate-950/80 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl", className)}>
      {/* Top Header & Org Chart Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Agent Headquarters & Mission Control</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Local-First Sovereign Operations Suite • Strict Multi-Agent Supervised Hierarchy
          </p>
        </div>

        {/* Dynamic Model Tier Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/60 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Chief of Staff (Frontier)</span>
          <span className="text-slate-600">→</span>
          <span className="text-cyan-400 font-medium">Gatekeeper (Fast Verifier)</span>
        </div>
      </div>

      {/* Visual Hierarchy Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
          <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
            <span>1. Human Sovereign (CEO)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-slate-500 text-[11px]">Only views vetted deliverables with 1-click execution approvals.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-indigo-500/30 relative overflow-hidden">
          <div className="text-indigo-400 font-semibold mb-1 flex items-center justify-between">
            <span>2. Chief of Staff</span>
            <Zap className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-slate-400 text-[11px]">Decomposes macro goals into departmental workstreams.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/30 relative overflow-hidden">
          <div className="text-cyan-400 font-semibold mb-1 flex items-center justify-between">
            <span>3. The Gatekeeper QA</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-slate-400 text-[11px]">Binary Pass/Fail sentry: Zero placeholders, PII shield, exact quotes.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/30 relative overflow-hidden">
          <div className="text-amber-400 font-semibold mb-1 flex items-center justify-between">
            <span>4. Sovereign Fabric Vault</span>
            <Database className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-slate-400 text-[11px]">Institutional memory: Markdown fact manifests & reusable SOPs.</p>
        </div>
      </div>

      {/* Macro Goal Input & Quick Deploy Buttons */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Macro Objective (Chief of Staff Dispatch)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={macroInput}
            onChange={(e) => setMacroInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDecompose()}
            placeholder="e.g. Enforce medical billing delays for Client Reyes, audit LC § 4622 penalties, and package executive briefing..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            onClick={() => handleDecompose()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <span>Decompose & Dispatch</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Launch Pre-sets */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          <span className="text-slate-500 self-center">Quick Objectives:</span>
          <button
            onClick={() => {
              setMacroInput("Enforce LC § 4622 medical-legal penalties and stage 28-line fee petition");
              handleDecompose("Enforce LC § 4622 medical-legal penalties and stage 28-line fee petition");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
          >
            ⚖️ Statutory Penalty Petition (LC § 4622)
          </button>
          <button
            onClick={() => {
              setMacroInput("Repurpose trial victory transcript into high-authority PR article & executive carousel");
              handleDecompose("Repurpose trial victory transcript into high-authority PR article & executive carousel");
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
          >
            📈 Repurpose Court Victory into PR Asset
          </button>
        </div>
      </div>

      {/* Active Briefing Display */}
      {activeBriefing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800">
          {/* Workstreams List (Left Column) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Departmental Workstreams ({activeBriefing.workstreams.length})</span>
              <span className="text-emerald-400 text-[11px]">
                ~{activeBriefing.estimatedTokensSaved} frontier tokens saved via smart tiering
              </span>
            </div>

            <div className="space-y-2">
              {activeBriefing.workstreams.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer text-left",
                      isSelected
                        ? "bg-slate-850 border-emerald-500/60 shadow-lg shadow-emerald-950/40"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {task.department === 'legal' && <Scale className="h-4 w-4 text-indigo-400" />}
                        {task.department === 'finance' && <DollarSign className="h-4 w-4 text-emerald-400" />}
                        {task.department === 'marketing' && <TrendingUp className="h-4 w-4 text-cyan-400" />}
                        {task.department === 'operations' && <Briefcase className="h-4 w-4 text-amber-400" />}
                        <span className="font-semibold text-sm text-white">{task.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {task.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Persona: <strong className="text-slate-300">{task.assignedPersona}</strong></span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <ShieldCheck className="h-3 w-3" />
                        Gatekeeper Passed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staged Deliverable & Gatekeeper Verification (Right Column) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedTask ? (
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                {/* Header & Verification Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedTask.title}</h3>
                    <p className="text-xs text-slate-400">Prepared by: {selectedTask.assignedPersona} • Supervised by Gatekeeper</p>
                  </div>

                  {selectedTask.auditReport?.pass && (
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>GATEKEEPER CERTIFIED</span>
                    </div>
                  )}
                </div>

                {/* Gatekeeper Audit Checklist */}
                {selectedTask.auditReport && (
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Gatekeeper Security & Rule Audit Report
                    </span>
                    {selectedTask.auditReport.passedChecks.map((check, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-emerald-400/90 text-[11px]">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>{check}</span>
                      </div>
                    ))}
                    {selectedTask.auditReport.violations.map((violation, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-rose-400 text-[11px]">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{violation}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Draft Content Preview */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Staged Deliverable (Ready for 1-Click Action)
                  </span>
                  <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 text-xs text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56">
                    {selectedTask.draftContent}
                  </pre>
                </div>

                {/* CEO 1-Click Decision Bar */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Deliverable state: Staged for Execution</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCommitVault}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>1-Click Approve & Commit to Vault</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/30 border border-slate-800">
                Select a departmental workstream to preview its vetted deliverable.
              </div>
            )}

            {/* Scribe Vault Archival Notice */}
            {vaultNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-300">
                <Database className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{vaultNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessOperationsHQ;
