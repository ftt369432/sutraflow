import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { ResizablePanelGroup, ResizablePanel } from '../ui/ResizablePanel';
import { GenieDriveSidebar } from './GenieDriveSidebar';
import GenieDriveFileList from './GenieDriveFileList';
import { GenieDrivePreview } from './GenieDrivePreview';
import { AIDriveFile, AIDriveService } from '../../services/drive/aiDriveService';
import { GenieDrivePageState } from '../../pages/GenieDrivePage';
import { cn } from '../../lib/utils';

interface GenieDriveBrowsePanelsProps {
  viewState: GenieDrivePageState;
  handleViewStateChange: (newState: Partial<GenieDrivePageState>) => void;
  handleFolderSelect: (folderId: string | null) => void;
  handleToggleStar: (item: AIDriveFile) => void;
  isLoading: boolean;
  aiDriveService: AIDriveService | null;
  userId: string;
  items: AIDriveFile[];
  handleItemClick: (item: AIDriveFile, event: React.MouseEvent) => void;
  handleItemOpen: (item: AIDriveFile) => void;
  handleRenameRequest: (item: AIDriveFile) => void;
  handleDeleteRequest: (item: AIDriveFile) => void;
  handleMoveRequest: (item: AIDriveFile) => void;
  handleCopyRequest: (item: AIDriveFile) => void;
  handleDownloadItem: (item: AIDriveFile) => void;
  handleShareItem: (item: AIDriveFile) => void;
  setIsCreateFolderModalOpen: (open: boolean) => void;
}

export const GenieDriveBrowsePanels: React.FC<GenieDriveBrowsePanelsProps> = ({
  viewState,
  handleViewStateChange,
  handleFolderSelect,
  handleToggleStar,
  isLoading,
  aiDriveService,
  userId,
  items,
  handleItemClick,
  handleItemOpen,
  handleRenameRequest,
  handleDeleteRequest,
  handleMoveRequest,
  handleCopyRequest,
  handleDownloadItem,
  handleShareItem,
  setIsCreateFolderModalOpen
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(true);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full relative">
      {/* Sidebar Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 z-50 h-8 w-4 rounded-l-none border border-l-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700',
          isSidebarCollapsed ? 'left-0' : 'left-[20%]'
        )}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </Button>

      <ResizablePanel
        defaultSize={20}
        minSize={isSidebarCollapsed ? 0 : 15}
        maxSize={isSidebarCollapsed ? 0 : 30}
        className={cn('transition-all duration-300', isSidebarCollapsed && 'opacity-0 pointer-events-none')}
      >
        <GenieDriveSidebar
          currentFolderId={viewState.currentFolderId}
          onFolderSelect={handleFolderSelect}
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          onToggleStar={handleToggleStar}
          isLoading={isLoading}
          aiDriveService={aiDriveService}
          userId={userId}
        />
      </ResizablePanel>

      <ResizablePanel defaultSize={isPreviewCollapsed ? 80 : 55} minSize={30}>
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

      {/* Preview Panel Toggle */}
      {viewState.currentItem && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-50 h-8 w-4 rounded-r-none border border-r-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700',
            isPreviewCollapsed ? 'right-0' : 'right-[25%]'
          )}
          onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
        >
          {isPreviewCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </Button>
      )}

      <ResizablePanel
        defaultSize={25}
        minSize={isPreviewCollapsed ? 0 : 20}
        maxSize={isPreviewCollapsed ? 0 : 35}
        className={cn('transition-all duration-300', isPreviewCollapsed && 'opacity-0 pointer-events-none')}
      >
        {viewState.currentItem && (
          <GenieDrivePreview
            item={viewState.currentItem}
            aiDriveService={aiDriveService}
            onClose={() => setIsPreviewCollapsed(true)}
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
