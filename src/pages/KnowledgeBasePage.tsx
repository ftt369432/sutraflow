import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';
import { Button } from '../components/ui/Button';
import type { AIDocument } from '../types/ai';
import { FolderTree } from '../components/knowledge/FolderTree';
import { DocumentDetailSidebar } from '../components/knowledge/DocumentDetailSidebar';
import { KnowledgeBasePreview } from '../components/knowledge/KnowledgeBasePreview';
import { SelectionProvider, useSelection } from '../components/knowledge/EnhancedSelectionContext';
import { useAuth } from '../contexts/AuthContext';
import { ResizablePanelGroup, ResizablePanel, ResizeHandle } from '../components/ui/ResizablePanel';
import { useAssistantStore } from '../store/assistantStore';
import { ToastProvider } from '../components/ui/useToast';
import { knowledgeBaseInitService } from '../services/knowledgeBaseInitService';
import { KnowledgeBaseHeaderToolbar } from '../components/knowledge/KnowledgeBaseHeaderToolbar';
import { KnowledgeBaseDocumentGrid } from '../components/knowledge/KnowledgeBaseDocumentGrid';
import { KnowledgeBaseModals } from '../components/knowledge/KnowledgeBaseModals';

function KnowledgeBaseContent() {
  const { user } = useAuth();
  const {
    documents,
    folders,
    initialized: isInitialized,
    loadDocuments,
    updateDocument,
    deleteDocument,
    deleteFolder,
    addFolder,
    updateFolder
  } = useKnowledgeBaseStore();

  const {
    selectedDocuments,
    selectedFolders,
    selectAllDocuments,
    clearSelection
  } = useSelection();

  const { assistants, fetchAssistants } = useAssistantStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isUploaderOpen, setUploaderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [showBatchTools, setShowBatchTools] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [fullViewDocument, setFullViewDocument] = useState<AIDocument | null>(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  useEffect(() => {
    if (user?.id && !isInitialized) {
      knowledgeBaseInitService.initialize().then(() => {
        loadDocuments().catch(console.error);
        fetchAssistants().catch(console.error);
      });
    }
  }, [user?.id, isInitialized, loadDocuments, fetchAssistants]);

  const filteredDocs = useMemo(() => {
    let result = documents;
    if (selectedFolderId !== null) {
      result = result.filter((d) => (d.folderId ?? null) === selectedFolderId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content?.toLowerCase().includes(q)
      );
    }
    if (selectedTags.length > 0) {
      result = result.filter((d) =>
        selectedTags.some((tag) => d.metadata?.tags?.includes(tag))
      );
    }
    return result;
  }, [documents, selectedFolderId, searchQuery, selectedTags]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Home' }];
    if (!selectedFolderId) return crumbs;

    const findAncestors = (folderId: string): Array<{ id: string; name: string }> => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return [];
      const parentCrumbs = folder.parentId ? findAncestors(folder.parentId) : [];
      return [...parentCrumbs, { id: folder.id, name: folder.name }];
    };

    return [...crumbs, ...findAncestors(selectedFolderId)];
  }, [selectedFolderId, folders]);

  const handleSelectAll = useCallback(() => {
    selectAllDocuments(filteredDocs.map((d) => d.id));
  }, [filteredDocs, selectAllDocuments]);

  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    return addFolder({ name, parentId: parentId ?? selectedFolderId });
  };

  const handleRename = async (newName: string) => {
    if (!itemToRename) return;
    if (itemToRename.type === 'folder') {
      await updateFolder(itemToRename.id, { name: newName });
    } else {
      await updateDocument(itemToRename.id, { title: newName });
    }
    setIsRenameModalOpen(false);
    setItemToRename(null);
  };

  const handleToggleStar = (doc: AIDocument) => {
    const currentTags = doc.metadata?.tags || [];
    const hasStarred = currentTags.includes('starred');
    const updatedTags = hasStarred
      ? currentTags.filter((t) => t !== 'starred')
      : [...currentTags, 'starred'];

    updateDocument(doc.id, {
      metadata: { ...doc.metadata, tags: updatedTags }
    });
  };

  const handleBulkDelete = async () => {
    for (const docId of selectedDocuments) {
      await deleteDocument(docId);
    }
    for (const folderId of selectedFolders) {
      await deleteFolder(folderId);
    }
    clearSelection();
  };

  const selectedItemsForAssistant = useMemo(() => {
    const docs = documents
      .filter((d) => selectedDocuments.includes(d.id))
      .map((d) => ({ id: d.id, name: d.title, type: 'document' as const }));
    const flds = folders
      .filter((f) => selectedFolders.includes(f.id))
      .map((f) => ({ id: f.id, name: f.name, type: 'folder' as const }));
    return [...docs, ...flds];
  }, [documents, folders, selectedDocuments, selectedFolders]);

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header Toolbar */}
      <KnowledgeBaseHeaderToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        breadcrumbs={breadcrumbs}
        onSelectFolder={setSelectedFolderId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showHiddenFiles={showHiddenFiles}
        toggleShowHiddenFiles={() => setShowHiddenFiles(!showHiddenFiles)}
        showBatchTools={showBatchTools}
        setShowBatchTools={setShowBatchTools}
        onSelectAll={handleSelectAll}
        onOpenModal={setActiveModal}
        onUploadClick={() => setUploaderOpen(true)}
        selectedDocumentIds={selectedDocuments}
        selectedFolderIds={selectedFolders}
        displayedDocuments={filteredDocs}
        allFolderIds={folders.map((f) => f.id)}
        selectedFolderId={selectedFolderId}
        onBulkMove={() => {}}
        onBulkDelete={handleBulkDelete}
        onBulkDownload={() => {}}
        onBulkStar={() => {}}
        onBulkAssignToAssistant={() => setActiveModal('assignToAssistant')}
        onBulkAssignToTask={() => setActiveModal('taskLinker')}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden flex">
        <ResizablePanelGroup direction="horizontal" className="min-h-[200px] w-full">
          {!isLeftPanelCollapsed && (
            <>
              <ResizablePanel
                defaultSize={22}
                minSize={15}
                maxSize={35}
                className="bg-slate-50 dark:bg-slate-900 relative border-r border-slate-200 dark:border-slate-800"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-6 w-6"
                  onClick={() => setIsLeftPanelCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="h-full overflow-y-auto p-2">
                  <FolderTree
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                    onRenameFolder={(id, name) => {
                      setItemToRename({ id, name, type: 'folder' });
                      setIsRenameModalOpen(true);
                    }}
                    onDeleteFolder={deleteFolder}
                  />
                </div>
              </ResizablePanel>
              <ResizeHandle direction="horizontal" />
            </>
          )}

          {isLeftPanelCollapsed && (
            <div className="w-10 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsLeftPanelCollapsed(false)}
                title="Show folder tree"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ResizablePanel defaultSize={78}>
            <KnowledgeBaseDocumentGrid
              documents={filteredDocs}
              folders={folders}
              selectedFolderId={selectedFolderId}
              viewMode={viewMode}
              searchQuery={searchQuery}
              onSelectFolder={setSelectedFolderId}
              onViewDetails={(id) => {
                setSelectedDocumentId(id);
                setShowDetailSidebar(true);
              }}
              onViewFull={setFullViewDocument}
              onReprocess={(id) => console.log('Reprocess document:', id)}
              onDelete={deleteDocument}
              onUploadClick={() => setUploaderOpen(true)}
              onMoveItem={(docId, folderId) => updateDocument(docId, { folderId })}
            />
          </ResizablePanel>

          {showDetailSidebar && selectedDocument && (
            <>
              <ResizeHandle direction="horizontal" />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <DocumentDetailSidebar
                  document={selectedDocument}
                  onClose={() => setShowDetailSidebar(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Extracted Modals Engine */}
      <KnowledgeBaseModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        selectedFolderId={selectedFolderId}
        selectedDocuments={selectedDocuments}
        selectedItemsForAssistant={selectedItemsForAssistant}
        isUploaderOpen={isUploaderOpen}
        setUploaderOpen={setUploaderOpen}
        filesToUpload={filesToUpload}
        isRenameModalOpen={isRenameModalOpen}
        setIsRenameModalOpen={setIsRenameModalOpen}
        itemToRename={itemToRename}
        setItemToRename={setItemToRename}
        fullViewDocument={fullViewDocument}
        setFullViewDocument={setFullViewDocument}
        documents={documents}
        handleCreateFolder={handleCreateFolder}
        handleRename={handleRename}
        handleRecoveryComplete={(count) => {
          setActiveModal(null);
          if (count > 0) loadDocuments().catch(console.error);
        }}
        onToggleStar={handleToggleStar}
      />
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <ToastProvider>
      <SelectionProvider>
        <KnowledgeBaseContent />
      </SelectionProvider>
    </ToastProvider>
  );
}
