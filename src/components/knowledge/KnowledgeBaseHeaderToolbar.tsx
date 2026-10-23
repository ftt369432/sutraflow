import React from 'react';
import {
  Search,
  HardDrive,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  CheckSquare,
  X,
  Brain,
  Bot
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TagSelector } from './TagSelector';
import { BulkActionsMenu } from './BulkActionsMenu';
import { KnowledgeBaseCreateButton } from './KnowledgeBaseCreateButton';
import EmbeddingHealthMonitor from './EmbeddingHealthMonitor';
import { cn } from '../../lib/utils';
import type { AIDocument } from '../../types/ai';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface KnowledgeBaseHeaderToolbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  breadcrumbs: BreadcrumbItem[];
  onSelectFolder: (folderId: string | null) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  showHiddenFiles: boolean;
  toggleShowHiddenFiles: () => void;
  showBatchTools: boolean;
  setShowBatchTools: (show: boolean) => void;
  onSelectAll: () => void;
  onOpenModal: (modalName: string) => void;
  onUploadClick: () => void;
  selectedDocumentIds: string[];
  selectedFolderIds: string[];
  displayedDocuments: AIDocument[];
  allFolderIds: string[];
  selectedFolderId: string | null;
  onBulkMove: (targetFolderId: string) => void;
  onBulkDelete: () => void;
  onBulkDownload: () => void;
  onBulkStar: () => void;
  onBulkAssignToAssistant: () => void;
  onBulkAssignToTask: () => void;
}

export const KnowledgeBaseHeaderToolbar: React.FC<KnowledgeBaseHeaderToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedTags,
  toggleTag,
  breadcrumbs,
  onSelectFolder,
  viewMode,
  setViewMode,
  showHiddenFiles,
  toggleShowHiddenFiles,
  showBatchTools,
  setShowBatchTools,
  onSelectAll,
  onOpenModal,
  onUploadClick,
  selectedDocumentIds,
  selectedFolderIds,
  displayedDocuments,
  allFolderIds,
  selectedFolderId,
  onBulkMove,
  onBulkDelete,
  onBulkDownload,
  onBulkStar,
  onBulkAssignToAssistant,
  onBulkAssignToTask
}) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-slate-950">
      {/* Top Row: Search & Utilities */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search documents by title, content, or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-xl"
            />
          </div>
          <TagSelector selectedTags={selectedTags} onToggleTag={toggleTag} />
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Hidden Files Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShowHiddenFiles}
            title={showHiddenFiles ? 'Hide hidden files' : 'Show hidden files'}
            className="h-9 px-3"
          >
            {showHiddenFiles ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            <span className="hidden sm:inline">{showHiddenFiles ? 'Hide Hidden' : 'Show Hidden'}</span>
          </Button>

          {/* Storage Manager */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenModal('storageManager')}
            className="h-9 px-3"
          >
            <HardDrive className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Storage</span>
          </Button>

          {/* Embedding Monitor */}
          <EmbeddingHealthMonitor />
        </div>
      </div>

      {/* Bottom Row: Breadcrumbs & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || 'root'}>
              {index > 0 && <span>/</span>}
              <button
                type="button"
                className={cn(
                  'hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap',
                  index === breadcrumbs.length - 1 ? 'font-bold text-slate-900 dark:text-white' : ''
                )}
                onClick={() => onSelectFolder(crumb.id)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            Select All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBatchTools(!showBatchTools)}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            {showBatchTools ? (
              <>
                <X className="h-3.5 w-3.5 mr-1" />
                Hide Batch Tools
              </>
            ) : (
              <>
                <Brain className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                Batch Tools
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenModal('assignToAssistant')}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            <Bot className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            Assign Assistant
          </Button>

          {selectedDocumentIds.length > 0 || selectedFolderIds.length > 0 ? (
            <BulkActionsMenu
              currentFolderId={selectedFolderId}
              allDocumentIds={displayedDocuments.map((d) => d.id)}
              allFolderIds={allFolderIds}
              onBulkMove={onBulkMove}
              onBulkDelete={onBulkDelete}
              onBulkDownload={onBulkDownload}
              onBulkStar={onBulkStar}
              onBulkAssignToAssistant={onBulkAssignToAssistant}
              onBulkAssignToTask={onBulkAssignToTask}
            />
          ) : (
            <KnowledgeBaseCreateButton
              onCreateDocument={() => onOpenModal('createDocument')}
              onCreateFolder={() => onOpenModal('createFolder')}
              onUploadFiles={onUploadClick}
              onCreateNote={() => onOpenModal('createNote')}
              onAssignToAssistant={() => onOpenModal('assignToAssistant')}
              onAIProcess={() => onOpenModal('aiProcessor')}
              onSyncWorkspace={() => onOpenModal('unpackWorkspace')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
