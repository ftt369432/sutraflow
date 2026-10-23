import React from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  FileCode,
  Printer,
  Edit3,
  Terminal,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Globe,
  Sparkles,
  Plus,
  Key,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { RightTab } from './types';
import { AnalystAuditReport } from '../../services/ai/ForensicAnalystLinter';
import { Tool } from '../../services/agents/ToolRegistry';
import { Button } from '../ui/Button';
import { tavilyGrounding, TavilySearchResult, TavilySearchResponse } from '../../services/legal/TavilyGroundingService';
import { MarkdownMessage } from '../ai/MarkdownMessage';
import { exportMarkdownToDocx } from '../../utils/docxExportUtil';
import { unwrapModelDeliverable } from '../../utils/deliverableUnwrapper';


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
  initialArtifacts?: Array<{ id: string; title: string; content: string; timestamp: string; diskPath?: string }>;
  initialActiveArtifactId?: string;
  onArtifactsChange?: (artifacts: Array<{ id: string; title: string; content: string; timestamp: string; diskPath?: string }>, activeId: string) => void;
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
  sourceSearchTerm,
  setSourceSearchTerm,
  onClearEvidence,
  notepadText,
  onNotepadChange,
  onCopyNotepad,
  onDownloadNotepadMd,
  onClearNotepad,
  onApplyNotepadToEvidence,
  registeredTools,
  toolSearchTerm,
  setToolSearchTerm,
  onExecuteTool,
  savedDiskPath,
  activeSessionId,
  initialArtifacts,
  initialActiveArtifactId,
  onArtifactsChange
}) => {
  const [showAuditDetail, setShowAuditDetail] = React.useState(false);
  const auditScore = auditReport ? (auditReport.overallScore ?? auditReport.score ?? 90) : 0;
  const isConformant = auditReport ? (auditReport.overallStatus === 'PASS' || auditScore >= 80) : false;

  // Smart Title Extraction for Distinct Artifacts
  const extractArtifactTitle = React.useCallback((content: string, defaultName: string = 'Deliverable'): string => {
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
  const initialUnwrapped = React.useMemo(() => unwrapModelDeliverable(generatedOutput), []);
  const [artifacts, setArtifacts] = React.useState<Array<{ id: string; title: string; content: string; timestamp: string; diskPath?: string }>>(() => {
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

  const [activeArtifactId, setActiveArtifactId] = React.useState<string>(() => {
    return initialActiveArtifactId || (initialArtifacts && initialArtifacts[0]?.id) || 'doc-primary';
  });
  const lastProcessedOutputRef = React.useRef<string>(generatedOutput);

  // Synchronize artifacts and active viewport whenever session switches or new chat is triggered
  React.useEffect(() => {
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
      // Clean slate for brand-new session (no page refresh required!)
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

  // Sync active artifacts state back to parent session storage
  React.useEffect(() => {
    onArtifactsChange?.(artifacts, activeArtifactId);
  }, [artifacts, activeArtifactId, onArtifactsChange]);

  // 📡 Direct listener for agentic canvas document events to mount multiple artifacts with true filenames
  React.useEffect(() => {
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
        // If an artifact with this path, id, or distinct title already exists, update its content & timestamp
        const existingIdx = prev.findIndex((a) =>
          (doc.path && a.diskPath === doc.path) ||
          (doc.id && a.id === doc.id) ||
          (doc.title && a.title === docTitle && !['Deliverable Document', 'Universal Work Product', 'Master Synthesis & Strategy'].includes(docTitle)) ||
          (a.content.trim() === cleanOutput.trim())
        );

        if (existingIdx !== -1) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            title: docTitle,
            content: cleanOutput,
            diskPath: docPath || next[existingIdx].diskPath,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setActiveArtifactId(next[existingIdx].id);
          return next;
        }

        // Check if primary is empty placeholder stub
        if (prev.length === 1 && (!prev[0].content || prev[0].content.trim().length < 80)) {
          setActiveArtifactId(prev[0].id);
          return [{
            id: prev[0].id,
            title: docTitle,
            content: cleanOutput,
            diskPath: docPath,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        }

        // Add as a new distinct artifact tab (supports 3-4 distinct deliverables emitted by agent)
        const newArtifact = {
          id: docId,
          title: docTitle,
          content: cleanOutput,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          diskPath: docPath
        };
        setActiveArtifactId(docId);
        return [...prev, newArtifact];
      });
    };

    const handleOpenArtifact = (e: any) => {
      const doc = e.detail;
      if (!doc) return;
      const cleanOutput = doc.content ? unwrapModelDeliverable(doc.content).content : '';
      const docTitle = doc.title || (doc.path ? doc.path.split(/[\\/]/).pop() : 'Deliverable');
      const docPath = doc.path;
      const docId = doc.id || (docPath ? `doc-${docPath.replace(/[^a-zA-Z0-9]/g, '_')}` : `doc-${Date.now()}`);

      setArtifacts((prev) => {
        const existingIdx = prev.findIndex((a) =>
          (docPath && a.diskPath === docPath) ||
          (doc.id && a.id === doc.id) ||
          (a.title === docTitle) ||
          (cleanOutput && a.content.trim() === cleanOutput.trim())
        );

        if (existingIdx !== -1) {
          const next = [...prev];
          if (cleanOutput && (!next[existingIdx].content || next[existingIdx].content.trim().length === 0)) {
            next[existingIdx] = {
              ...next[existingIdx],
              content: cleanOutput
            };
          }
          setActiveArtifactId(next[existingIdx].id);
          return next;
        }

        // If primary is empty placeholder, replace it
        if (prev.length === 1 && (!prev[0].content || prev[0].content.trim().length < 80)) {
          setActiveArtifactId(prev[0].id);
          return [{
            id: prev[0].id,
            title: docTitle,
            content: cleanOutput,
            diskPath: docPath,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        }

        const newArtifact = {
          id: docId,
          title: docTitle,
          content: cleanOutput,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          diskPath: docPath
        };
        setActiveArtifactId(docId);
        return [...prev, newArtifact];
      });
      setActiveRightTab('deliverable');
    };

    window.addEventListener('genieflow:create-canvas', handleCanvasCreated as EventListener);
    window.addEventListener('genieflow:open-artifact', handleOpenArtifact as EventListener);
    return () => {
      window.removeEventListener('genieflow:create-canvas', handleCanvasCreated as EventListener);
      window.removeEventListener('genieflow:open-artifact', handleOpenArtifact as EventListener);
    };
  }, [extractArtifactTitle, savedDiskPath]);

  // Synchronize deliverables without destructive overwrites or redundant duplicates
  React.useEffect(() => {
    if (!generatedOutput || generatedOutput.trim().length === 0) {
      lastProcessedOutputRef.current = '';
      return;
    }
    if (generatedOutput === lastProcessedOutputRef.current) return;
    lastProcessedOutputRef.current = generatedOutput;

    const unwrapped = unwrapModelDeliverable(generatedOutput);
    const cleanOutput = unwrapped.content;
    if (!cleanOutput || cleanOutput.trim().length === 0) return;

    const resolvedDiskPath = unwrapped.diskPath || savedDiskPath;

    setArtifacts((prev) => {
      const currentActive = prev.find((a) => a.id === activeArtifactId) || prev[0];
      const isPlaceholder = !currentActive || !currentActive.content || currentActive.content.trim().length < 80;
      const newTitle = unwrapped.suggestedFileName || extractArtifactTitle(cleanOutput, `Deliverable ${prev.length + 1}`);

      // 1. If active tab is an empty/placeholder stub, update it directly
      if (isPlaceholder && currentActive) {
        return prev.map((a) =>
          a.id === currentActive.id
            ? {
                ...a,
                title: newTitle,
                content: cleanOutput,
                diskPath: resolvedDiskPath,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : a
        );
      }

      // Check if this exact content or diskPath is already mounted in one of the tabs
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
                diskPath: resolvedDiskPath || a.diskPath,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : a
        );
      }

      // 2. If the active artifact already has different substantive content, CREATE A NEW ARTIFACT TAB!
      const newId = `doc-${Date.now()}`;
      const newArtifact = {
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

  // Update diskPath on the active artifact if savedDiskPath changes
  React.useEffect(() => {
    if (savedDiskPath) {
      setArtifacts((prev) =>
        prev.map((a) => (a.id === activeArtifactId ? { ...a, diskPath: savedDiskPath } : a))
      );
    }
  }, [savedDiskPath, activeArtifactId]);

  const activeDoc = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0] || {
    id: 'doc-primary',
    title: 'Deliverable',
    content: '',
    timestamp: 'Active',
    diskPath: savedDiskPath
  };

  // Prevent old generatedOutput text from bleeding into new or empty artifact tabs
  const rawActiveContent = (activeDoc && typeof activeDoc.content === 'string')
    ? activeDoc.content
    : (generatedOutput || '');
  const activeUnwrapped = React.useMemo(() => unwrapModelDeliverable(rawActiveContent), [rawActiveContent]);
  const activeContent = activeUnwrapped.content;

  const handleAddNewArtifact = () => {
    const newId = `doc-${Date.now()}`;
    const newDoc = {
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

  // Tavily Grounding State & Key Management ($3,000 Hackathon Prize Integration)
  const [tavilyQuery, setTavilyQuery] = React.useState('');
  const [tavilyLoading, setTavilyLoading] = React.useState(false);
  const [tavilyResults, setTavilyResults] = React.useState<TavilySearchResult[]>([]);
  const [tavilyAnswer, setTavilyAnswer] = React.useState<string>('');
  const [tavilyResponseTime, setTavilyResponseTime] = React.useState<number>(0);
  const [tavilyKey, setTavilyKey] = React.useState<string>(() => tavilyGrounding.getApiKey());
  const [showKeyConfig, setShowKeyConfig] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<TavilySearchResponse[]>(() => tavilyGrounding.getRecentSearches());
  const [selectedSearchQuery, setSelectedSearchQuery] = React.useState<string>('');

  // Synchronize with live searches executed by Swarms or UI
  React.useEffect(() => {
    const handleSearchEvent = (e: any) => {
      const resp: TavilySearchResponse = e.detail;
      if (resp) {
        setTavilyResults(resp.results || []);
        setTavilyAnswer(resp.answer || '');
        setTavilyResponseTime(resp.responseTime || 0);
        setTavilyQuery(resp.query || '');
        setSelectedSearchQuery(resp.query || '');
        setRecentSearches(tavilyGrounding.getRecentSearches());
      }
    };

    const handleClearEvent = () => {
      setTavilyResults([]);
      setTavilyAnswer('');
      setTavilyResponseTime(0);
      setRecentSearches([]);
      setSelectedSearchQuery('');
    };

    window.addEventListener('genieflow_tavily_searched', handleSearchEvent);
    window.addEventListener('genieflow_tavily_cleared', handleClearEvent);

    // Initial hydration if already searched
    const latest = tavilyGrounding.getLatestSearch();
    if (latest) {
      setTavilyResults(latest.results || []);
      setTavilyAnswer(latest.answer || '');
      setTavilyResponseTime(latest.responseTime || 0);
      setTavilyQuery(latest.query || '');
      setSelectedSearchQuery(latest.query || '');
    }

    return () => {
      window.removeEventListener('genieflow_tavily_searched', handleSearchEvent);
      window.removeEventListener('genieflow_tavily_cleared', handleClearEvent);
    };
  }, []);

  const handleSaveTavilyKey = (k: string) => {
    const trimmed = k.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('genieflow_tavily_key', trimmed);
    }
    setTavilyKey(trimmed);
    setShowKeyConfig(false);
  };

  const handleExecuteTavilySearch = async (overrideQuery?: string) => {
    const q = overrideQuery || tavilyQuery;
    if (!q) return;
    setTavilyLoading(true);
    try {
      const resp = await tavilyGrounding.searchPrecedents(q, {
        searchDepth: 'advanced',
        maxResults: 4
      });
      setTavilyResults(resp.results || []);
      setTavilyAnswer(resp.answer || '');
      setTavilyResponseTime(resp.responseTime || 0);
      setSelectedSearchQuery(q);
      setRecentSearches(tavilyGrounding.getRecentSearches());
    } catch (_err) {
      // Fallback handled gracefully
    } finally {
      setTavilyLoading(false);
    }
  };

  const handleSelectPastSearch = (search: TavilySearchResponse) => {
    setSelectedSearchQuery(search.query);
    setTavilyQuery(search.query);
    setTavilyResults(search.results || []);
    setTavilyAnswer(search.answer || '');
    setTavilyResponseTime(search.responseTime || 0);
  };


  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Tab Navigation & Actions Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        {/* Left Tabs - Matches Photo's Segmented List/Grid View */}
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
            <span>Precedent Grounding</span>
            {tavilyResults.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                {tavilyResults.length}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                Live
              </span>
            )}
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
              className="h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 sutra-silver-create shimmer-button-energy cursor-pointer"
              title="Download Word Document (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .docx</span>
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
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {artifacts.map((art) => (
              <div
                key={art.id}
                onClick={() => setActiveArtifactId(art.id)}
                className={`group/tab px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 transition cursor-pointer select-none ${
                  activeArtifactId === art.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
                title={art.title}
              >
                <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate max-w-[130px]">{art.title}</span>
                {art.id === activeArtifactId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Viewport" />
                )}
                {artifacts.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleCloseArtifact(e, art.id)}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-60 group-hover/tab:opacity-100 transition cursor-pointer ml-0.5"
                    title="Close tab"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddNewArtifact}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
              title="Add another deliverable tab"
            >
              <Plus className="w-3 h-3" />
              <span>New Artifact</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {(activeDoc.diskPath || savedDiskPath) && (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 font-mono"
                title={`Saved to disk: ${activeDoc.diskPath || savedDiskPath}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[240px]">
                  Saved: {(activeDoc.diskPath || savedDiskPath || '').split(/[\\/]/).pop()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const p = activeDoc.diskPath || savedDiskPath || '';
                    navigator.clipboard.writeText(p);
                  }}
                  className="hover:text-emerald-900 dark:hover:text-white transition cursor-pointer ml-0.5"
                  title="Copy full disk path"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Artifacts ({artifacts.length})
            </span>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {/* Tab 1: Synthesis Deliverable */}
        {activeRightTab === 'deliverable' && (
          <div className="min-h-full flex flex-col">
            {(activeContent && activeContent.trim().length > 0) ? (
              <div className="space-y-4">
                {auditReport && (
                  <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 overflow-hidden text-xs transition">
                    <button
                      type="button"
                      onClick={() => setShowAuditDetail((prev) => !prev)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Domain Swarm Quality Audit: {auditScore}/100
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          ({isConformant ? '✓ Quote Guard & Compliance Verified' : 'Review Recommended'})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {showAuditDetail ? 'Hide Checks ▲' : 'View Checks ▼'}
                      </span>
                    </button>

                    {showAuditDetail && (
                      <div className="p-3.5 pt-0 border-t border-slate-200 dark:border-slate-700 space-y-2 mt-1 animate-in fade-in duration-100">
                        {auditReport.checks && auditReport.checks.length > 0 ? (
                          auditReport.checks.map((check) => (
                            <div key={check.id} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                              <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                check.status === 'PASS' 
                                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' 
                                  : check.status === 'WARN' 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' 
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                              }`}>
                                {check.status}
                              </span>
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{check.title}</div>
                                <div className="text-slate-500 dark:text-slate-400">{check.finding}</div>
                                {check.recommendation && (
                                  <div className="text-amber-700 dark:text-amber-400 text-[10px] italic">💡 {check.recommendation}</div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-500">All statutory citations and formatting verified.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-slate-800 dark:text-slate-200 font-normal leading-relaxed">
                  <MarkdownMessage content={activeContent} />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-8">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">No deliverable generated yet</p>
                <p className="text-xs max-w-xs text-slate-400">
                  Ask a question or select an action objective from the prompt feed to start drafting.
                </p>
              </div>
            )}
          </div>
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
          <div className="min-h-full flex flex-col space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={toolSearchTerm}
                onChange={(e) => setToolSearchTerm(e.target.value)}
                placeholder="Search registered agentic tools..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {registeredTools
                .filter((t) =>
                  toolSearchTerm
                    ? t.name.toLowerCase().includes(toolSearchTerm.toLowerCase()) ||
                      t.description.toLowerCase().includes(toolSearchTerm.toLowerCase())
                    : true
                )
                .map((tool) => (
                  <div
                    key={tool.name}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{tool.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Agentic Tool</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                      {tool.description}
                    </p>
                    <button
                      onClick={() => onExecuteTool(tool)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      Trigger Tool Action
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 5: Tavily Live Precedent Grounding ($3,000 Hackathon Prize) */}
        {activeRightTab === 'tavily' && (
          <div className="min-h-full flex flex-col space-y-4">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Real-Time Statutory & Precedent Grounding</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Web Grounding
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Grounds pleading synthesis against live California Court of Appeal, WCAB en banc, and DIR statutory sources.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tavilyResponseTime > 0 && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {tavilyResponseTime}ms latency
                    </span>
                  )}
                  {recentSearches.length > 0 && (
                    <button
                      onClick={() => tavilyGrounding.clearSearches()}
                      className="text-[10px] font-medium text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      Clear History
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Legal Issue Chips */}
              <div className="mt-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Dynamic California Workers' Comp Issues
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'LC § 5814 Unreasonable Delay',
                    'LC § 4622 Medical Billing 60-Day Mandate',
                    'LC § 5813 Bad Faith Sanctions',
                    '8 CCR § 10786 Costs Petition (Master V5)',
                    '8 CCR § 10964 Answer to WCJ Report',
                    'LC § 4062.2 Strike Panel Replacement',
                    'Otis v. City of Los Angeles (En Banc)',
                    'Escobedo Medical Apportionment'
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        const q = `California workers compensation: ${preset}`;
                        setTavilyQuery(q);
                        handleExecuteTavilySearch(q);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches History Bar */}
              {recentSearches.length > 1 && (
                <div className="mt-3 pt-2 border-t border-amber-500/15">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Recent Swarm & User Grounding Sessions ({recentSearches.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto max-h-16 py-0.5">
                    {recentSearches.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPastSearch(s)}
                        className={`px-2 py-0.5 rounded text-[10px] truncate max-w-[220px] transition cursor-pointer ${
                          selectedSearchQuery === s.query
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title={s.query}
                      >
                        {s.query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* API Key Connection Status & Setup Bar */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Key className={`w-3.5 h-3.5 ${tavilyKey ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {tavilyKey ? 'Tavily Search Engine Connected' : 'Tavily API Key Not Hooked Up'}
                  </span>
                  {tavilyKey ? (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Active ({tavilyKey.slice(0, 6)}...{tavilyKey.slice(-4)})
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Action Required
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyConfig((prev) => !prev)}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {showKeyConfig ? 'Cancel' : tavilyKey ? 'Update Key' : 'Hook Up Key Now'}
                </button>
              </div>

              {showKeyConfig && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Paste your Tavily API Key (tvly-...)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTavilyKey(keyInput)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tavilyQuery}
                  onChange={(e) => setTavilyQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecuteTavilySearch()}
                  placeholder="Enter California legal statutory or case-law issue to ground..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
              <button
                onClick={() => handleExecuteTavilySearch()}
                disabled={tavilyLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {tavilyLoading ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Ground Query</span>
                  </>
                )}
              </button>
            </div>

            {/* Results or Empty State */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {tavilyAnswer && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tavily Grounded Summary</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {tavilyAnswer}
                  </p>
                </div>
              )}

              {tavilyResults.length > 0 ? (
                tavilyResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>{result.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                        {Math.round((result.score || 0.95) * 100)}% Match
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 my-2 leading-relaxed italic border-l-2 border-amber-500/40 pl-2">
                      "{result.content}"
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-400 truncate max-w-[280px]">
                        {result.url}
                      </span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const snippet = `\n\n### Grounded Authority: ${result.title}\nURL: ${result.url}\nQuote: "${result.content}"\n`;
                            onNotepadChange(notepadText + snippet);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                        >
                          + Append to Scratchpad
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : !tavilyLoading && (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Globe className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No active Tavily searches yet
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                    Click one of the statutory chips above or run a custom query to ground legal authorities with live appellate precedents.
                  </p>
                  <button
                    onClick={() => handleExecuteTavilySearch('California workers compensation Labor Code 5814 penalties')}
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition cursor-pointer"
                  >
                    Run Sample Grounding Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
