/**
 * 📄 Sovereign Document Viewer — Phase 1
 * 
 * A lightweight markdown viewer that replicates the Antigravity workflow:
 *   1. Browse files from Drive explorer tree (left sidebar)
 *   2. AI writes into .md → user reviews beautifully rendered content
 *   3. User requests changes conversationally in chat
 *   4. One-click export to .docx via the existing compiler pipeline
 * 
 * This is NOT a heavy editor. It's a premium reading/review panel
 * designed to sit alongside (or toggle with) the existing Canvas system.
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  FileText,
  Copy,
  Download,
  Save,
  Edit,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  BookOpen,
  Scale,
  FolderOpen,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Loader2,
} from 'lucide-react';
import { aiDriveService } from '../../services/drive/aiDriveService';
import { GenieDrivePDFViewer } from '../geniedrive/GenieDrivePDFViewer';
import { useInlineCompletion } from '../../hooks/useInlineCompletion';
import { Sparkles } from 'lucide-react';
import { activeContextSensor } from '../../services/context/ActiveContextSensor';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ViewerDocument {
  id: string;
  title: string;
  content: string;
  modified?: Date;
  filePath?: string;
  metadata?: Record<string, any>;
  mimeType?: string;
  fileId?: string;
}

export interface DriveFileNode {
  id: string;
  name: string;
  mimeType?: string;
  isFolder?: boolean;
  children?: DriveFileNode[];
  path?: string;
}

interface SovereignDocViewerProps {
  /** The documents currently loaded (from canvas system) */
  documents: ViewerDocument[];
  /** Currently active document id */
  activeDocumentId?: string;
  /** Callback when user wants to switch active document */
  onDocumentSelect?: (id: string) => void;
  /** Callback when user makes a quick edit */
  onContentChange?: (id: string, newContent: string) => void;
  /** Callback when user opens a file from the explorer tree */
  onFileOpen?: (file: DriveFileNode) => void;
  /** Callback to close the viewer panel */
  onClose?: () => void;
  /** Callback to close a specific document tab */
  onDocumentClose?: (id: string) => void;
  /** Optional: render a custom file tree component in the sidebar */
  renderFileTree?: () => React.ReactNode;
  /** Optional list of Drive files to build the built-in tree */
  driveFiles?: DriveFileNode[];
}

