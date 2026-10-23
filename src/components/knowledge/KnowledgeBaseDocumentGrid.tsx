import React from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { DocumentCard, adaptAIDocumentToUnified } from '../common/DocumentCard';
import type { AIDocument } from '../../types/ai';

interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
}

interface KnowledgeBaseDocumentGridProps {
  documents: AIDocument[];
  folders: FolderItem[];
  selectedFolderId: string | null;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  onSelectFolder: (id: string) => void;
  onViewDetails: (docId: string) => void;
  onViewFull: (doc: AIDocument) => void;
  onReprocess: (docId: string) => void;
  onDelete: (docId: string) => void;
  onUploadClick: () => void;
  onMoveItem: (docId: string, folderId: string) => void;
}

export const KnowledgeBaseDocumentGrid: React.FC<KnowledgeBaseDocumentGridProps> = ({
  documents,
  folders,
  selectedFolderId,
  viewMode,
  searchQuery,
  onSelectFolder,
  onViewDetails,
  onViewFull,
  onReprocess,
  onDelete,
  onUploadClick,
  onMoveItem
}) => {
  const currentFolders = folders.filter((f) => (f.parentId ?? null) === selectedFolderId);

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Current Folder Subdirectories */}
      {currentFolders.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Folders
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {currentFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder(folder.id)}
                className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 hover:shadow-sm transition-all text-left group"
              >
                <span className="text-xl">📁</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {folder.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Documents Grid / List */}
      {documents.length > 0 ? (
        <div>
          {currentFolders.length > 0 && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Documents
            </h4>
          )}
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-2'
            }
          >
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={adaptAIDocumentToUnified(doc)}
                viewMode={viewMode}
                onSelect={() => onViewDetails(doc.id)}
                onView={() => onViewFull(doc)}
                onReprocess={() => onReprocess(doc.id)}
                onDelete={() => onDelete(doc.id)}
                onMove={(folderId) => onMoveItem(doc.id, folderId)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center h-80 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 mt-4">
          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'No matching documents found' : 'No documents in this folder'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {searchQuery
              ? 'Try refining your search keyword or clearing the active tag filter.'
              : 'Upload new PDFs, case files, or briefs to ground your sovereign assistants.'}
          </p>
          <Button size="sm" onClick={onUploadClick} className="mt-4">
            <Upload className="h-4 w-4 mr-1.5" />
            Upload Files
          </Button>
        </div>
      )}
    </div>
  );
};
