import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DomainProfile,
  DomainType,
  PRESET_PROFILES
} from '../services/ai/UniversalDomainOperator';
import { AnalystAuditReport } from '../services/ai/ForensicAnalystLinter';
import { exportMarkdownToDocx } from '../utils/docxExportUtil';
import { useToast } from '../hooks/useToast';
import { useActiveContext } from '../hooks/useActiveContext';
import { AgenticToolRegistry, Tool } from '../services/agents/ToolRegistry';
import { useAttachedDriveStore } from '../store/attachedDriveStore';
import { sovereignFs } from '../services/fs/sovereignFsBridge';
import { GenieDriveTree } from '../components/geniedrive/GenieDriveTree';
import { LayoutMode, MessageSuggestion, ThoughtTraceStep, RightTab } from '../components/workbench/types';
import { WorkbenchHeader } from '../components/workbench/WorkbenchHeader';
import { WorkbenchDriveDrawer } from '../components/workbench/WorkbenchDriveDrawer';
import { WorkbenchChatFeed } from '../components/workbench/WorkbenchChatFeed';
import { WorkbenchPromptInput } from '../components/workbench/WorkbenchPromptInput';
import { WorkbenchDeliverablePane } from '../components/workbench/WorkbenchDeliverablePane';
import { DynamicWorkflowCarousel } from '../components/workbench/DynamicWorkflowCarousel';
import { NewWorkflowModal } from '../components/workbench/NewWorkflowModal';
import { BrainGenesisModal } from '../components/workbench/BrainGenesisModal';
import { WorkflowItem } from '../components/workbench/workflowData';
import { SYNTHETIC_DEMO_RECORD_TEXT, SYNTHETIC_DEMO_OBJECTIVE } from '../data/demo/syntheticDemoCase';
import { WorkbenchSessionHistoryDrawer } from '../components/workbench/WorkbenchSessionHistoryDrawer';
import { useWorkbenchSessions } from './UniversalWorkbench/useWorkbenchSessions';
import {
  handleManifestIntent,
  handleDocxIntent,
  handleFolderCreationIntent,
  handleConversationalQA,
  handleSovereignReActExecution,
  IntentContext
} from '../services/workbench/workbenchIntentRouter';

