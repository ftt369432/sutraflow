import React from 'react';
import { AIDriveFile, AIDriveService } from '../../services/drive/aiDriveService';
import { GenieDriveUploadModal } from './GenieDriveUploadModal';
import { GenieDriveCreateFolderModal } from './GenieDriveCreateFolderModal';
import { GenieDriveLinkToKnowledgeBaseModal } from './GenieDriveLinkToKnowledgeBaseModal';
import { GenieDriveDeleteModal } from './GenieDriveDeleteModal';
import { GenieDriveBulkDeleteModal } from './GenieDriveBulkDeleteModal';
import { GenieDriveRenameModal } from './GenieDriveRenameModal';
import { GenieDriveMoveModal } from './GenieDriveMoveModal';

interface GenieDriveModalsProps {
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  currentFolderId: string | null;
  aiDriveService: AIDriveService | null;
  userId: string;
  refreshItems: () => void;
  isCreateFolderModalOpen: boolean;
  setIsCreateFolderModalOpen: (open: boolean) => void;
  handleCreateFolder: (name: string) => Promise<any>;
  isLinkToKnowledgeBaseModalOpen: boolean;
  setIsLinkToKnowledgeBaseModalOpen: (open: boolean) => void;
  items: AIDriveFile[];
  selectedItemIds: string[];
  itemToDelete: AIDriveFile | null;
  setItemToDelete: (item: AIDriveFile | null) => void;
  handleConfirmDelete: () => Promise<void>;
  isBulkDeleteModalOpen: boolean;
  setIsBulkDeleteModalOpen: (open: boolean) => void;
  selectedFiles: AIDriveFile[];
  isBulkDeleting: boolean;
  bulkDeleteProgress: { completed: number; total: number } | null;
  handleConfirmBulkDelete: () => Promise<void>;
  itemToRename: AIDriveFile | null;
  setItemToRename: (item: AIDriveFile | null) => void;
  handleConfirmRename: (newName: string) => Promise<void>;
  itemsToMove: AIDriveFile[];
  setItemsToMove: (items: AIDriveFile[]) => void;
  handleConfirmMove: (targetFolderId: string | null) => Promise<void>;
}

export const GenieDriveModals: React.FC<GenieDriveModalsProps> = ({
  isUploadModalOpen,
  setIsUploadModalOpen,
  currentFolderId,
  aiDriveService,
  userId,
  refreshItems,
  isCreateFolderModalOpen,
  setIsCreateFolderModalOpen,
  handleCreateFolder,
  isLinkToKnowledgeBaseModalOpen,
  setIsLinkToKnowledgeBaseModalOpen,
  items,
  selectedItemIds,
  itemToDelete,
  setItemToDelete,
  handleConfirmDelete,
  isBulkDeleteModalOpen,
  setIsBulkDeleteModalOpen,
  selectedFiles,
  isBulkDeleting,
  bulkDeleteProgress,
  handleConfirmBulkDelete,
  itemToRename,
  setItemToRename,
  handleConfirmRename,
  itemsToMove,
  setItemsToMove,
  handleConfirmMove
}) => {
  return (
    <>
      {/* Upload Modal */}
      {isUploadModalOpen && aiDriveService && userId && (
        <GenieDriveUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          currentFolder={currentFolderId}
          aiDriveService={aiDriveService}
          userId={userId}
          onSuccess={refreshItems}
        />
      )}

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <GenieDriveCreateFolderModal
          isOpen={isCreateFolderModalOpen}
          onClose={() => setIsCreateFolderModalOpen(false)}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* Link to Knowledge Base Modal */}
      {isLinkToKnowledgeBaseModalOpen && (
        <GenieDriveLinkToKnowledgeBaseModal
          isOpen={isLinkToKnowledgeBaseModalOpen}
          onClose={() => setIsLinkToKnowledgeBaseModalOpen(false)}
          selectedFiles={items.filter((item) => selectedItemIds.includes(item.id) && !item.is_folder)}
          selectedFolders={items.filter((item) => selectedItemIds.includes(item.id) && item.is_folder)}
        />
      )}

      {/* Single Item Delete Modal */}
      {itemToDelete && (
        <GenieDriveDeleteModal
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          onConfirmDelete={handleConfirmDelete}
          item={itemToDelete}
        />
      )}

      {/* Bulk Delete Modal */}
      <GenieDriveBulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmBulkDelete}
        items={selectedFiles}
        isDeleting={isBulkDeleting}
        progress={bulkDeleteProgress}
      />

      {/* Rename Modal */}
      {itemToRename && (
        <GenieDriveRenameModal
          isOpen={Boolean(itemToRename)}
          item={itemToRename}
          onClose={() => setItemToRename(null)}
          onRename={handleConfirmRename}
        />
      )}

      {/* Move Modal */}
      {itemsToMove.length > 0 && aiDriveService && userId && (
        <GenieDriveMoveModal
          isOpen={itemsToMove.length > 0}
          items={itemsToMove}
          aiDriveService={aiDriveService}
          userId={userId}
          onClose={() => setItemsToMove([])}
          onMove={handleConfirmMove}
        />
      )}
    </>
  );
};
