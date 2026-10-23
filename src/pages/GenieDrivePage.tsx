import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FileText, Layout } from 'lucide-react';
import { GenieDriveHeader } from '../components/geniedrive/GenieDriveHeader';
import { GenieDriveBulkActionsToolbar } from '../components/geniedrive/GenieDriveBulkActionsToolbar';
import { GenieDriveBrowsePanels } from '../components/geniedrive/GenieDriveBrowsePanels';
import { GenieDriveEditPanels } from '../components/geniedrive/GenieDriveEditPanels';
import { GenieDriveModals } from '../components/geniedrive/GenieDriveModals';
import { AIDriveFile, FileSearchOptions } from '../services/drive/aiDriveService';
import { useAiDriveService } from '../hooks/useAiDriveService';
import { useDocumentTabs } from '../hooks/useDocumentTabs';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

export type SortByOptions = 'name' | 'created_at' | 'updated_at' | 'size';
export type SortDirectionOptions = 'asc' | 'desc';
export type GenieDriveViewStyle = 'grid' | 'list' | 'compact';

export interface GenieDrivePageState {
  currentFolderId: string | null;
  currentItem: AIDriveFile | null;
  selectedItems: string[];
  pathStack: AIDriveFile[];
  searchTerm: string;
  filterOptions: Partial<FileSearchOptions>;
  sortOptions: {
    field: SortByOptions;
    direction: SortDirectionOptions;
  };
  viewMode: GenieDriveViewStyle;
}

const initialViewState: GenieDrivePageState = {
  currentFolderId: null,
  currentItem: null,
  selectedItems: [],
  pathStack: [],
  searchTerm: '',
  filterOptions: { include_trashed: false },
  sortOptions: { field: 'name', direction: 'asc' },
  viewMode: 'list'
};