// ─── File Explorer Tree (Built-in fallback) ──────────────────────────────────
const FileTreeNode: React.FC<{
  node: DriveFileNode;
  depth: number;
  isDark: boolean;
  onSelect: (node: DriveFileNode) => void;
}> = ({ node, depth, isDark, onSelect }) => {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-blue-500/10 rounded transition-colors text-left',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight
            className={cn(
              'h-3 w-3 transition-transform shrink-0',
              expanded && 'rotate-90'
            )}
          />
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <FileTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            isDark={isDark}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  // File node
  const isMd = node.name.endsWith('.md');
  return (
    <button
      onClick={() => onSelect(node)}
      className={cn(
        'flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded transition-colors text-left',
        isMd
          ? isDark
            ? 'text-blue-300 hover:bg-blue-500/15'
            : 'text-blue-700 hover:bg-blue-50'
          : isDark
            ? 'text-gray-400 hover:bg-gray-700/50'
            : 'text-gray-500 hover:bg-gray-100'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <FileText className={cn('h-3.5 w-3.5 shrink-0', isMd ? 'text-blue-400' : 'text-gray-400')} />
      <span className="truncate">{node.name}</span>
    </button>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const SovereignDocViewer: React.FC<SovereignDocViewerProps> = ({
  documents,
  activeDocumentId,
  onDocumentSelect,
  onContentChange,
  onFileOpen,
  onClose,
  onDocumentClose,
  renderFileTree,
  driveFiles,
}) => {
  const { isDark } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [explorerSearch, setExplorerSearch] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<number>(0);

  // ⚡ Predictive FIM Inline Completion
  const { suggestion, isCompleting, acceptSuggestion, discardSuggestion } = useInlineCompletion(
    editContent,
    cursorPos,
    'MURILLO_IRMA',
    isEditMode
  );

  // Get active document
  const activeDoc = useMemo(
    () => documents.find((d) => d.id === activeDocumentId) || documents[0],
    [documents, activeDocumentId]
  );

  // Sync edit content when active document changes
  useEffect(() => {
    if (activeDoc) {
      setEditContent(activeDoc.content);
      setIsEditMode(false);
      activeContextSensor.setActiveDocument({
        id: activeDoc.id,
        name: activeDoc.title,
        path: activeDoc.filePath,
        content: activeDoc.content,
        snippet: activeDoc.content ? activeDoc.content.substring(0, 1500) : undefined,
        language: activeDoc.mimeType?.includes('pdf') ? 'pdf' : 'markdown'
      });
    }
  }, [activeDoc?.id, activeDoc?.title, activeDoc?.content, activeDoc?.filePath, activeDoc?.mimeType]);

  // Sync / Download Drive or Local files when selected
  useEffect(() => {
    if (!activeDoc) return;
    
    const fileId = activeDoc.fileId || activeDoc.metadata?.fileId;
    const isPdf = activeDoc.mimeType?.includes('pdf') || activeDoc.title.endsWith('.pdf') || activeDoc.title.includes('.pdf');
    const isImage = activeDoc.mimeType?.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(activeDoc.title);
    const localFile = activeDoc.metadata?.localFile;

    setPdfBlobUrl(null);
    setLoadError(null);

    let active = true;
    let localUrl: string | null = null;

    if (localFile && localFile instanceof File) {
      if (isPdf || isImage) {
        localUrl = URL.createObjectURL(localFile);
        setPdfBlobUrl(localUrl);
      } else {
        // Read local text/markdown file
        const reader = new FileReader();
        reader.onload = (e) => {
          if (active && e.target?.result && onContentChange) {
            onContentChange(activeDoc.id, e.target.result as string);
          }
        };
        reader.readAsText(localFile);
      }
      return () => {
        active = false;
        if (localUrl) {
          URL.revokeObjectURL(localUrl);
        }
      };
    }

    if (!fileId || (activeDoc.content && !isPdf && !isImage)) {
      return;
    }

    const loadDriveFile = async () => {
      setLoadingFileId(fileId);
      try {
        const url = await aiDriveService.downloadFile(fileId);
        if (!active || !url) return;

        if (isPdf || isImage) {
          const response = await fetch(url);
          const blob = await response.blob();
          if (active) {
            const blobUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(blobUrl);
          }
        } else if (!activeDoc.content) {
          const response = await fetch(url);
          const text = await response.text();
          if (active && onContentChange) {
            onContentChange(activeDoc.id, text);
          }
        }
      } catch (err) {
        if (!activeDoc.content) {
          console.warn('Drive file download skipped/offline in SovereignDocViewer:', err);
          if (active) {
            setLoadError(err instanceof Error ? err.message : 'Failed to download file');
          }
        }
      } finally {
        if (active) {
          setLoadingFileId(null);
        }
      }
    };

    loadDriveFile();
    return () => {
      active = false;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [activeDoc?.id]);

  // Word count & section count
  const stats = useMemo(() => {
    if (!activeDoc) return { words: 0, sections: 0, chars: 0 };
    const words = activeDoc.content.split(/\s+/).filter(Boolean).length;
    const sections = (activeDoc.content.match(/^#{1,4}\s/gm) || []).length;
    const chars = activeDoc.content.length;
    return { words, sections, chars };
  }, [activeDoc?.content]);

  // Copy markdown to clipboard
  const handleCopyMd = useCallback(async () => {
    if (!activeDoc) return;
    try {
      await navigator.clipboard.writeText(activeDoc.content);
      setCopiedId(activeDoc.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [activeDoc]);

  // Save quick edit
  const handleSaveEdit = useCallback(() => {
    if (!activeDoc || !onContentChange) return;
    onContentChange(activeDoc.id, editContent);
    setIsEditMode(false);
  }, [activeDoc, editContent, onContentChange]);

  // Cancel quick edit
  const handleCancelEdit = useCallback(() => {
    if (activeDoc) setEditContent(activeDoc.content);
    setIsEditMode(false);
  }, [activeDoc]);

  // Handle file selection from tree
  const handleFileSelect = useCallback((node: DriveFileNode) => {
    if (onFileOpen) {
      onFileOpen(node);
    }
  }, [onFileOpen]);

  // Empty state
  if (!activeDoc && documents.length === 0) {
    return (
      <div className={cn(
        'sovereign-viewer flex h-full',
        isDark ? 'bg-gray-900' : 'bg-white'
      )}>
        {/* Explorer sidebar still shows even when no document is loaded */}
        {showExplorer && (
          <div className={cn(
            'w-56 border-r flex flex-col shrink-0',
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="p-2 border-b flex items-center justify-between">
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
                Explorer
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowExplorer(false)}>
                <PanelLeftClose className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {renderFileTree ? renderFileTree() : (
                <div className="p-4 text-center text-xs opacity-40">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  Connect Drive to browse files
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            {!showExplorer && (
              <Button variant="ghost" size="sm" className="mb-4" onClick={() => setShowExplorer(true)}>
                <PanelLeftOpen className="h-3 w-3 mr-1" /> Show Explorer
              </Button>
            )}
            <BookOpen className={cn('h-12 w-12 mx-auto opacity-20', isDark ? 'text-gray-500' : 'text-gray-400')} />
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>No document loaded</p>
            <p className={cn('text-xs opacity-60', isDark ? 'text-gray-500' : 'text-gray-400')}>
              Browse files in the explorer, or ask the AI to draft a document.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'sovereign-viewer flex flex-row h-full w-full overflow-hidden',
        isDark ? 'bg-gray-900' : 'bg-white'
      )}
    >
      {/* ─── Explorer Sidebar ─────────────────────────────────────────── */}
      {showExplorer && (
        <div className={cn(
          'w-56 border-r flex flex-col shrink-0 transition-all duration-200',
          isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50/80 border-gray-200'
        )}>
          {/* Explorer Header */}
          <div className={cn(
            'px-2 py-1.5 border-b flex items-center justify-between',
            isDark ? 'border-gray-700' : 'border-gray-200'
          )}>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Explorer
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowExplorer(false)}>
              <PanelLeftClose className="h-3 w-3" />
            </Button>
          </div>

          {/* Explorer Search */}
          <div className={cn('px-2 py-1 border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
              isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-white text-gray-600'
            )}>
              <Search className="h-3 w-3 opacity-40" />
              <input
                type="text"
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                placeholder="Search files..."
                className="bg-transparent border-none outline-none flex-1 text-xs placeholder:opacity-40"
              />
            </div>
          </div>

          {/* Open Documents Section */}
          {documents.length > 0 && (
            <div className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <div className={cn(
                'px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )}>
                Open Documents ({documents.length})
              </div>
              <div className="pb-1">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentSelect?.(doc.id)}
                    className={cn(
                      'flex items-center gap-1.5 w-full px-3 py-1 text-xs transition-colors text-left',
                      doc.id === activeDoc?.id
                        ? isDark
                          ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-400'
                          : 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                        : isDark
                          ? 'text-gray-300 hover:bg-gray-700/50'
                          : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <FileText className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      doc.id === activeDoc?.id ? 'text-blue-400' : 'text-gray-400'
                    )} />
                    <span className="truncate">
                      {doc.title.length > 28 ? doc.title.slice(0, 28) + '…' : doc.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Drive File Tree */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn(
              'px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              Drive Files
            </div>
            {renderFileTree ? renderFileTree() : driveFiles && driveFiles.length > 0 ? (
              <div className="space-y-0.5">
                {driveFiles.map((node) => (
                  <FileTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    isDark={isDark}
                    onSelect={handleFileSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs opacity-35">
                <Folder className="h-6 w-6 mx-auto mb-1 opacity-25 animate-pulse" />
                <p>AI Drive tree</p>
                <p className="text-[10px] mt-0.5">Available when connected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ─── Top Horizontal Document Tab Strip (Antigravity-Grade) ─────────────── */}
        {documents.length > 0 && (
          <div className={cn(
            'flex items-center gap-1 px-2 pt-1.5 border-b shrink-0 overflow-x-auto custom-scrollbar select-none',
            isDark ? 'bg-[#09090f] border-gray-800' : 'bg-slate-100/90 border-slate-200'
          )}>
            {documents.map((doc) => {
              const isActive = doc.id === activeDoc?.id;
              return (
                <div
                  key={doc.id}
                  className={cn(
                    'group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all border-t-2 shrink-0 max-w-[220px]',
                    isActive
                      ? isDark
                        ? 'bg-gray-900 text-blue-300 border-blue-500 shadow-sm'
                        : 'bg-white text-blue-700 border-blue-600 shadow-xs'
                      : isDark
                        ? 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border-transparent'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-slate-200/50 border-transparent'
                  )}
                  onClick={() => onDocumentSelect?.(doc.id)}
                  title={doc.title}
                >
                  <FileText className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    isActive ? 'text-blue-500' : isDark ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <span className="truncate">{doc.title}</span>
                  {onDocumentClose && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentClose(doc.id);
                      }}
                      className={cn(
                        'p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ml-1',
                        isActive && 'opacity-60'
                      )}
                      title="Close Document"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Header Bar ───────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center justify-between px-3 py-1.5 border-b shrink-0',
            isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {!showExplorer && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowExplorer(true)} title="Show Explorer">
                <PanelLeftOpen className="h-3 w-3" />
              </Button>
            )}
            <Scale className={cn('h-4 w-4 shrink-0', isDark ? 'text-blue-400' : 'text-blue-600')} />
            <span className={cn(
              'text-xs font-bold uppercase tracking-wider truncate',
              isDark ? 'text-gray-300' : 'text-gray-600'
            )}>
              Sovereign Viewer
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {isEditMode ? '✏️ Edit' : '👁️ View'}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {/* Toggle Edit Mode */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                if (isEditMode) {
                  handleCancelEdit();
                } else {
                  setIsEditMode(true);
                }
              }}
              title={isEditMode ? 'Cancel Edit' : 'Quick Edit'}
            >
              {isEditMode ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
            </Button>

            {/* Save (only in edit mode) */}
            {isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-500"
                onClick={handleSaveEdit}
                title="Save Changes"
              >
                <Save className="h-3 w-3" />
              </Button>
            )}

            {/* Copy Markdown */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyMd}
              title="Copy Markdown"
            >
              {copiedId === activeDoc?.id ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>

            {/* Export DOCX */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('genieflow:export-docx', {
                    detail: {
                      documentId: activeDoc?.id,
                      title: activeDoc?.title,
                      content: activeDoc?.content,
                    },
                  })
                );
              }}
              title="Export to DOCX (28-line pleading)"
            >
              <Download className="h-3 w-3" />
            </Button>

            {/* Close */}
            {onClose && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} title="Close Viewer">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* ─── Document Title ───────────────────────────────────────── */}
        {activeDoc && (
          <div className={cn(
            'px-4 py-2.5 border-b shrink-0',
            isDark ? 'border-gray-800' : 'border-gray-100'
          )}>
            <h2 className={cn(
              'text-sm font-bold tracking-tight',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}>
              📄 {activeDoc.title}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={cn('text-[10px]', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {stats.sections} sections
              </span>
              <span className={cn('text-[10px]', isDark ? 'text-gray-500' : 'text-gray-400')}>
                {stats.words.toLocaleString()} words
              </span>
              {activeDoc.modified && (
                <span className={cn('text-[10px]', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  Last saved: {new Date(activeDoc.modified).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── Content Area ─────────────────────────────────────────── */}
        <div 
          ref={contentRef} 
          onMouseUp={() => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim()) {
              activeContextSensor.setActiveSelection({ text: sel.toString().trim() });
            } else {
              activeContextSensor.setActiveSelection(null);
            }
          }}
          className="flex-1 overflow-y-auto min-h-0"
        >
          {!activeDoc ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2 opacity-40">
                <BookOpen className="h-10 w-10 mx-auto" />
                <p className="text-sm">Select a document from the explorer</p>
              </div>
            </div>
          ) : loadingFileId ? (
            /* Loading Drive File Skeleton */
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                Fetching file from Drive...
              </p>
            </div>
          ) : loadError ? (
            /* Load Error Panel */
            <div className="p-6 max-w-md mx-auto">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                <p className="text-red-800 dark:text-red-300 font-semibold mb-1">Failed to load document</p>
                <p className="text-red-600 dark:text-red-400 text-xs">{loadError}</p>
              </div>
            </div>
          ) : (activeDoc.mimeType?.includes('pdf') || activeDoc.title.endsWith('.pdf')) && pdfBlobUrl ? (
            /* Premium PDF Viewer integration */
            <div className="w-full h-full flex flex-col overflow-hidden">
              <GenieDrivePDFViewer
                pdfUrl={pdfBlobUrl}
                fileName={activeDoc.title}
                fileId={activeDoc.fileId || activeDoc.id}
                aiDriveService={aiDriveService}
              />
            </div>
          ) : (activeDoc.mimeType?.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(activeDoc.title)) && pdfBlobUrl ? (
            /* Image Preview */
            <div className="w-full h-full flex items-center justify-center p-6 bg-slate-900/5 dark:bg-slate-950/20 overflow-y-auto">
              <img
                src={pdfBlobUrl}
                alt={activeDoc.title}
                className="max-w-full max-h-[85vh] object-contain rounded shadow-lg border border-slate-200 dark:border-slate-800"
              />
            </div>
          ) : isEditMode ? (
            /* Quick Edit with Predictive FIM Autocomplete */
            <div className="relative w-full h-full flex flex-col">
              {suggestion && (
                <div className="absolute top-2 right-4 z-20 bg-blue-600/90 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur animate-fade-in">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  <span>Press <kbd className="px-1 py-0.5 bg-black/40 rounded font-mono font-bold">TAB</kbd> to insert: <em>"{suggestion.text.slice(0, 35)}..."</em></span>
                </div>
              )}
              {isCompleting && (
                <div className="absolute top-2 right-4 z-20 bg-slate-800/80 text-slate-300 text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                  <span>Predicting...</span>
                </div>
              )}
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setCursorPos(e.target.selectionStart);
                }}
                onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
                onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
                onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && suggestion) {
                    e.preventDefault();
                    const updated = acceptSuggestion();
                    if (updated) {
                      setEditContent(updated);
                      onContentChange?.(activeDoc.id, updated);
                    }
                  } else if (e.key === 'Escape') {
                    discardSuggestion();
                  }
                }}
                className={cn(
                  'w-full h-full p-6 resize-none border-none outline-none font-mono text-sm leading-relaxed',
                  isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
                )}
                spellCheck
                placeholder="Start drafting legal brief... predictive autocomplete will assist as you pause."
              />
            </div>
          ) : (
            /* Sovereign Viewer — Legal-aware markdown renderer */
            <div className={cn(
              'px-6 py-4 max-w-none prose prose-sm',
              isDark ? 'prose-invert' : '',
              // Legal document styling overrides
              '[&_h1]:text-center [&_h1]:uppercase [&_h1]:tracking-wide [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3',
              '[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:pb-2',
              isDark ? '[&_h2]:border-gray-700' : '[&_h2]:border-gray-200',
              '[&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2',
              '[&_h4]:text-sm [&_h4]:font-bold [&_h4]:italic [&_h4]:mt-3 [&_h4]:mb-1',
              '[&_p]:text-justify [&_p]:leading-relaxed [&_p]:mb-3',
              '[&_blockquote]:border-l-3 [&_blockquote]:my-4 [&_blockquote]:mx-6 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-md [&_blockquote]:italic [&_blockquote]:text-sm',
              isDark
                ? '[&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-900/10 [&_blockquote]:text-blue-200'
                : '[&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-50/80 [&_blockquote]:text-blue-900',
              isDark ? '[&_strong]:text-blue-300' : '[&_strong]:text-blue-800',
              '[&_hr]:my-6',
              isDark ? '[&_hr]:border-gray-700' : '[&_hr]:border-gray-200',
              '[&_li]:mb-1',
              '[&_table]:text-xs [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2',
              // Font family for legal docs
              'font-serif',
            )}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeDoc.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* ─── Bottom Status Bar ────────────────────────────────────── */}
        <div className={cn(
          'flex items-center justify-between px-3 py-1 border-t text-[10px] shrink-0',
          isDark ? 'bg-gray-800/50 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
        )}>
          <div className="flex items-center gap-3">
            <span>📊 {stats.sections} sections</span>
            <span>{stats.words.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMd}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors"
            >
              <Copy className="h-3 w-3" /> Copy MD
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('genieflow:export-docx', {
                    detail: { documentId: activeDoc?.id, title: activeDoc?.title, content: activeDoc?.content },
                  })
                );
              }}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors"
            >
              <Download className="h-3 w-3" /> Export DOCX
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('genieflow:save-to-drive', {
                    detail: { documentId: activeDoc?.id, title: activeDoc?.title, content: activeDoc?.content },
                  })
                );
              }}
              className="flex items-center gap-1 hover:text-blue-400 transition-colors"
            >
              <Save className="h-3 w-3" /> Save to Drive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignDocViewer;
