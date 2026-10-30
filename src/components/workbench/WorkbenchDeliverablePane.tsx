import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Printer,
  FileText,
  Search,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { RightTab } from './types';
import { Tool } from '../../services/agents/ToolRegistry';
import { AnalystAuditReport } from '../../services/ai/ForensicAnalystLinter';
import { exportMarkdownToDocx } from '../../utils/docxExportUtil';
import { unwrapModelDeliverable } from '../../utils/deliverableUnwrapper';
import { DOMAIN_GROUNDING_CONFIGS } from '../../services/legal/TavilyGroundingService';
import { WorkbenchToolHandsTab } from './WorkbenchToolHandsTab';
import { WorkbenchTavilyTab } from './WorkbenchTavilyTab';
import { WorkbenchSynthesisTab } from './WorkbenchSynthesisTab';
import { WorkbenchArtifactSubtabs, ArtifactItem } from './WorkbenchArtifactSubtabs';

interface WorkbenchDeliverablePaneProps {
  activeRightTab: RightTab;
  setActiveRightTab: (tab: RightTab) => void;
  // Deliverable Content
  generatedOutput: string;
  copied: boolean;
  onCopyOutput: () => void;
  onExportDocx: () => void;
  onDownloadMd: () => void;
  onPrint: () => void;
  auditReport: AnalystAuditReport | null;
  // Source Evidence Content
  evidenceText: string;
  sourceSearchTerm: string;
  setSourceSearchTerm: (term: string) => void;
  onClearEvidence: () => void;
  // Notepad / Scratchpad
  notepadText: string;
  onNotepadChange: (text: string) => void;
  onCopyNotepad: () => void;
  onDownloadNotepadMd: () => void;
  onClearNotepad: () => void;
  onApplyNotepadToEvidence: () => void;
  // Tools
  registeredTools: Tool[];
  toolSearchTerm: string;
  setToolSearchTerm: (term: string) => void;
  onExecuteTool: (tool: Tool) => void;
  // Disk persistence
  savedDiskPath?: string;
  // Session & Multi-Artifact Persistence
  activeSessionId?: string;
  activeDomainType?: string;
  initialArtifacts?: ArtifactItem[];
  initialActiveArtifactId?: string;
  onArtifactsChange?: (artifacts: ArtifactItem[], activeId: string) => void;
}