export const GenieDrivePage: React.FC = () => {
  const aiDriveService = useAiDriveService();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const [viewState, setViewState] = useState<GenieDrivePageState>(initialViewState);
  const [items, setItems] = useState<AIDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<AIDriveFile | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AIDriveFile | null>(null);
  const [itemsToMove, setItemsToMove] = useState<AIDriveFile[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isLinkToKnowledgeBaseModalOpen, setIsLinkToKnowledgeBaseModalOpen] = useState(false);

  // Browse vs Edit tabbed mode
  const [viewMode, setViewMode] = useState<'browse' | 'edit'>('browse');
  const [isDocumentPanelMaximized, setIsDocumentPanelMaximized] = useState(false);

  const documentTabs = useDocumentTabs({
    aiDriveService: aiDriveService!,
    userId: user?.id || '',
    maxOpenDocuments: 10
  });

  const refreshItems = useCallback(async () => {
    if (!aiDriveService || !user?.id) return;
    setIsLoading(true);
    try {
      const fetchedItems = await aiDriveService.listFiles(viewState.currentFolderId, {
        ...viewState.filterOptions,
        query: viewState.searchTerm,
        sort_by: viewState.sortOptions.field,
        sort_direction: viewState.sortOptions.direction
      });
      setItems(fetchedItems);
    } catch (error) {
      console.error('Failed to fetch drive items:', error);
      toast({ title: 'Error', description: 'Failed to load files', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [aiDriveService, user?.id, viewState.currentFolderId, viewState.filterOptions, viewState.searchTerm, viewState.sortOptions, toast]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const handleViewStateChange = useCallback((newState: Partial<GenieDrivePageState>) => {
    setViewState((prev) => ({ ...prev, ...newState }));
  }, []);

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setViewState((prev) => ({
      ...prev,
      currentFolderId: folderId,
      selectedItems: [],
      currentItem: null
    }));
  }, []);

  const handleItemClick = useCallback((item: AIDriveFile, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setViewState((prev) => ({
        ...prev,
        selectedItems: prev.selectedItems.includes(item.id)
          ? prev.selectedItems.filter((id) => id !== item.id)
          : [...prev.selectedItems, item.id]
      }));
    } else {
      setViewState((prev) => ({
        ...prev,
        selectedItems: [item.id],
        currentItem: item
      }));
    }
  }, []);

  const handleItemOpen = useCallback((item: AIDriveFile) => {
    if (item.is_folder) {
      handleFolderSelect(item.id);
    } else {
      documentTabs.openDocument(item.id, item.name);
      setViewMode('edit');
    }
  }, [handleFolderSelect, documentTabs]);

  const handleToggleStar = useCallback(async (item: AIDriveFile) => {
    if (!aiDriveService) return;
    try {
      await aiDriveService.fileService.updateFile(item.id, { is_starred: !item.is_starred });
      refreshItems();
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  }, [aiDriveService, refreshItems]);

  const handleCreateFolder = useCallback(async (name: string) => {
    if (!aiDriveService || !user?.id) return;
    try {
      await aiDriveService.createFolder(name, viewState.currentFolderId, user.id);
      setIsCreateFolderModalOpen(false);
      refreshItems();
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  }, [aiDriveService, user?.id, viewState.currentFolderId, refreshItems]);

  const handleConfirmRename = useCallback(async (newName: string) => {
    if (!aiDriveService || !itemToRename) return;
    try {
      await aiDriveService.fileService.updateFile(itemToRename.id, { name: newName });
      setItemToRename(null);
      refreshItems();
    } catch (err) {
      console.error('Failed to rename item:', err);
    }
  }, [aiDriveService, itemToRename, refreshItems]);

  const handleConfirmDelete = useCallback(async () => {
    if (!aiDriveService || !itemToDelete) return;
    try {
      await aiDriveService.deleteFile(itemToDelete.id);
      setItemToDelete(null);
      refreshItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  }, [aiDriveService, itemToDelete, refreshItems]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!aiDriveService) return;
    setIsBulkDeleting(true);
    try {
      for (let i = 0; i < viewState.selectedItems.length; i++) {
        await aiDriveService.deleteFile(viewState.selectedItems[i]);
        setBulkDeleteProgress({ completed: i + 1, total: viewState.selectedItems.length });
      }
      setIsBulkDeleteModalOpen(false);
      setViewState((prev) => ({ ...prev, selectedItems: [], currentItem: null }));
      refreshItems();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteProgress(null);
    }
  }, [aiDriveService, viewState.selectedItems, refreshItems]);

  const handleConfirmMove = useCallback(async (targetFolderId: string | null) => {
    if (!aiDriveService) return;
    try {
      for (const item of itemsToMove) {
        await aiDriveService.fileService.updateFile(item.id, { parent_id: targetFolderId });
      }
      setItemsToMove([]);
      refreshItems();
    } catch (err) {
      console.error('Failed to move items:', err);
    }
  }, [aiDriveService, itemsToMove, refreshItems]);

  const selectedFiles = useMemo(
    () => items.filter((item) => viewState.selectedItems.includes(item.id)),
    [items, viewState.selectedItems]
  );

  const handleBulkStar = useCallback(async (starred: boolean) => {
    if (!aiDriveService) return;
    try {
      for (const item of selectedFiles) {
        await aiDriveService.fileService.updateFile(item.id, { is_starred: starred });
      }
      toast({ title: 'Success', description: `Updated star status on ${selectedFiles.length} item(s)` });
      refreshItems();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update star status', variant: 'destructive' });
    }
  }, [aiDriveService, selectedFiles, toast, refreshItems]);

  const handleBulkAnalyze = useCallback(() => {
    if (selectedFiles.length === 0) return;
    setIsLinkToKnowledgeBaseModalOpen(true);
  }, [selectedFiles]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Header Bar */}
      <GenieDriveHeader
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        onUploadClick={() => setIsUploadModalOpen(true)}
        onCreateFolderClick={() => setIsCreateFolderModalOpen(true)}
        onLinkToKnowledgeBase={() => setIsLinkToKnowledgeBaseModalOpen(true)}
        path={viewState.pathStack}
        onNavigatePath={(folderId) => handleFolderSelect(folderId)}
      />

      {/* Mode Switcher */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('browse')}
            className="flex items-center gap-2"
          >
            <Layout className="w-4 h-4" />
            Browse Files
          </Button>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="flex items-center gap-2"
            disabled={documentTabs.openDocuments.length === 0}
          >
            <FileText className="w-4 h-4" />
            Edit Documents ({documentTabs.openDocuments.length})
          </Button>
        </div>

        {viewMode === 'edit' && documentTabs.openDocuments.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDocumentPanelMaximized(!isDocumentPanelMaximized)}
            >
              {isDocumentPanelMaximized ? 'Restore' : 'Maximize Editor'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => documentTabs.closeAllDocuments()}
            >
              Close All ({documentTabs.openDocuments.length})
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace Panels */}
      <div className="flex-grow overflow-hidden">
        {viewMode === 'browse' ? (
          <GenieDriveBrowsePanels
            viewState={viewState}
            handleViewStateChange={handleViewStateChange}
            handleFolderSelect={handleFolderSelect}
            handleToggleStar={handleToggleStar}
            isLoading={isLoading}
            aiDriveService={aiDriveService}
            userId={user?.id || ''}
            items={items}
            handleItemClick={handleItemClick}
            handleItemOpen={handleItemOpen}
            handleRenameRequest={setItemToRename}
            handleDeleteRequest={setItemToDelete}
            handleMoveRequest={(item) => setItemsToMove([item])}
            handleCopyRequest={() => {}}
            handleDownloadItem={() => {}}
            handleShareItem={() => {}}
            setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
          />
        ) : (
          <GenieDriveEditPanels
            isDocumentPanelMaximized={isDocumentPanelMaximized}
            setIsDocumentPanelMaximized={setIsDocumentPanelMaximized}
            items={items}
            viewState={viewState}
            handleViewStateChange={handleViewStateChange}
            handleItemClick={handleItemClick}
            handleItemOpen={handleItemOpen}
            handleToggleStar={handleToggleStar}
            handleRenameRequest={setItemToRename}
            handleDeleteRequest={setItemToDelete}
            handleMoveRequest={(item) => setItemsToMove([item])}
            handleCopyRequest={() => {}}
            handleDownloadItem={() => {}}
            handleShareItem={() => {}}
            setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
            isLoading={isLoading}
            aiDriveService={aiDriveService}
            userId={user?.id || ''}
            documentTabs={documentTabs}
          />
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      <GenieDriveBulkActionsToolbar
        selectedCount={viewState.selectedItems.length}
        selectedItems={selectedFiles}
        onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        onBulkStar={handleBulkStar}
        onBulkMove={() => setItemsToMove(selectedFiles)}
        onBulkDuplicate={() => {}}
        onBulkAnalyze={handleBulkAnalyze}
        onClearSelection={() => setViewState((prev) => ({ ...prev, selectedItems: [] }))}
        isProcessing={isAIProcessing || isBulkDeleting}
      />

      {/* Self-Contained Modal Engine */}
      <GenieDriveModals
        isUploadModalOpen={isUploadModalOpen}
        setIsUploadModalOpen={setIsUploadModalOpen}
        currentFolderId={viewState.currentFolderId}
        aiDriveService={aiDriveService}
        userId={user?.id || ''}
        refreshItems={refreshItems}
        isCreateFolderModalOpen={isCreateFolderModalOpen}
        setIsCreateFolderModalOpen={setIsCreateFolderModalOpen}
        handleCreateFolder={handleCreateFolder}
        isLinkToKnowledgeBaseModalOpen={isLinkToKnowledgeBaseModalOpen}
        setIsLinkToKnowledgeBaseModalOpen={setIsLinkToKnowledgeBaseModalOpen}
        items={items}
        selectedItemIds={viewState.selectedItems}
        itemToDelete={itemToDelete}
        setItemToDelete={setItemToDelete}
        handleConfirmDelete={handleConfirmDelete}
        isBulkDeleteModalOpen={isBulkDeleteModalOpen}
        setIsBulkDeleteModalOpen={setIsBulkDeleteModalOpen}
        selectedFiles={selectedFiles}
        isBulkDeleting={isBulkDeleting}
        bulkDeleteProgress={bulkDeleteProgress}
        handleConfirmBulkDelete={handleConfirmBulkDelete}
        itemToRename={itemToRename}
        setItemToRename={setItemToRename}
        handleConfirmRename={handleConfirmRename}
        itemsToMove={itemsToMove}
        setItemsToMove={setItemsToMove}
        handleConfirmMove={handleConfirmMove}
      />
    </div>
  );
};

export default GenieDrivePage;