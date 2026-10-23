import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Code as CodeIcon,
  Loader2,
  Pin,
  Search,
  HardDrive,
  Plus,
  Sparkles,
  Cloud,
  File,
  X,
  ArrowUpDown,
  RotateCw,
  FolderTree,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { aiDriveService, AIDriveFile } from '../../services/drive/aiDriveService';
import { caseStateHarvester, CaseState } from '../../services/legal/CaseStateHarvester';
import { useAuth } from '../../contexts/AuthContext';
import { ScrollArea } from '../ui/ScrollArea';
import {
  useAttachedDriveStore,
  AttachedDrive,
  AttachedFileNode
} from '../../store/attachedDriveStore';

interface GenieDriveTreeProps {
  onFileSelect?: (file: any) => void;
  onSelect?: (file: any) => void;
  onPin?: (file: any) => void;
  className?: string;
  selectedFileId?: string;
  teamId?: string;
  teamName?: string;
}

type SortField = 'name' | 'date' | 'type';
type SortDirection = 'asc' | 'desc';

export function GenieDriveTree({
  onFileSelect,
  onSelect,
  onPin,
  className,
  selectedFileId,
  teamId,
  teamName
}: GenieDriveTreeProps) {
  const handleSelect = onSelect || onFileSelect;
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    drives,
    pinnedFiles,
    attachDriveFromHandle,
    attachDriveFromFolderPath,
    attachDriveFromFiles,
    attachPreconfiguredDrive,
    detachDrive,
    toggleDriveExpanded,
    togglePinFile,
    togglePinFolder,
    clearPinnedFiles,
    readFileContent,
    loadFolderChildren,
    refreshGeneratedDocs,
    isAttaching
  } = useAttachedDriveStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeCase, setActiveCase] = useState<CaseState | null>(() => caseStateHarvester.getActiveCaseState());
  const [searchQuery, setSearchQuery] = useState('');
  const [isCloudExpanded, setIsCloudExpanded] = useState(false);
  const [cloudFiles, setCloudFiles] = useState<AIDriveFile[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Auto-refresh generated docs from live filesystem on mount
  useEffect(() => {
    refreshGeneratedDocs();
  }, [refreshGeneratedDocs]);

  // Subscribe to case state changes
  useEffect(() => {
    const unsubscribe = caseStateHarvester.subscribe((state) => {
      setActiveCase(state);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch cloud drive files
  useEffect(() => {
    let isMounted = true;
    const fetchCloud = async () => {
      if (!user?.id) return;
      setCloudLoading(true);
      try {
        const files = await aiDriveService.listFiles(null, { team_id: teamId });
        if (isMounted) setCloudFiles(files);
      } catch (_e) {
        // Silently handled
      } finally {
        if (isMounted) setCloudLoading(false);
      }
    };
    fetchCloud();
    return () => { isMounted = false; };
  }, [user?.id, teamId]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Expand all folders across all attached drives
  const handleExpandAll = useCallback(() => {
    const allFolderIds = new Set<string>();
    const collectFolderIds = (nodes: AttachedFileNode[]) => {
      for (const node of nodes) {
        if (node.isFolder) {
          allFolderIds.add(node.id);
          if (node.children) collectFolderIds(node.children);
        }
      }
    };
    for (const drive of drives) {
      collectFolderIds(drive.items);
    }
    setExpandedFolders(allFolderIds);
    toast.success('Expanded all folders in view');
  }, [drives]);

  // Collapse all folders
  const handleCollapseAll = useCallback(() => {
    setExpandedFolders(new Set());
    toast.info('Collapsed all folders');
  }, []);

  // Manual Live Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshGeneratedDocs();
      toast.success('Live file system refreshed');
    } catch (_err) {
      toast.error('Could not refresh files');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle native folder attachment
  const handleAttachFolderClick = async () => {
    const electronBridge = typeof window !== 'undefined' ? (window as any).electronBridge : null;
    if (electronBridge?.dialog?.openFolder) {
      try {
        const res = await electronBridge.dialog.openFolder();
        if (res?.success && res.paths && res.paths.length > 0) {
          await attachDriveFromFolderPath(res.paths[0]);
        }
        return;
      } catch (err: any) {
        console.warn('Electron openFolder failed, falling back to web picker:', err);
      }
    }

    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        if (dirHandle) {
          await attachDriveFromHandle(dirHandle);
          return;
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('showDirectoryPicker failed, falling back to input:', err);
        } else {
          return;
        }
      }
    }

    fileInputRef.current?.click();
  };

  const handleDirectoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const firstPath = (files[0] as any).webkitRelativePath || files[0].name;
    const folderName = firstPath.split('/')[0] || 'Attached Folder';
    attachDriveFromFiles(folderName, files, 'local');
    if (e.target) e.target.value = '';
  };

  const handleNodeClick = async (node: AttachedFileNode) => {
    if (node.isFolder) {
      if (!node.isLoaded && (!node.children || node.children.length === 0)) {
        await loadFolderChildren(node);
      }
      toggleFolder(node.id);
      return;
    }

    let content = node.content || '';
    if (!content) {
      try {
        content = await readFileContent(node);
      } catch (_e) {}
    }

    if (handleSelect) {
      handleSelect({
        id: node.id,
        name: node.name,
        path: node.path,
        content,
        mime_type: node.mimeType || 'text/markdown',
        size: node.size || 0,
        is_folder: false,
        created_at: node.lastModified || new Date().toISOString()
      });
    }
  };

  const handleNodePin = async (node: AttachedFileNode, e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePinFile(node);
    if (onPin) {
      let content = node.content || '';
      if (!content) {
        try { content = await readFileContent(node); } catch (_e) {}
      }
      onPin({
        id: node.id,
        name: node.name,
        path: node.path,
        content,
        mime_type: node.mimeType || 'text/markdown'
      });
    }
  };

  const handleFolderPin = async (node: AttachedFileNode, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast.info(`Scanning and pinning files in ${node.name}...`);
      const count = await togglePinFolder(node);
      if (count > 0) {
        toast.success(`📌 Pinned ${count} document${count > 1 ? 's' : ''} from "${node.name}" to Chat`);
      } else if (count < 0) {
        toast.info(`Unpinned ${Math.abs(count)} document${Math.abs(count) > 1 ? 's' : ''} from "${node.name}"`);
      } else {
        toast.info(`No documents found in "${node.name}"`);
      }
    } catch (_err) {
      toast.error(`Could not pin folder "${node.name}"`);
    }
  };

  // Helper to pick file icons
  const renderFileIcon = (node: AttachedFileNode) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders.has(node.id);
      return isExpanded 
        ? <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        : <Folder className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />;
    }

    const ext = node.extension?.toLowerCase() || node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-3.5 w-3.5 text-sky-500 shrink-0" />;
      case 'md':
      case 'txt':
        return <FileText className="h-3.5 w-3.5 text-blue-400 dark:text-blue-300 shrink-0" />;
      case 'json':
      case 'ts':
      case 'js':
      case 'py':
        return <CodeIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case 'png':
      case 'jpg':
      case 'svg':
        return <ImageIcon className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
      default:
        return <File className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
    }
  };

  // Sorting comparator
  const sortNodes = useCallback((nodes: AttachedFileNode[]): AttachedFileNode[] => {
    return [...nodes].sort((a, b) => {
      // Folders always precede files in IDE explorer
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let compareVal = 0;
      if (sortField === 'name') {
        compareVal = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'date') {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        compareVal = dateB - dateA; // default newest first
      } else if (sortField === 'type') {
        const extA = a.extension || '';
        const extB = b.extension || '';
        compareVal = extA.localeCompare(extB) || a.name.localeCompare(b.name);
      }

      return sortDirection === 'asc' ? compareVal : -compareVal;
    });
  }, [sortField, sortDirection]);

  // Filter tree items by search query
  const filterAndSortNode = useCallback((node: AttachedFileNode, query: string): AttachedFileNode | null => {
    const q = query.trim().toLowerCase();

    function processNode(item: AttachedFileNode): AttachedFileNode | null {
      const matchesName = !q || item.name.toLowerCase().includes(q);

      if (item.isFolder) {
        const rawChildren = item.children || [];
        const filteredChildren = rawChildren
          .map(c => processNode(c))
          .filter((c): c is AttachedFileNode => c !== null);

        if (filteredChildren.length > 0 || matchesName) {
          return {
            ...item,
            children: sortNodes(filteredChildren)
          };
        }
        return null;
      }

      return matchesName ? item : null;
    }

    return processNode(node);
  }, [sortNodes]);

  // Recursive IDE tree node renderer with chevrons and indent guidelines
  const renderTreeNode = (node: AttachedFileNode, level: number = 0) => {
    const isFolder = node.isFolder;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileId === node.id;
    const isPinned = pinnedFiles.some(p => p.id === node.id);
    const childCount = node.children?.length ?? 0;

    return (
      <div key={node.id} className="select-none group/row">
        <div
          onClick={() => handleNodeClick(node)}
          draggable={true}
          onDragStart={(e) => {
            const payload = JSON.stringify({
              type: isFolder ? 'AIDriveFolder' : 'AIDriveFile',
              id: node.path || node.id,
              path: node.path || node.id,
              name: node.name,
              isFolder
            });
            e.dataTransfer.setData('text/plain', payload);
            e.dataTransfer.setData('application/json', payload);
          }}
          style={{ paddingLeft: `${level * 14 + 6}px` }}
          className={cn(
            "flex items-center h-7 px-1.5 cursor-pointer text-xs rounded transition-colors relative",
            "hover:bg-slate-200/60 dark:hover:bg-slate-800/60",
            isSelected 
              ? "bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 font-semibold border-l-2 border-blue-500 shadow-2xs" 
              : "text-slate-700 dark:text-slate-300",
            isPinned && "bg-amber-50/60 dark:bg-amber-950/20"
          )}
        >
          {/* Chevron for folder */}
          <div 
            onClick={(e) => {
              if (isFolder) {
                e.stopPropagation();
                handleNodeClick(node);
              }
            }}
            className="w-4 h-4 flex items-center justify-center mr-0.5 shrink-0 rounded hover:bg-black/5 dark:hover:bg-white/10"
          >
            {isFolder ? (
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-slate-400 transition-transform duration-150",
                  isExpanded && "transform rotate-90 text-slate-600 dark:text-slate-200"
                )}
              />
            ) : (
              <span className="w-3.5" />
            )}
          </div>

          {/* File/Folder Icon */}
          <div className="mr-1.5 shrink-0">{renderFileIcon(node)}</div>

          {/* Label */}
          <span
            className="truncate flex-1 font-sans text-xs tracking-tight select-none"
            title={node.path || node.name}
          >
            {node.name}
          </span>

          {/* Folder Child Count Badge */}
          {isFolder && childCount > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mr-1 shrink-0">
              ({childCount})
            </span>
          )}

          {/* Action buttons (Pin / Context) */}
          {isFolder ? (
            <button
              onClick={(e) => handleFolderPin(node, e)}
              className="p-1 rounded opacity-0 group-hover/row:opacity-100 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0 cursor-pointer"
              title={`Pin all files in "${node.name}" to context`}
            >
              <Pin className="h-3 w-3 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={(e) => handleNodePin(node, e)}
              className={cn(
                "p-1 rounded transition shrink-0 cursor-pointer",
                isPinned
                  ? "text-amber-600 dark:text-amber-400 opacity-100"
                  : "text-slate-400 opacity-0 group-hover/row:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
              title={isPinned ? "Pinned to context" : "Pin file to context"}
            >
              <Pin className={cn("h-3 w-3", isPinned && "fill-amber-500 text-amber-500")} />
            </button>
          )}
        </div>

        {/* Indented Children Container with Guideline */}
        {isFolder && isExpanded && (
          <div className="border-l border-slate-200 dark:border-slate-800/80 ml-3.5">
            {node.children && node.children.length > 0 ? (
              sortNodes(node.children).map(child => renderTreeNode(child, level + 1))
            ) : node.isLoaded ? (
              <div 
                className="text-[11px] text-slate-400 dark:text-slate-500 py-1 italic"
                style={{ paddingLeft: `${(level + 1) * 14 + 10}px` }}
              >
                (empty folder)
              </div>
            ) : (
              <div 
                className="text-[11px] text-slate-400 dark:text-slate-500 py-1 italic flex items-center gap-1.5"
                style={{ paddingLeft: `${(level + 1) * 14 + 10}px` }}
              >
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span>Reading directory contents...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Group drives
  const attachedRoots = drives.filter(d => d.type !== 'generated' && d.type !== 'cloud');
  const generatedRoots = drives.filter(d => d.type === 'generated');

  return (
    <div className={cn("h-full flex flex-col bg-transparent text-xs", className)}>
      {/* Hidden input for fallback folder upload */}
      <input
        type="file"
        ref={fileInputRef}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleDirectoryInputChange}
        className="hidden"
      />

      {/* 🚀 Top Action Bar: Attach Drive & Quick Presets */}
      <div className="p-2 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] space-y-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAttachFolderClick}
            disabled={isAttaching}
            className="flex-1 py-1.5 px-3 sutra-silver-create shimmer-button-energy font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all text-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Attach a local folder, USB travel drive (E:\), or Google Drive (G:\)"
          >
            {isAttaching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>Attach Drive / Folder</span>
          </button>
        </div>

        {/* Quick-mount Preset Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-0.5">Mount:</span>
          <button
            onClick={() => attachPreconfiguredDrive('travel')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition ${
              drives.some(d => d.name.toLowerCase().includes('travel') || d.name.includes('E:'))
                ? 'sutra-steel-active text-white'
                : 'sutra-silver-create text-slate-700 dark:text-slate-200 hover:brightness-105'
            }`}
            title="Mount Travel Drive (E:\) with client cases"
          >
            <HardDrive className="h-2.5 w-2.5" />
            <span>Travel (E:)</span>
            {drives.some(d => d.name.toLowerCase().includes('travel') || d.name.includes('E:')) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => attachPreconfiguredDrive('gdrive')}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition ${
              drives.some(d => d.name.toLowerCase().includes('google') || d.name.includes('G:'))
                ? 'sutra-steel-active text-white'
                : 'sutra-silver-create text-slate-700 dark:text-slate-200 hover:brightness-105'
            }`}
            title="Mount Google Drive (G:\My Drive)"
          >
            <Folder className="h-2.5 w-2.5" />
            <span>Google (G:)</span>
            {drives.some(d => d.name.toLowerCase().includes('google') || d.name.includes('G:')) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Real-time Search Box */}
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search across all files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-7 py-1 text-xs bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-md placeholder:text-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* 🎛️ IDE-Style View Controls (Sort, Expand All, Collapse All, Refresh) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort:</span>
            <button
              onClick={() => {
                if (sortField === 'name') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('name');
                  setSortDirection('asc');
                }
              }}
              className={cn(
                "px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer font-medium",
                sortField === 'name' && "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              )}
              title="Sort by Name (A-Z / Z-A)"
            >
              A-Z {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortField === 'date') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('date');
                  setSortDirection('asc');
                }
              }}
              className={cn(
                "px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer font-medium",
                sortField === 'date' && "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              )}
              title="Sort by Date Modified"
            >
              Date
            </button>
            <button
              onClick={() => {
                if (sortField === 'type') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('type');
                  setSortDirection('asc');
                }
              }}
              className={cn(
                "px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer font-medium",
                sortField === 'type' && "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              )}
              title="Sort by File Type"
            >
              Type
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleExpandAll}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Expand All Folders"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCollapseAll}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Collapse All Folders"
            >
              <FolderTree className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Refresh Live Filesystem from Disk"
            >
              <RotateCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-blue-500")} />
            </button>
          </div>
        </div>
      </div>

      {/* 📁 Hierarchical IDE File Tree View */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-3">
          
          {/* 1. AI GENERATED DOCUMENTS & BRAIN (Expanded & live from AI_GENERATED_DOCS) */}
          <div className="space-y-1">
            <div className="px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                AI Generated Docs & Work Products
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({generatedRoots.reduce((acc, g) => acc + g.fileCount, 0)} files)
              </span>
            </div>

            <div className="rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 p-1 space-y-0.5">
              {generatedRoots.flatMap(g => g.items)
                .map(i => filterAndSortNode(i, searchQuery))
                .filter((i): i is AttachedFileNode => i !== null)
                .map(item => renderTreeNode(item, 0))}
            </div>
          </div>

          {/* 2. ATTACHED LOCAL / TRAVEL STORAGE VAULTS */}
          <div className="space-y-1">
            <div className="px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                Attached Storage Vaults ({attachedRoots.length})
              </span>
            </div>

            {attachedRoots.length === 0 ? (
              <div className="p-3 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">No external storage attached.</p>
                <button
                  onClick={handleAttachFolderClick}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:underline cursor-pointer"
                >
                  + Click to attach a local folder or E:\ drive
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {attachedRoots.map((drive) => {
                  const filteredItems = drive.items
                    .map(i => filterAndSortNode(i, searchQuery))
                    .filter((i): i is AttachedFileNode => i !== null);

                  return (
                    <div key={drive.id} className="rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-2xs">
                      {/* Drive Header */}
                      <div 
                        onClick={() => toggleDriveExpanded(drive.id)}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-slate-100/90 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-750 transition"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ChevronRight className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-150 shrink-0", drive.isExpanded && "transform rotate-90 text-slate-600 dark:text-slate-200")} />
                          <HardDrive className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                          <span className="font-bold truncate text-slate-800 dark:text-slate-100 font-sans text-xs">{drive.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">({drive.fileCount})</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            detachDrive(drive.id);
                          }}
                          className="p-1 hover:text-rose-500 text-slate-400 transition-colors cursor-pointer"
                          title="Detach drive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Drive Files Tree */}
                      {drive.isExpanded && (
                        <div className="p-1 space-y-0.5">
                          {filteredItems.length === 0 ? (
                            <div className="p-2 text-center text-[10px] text-slate-400 italic">
                              {searchQuery ? 'No matching files.' : 'Empty drive.'}
                            </div>
                          ) : (
                            sortNodes(filteredItems).map(item => renderTreeNode(item, 0))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. AI CLOUD REPOSITORY */}
          <div className="space-y-1">
            <div 
              onClick={() => setIsCloudExpanded(prev => !prev)}
              className="px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center justify-between cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <span className="flex items-center gap-1.5">
                <Cloud className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                AI Cloud Storage ({cloudFiles.length})
              </span>
              <ChevronRight className={cn("h-3.5 w-3.5 text-slate-400 transition-transform duration-150", isCloudExpanded && "transform rotate-90")} />
            </div>

            {isCloudExpanded && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-2">
                {cloudLoading ? (
                  <div className="flex items-center justify-center p-2 text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Syncing cloud files...</span>
                  </div>
                ) : cloudFiles.length === 0 ? (
                  <div className="text-center text-[10px] text-slate-400 py-1 italic">
                    Cloud files synchronized. (0 cloud files)
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {cloudFiles.map(cf => (
                      <div
                        key={cf.id}
                        onClick={() => handleSelect && handleSelect(cf)}
                        className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate flex-1">{cf.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </ScrollArea>

      {/* 📌 Executive Evidentiary HUD */}
      {pinnedFiles.length > 0 && (
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/90 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Evidentiary Context
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                {pinnedFiles.length.toLocaleString()} Active
              </span>
            </div>
            <button
              onClick={() => clearPinnedFiles()}
              className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {pinnedFiles.slice(0, 6).map(pf => (
              <span 
                key={pf.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono"
                title={pf.path || pf.name}
              >
                <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[280px]">{pf.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinFile({ id: pf.id, name: pf.name, path: pf.path, isFolder: false, driveId: pf.driveId } as any);
                  }}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                  title="Unpin file"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {pinnedFiles.length > 6 && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800/80 rounded">
                +{ (pinnedFiles.length - 6).toLocaleString() } more in LLM context
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
