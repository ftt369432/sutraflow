import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Play,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowDown,
  Layers,
  Bot,
  Sliders,
  RefreshCw,
  Search,
  Code
} from 'lucide-react';
import { useWorkflowStore, Workflow, WorkflowStep } from '../store/workflowStore';
import { useAgentStore } from '../store/agentStore';
import { toast } from 'sonner';

export const WorkflowEditorPage: React.FC = () => {
  const {
    workflows,
    runs,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    runWorkflow,
    generateWorkflowFromPrompt,
    isEnhancing
  } = useWorkflowStore();

  const { agents } = useAgentStore();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // AI Prompt Builder State
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Select first workflow by default if available
  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows, selectedWorkflowId]);

  const activeWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];
  const activeRun = runs.find((r) => r.id === activeRunId || (activeWorkflow && r.workflowId === activeWorkflow.id));

  const handleCreateNewWorkflow = () => {
    const newId = addWorkflow({
      name: 'New Custom Workflow',
      description: 'Describe the sequence of automated actions',
      trigger: 'manual',
      status: 'active',
      steps: [
        {
          id: `step-${Date.now()}-1`,
          agentId: agents[0]?.id || 'agent-default',
          actionType: 'email',
          name: 'Receive & Ingest Trigger',
          description: 'Extract parameters and validate trigger payload',
          input: '{input.data}',
          inputType: 'dynamic',
          outputMapping: 'ingestResult',
          condition: { type: 'always' }
        }
      ]
    });
    setSelectedWorkflowId(newId);
    toast.success('New workflow created');
  };

  const handleRunWorkflow = async () => {
    if (!activeWorkflow) return;
    setIsRunning(true);
    try {
      toast.info(`Executing workflow: ${activeWorkflow.name}...`);
      const runId = await runWorkflow(activeWorkflow.id, {
        timestamp: new Date().toISOString(),
        initiatedBy: 'Manual Trigger'
      });
      setActiveRunId(runId);
      toast.success('Workflow run finished successfully');
    } catch (err: any) {
      toast.error(`Workflow execution failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    try {
      const generated = await generateWorkflowFromPrompt(aiPrompt);
      if (generated) {
        setSelectedWorkflowId(generated.id);
        setShowAiModal(false);
        setAiPrompt('');
        toast.success('AI generated workflow created!');
      }
    } catch (err: any) {
      toast.error(`Failed to generate workflow: ${err?.message || 'Error'}`);
    }
  };

  const handleAddStep = () => {
    if (!activeWorkflow) return;
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      agentId: agents[0]?.id || '1',
      actionType: 'task',
      name: `Step ${activeWorkflow.steps.length + 1}`,
      description: 'Action description',
      input: '{steps.previous.output}',
      inputType: 'previous',
      outputMapping: `step${activeWorkflow.steps.length + 1}Output`,
      condition: { type: 'always' }
    };

    updateWorkflow(activeWorkflow.id, {
      steps: [...activeWorkflow.steps, newStep]
    });
    toast.success('Step added');
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!activeWorkflow) return;
    const updatedSteps = activeWorkflow.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
    updateWorkflow(activeWorkflow.id, { steps: updatedSteps });
  };

  const handleDeleteStep = (stepId: string) => {
    if (!activeWorkflow) return;
    if (activeWorkflow.steps.length <= 1) {
      toast.warning('A workflow must have at least one step');
      return;
    }
    const filteredSteps = activeWorkflow.steps.filter((s) => s.id !== stepId);
    updateWorkflow(activeWorkflow.id, { steps: filteredSteps });
    toast.success('Step removed');
  };

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <GitFork className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Autonomous Workflow Studio
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
                v2.4 Sovereign
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Orchestrate multi-agent autonomous sequences, data pipelining, and event-driven tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all font-medium text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Prompt Builder
          </button>

          <button
            onClick={handleCreateNewWorkflow}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>

          {activeWorkflow && (
            <button
              onClick={handleRunWorkflow}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-md shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Execute Sequence
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Workflow Selector */}
        <aside className="w-80 border-r border-slate-800/80 bg-slate-900/40 p-4 flex flex-col overflow-y-auto">
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Registered Workflows ({filteredWorkflows.length})
          </div>

          <div className="space-y-2 flex-1">
            {filteredWorkflows.map((w) => {
              const isSelected = w.id === activeWorkflow?.id;
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWorkflowId(w.id)}
                  className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {w.name}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        w.trigger === 'scheduled'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : w.trigger === 'event'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {w.trigger}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{w.description}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {w.steps?.length || 0} steps
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete workflow "${w.name}"?`)) {
                          deleteWorkflow(w.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Canvas / Sequencer */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
          {activeWorkflow ? (
            <>
              {/* Workflow Details & Trigger Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-[280px]">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Workflow Name
                    </label>
                    <input
                      type="text"
                      value={activeWorkflow.name}
                      onChange={(e) => updateWorkflow(activeWorkflow.id, { name: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-lg font-bold text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="w-44">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={activeWorkflow.status}
                      onChange={(e) => updateWorkflow(activeWorkflow.id, { status: e.target.value as any })}
                      className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="active">Active (Operational)</option>
                      <option value="inactive">Inactive (Paused)</option>
                      <option value="running">Running</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={activeWorkflow.description}
                    onChange={(e) => updateWorkflow(activeWorkflow.id, { description: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Trigger Configuration */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-300">Trigger Mechanism:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(['manual', 'scheduled', 'event'] as const).map((trig) => (
                      <button
                        key={trig}
                        type="button"
                        onClick={() => updateWorkflow(activeWorkflow.id, { trigger: trig })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          activeWorkflow.trigger === trig
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {trig}
                      </button>
                    ))}
                  </div>

                  {activeWorkflow.trigger === 'scheduled' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cron expression e.g. 0 9 * * 1-5"
                        value={activeWorkflow.triggerConfig?.schedule || ''}
                        onChange={(e) =>
                          updateWorkflow(activeWorkflow.id, {
                            triggerConfig: { ...activeWorkflow.triggerConfig, schedule: e.target.value }
                          })
                        }
                        className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                      />
                    </div>
                  )}

                  {activeWorkflow.trigger === 'event' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Webhook / event e.g. email.received"
                        value={activeWorkflow.triggerConfig?.event || ''}
                        onChange={(e) =>
                          updateWorkflow(activeWorkflow.id, {
                            triggerConfig: { ...activeWorkflow.triggerConfig, event: e.target.value }
                          })
                        }
                        className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step Sequencer */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Execution Pipeline ({activeWorkflow.steps?.length || 0} Nodes)
                  </h2>
                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Step Node
                  </button>
                </div>

                {activeWorkflow.steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all space-y-4 relative group">
                      {/* Step Header */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                            className="bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-transparent focus:border-cyan-500 px-1"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={step.actionType}
                            onChange={(e) => handleUpdateStep(step.id, { actionType: e.target.value })}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="email">Email Processing</option>
                            <option value="task">Task Creation</option>
                            <option value="web-search">Web / Knowledge Search</option>
                            <option value="summarize">AI Summarization</option>
                            <option value="api-request">HTTP / API Request</option>
                            <option value="notification">Push Notification</option>
                          </select>

                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            title="Remove Step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Step Body */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="font-medium text-slate-400">Assigned Agent</label>
                          <select
                            value={step.agentId}
                            onChange={(e) => handleUpdateStep(step.id, { agentId: e.target.value })}
                            className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                          >
                            {agents.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.role || 'Autonomous Worker'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-medium text-slate-400">Output Mapping Variable</label>
                          <input
                            type="text"
                            value={step.outputMapping}
                            onChange={(e) => handleUpdateStep(step.id, { outputMapping: e.target.value })}
                            className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                            placeholder="e.g. stepOutput"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="font-medium text-slate-400">Payload / Input Binding</label>
                          <input
                            type="text"
                            value={typeof step.input === 'string' ? step.input : JSON.stringify(step.input)}
                            onChange={(e) => handleUpdateStep(step.id, { input: e.target.value })}
                            className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                            placeholder="{steps.previous.output}"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step Flow Connector Arrow */}
                    {idx < activeWorkflow.steps.length - 1 && (
                      <div className="flex justify-center my-1">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20">
              <Layers className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm">No workflow selected. Choose one from the left or create a new one.</p>
            </div>
          )}
        </main>

        {/* Right Sidebar: Execution Telemetry & Run History */}
        <aside className="w-84 border-l border-slate-800/80 bg-slate-900/40 p-4 flex flex-col overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Run Telemetry
          </div>

          {activeRun ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Run ID:</span>
                  <span className="font-mono text-cyan-400">{activeRun.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${
                      activeRun.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : activeRun.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    {activeRun.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Steps Executed:</span>
                  <span className="font-semibold text-slate-200">
                    {activeRun.stepResults?.length || 0} / {activeWorkflow?.steps?.length || 0}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-semibold uppercase text-slate-400">Step Outputs</div>
              <div className="space-y-2">
                {activeRun.stepResults?.map((res, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Step #{i + 1}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </span>
                    </div>
                    <pre className="p-1.5 bg-slate-900 rounded text-[10px] text-slate-400 overflow-x-auto">
                      {typeof res.output === 'string' ? res.output : JSON.stringify(res.output, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-10">
              No recent execution logs for this workflow. Click "Execute Sequence" to run simulation.
            </div>
          )}
        </aside>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Generate Workflow with AI</h3>
            </div>
            <p className="text-xs text-slate-300">
              Describe in natural language the multi-step automation workflow you want to construct.
            </p>
            <form onSubmit={handleAiGenerate} className="space-y-4">
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Check incoming emails every morning, summarize client requests, and add top action items into my tasks board..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnhancing || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isEnhancing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Pipeline
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowEditorPage;