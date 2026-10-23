import React from 'react';
import { ResizablePanelGroup, ResizablePanel } from '../ui/ResizablePanel';
import GenieDriveFileList from './GenieDriveFileList';
import { GenieDriveDocumentTabs } from './GenieDriveDocumentTabs';
import { AIDriveFile, AIDriveService } from '../../services/drive/aiDriveService';
import { GenieDrivePageState } from '../../pages/GenieDrivePage';

interface GenieDriveEditPanelsProps {
  isDocumentPanelMaximized: boolean;
  setIsDocumentPanelMaximized: (maximized: boolean) => void;
  items: AIDriveFile[];
  viewState: GenieDrivePageState;
  handleViewStateChange: (newState: Partial<GenieDrivePageState>) => void;
  handleItemClick: (item: AIDriveFile, event: React.MouseEvent) => void;
  handleItemOpen: (item: AIDriveFile) => void;
  handleToggleStar: (item: AIDriveFile) => void;
  handleRenameRequest: (item: AIDriveFile) => void;
  handleDeleteRequest: (item: AIDriveFile) => void;
  handleMoveRequest: (item: AIDriveFile) => void;
  handleCopyRequest: (item: AIDriveFile) => void;
  handleDownloadItem: (item: AIDriveFile) => void;
  handleShareItem: (item: AIDriveFile) => void;
  setIsCreateFolderModalOpen: (open: boolean) => void;
  isLoading: boolean;
  aiDriveService: AIDriveService | null;
  userId: string;
  documentTabs: any;
}

export const GenieDriveEditPanels: React.FC<GenieDriveEditPanelsProps> = ({
  isDocumentPanelMaximized,
  setIsDocumentPanelMaximized,
  items,
  viewState,
  handleViewStateChange,
  handleItemClick,
  handleItemOpen,
  handleToggleStar,
  handleRenameRequest,
  handleDeleteRequest,
  handleMoveRequest,
  handleCopyRequest,
  handleDownloadItem,
  handleShareItem,
  setIsCreateFolderModalOpen,
  isLoading,
  aiDriveService,
  userId,
  documentTabs
}) => {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {!isDocumentPanelMaximized && (
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <GenieDriveFileList
            items={items}
            selectedItems={new Set(viewState.selectedItems)}
            onItemClick={handleItemClick}
            onItemOpen={handleItemOpen}
            onToggleStar={handleToggleStar}
            onRenameItem={handleRenameRequest}
            onDeleteItem={handleDeleteRequest}
            onMoveItem={handleMoveRequest}
            onCopyItem={handleCopyRequest}
            onDownloadItem={handleDownloadItem}
            onShareItem={handleShareItem}
            onCreateFolderRequest={() => setIsCreateFolderModalOpen(true)}
            viewState={viewState}
            onViewStateChange={handleViewStateChange}
            isLoading={isLoading}
            aiDriveService={aiDriveService}
            userId={userId}
          />
        </ResizablePanel>
      )}

      <ResizablePanel defaultSize={isDocumentPanelMaximized ? 100 : 75} minSize={60}>
        {aiDriveService && userId ? (
          <GenieDriveDocumentTabs
            aiDriveService={aiDriveService}
            userId={userId}
            openDocuments={documentTabs.openDocuments}
            activeDocumentId={documentTabs.activeDocumentId}
            onDocumentOpen={documentTabs.openDocument}
            onDocumentClose={documentTabs.closeDocument}
            onDocumentSave={documentTabs.saveDocument}
            onContentChange={documentTabs.updateDocumentContent}
            onActiveDocumentChange={documentTabs.setActiveDocumentId}
            isMaximized={isDocumentPanelMaximized}
            onToggleMaximize={() => setIsDocumentPanelMaximized(!isDocumentPanelMaximized)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-sm">Loading document editor...</p>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