export const WorkbenchDeliverablePane: React.FC<WorkbenchDeliverablePaneProps> = ({
  activeRightTab,
  setActiveRightTab,
  generatedOutput,
  copied,
  onCopyOutput,
  onExportDocx,
  onDownloadMd,
  onPrint,
  auditReport,
  evidenceText,
  onClearEvidence,
  notepadText,
  onNotepadChange,
  onCopyNotepad,
  onClearNotepad,
  onApplyNotepadToEvidence,
  registeredTools,
  toolSearchTerm,
  setToolSearchTerm,
  onExecuteTool,
  savedDiskPath,
  activeSessionId,
  activeDomainType = 'legal',
  initialArtifacts,
  initialActiveArtifactId,
  onArtifactsChange
}) => {
  const groundingConfig = DOMAIN_GROUNDING_CONFIGS[activeDomainType || 'legal'] || DOMAIN_GROUNDING_CONFIGS.custom;

  // Smart Title Extraction for Distinct Artifacts
  const extractArtifactTitle = useCallback((content: string, defaultName: string = 'Deliverable'): string => {
    if (!content) return defaultName;
    const unwrapped = unwrapModelDeliverable(content);
    const clean = unwrapped.content || content;
    const headingMatch = clean.match(/^#+\s*([^\n\r#]+)/m);
    if (headingMatch && headingMatch[1]) {
      const raw = headingMatch[1].replace(/[*_`]/g, '').trim();
      if (raw.length > 2) {
        return raw.replace(/^PETITION FOR /i, 'Petition: ').slice(0, 30);
      }
    }
    const firstLines = clean.slice(0, 500);
    const petitionMatch = firstLines.match(/PETITION\s+FOR\s+([^\n\r,]+)/i);
    if (petitionMatch && petitionMatch[1]) {
      return `Petition: ${petitionMatch[1].trim()}`.slice(0, 30);
    }
    return defaultName;
  }, []);

  // Multi-Artifact State
  const initialUnwrapped = useMemo(() => unwrapModelDeliverable(generatedOutput), []);
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>(() => {
    if (initialArtifacts && initialArtifacts.length > 0) {
      return initialArtifacts;
    }
    const clean = initialUnwrapped.content;
    if (clean && clean.trim().length > 0) {
      return [{
        id: 'doc-primary',
        title: initialUnwrapped.suggestedFileName || extractArtifactTitle(clean, 'Deliverable'),
        content: clean,
        timestamp: 'Active',
        diskPath: initialUnwrapped.diskPath || savedDiskPath
      }];
    }
    return [{
      id: 'doc-primary',
      title: 'Deliverable',
      content: '',
      timestamp: 'Active',
      diskPath: savedDiskPath
    }];
  });

  const [activeArtifactId, setActiveArtifactId] = useState<string>(() => {
    return initialActiveArtifactId || (initialArtifacts && initialArtifacts[0]?.id) || 'doc-primary';
  });
  const lastProcessedOutputRef = useRef<string>(generatedOutput);

  // Synchronize artifacts and active viewport whenever session switches
  useEffect(() => {
    if (initialArtifacts && initialArtifacts.length > 0) {
      setArtifacts(initialArtifacts);
      setActiveArtifactId(initialActiveArtifactId || initialArtifacts[0].id);
      const activeItem = initialArtifacts.find(a => a.id === (initialActiveArtifactId || initialArtifacts[0].id));
      lastProcessedOutputRef.current = activeItem?.content || generatedOutput || '';
    } else if (generatedOutput && generatedOutput.trim().length > 0) {
      const unwrapped = unwrapModelDeliverable(generatedOutput);
      const title = unwrapped.suggestedFileName || extractArtifactTitle(unwrapped.content, 'Deliverable');
      const initialList = [{
        id: 'doc-primary',
        title,
        content: unwrapped.content,
        timestamp: 'Active',
        diskPath: unwrapped.diskPath || savedDiskPath
      }];
      setArtifacts(initialList);
      setActiveArtifactId('doc-primary');
      lastProcessedOutputRef.current = generatedOutput;
    } else {
      setArtifacts([{
        id: 'doc-primary',
        title: 'Deliverable',
        content: '',
        timestamp: 'Active'
      }]);
      setActiveArtifactId('doc-primary');
      lastProcessedOutputRef.current = '';
    }
  }, [activeSessionId]);

  // Store latest onArtifactsChange in ref to prevent infinite re-render loops
  const onArtifactsChangeRef = useRef(onArtifactsChange);
  useEffect(() => {
    onArtifactsChangeRef.current = onArtifactsChange;
  }, [onArtifactsChange]);

  const lastSyncedArtifactsRef = useRef<{ artifacts: any[]; activeId: string }>({
    artifacts: [],
    activeId: ''
  });

  useEffect(() => {
    const isSameLength = lastSyncedArtifactsRef.current.artifacts.length === artifacts.length;
    const isSameId = lastSyncedArtifactsRef.current.activeId === activeArtifactId;
    const isSameContent =
      isSameLength &&
      artifacts.every((a, i) => {
        const prev = lastSyncedArtifactsRef.current.artifacts[i];
        return (
          prev &&
          prev.id === a.id &&
          prev.content === a.content &&
          prev.diskPath === a.diskPath &&
          prev.title === a.title
        );
      });

    if (isSameId && isSameContent) {
      return;
    }

    lastSyncedArtifactsRef.current = { artifacts, activeId: activeArtifactId };
    onArtifactsChangeRef.current?.(artifacts, activeArtifactId);
  }, [artifacts, activeArtifactId]);

  // Listener for agentic canvas document events
  useEffect(() => {
    const handleCanvasCreated = (e: any) => {
      const doc = e.detail;
      if (!doc || !doc.content || typeof doc.content !== 'string' || doc.content.trim().length === 0) return;

      const unwrapped = unwrapModelDeliverable(doc.content);
      const cleanOutput = unwrapped.content;
      if (!cleanOutput || cleanOutput.trim().length === 0) return;

      const docTitle = doc.title || unwrapped.suggestedFileName || extractArtifactTitle(cleanOutput, 'Deliverable Document');
      const docPath = doc.path || unwrapped.diskPath || savedDiskPath;
      const docId = doc.id || `doc-${Date.now()}`;

      setArtifacts((prev) => {
        const existingIdx = prev.findIndex((a) =>
          (doc.path && a.diskPath === doc.path) ||
          (doc.id && a.id === doc.id) ||
          (doc.title && a.title === docTitle && !['Deliverable Document', 'Universal Work Product', 'Master Synthesis & Strategy'].includes(docTitle)) ||
          (a.content.trim() === cleanOutput.trim())
        );

        if (existingIdx !== -1) {
          const currentItem = prev[existingIdx];
          const hasContentChange = currentItem.content.trim() !== cleanOutput.trim();
          const hasTitleChange = docTitle && currentItem.title !== docTitle;
          const hasPathChange = docPath && currentItem.diskPath !== docPath;

          if (!hasContentChange && !hasTitleChange && !hasPathChange) {
            return prev;
          }

          const next = [...prev];
          next[existingIdx] = {
            ...currentItem,
            title: docTitle || currentItem.title,
            content: cleanOutput,
            diskPath: docPath || currentItem.diskPath,
            timestamp: hasContentChange ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : currentItem.timestamp
          };
          return next;
        }

        const newDoc: ArtifactItem = {
          id: docId,
          title: docTitle,
          content: cleanOutput,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          diskPath: docPath
        };
        setActiveArtifactId(docId);
        return [...prev, newDoc];
      });
    };

    window.addEventListener('genieflow:canvas-document-created', handleCanvasCreated);
    return () => window.removeEventListener('genieflow:canvas-document-created', handleCanvasCreated);
  }, [extractArtifactTitle, savedDiskPath]);

  // Sync incoming model output into active artifact
  useEffect(() => {
    if (!generatedOutput || generatedOutput.trim().length === 0) return;
    if (generatedOutput === lastProcessedOutputRef.current) return;
    lastProcessedOutputRef.current = generatedOutput;

    const unwrapped = unwrapModelDeliverable(generatedOutput);
    const cleanOutput = unwrapped.content;
    if (!cleanOutput || cleanOutput.trim().length === 0) return;

    const newTitle = unwrapped.suggestedFileName || extractArtifactTitle(cleanOutput, 'Deliverable Document');
    const resolvedDiskPath = unwrapped.diskPath || savedDiskPath;

    setArtifacts((prev) => {
      const activeItem = prev.find((a) => a.id === activeArtifactId);
      if (!activeItem || !activeItem.content || activeItem.content.trim().length === 0) {
        return prev.map((a) =>
          a.id === activeArtifactId
            ? {
                ...a,
                title: a.title && !['Deliverable', 'Deliverable Document'].includes(a.title) ? a.title : newTitle,
                content: cleanOutput,
                diskPath: resolvedDiskPath || a.diskPath,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : a
        );
      }

      const existingMatch = prev.find(
        (a) => (resolvedDiskPath && a.diskPath === resolvedDiskPath) || a.content.trim() === cleanOutput.trim()
      );
      if (existingMatch) {
        return prev.map((a) =>
          a.id === existingMatch.id
            ? {
                ...a,
                title: a.title && !a.title.startsWith('Deliverable ') ? a.title : newTitle,
                content: cleanOutput,
                diskPath: resolvedDiskPath || a.diskPath
              }
            : a
        );
      }

      const newId = `doc-${Date.now()}`;
      const newArtifact: ArtifactItem = {
        id: newId,
        title: newTitle,
        content: cleanOutput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diskPath: resolvedDiskPath
      };
      setActiveArtifactId(newId);
      return [...prev, newArtifact];
    });
  }, [generatedOutput, savedDiskPath, activeArtifactId, extractArtifactTitle]);

  const activeDoc = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0] || {
    id: 'doc-primary',
    title: 'Deliverable',
    content: '',
    timestamp: 'Active',
    diskPath: savedDiskPath
  };

  const rawActiveContent = (activeDoc && typeof activeDoc.content === 'string')
    ? activeDoc.content
    : (generatedOutput || '');
  const activeUnwrapped = useMemo(() => unwrapModelDeliverable(rawActiveContent), [rawActiveContent]);
  const activeContent = activeUnwrapped.content;

  const handleAddNewArtifact = () => {
    const newId = `doc-${Date.now()}`;
    const newDoc: ArtifactItem = {
      id: newId,
      title: `Draft ${artifacts.length + 1}`,
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setArtifacts((prev) => [...prev, newDoc]);
    setActiveArtifactId(newId);
  };

  const handleCloseArtifact = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (artifacts.length <= 1) return;
    setArtifacts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (activeArtifactId === id && next.length > 0) {
        setActiveArtifactId(next[next.length - 1].id);
      }
      return next;
    });
  };

  const handleCloseOtherArtifacts = () => {
    const current = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0];
    if (current) {
      setArtifacts([current]);
      setActiveArtifactId(current.id);
    }
  };

  const handleResetArtifacts = () => {
    const cleanId = `doc-primary`;
    setArtifacts([{
      id: cleanId,
      title: 'Deliverable',
      content: '',
      timestamp: 'Active',
      diskPath: undefined
    }]);
    setActiveArtifactId(cleanId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Tab Navigation & Actions Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        {/* Left Tabs */}
        <div className="border border-slate-300 dark:border-slate-700 rounded-lg flex p-0.5 bg-slate-100 dark:bg-slate-800/90 shadow-2xs">
          <button
            onClick={() => setActiveRightTab('deliverable')}
            className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
              activeRightTab === 'deliverable'
                ? 'sutra-steel-active font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium'
            }`}
          >
            Synthesis Output
          </button>
          <button
            onClick={() => setActiveRightTab('source')}
            className={`px-3 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeRightTab === 'source'
                ? 'sutra-steel-active font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium'
            }`}
          >
            <span>Source Evidence</span>
            {evidenceText && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeRightTab === 'source'
                  ? 'bg-white/25 text-white font-semibold'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium'
              }`}>
                Attached
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveRightTab('notepad')}
            className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
              activeRightTab === 'notepad'
                ? 'sutra-steel-active font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium'
            }`}
          >
            Scratchpad
          </button>
          <button
            onClick={() => setActiveRightTab('tools')}
            className={`px-3 py-1 rounded-md text-xs transition cursor-pointer ${
              activeRightTab === 'tools'
                ? 'sutra-steel-active font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium'
            }`}
          >
            Tool Hands ({registeredTools.length})
          </button>
          <button
            onClick={() => setActiveRightTab('tavily')}
            className={`px-3 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1.5 ${
              activeRightTab === 'tavily'
                ? 'sutra-steel-active font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium'
            }`}
          >
            <Search className="w-3 h-3 text-amber-500" />
            <span>{groundingConfig.tabLabel}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
              Live
            </span>
          </button>
        </div>

        {/* Right Action Icons (for Deliverable) */}
        {activeRightTab === 'deliverable' && activeContent && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={async () => {
                try {
                  const text = activeContent;
                  const fileName = `${(activeDoc.title || 'Deliverable').replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
                  await exportMarkdownToDocx(text, fileName);
                } catch {
                  onExportDocx();
                }
              }}
              className="h-5.5 px-2 rounded-md text-[10.5px] font-medium flex items-center gap-1 sutra-silver-create hover:opacity-90 transition cursor-pointer shadow-2xs"
              title="Download Word Document (.docx)"
            >
              <Download className="w-2.5 h-2.5" />
              <span>.docx</span>
            </button>
            <button
              onClick={() => {
                const text = activeContent;
                navigator.clipboard.writeText(text);
                onCopyOutput();
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={copied ? 'Copied!' : 'Copy Markdown'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                const text = activeContent;
                const blob = new Blob([text], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(activeDoc.title || 'Deliverable').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
                a.click();
                URL.revokeObjectURL(url);
                onDownloadMd();
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Download Markdown (.md)"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPrint}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Multi-Artifact Deliverable Strip */}
      {activeRightTab === 'deliverable' && (
        <WorkbenchArtifactSubtabs
          artifacts={artifacts}
          activeArtifactId={activeArtifactId}
          onSelectArtifact={(id) => setActiveArtifactId(id)}
          onCloseArtifact={handleCloseArtifact}
          onAddNewArtifact={handleAddNewArtifact}
          onCloseOtherArtifacts={handleCloseOtherArtifacts}
          onResetArtifacts={handleResetArtifacts}
        />
      )}

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {/* Tab 1: Synthesis Deliverable */}
        {activeRightTab === 'deliverable' && (
          <WorkbenchSynthesisTab
            activeContent={activeContent}
            auditReport={auditReport}
          />
        )}

        {/* Tab 2: Source Evidence */}
        {activeRightTab === 'source' && (
          <div className="min-h-full flex flex-col space-y-3">
            {evidenceText ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500">
                    Active Grounding Context ({evidenceText.length.toLocaleString()} characters)
                  </div>
                  <button
                    onClick={onClearEvidence}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear Evidence
                  </button>
                </div>
                <div className="flex-1 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {evidenceText}
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-8">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">No source document attached</p>
                <p className="text-xs max-w-xs text-slate-400">
                  Use the paperclip menu in the chat or open SutraDrive to load medicals, pleadings, or notes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Scratchpad */}
        {activeRightTab === 'notepad' && (
          <div className="min-h-full flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">
                Persistent Practitioner Scratchpad
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onCopyNotepad}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title="Copy Notes"
                >
                  <Copy className="w-3 h-3 inline mr-1" />
                  Copy
                </button>
                <button
                  onClick={onApplyNotepadToEvidence}
                  className="h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 sutra-silver-create shimmer-button-energy cursor-pointer"
                  title="Append notes into active evidence context"
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Attach to Evidence</span>
                </button>
                <button
                  onClick={onClearNotepad}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  title="Clear Scratchpad"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={notepadText}
              onChange={(e) => onNotepadChange(e.target.value)}
              placeholder="Jot down quick case strategy notes, calculation parameters, or practitioner ideas..."
              className="flex-1 w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
            />
          </div>
        )}

        {/* Tab 4: Tools Hands Registry */}
        {activeRightTab === 'tools' && (
          <WorkbenchToolHandsTab
            registeredTools={registeredTools}
            toolSearchTerm={toolSearchTerm}
            setToolSearchTerm={setToolSearchTerm}
            onExecuteTool={onExecuteTool}
          />
        )}

        {/* Tab 5: Dynamic Authority & Tavily Live Grounding */}
        {activeRightTab === 'tavily' && (
          <WorkbenchTavilyTab
            activeDomainType={activeDomainType}
            notepadText={notepadText}
            onNotepadChange={onNotepadChange}
          />
        )}
      </div>
    </div>
  );
};