export const UniversalWorkbenchPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { setActiveContext: setActiveGlobalContext, setActiveDocument } = useActiveContext();

  const [profiles, setProfiles] = useState<Record<DomainType, DomainProfile>>(PRESET_PROFILES);
  const [showDomainDropdown, setShowDomainDropdown] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [showEngineDropdown, setShowEngineDropdown] = useState<boolean>(false);

  // Modular Multi-Session & Parallel Background Runner Hook
  const {
    sessions,
    setSessions,
    activeSessionId,
    runningSessionIds,
    activeDomainType,
    setActiveDomainType,
    messages,
    setMessages,
    generatedOutput,
    setGeneratedOutput,
    sessionArtifacts,
    setSessionArtifacts,
    activeArtifactId,
    setActiveArtifactId,
    liveThoughtSteps,
    setLiveThoughtSteps,
    attachedFileName,
    setAttachedFileName,
    evidenceText,
    setEvidenceText,
    notepadText,
    setNotepadText,
    handleSelectSession,
    handleCreateSession,
    markSessionRunning,
    updateSessionData
  } = useWorkbenchSessions(profiles);

  const activeProfile = profiles[activeDomainType] || PRESET_PROFILES.legal;

  // Active Pane Tab State
  const [activeRightTab, setActiveRightTab] = useState<RightTab>('deliverable');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [savedDiskPath, setSavedDiskPath] = useState<string>('');
  const [auditReport, setAuditReport] = useState<AnalystAuditReport | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Voice Dictation
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Layout & Navigation State
  const [showDrivePanel, setShowDrivePanel] = useState<boolean>(false);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showGenieDriveModal, setShowGenieDriveModal] = useState<boolean>(false);
  const [showNewWorkflowModal, setShowNewWorkflowModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>(undefined);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [leftPanelPercent, setLeftPanelPercent] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('workbench_panel_split');
      if (stored) return Number(stored) || 50;
    } catch (_e) {}
    return 50;
  });

  // Tools & Search Filter States
  const [sourceSearchTerm, setSourceSearchTerm] = useState<string>('');
  const [toolSearchTerm, setToolSearchTerm] = useState<string>('');
  const [registeredTools, setRegisteredTools] = useState<Tool[]>([]);

  // Engine & Tier
  const [activeEngine, setActiveEngine] = useState<string>('nebius');
  const [activeNebiusTier, setActiveNebiusTier] = useState<string>('super');
  const [deepLoop, setDeepLoop] = useState<boolean>(true);

  // Initialize Tools
  useEffect(() => {
    const tools = AgenticToolRegistry.getInstance().getAllTools();
    setRegisteredTools(tools);
  }, []);

  // Sync Global Context
  useEffect(() => {
    setActiveGlobalContext({
      type: 'workbench',
      id: activeSessionId,
      name: `${activeProfile.title} — ${activeSessionId}`
    });
  }, [activeSessionId, activeProfile, setActiveGlobalContext]);

  // Contextual Suggestion Pills Engine
  const getDynamicSuggestions = useCallback((lastText: string, domain: string): MessageSuggestion[] => {
    const lower = (lastText || '').toLowerCase();

    if (domain === 'coding' || lower.includes('typescript') || lower.includes('architecture') || lower.includes('api')) {
      return [
        { id: 'c-1', label: '⚡ Synthesize Architecture RFC', prompt: 'Draft a comprehensive System Architecture RFC with component diagrams and failure modes.', icon: 'zap' },
        { id: 'c-2', label: '📋 Generate Typed API Contract', prompt: 'Formulate a full-stack OpenAPI / TypeScript API contract specification with request/response schemas.', icon: 'target' },
        { id: 'c-3', label: '🛡️ Run OWASP Security Audit', prompt: 'Perform a strict OWASP Top 10 code security audit and generate remediated patches.', icon: 'shield' },
        { id: 'c-4', label: '🚀 Design CI/CD Pipeline Blueprint', prompt: 'Create an automated GitHub Actions CI/CD deployment pipeline with test validation.', icon: 'folder' }
      ];
    }

    if (domain === 'real_estate' || lower.includes('zoning') || lower.includes('lease') || lower.includes('property')) {
      return [
        { id: 're-1', label: '🏢 Audit Lease & Escalations', prompt: 'Conduct a forensic Lease Agreement Audit: inspect rent escalations, CAM fees, and default provisions.', icon: 'target' },
        { id: 're-2', label: '📊 Build Acquisition Pro Forma & IRR', prompt: 'Build a full Real Estate Pro Forma with NOI, DSCR, and 5-year IRR projections.', icon: 'brain' },
        { id: 're-3', label: '🗺️ Verify Municipal Zoning & Setbacks', prompt: 'Conduct a Municipal Zoning Audit: verify FAR, setback minimums, and California ADU regulations.', icon: 'shield' },
        { id: 're-4', label: '📝 Draft CAR Repair Request Form', prompt: 'Analyze physical inspection defects and compile a formal Buyer Request for Repair (Form RR).', icon: 'folder' }
      ];
    }

    if (domain === 'medical' || lower.includes('qme') || lower.includes('ime') || lower.includes('mtus') || lower.includes('wpi')) {
      return [
        { id: 'med-1', label: '🩺 Clinical Chronology & Treatment Review', prompt: 'Synthesize an itemized clinical treatment chronology across all diagnostic exams and PR-2 reports.', icon: 'brain' },
        { id: 'med-2', label: '📋 MTUS Treatment Necessity Rebuttal', prompt: 'Draft a formal clinical rebuttal under MTUS and ACOEM guidelines demonstrating medical necessity.', icon: 'shield' },
        { id: 'med-3', label: '⚖️ Forensic Apportionment Analysis', prompt: 'Extract whole person impairment (WPI) and assess substantial medical evidence on apportionment under Escobedo.', icon: 'scale' },
        { id: 'med-4', label: '💰 Audit OMFS Medical-Legal Billing', prompt: 'Audit billing codes under 8 CCR § 9795 (OMFS ML201-ML204) for fee schedule compliance.', icon: 'folder' }
      ];
    }

    if (lower.includes('wcab') || lower.includes('penalty') || lower.includes('pleading') || domain === 'legal') {
      return [
        { id: 'l-1', label: '⚖️ Draft Petition for LC § 5814 Penalties', prompt: 'Draft a formal California 28-line conformed Petition for LC § 5814 Penalties and § 5814.5 Attorney Fees based on carrier unreasonable delay.', icon: 'scale' },
        { id: 'l-2', label: '📋 Compile 15-Exhibit Conformed Master Binder', prompt: 'Recompile the complete 15-exhibit conformed master exhibit binder with bates stamps and Avruscio-grid separators.', icon: 'shield' },
        { id: 'l-3', label: '🩺 Extract QME Impairment & Apportionment', prompt: 'Perform forensic extraction of WPI impairment percentages, AMA Guides Chapter 15 ratings, and 100% industrial causation findings.', icon: 'brain' },
        { id: 'l-4', label: '📂 Sync Client Binder to Active Workspace', prompt: 'Verify all exhibits and conform pleadings with our active legal workspace records.', icon: 'folder' }
      ];
    }

    return [
      { id: 'g-1', label: '🧠 Walk Through Socratic Setup Interview', prompt: 'I want to customize this brain for my business. Walk me through the 3-step setup interview to configure our vertical, deliverables, and rules.', icon: 'brain' },
      { id: 'g-2', label: '⚡ Assemble 3 Custom Workflows', prompt: 'Proactively generate and save the top 3 high-impact workflows for this business into .agents/workflows/.', icon: 'zap' },
      { id: 'g-3', label: '🎯 Define Ideal Client Profile (ICP)', prompt: 'Detail our Ideal Client Profile, target audience pain points, and intake audit criteria.', icon: 'target' },
      { id: 'g-4', label: '📂 Mount to Sovereign Workspace', prompt: 'Verify folder architecture and mount master client files directly to the active workspace.', icon: 'folder' }
    ];
  }, []);

  // Persist Deliverable to Disk Helper
  const persistDeliverableToDisk = useCallback(async (baseName: string, content: string, explicitFileName?: string) => {
    if (!content || content.trim().length === 0) return;
    try {
      const activeFolder = attachedFileName ? attachedFileName.replace(/\.[^/.]+$/, '') : 'AI_GENERATED_DOCS';
      const cleanFileName = explicitFileName || `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}.md`;
      const targetPath = await sovereignWorkspace.resolvePath(activeFolder, cleanFileName);
      await sovereignFs.writeFile({ path: targetPath, content });
      setSavedDiskPath(targetPath);
    } catch (_e) {}
  }, [attachedFileName]);

  // Main Execution Dispatcher
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim() && !evidenceText) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentSessionId = activeSessionId;
    const userMsgId = `user-${Date.now()}`;
    const userMsg: StudioMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend || `Analyze attached file: ${attachedFileName}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: StudioMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      thoughtSteps: []
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setChatInput('');
    setIsProcessing(true);
    setProgressStep('Analyzing request & routing intent...');
    setLiveThoughtSteps([]);
    markSessionRunning(currentSessionId, true);

    const startTime = Date.now();
    const thoughtTraceSteps: ThoughtTraceStep[] = [];

    const handleThought = (step: string, detail?: string) => {
      const trace: ThoughtTraceStep = {
        id: `thought-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: step,
        detail,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      thoughtTraceSteps.push(trace);
      setLiveThoughtSteps([...thoughtTraceSteps]);
      setProgressStep(step);
    };

    const intentCtx: IntentContext = {
      trimmed: textToSend.trim(),
      lower: textToSend.trim().toLowerCase(),
      sessionId: currentSessionId,
      activeProfile,
      activeDomainType,
      evidenceText,
      attachedFileName,
      notepadText,
      generatedOutput,
      deepLoop,
      activeEngine,
      activeNebiusTier,
      pinnedFiles: useAttachedDriveStore.getState().pinnedFiles || [],
      startTime,
      onThoughtStep: handleThought,
      onSessionArtifacts: (arts) => {
        setSessionArtifacts(arts);
        if (arts[0]) setActiveArtifactId(arts[0].id);
      },
      onDeliverableOutput: (content, diskPath) => {
        setGeneratedOutput(content);
        if (diskPath) setSavedDiskPath(diskPath);
        setActiveRightTab('deliverable');
        persistDeliverableToDisk(textToSend.slice(0, 30), content);
      }
    };

    try {
      // 1. Manifest Intent
      const manifestRes = await handleManifestIntent(intentCtx);
      if (manifestRes?.handled) {
        finishExecution(assistantMsgId, manifestRes.replyContent || '', startTime, thoughtTraceSteps);
        return;
      }

      // 2. Docx Intent
      const docxRes = await handleDocxIntent(intentCtx);
      if (docxRes?.handled) {
        finishExecution(assistantMsgId, docxRes.replyContent || '', startTime, thoughtTraceSteps);
        return;
      }

      // 3. Folder Creation Intent
      const folderRes = await handleFolderCreationIntent(intentCtx);
      if (folderRes?.handled) {
        finishExecution(assistantMsgId, folderRes.replyContent || '', startTime, thoughtTraceSteps);
        return;
      }

      // 4. Drafting vs Conversational QA
      const isExplicitDrafting = /\b(draft|prepare|generate|create|build|scaffold|automate|init|petition|brief|rating)\b/i.test(intentCtx.trimmed);
      if (!isExplicitDrafting) {
        const qaRes = await handleConversationalQA(intentCtx);
        finishExecution(assistantMsgId, qaRes.replyContent || '', startTime, thoughtTraceSteps);
        return;
      }

      // 5. Sovereign ReAct Engine
      const reactRes = await handleSovereignReActExecution(intentCtx);
      finishExecution(
        assistantMsgId,
        reactRes.replyContent || '',
        startTime,
        thoughtTraceSteps,
        reactRes.artifactBadges,
        reactRes.auditScore
      );
    } catch (err: any) {
      finishExecution(
        assistantMsgId,
        `Execution encountered error: ${err.message || 'Unknown error'}. Please retry.`,
        startTime,
        thoughtTraceSteps
      );
    } finally {
      setIsProcessing(false);
      markSessionRunning(currentSessionId, false);
    }
  };

  const finishExecution = (
    msgId: string,
    content: string,
    startTime: number,
    thoughtSteps: ThoughtTraceStep[],
    artifacts?: any[],
    auditScore?: number
  ) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? {
              ...msg,
              content,
              artifacts,
              auditScore,
              suggestions: getDynamicSuggestions(content, activeDomainType),
              isStreaming: false,
              thoughtDuration: `${elapsed}s`,
              thoughtSteps
            }
          : msg
      )
    );
  };

  const handleCopyOutput = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    toast.success('Copied deliverable to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDocx = async () => {
    if (!generatedOutput) return;
    const title = `${activeProfile.title.replace(/\s+/g, '_')}_Deliverable`;
    await exportMarkdownToDocx(generatedOutput, title);
    toast.success('Exported Word (.docx) document!');
  };

  const handleDownloadMd = () => {
    if (!generatedOutput) return;
    const blob = new Blob([generatedOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProfile.title.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded Markdown (.md) file!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <WorkbenchHeader
        activeProfile={activeProfile}
        activeDomainType={activeDomainType}
        profiles={profiles}
        showDomainDropdown={showDomainDropdown}
        setShowDomainDropdown={setShowDomainDropdown}
        onSelectDomain={(key) => {
          setActiveDomainType(key);
          setShowDomainDropdown(false);
        }}
        onOpenCustomModal={() => {
          setShowDomainDropdown(false);
          setShowCustomModal(true);
        }}
        showDrivePanel={showDrivePanel}
        setShowDrivePanel={setShowDrivePanel}
        showHistoryDrawer={showHistoryDrawer}
        setShowHistoryDrawer={setShowHistoryDrawer}
        sessionCount={sessions.length}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        activeEngine={activeEngine}
        activeNebiusTier={activeNebiusTier}
        onSelectNebiusTier={setActiveNebiusTier}
        showEngineDropdown={showEngineDropdown}
        setShowEngineDropdown={setShowEngineDropdown}
        onSelectEngine={setActiveEngine}
        deepLoop={deepLoop}
        setDeepLoop={setDeepLoop}
      />

      {/* Main Split Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* SutraDrive Drawer */}
        <WorkbenchDriveDrawer
          showDrivePanel={showDrivePanel}
          onSelectFile={(f) => {
            setAttachedFileName(f.name);
            setEvidenceText(f.content || f.preview || '');
            toast.success(`Attached ${f.name}!`);
          }}
          onClose={() => setShowDrivePanel(false)}
        />

        {/* Left Chat Pane */}
        {(layoutMode === 'split' || layoutMode === 'chat') && (
          <div
            style={{ width: layoutMode === 'split' ? `${leftPanelPercent}%` : '100%' }}
            className="flex flex-col h-full min-h-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <WorkbenchChatFeed
              messages={messages}
              isProcessing={isProcessing}
              progressStep={progressStep}
              liveThoughtSteps={liveThoughtSteps}
              onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
            />

            <DynamicWorkflowCarousel
              activeDomainType={activeDomainType}
              selectedWorkflowId={selectedWorkflowId}
              onSelectWorkflow={(wf) => {
                setSelectedWorkflowId(wf.id);
                setChatInput(wf.prompt);
              }}
              onOpenNewModal={() => setShowNewWorkflowModal(true)}
            />

            <WorkbenchPromptInput
              chatInput={chatInput}
              setChatInput={setChatInput}
              isProcessing={isProcessing}
              isListening={isListening}
              attachedFileName={attachedFileName}
              onSend={() => handleSendMessage()}
              onToggleMic={() => setIsListening(!isListening)}
              onClearAttachment={() => {
                setAttachedFileName('');
                setEvidenceText('');
              }}
              onLoadDemoCase={() => {
                setAttachedFileName('DEMO_CASE_ALEX_DEMO_ADJ9928174.txt');
                setEvidenceText(SYNTHETIC_DEMO_RECORD_TEXT);
                setChatInput(SYNTHETIC_DEMO_OBJECTIVE);
                toast.success('Loaded synthetic demo case!');
              }}
            />
          </div>
        )}

        {/* Right Synthesis Output & Grounding Pane */}
        {(layoutMode === 'split' || layoutMode === 'deliverable') && (
          <div
            style={{ width: layoutMode === 'split' ? `${100 - leftPanelPercent}%` : '100%' }}
            className="flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <WorkbenchDeliverablePane
              activeRightTab={activeRightTab}
              setActiveRightTab={setActiveRightTab}
              activeDomainType={activeDomainType}
              generatedOutput={generatedOutput}
              savedDiskPath={savedDiskPath}
              copied={copied}
              onCopyOutput={handleCopyOutput}
              onExportDocx={handleExportDocx}
              onDownloadMd={handleDownloadMd}
              onPrint={handlePrint}
              auditReport={auditReport}
              evidenceText={evidenceText}
              sourceSearchTerm={sourceSearchTerm}
              setSourceSearchTerm={setSourceSearchTerm}
              onClearEvidence={() => {
                setEvidenceText('');
                setAttachedFileName('');
              }}
              notepadText={notepadText}
              onNotepadChange={setNotepadText}
              onCopyNotepad={() => {
                navigator.clipboard.writeText(notepadText);
                toast.success('Copied Scratchpad notes!');
              }}
              onDownloadNotepadMd={() => {
                const blob = new Blob([notepadText], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Scratchpad_Notes.md';
                a.click();
              }}
              onClearNotepad={() => setNotepadText('')}
              onApplyNotepadToEvidence={() => {
                setEvidenceText((prev) => `${prev}\n\n${notepadText}`);
                toast.success('Appended Scratchpad notes to Evidence Context!');
              }}
              registeredTools={registeredTools}
              toolSearchTerm={toolSearchTerm}
              setToolSearchTerm={setToolSearchTerm}
              onExecuteTool={(tool) => toast.info(`Selected tool: ${tool.name}`)}
              activeSessionId={activeSessionId}
              initialArtifacts={sessionArtifacts}
              initialActiveArtifactId={activeArtifactId}
              onArtifactsChange={(arts, actId) => {
                setSessionArtifacts(arts);
                setActiveArtifactId(actId);
              }}
            />
          </div>
        )}
      </div>

      {/* Sessions History Drawer with Parallel Running Indicators */}
      <WorkbenchSessionHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setShowHistoryDrawer(false);
        }}
        onNewSession={() => {
          handleCreateSession(activeDomainType);
          setShowHistoryDrawer(false);
        }}
        onDeleteSession={(id) => {
          setSessions((prev) => prev.filter((s) => s.id !== id));
        }}
      />

      {/* Brain Genesis Modal */}
      <BrainGenesisModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onBrainActivated={(newProfile, newWf) => {
          setProfiles((prev) => ({ ...prev, custom: newProfile as any }));
          setActiveDomainType('custom');
          setSelectedWorkflowId(newWf.id);
          setChatInput(newWf.prompt);
          toast.success(`Activated Brain for ${newProfile.title}!`);
        }}
      />

      {/* Dynamic Workflow Modal */}
      <NewWorkflowModal
        isOpen={showNewWorkflowModal}
        onClose={() => setShowNewWorkflowModal(false)}
        activeDomainType={activeDomainType}
        onWorkflowCreated={(newWf) => {
          setSelectedWorkflowId(newWf.id);
          setChatInput(newWf.prompt);
          toast.success(`Workflow created: ${newWf.title}`);
        }}
      />
    </div>
  );
};
