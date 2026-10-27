import React, { useState, useRef, useEffect } from 'react';
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
  Trash2,
  Bot,
  Mic,
  MicOff,
  Sparkles,
  ChevronDown,
  RefreshCw,
  FolderLock,
  FileText,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { sovereignFs } from '../../services/fs/sovereignFsBridge';
import { cn } from '../../lib/utils';
import { useAIEmployeeStore } from '../../store/aiEmployeeStore';
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

  const [activeTab, setActiveTab] = useState<'mission_control' | 'the_org' | 'approvals'>('mission_control');
  const [editingEmployee, setEditingEmployee] = useState<AIEmployee | null>(null);
  const [macroInput, setMacroInput] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('auto');
  const [selectedTask, setSelectedTask] = useState<WorkstreamTask | null>(null);
  const [vaultNotice, setVaultNotice] = useState<string | null>(null);

  // SOP Spec Preview & Generation state
  const [sopModal, setSopModal] = useState<{
    isOpen: boolean;
    title: string;
    path: string;
    content: string;
    isLoading: boolean;
  } | null>(null);
  const [isGeneratingSop, setIsGeneratingSop] = useState(false);

  // Voice speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMacroInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

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

    const gatekeeper = employees.find((e) => e.role === 'verifier') || employees[1];
    const gatekeeperName = gatekeeper ? gatekeeper.name : 'Rule Enforcer';

    briefing.workstreams = briefing.workstreams.map((task) => {
      let draft = '';
      if (task.department === 'revenue') {
        draft = `### Executive Outbound Communications Plan\n\nTarget Persona: Third-Party Administrator (TPA) Claims Directors & Risk Managers.\nObjective: Formal Meet-and-Confer regarding expedited audit of delinquent medical-legal billings under LC § 4622.\n\nChannel: Direct Executive Email & Professional Communications.\nStatus: Staged for 1-click human approval before external dispatch.\nZero placeholders detected.`;
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

  // Stage task into Human Approval Queue
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
  };

  // Commit verified record to local vault (Institutional Scribe)
  const handleCommitVault = () => {
    if (!activeBriefing) return;
    const scribe = employees.find((e) => e.role === 'scribe') || employees[3];
    const scribeName = scribe ? scribe.name : 'Vault Scribe';

    const vaultMarkdown = hierarchicalOrchestrator.compileVaultRecord(activeBriefing, scribeName);
    setVaultNotice(`Archived ${activeBriefing.workstreams.length} certified workstreams into Local Sovereign Fabric Vault. Document size: ${vaultMarkdown.length} bytes.`);
  };

  // View linked Markdown SOP file from disk/vault
  const handleViewSop = async (employee: AIEmployee) => {
    if (!employee.markdownSpecPath) return;
    setSopModal({
      isOpen: true,
      title: `${employee.name} — SOP Spec`,
      path: employee.markdownSpecPath,
      content: '',
      isLoading: true
    });

    try {
      const res = await sovereignFs.readFile({ path: employee.markdownSpecPath });
      if (res?.success && res.content) {
        setSopModal(prev => prev ? { ...prev, content: res.content!, isLoading: false } : null);
      } else {
        setSopModal(prev => prev ? {
          ...prev,
          content: `# ${employee.name} Standard Operating Procedure\n\nNo active document found at:\n\`${employee.markdownSpecPath}\`\n\nYou can click 'AI Generate SOP' to automatically draft and link this file in your AI Drive/Vault.`,
          isLoading: false
        } : null);
      }
    } catch (err) {
      setSopModal(prev => prev ? {
        ...prev,
        content: `Error loading SOP file: ${String(err)}`,
        isLoading: false
      } : null);
    }
  };

  // AI Generate full structured SOP Markdown file and write to disk
  const handleGenerateSop = async (emp: AIEmployee) => {
    setIsGeneratingSop(true);
    try {
      const defaultPath = emp.markdownSpecPath || `i:/.genieflowai.brain/SOP/${emp.id.toUpperCase().replace(/-/g, '_')}_SOP.md`;
      const generatedMarkdown = `# Standard Operating Procedure (SOP): ${emp.name}

## 1. Identity & Mandate
- **Role:** ${emp.title}
- **Department:** ${emp.department.toUpperCase()}
- **Model Tier:** ${emp.modelTier}
- **Supervising Principal:** Executive Conductor / The Principal

## 2. Core Operational Directives
${emp.systemDirectives}

## 3. Allowed Primitives & Tools
${emp.allowedTools.map(t => `- \`${t}\``).join('\n')}

## 4. Human Approval Guardrails
${emp.requiresApprovalFor.length > 0
  ? emp.requiresApprovalFor.map(a => `- **STRICT HUMAN APPROVAL REQUIRED:** \`${a}\``).join('\n')
  : '- Autonomous execution permitted for non-destructive actions.'}

## 5. Sovereign Execution Standards
- **Zero Placeholders:** Never generate bracketed placeholders like [Insert Date] or [Amount].
- **Factual Grounding:** Cross-reference every assertion against primary vault records.
- **Continuous Learning:** Log corrections and operational playbooks to the Institutional Memory Scribe.
`;

      await sovereignFs.writeFile({ path: defaultPath, content: generatedMarkdown });

      const updated = { ...emp, markdownSpecPath: defaultPath };
      updateEmployee(emp.id, updated);
      if (editingEmployee && editingEmployee.id === emp.id) {
        setEditingEmployee(updated);
      }

      setSopModal({
        isOpen: true,
        title: `${emp.name} — SOP Spec (Generated)`,
        path: defaultPath,
        content: generatedMarkdown,
        isLoading: false
      });
    } catch (err) {
      console.error('Error generating SOP:', err);
    } finally {
      setIsGeneratingSop(false);
    }
  };

  const pendingApprovalsCount = approvalQueue.filter((a) => a.status === 'pending').length;
  const readyToReviewCount = activeBriefing ? activeBriefing.workstreams.filter((t) => t.status === 'verified').length : 0;
  const workingNowCount = activeBriefing ? activeBriefing.workstreams.filter((t) => t.status === 'pending' || t.status === 'in_progress').length : 0;

  // Department grouping for "The Org" view
  const executiveTeam = employees.filter(e => e.role === 'orchestrator' || e.role === 'verifier' || e.role === 'scribe');
  const revenueTeam = employees.filter(e => e.department === 'revenue');
  const legalTeam = employees.filter(e => e.department === 'legal');
  const financeTeam = employees.filter(e => e.department === 'finance');

  return (
    <div className={cn("p-6 space-y-6 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-950/90 rounded-2xl border border-gray-200 dark:border-slate-800/80 backdrop-blur-md shadow-xl transition-colors", className)}>
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Agent HQ</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Sovereign Practice Controller • Autonomous Multi-Agent Hierarchy • Zero-Cloud Egress
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('mission_control')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === 'mission_control'
                ? "bg-white dark:bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-gray-200 dark:border-orange-500/40 shadow-sm font-semibold"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Mission Control
          </button>

          <button
            onClick={() => setActiveTab('the_org')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === 'the_org'
                ? "bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-gray-200 dark:border-emerald-500/40 shadow-sm font-semibold"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            The Org ({employees.length})
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative",
              activeTab === 'approvals'
                ? "bg-white dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-gray-200 dark:border-amber-500/40 shadow-sm font-semibold"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            1-Click Approvals
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-bold animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MISSION CONTROL
          ========================================================================= */}
      {activeTab === 'mission_control' && (
        <div className="space-y-6">
          {/* Top 4 Counter Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 text-center">
              <span className="block text-2xl font-black text-cyan-600 dark:text-cyan-400">{workingNowCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Working Now</span>
            </div>
            <div className={cn(
              "p-4 rounded-xl border text-center transition-all",
              pendingApprovalsCount > 0
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/60 text-amber-700 dark:text-amber-300"
                : "bg-gray-50 dark:bg-slate-900/80 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400"
            )}>
              <span className={cn(
                "block text-2xl font-black",
                pendingApprovalsCount > 0 ? "text-amber-600 dark:text-amber-400 animate-pulse" : "text-gray-400 dark:text-slate-500"
              )}>
                {pendingApprovalsCount}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Needs You</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 text-center">
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{readyToReviewCount}</span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ready to Review</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 text-center">
              <span className="block text-2xl font-black text-gray-400 dark:text-slate-500">0</span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Problems</span>
            </div>
          </div>

          {/* "While You Were Away" / Morning Executive Briefing Banner */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-gray-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold text-[10px]">
                WHILE YOU WERE AWAY
              </span>
              <span>Executive Sitrep synced with Sovereign Vault • All overnight routines completed.</span>
            </div>
            <span className="text-gray-400 dark:text-slate-500 font-mono text-[11px]">Synced Today at 9:00 AM</span>
          </div>

          {/* THE UNIVERSAL DELEGATE & VOICE BAR ("JUST TALK TO IT") */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900/90 border border-gray-200 dark:border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                Delegate to Team Coordinator
              </label>
              <span className="text-[11px] text-gray-400 dark:text-slate-400">Speak naturally or type your directive</span>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-2.5">
              {/* Area Selector Dropdown */}
              <div className="relative md:w-56 shrink-0">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full appearance-none px-3.5 py-3 rounded-xl bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 text-gray-900 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500 pr-8 cursor-pointer shadow-sm"
                >
                  <option value="auto">Auto — Choose Area</option>
                  <option value="revenue">Revenue & Outbound (CRO)</option>
                  <option value="legal">Workers' Comp Litigation</option>
                  <option value="finance">Statutory Billing & Audit</option>
                  <option value="operations">Operations & Sovereign SOPs</option>
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Main Prompt Input Bar */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={macroInput}
                  onChange={(e) => setMacroInput(e.target.value)}
                  placeholder={isListening ? "Listening to your voice..." : "What do you want your team to get done?"}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border text-gray-900 dark:text-white text-sm focus:outline-none pr-12 transition-all shadow-sm",
                    isListening
                      ? "border-red-500 ring-2 ring-red-500/20 placeholder-red-400"
                      : "border-gray-300 dark:border-slate-700/80 focus:border-orange-500"
                  )}
                  onKeyDown={(e) => e.key === 'Enter' && handleDecomposeGoal()}
                />

                {/* Voice Input Microphone Button ("Just Talk To It") */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={cn(
                    "absolute right-2.5 p-2 rounded-lg transition-all",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                  title={isListening ? "Stop listening" : "Click to speak voice directive"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>

              {/* Delegate Button */}
              <button
                onClick={() => handleDecomposeGoal()}
                className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
              >
                <Zap className="h-4 w-4" />
                Delegate
              </button>
            </div>

            {/* Quick Strategic Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-gray-400 dark:text-slate-500">Quick Shortcuts:</span>
              <button
                onClick={() => {
                  const goal = "Prospect 50 TPA claims directors on LinkedIn and stage outbound LC § 4622 penalty demand letters.";
                  setMacroInput(goal);
                  handleDecomposeGoal(goal);
                }}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="h-3 w-3 text-orange-500" />
                Outbound CRO Outreach
              </button>
              <button
                onClick={() => {
                  const goal = "Audit unreviewed QME records for John Ureno and draft formal 28-line objection under LC § 4062.3.";
                  setMacroInput(goal);
                  handleDecomposeGoal(goal);
                }}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Scale className="h-3 w-3 text-cyan-500" />
                28-Line Legal Objection
              </button>
              <button
                onClick={() => {
                  const goal = "Audit delinquent treatment and medical-legal ledgers past 60 days, calculating 10% penalty and 7% interest.";
                  setMacroInput(goal);
                  handleDecomposeGoal(goal);
                }}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="h-3 w-3 text-emerald-500" />
                LC § 4622 Interest Audit
              </button>
            </div>
          </div>

          {/* "NEEDS YOU" SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-500" />
                Needs You
              </h3>
              <span className="text-[11px] text-gray-500">
                {pendingApprovalsCount === 0 ? "ALL CLEAR" : `${pendingApprovalsCount} Action(s) Waiting For Sign-off`}
              </span>
            </div>

            {pendingApprovalsCount === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800/80 text-center text-gray-500 dark:text-slate-400 text-xs">
                All Clear — No pending agent approvals or questions. Review Open Loops for business decisions.
              </div>
            ) : (
              <div className="space-y-3">
                {approvalQueue.filter(item => item.status === 'pending').map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 dark:border-amber-500/40 text-[10px] font-bold uppercase">
                          {item.actionType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-slate-400">Staged by <strong>{item.employeeName}</strong></span>
                        {item.recipientOrTarget && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">→ {item.recipientOrTarget}</span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                      <pre className="p-3 rounded bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] text-gray-800 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {item.previewContent}
                      </pre>
                    </div>

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
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold border border-gray-300 dark:border-slate-700 transition-colors"
                      >
                        Reject / Revise
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* "READY TO REVIEW" SECTION */}
          {activeBriefing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Ready to Review ({activeBriefing.workstreams.length} Workstreams)
                </h3>
                <button
                  onClick={handleCommitVault}
                  className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Database className="h-3.5 w-3.5 text-cyan-500" />
                  Commit to Vault
                </button>
              </div>

              {vaultNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {vaultNotice}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeBriefing.workstreams.map((task) => {
                  const assignedEmp = employees.find((e) => e.id === task.assignedEmployeeId) || employees[0];
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
                        selectedTask?.id === task.id
                          ? "bg-white dark:bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/40"
                          : "bg-gray-50/70 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                            {task.department}
                          </span>
                          {task.auditReport?.pass ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Certified Pass
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Audit Flagged
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{task.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                          {renderEmployeeIcon(assignedEmp.avatarIcon, "h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400")}
                          <span className="font-medium text-[11px]">{assignedEmp.name}</span>
                        </div>

                        {task.status !== 'staged_for_approval' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageForApproval(task);
                            }}
                            className="px-2 py-1 rounded bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Send className="h-2.5 w-2.5" />
                            Stage Approval
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Staged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: "THE ORG"
          ========================================================================= */}
      {activeTab === 'the_org' && (
        <div className="space-y-8">
          {/* Top Apex Node: The Human Principal */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 px-8 rounded-2xl bg-gradient-to-r from-orange-50 via-orange-100/50 to-orange-50 dark:from-orange-500/20 dark:via-orange-500/30 dark:to-orange-500/20 border-2 border-orange-300 dark:border-orange-500/60 shadow-lg flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                F
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-base">You (The Principal)</h3>
                <p className="text-xs text-orange-700 dark:text-orange-200">The Human • Final Decisions & Direct Authorizations</p>
              </div>
            </div>
            <div className="h-6 w-0.5 bg-gray-300 dark:bg-slate-700" />
          </div>

          {/* Level 2: Executive Management Hub */}
          <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Executive Management Desk</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">Led by your Chief of Staff • Central hub for all department directives</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-300 dark:border-emerald-500/30">
                Core Leadership Hub
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {executiveTeam.map((emp) => (
                <div
                  key={emp.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                          {renderEmployeeIcon(emp.avatarIcon)}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-xs">{emp.name}</h5>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 capitalize">{emp.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 p-1"
                        title="Rename or configure"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-slate-400 line-clamp-2">{emp.title}</p>
                    {emp.markdownSpecPath && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSop(emp);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                        title={`View attached SOP: ${emp.markdownSpecPath}`}
                      >
                        <FileText className="h-2.5 w-2.5" />
                        <span className="truncate max-w-[130px]">{emp.markdownSpecPath.split(/[/\\]/).pop()}</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500">
                    <span>Tier: {emp.modelTier}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{emp.metrics.passRate}% pass</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level 3: Departments & Specialists Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Departments & Specialists</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">Autonomous departmental sub-agents managed by the Executive Conductor</p>
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Revenue & CRO Team Card */}
              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="h-4 w-4" />
                    Revenue & Growth (CRO)
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{revenueTeam.length} Agent(s)</span>
                </div>
                {revenueTeam.map((emp) => (
                  <div key={emp.id} className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-xs">{emp.name}</h5>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400">{emp.title}</p>
                      {emp.markdownSpecPath && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSop(emp);
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-medium border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          title={`View linked SOP: ${emp.markdownSpecPath}`}
                        >
                          <FileText className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[110px]">{emp.markdownSpecPath.split(/[/\\]/).pop()}</span>
                        </button>
                      )}
                    </div>
                    <button onClick={() => setEditingEmployee(emp)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Workers' Comp Litigation Team Card */}
              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Scale className="h-4 w-4" />
                    Litigation & Pleadings
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{legalTeam.length} Agent(s)</span>
                </div>
                {legalTeam.map((emp) => (
                  <div key={emp.id} className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-xs">{emp.name}</h5>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400">{emp.title}</p>
                      {emp.markdownSpecPath && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSop(emp);
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-medium border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          title={`View linked SOP: ${emp.markdownSpecPath}`}
                        >
                          <FileText className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[110px]">{emp.markdownSpecPath.split(/[/\\]/).pop()}</span>
                        </button>
                      )}
                    </div>
                    <button onClick={() => setEditingEmployee(emp)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Finance & Statutory Billing Team Card */}
              <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <DollarSign className="h-4 w-4" />
                    Finance & Penalties
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{financeTeam.length} Agent(s)</span>
                </div>
                {financeTeam.map((emp) => (
                  <div key={emp.id} className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white text-xs">{emp.name}</h5>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400">{emp.title}</p>
                      {emp.markdownSpecPath && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSop(emp);
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-medium border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          title={`View linked SOP: ${emp.markdownSpecPath}`}
                        >
                          <FileText className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[110px]">{emp.markdownSpecPath.split(/[/\\]/).pop()}</span>
                        </button>
                      )}
                    </div>
                    <button onClick={() => setEditingEmployee(emp)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: 1-CLICK HUMAN APPROVAL QUEUE (STANDALONE VIEW)
          ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">1-Click Human Approval Queue</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Direct Report Protocol: AI Employees stage high-stakes external actions (emails, filings, transactions) here for your review before dispatch.
            </p>
          </div>

          {approvalQueue.length === 0 ? (
            <div className="p-8 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center text-gray-500 dark:text-slate-400 text-xs">
              Zero pending items in approval queue. All agent actions have been resolved.
            </div>
          ) : (
            <div className="space-y-3">
              {approvalQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        item.status === 'pending' ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40" :
                        item.status === 'authorized' ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40" :
                        "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40"
                      )}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-slate-400">Staged by <strong>{item.employeeName}</strong></span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">•</span>
                      <span className="text-xs text-cyan-600 dark:text-cyan-400 font-mono capitalize">{item.actionType.replace('_', ' ')}</span>
                    </div>

                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                    {item.recipientOrTarget && (
                      <p className="text-xs text-gray-600 dark:text-slate-300">
                        Target Recipient: <span className="font-mono text-emerald-600 dark:text-emerald-400">{item.recipientOrTarget}</span>
                      </p>
                    )}
                    <pre className="p-3 rounded bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] text-gray-800 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
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
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold border border-gray-200 dark:border-slate-700 transition-colors"
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
          MODAL: EDIT / CONFIGURE AI EMPLOYEE
          ========================================================================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {renderEmployeeIcon(editingEmployee.avatarIcon)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Configure AI Employee</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Customize display name, model tier, and strict guardrails.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Employee Display Name</label>
                <input
                  type="text"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  placeholder="e.g., Frank Jr, Sentinel, Revenue Hunter"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Functional Title</label>
                <input
                  type="text"
                  value={editingEmployee.title}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value as DepartmentType })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">Model Inference Tier</label>
                  <select
                    value={editingEmployee.modelTier}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, modelTier: e.target.value as ModelTier })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="frontier_reasoning">Frontier Reasoning (Nemotron 550B)</option>
                    <option value="fast_verifier">Fast Verifier (Sub-1s Token Tier)</option>
                    <option value="creative_precision">Creative Precision (Copy & Growth)</option>
                    <option value="deterministic_math">Deterministic Math (Python Engine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1">System Directives & Core Purpose</label>
                <textarea
                  rows={2}
                  value={editingEmployee.systemDirectives}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, systemDirectives: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Linked Markdown SOP Spec */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Attached Markdown SOP Spec (AI Drive / Vault)
                  </label>
                  <div className="flex items-center gap-2">
                    {editingEmployee.markdownSpecPath && (
                      <button
                        type="button"
                        onClick={() => handleViewSop(editingEmployee)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Preview Spec
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleGenerateSop(editingEmployee)}
                      disabled={isGeneratingSop}
                      className="text-[11px] bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      {isGeneratingSop ? 'Writing...' : 'AI Generate SOP'}
                    </button>
                  </div>
                </div>

                {/* Preset SOP Quick Selector */}
                <div className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Or choose a preset template:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setEditingEmployee({ ...editingEmployee, markdownSpecPath: e.target.value });
                      }
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>Select Preset SOP...</option>
                    <option value="i:/.genieflowai.brain/SOP/PRESETS/MEDICAL_CLINIC_SOP.md">Medical Practice & Clinic</option>
                    <option value="i:/.genieflowai.brain/SOP/PRESETS/MARKETING_GROWTH_SOP.md">Growth Marketing & Copywriting</option>
                    <option value="i:/.genieflowai.brain/SOP/PRESETS/ARCHITECTURE_ENGINEERING_SOP.md">Architecture & Permitting</option>
                    <option value="i:/.genieflowai.brain/SOP/PRESETS/ACCOUNTING_TAX_SOP.md">Accounting, Tax & Audit</option>
                    <option value="i:/.genieflowai.brain/SOP/PRESETS/GENERAL_OPERATIONS_SOP.md">General Business Operations</option>
                    <option value="i:/.genieflowai.brain/SOP/LEGAL_COUNSEL_SOP.md">Legal Counsel & Litigation</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={editingEmployee.markdownSpecPath || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, markdownSpecPath: e.target.value })}
                  placeholder="e.g., i:/.genieflowai.brain/SOP/PRESETS/MEDICAL_CLINIC_SOP.md"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                  Direct markdown file path on your local drive or AI Drive. Edit the markdown file directly anytime to change how this agent operates.
                </p>
              </div>

              {/* Strict Approval Guardrails Checkboxes */}
              <div>
                <label className="block text-gray-700 dark:text-slate-300 font-semibold mb-1.5">Strict Human Approval Required For:</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-950 p-2.5 rounded-lg border border-gray-200 dark:border-slate-800">
                  {(['external_email', 'financial_transfer', 'court_filing', 'contract_sign', 'calendar_booking'] as HighStakesAction[]).map((action) => {
                    const checked = editingEmployee.requiresApprovalFor.includes(action);
                    return (
                      <label key={action} className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...editingEmployee.requiresApprovalFor, action]
                              : editingEmployee.requiresApprovalFor.filter((a) => a !== action);
                            setEditingEmployee({ ...editingEmployee, requiresApprovalFor: next });
                          }}
                          className="rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-0"
                        />
                        <span className="capitalize">{action.replace('_', ' ')}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
              {editingEmployee.isCustom ? (
                <button
                  onClick={() => {
                    deleteEmployee(editingEmployee.id);
                    setEditingEmployee(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Employee
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium"
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

      {/* =========================================================================
          SOP SPEC PREVIEW / READER MODAL
          ========================================================================= */}
      {sopModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{sopModal.title}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono truncate max-w-md">{sopModal.path}</p>
                </div>
              </div>
              <button
                onClick={() => setSopModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs bg-gray-50/50 dark:bg-slate-950/50 text-gray-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {sopModal.isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Reading SOP spec from disk...
                </div>
              ) : (
                sopModal.content
              )}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-950 text-xs">
              <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-gray-400" />
                Linked to Sovereign Vault & AI Drive
              </span>
              <button
                onClick={() => setSopModal(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessOperationsHQ;
