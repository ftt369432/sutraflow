import React from 'react';
import { 
  FolderOpen, Star, Share, Clock, Trash, Cloud, 
  Image as ImageIcon, 
  FileText, FileArchive, 
  Film, Music, Code as CodeIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { AIDriveService, AIDriveFile, FileSearchOptions } from '../../services/drive/aiDriveService';
import { GenieDrivePageState } from '../../pages/GenieDrivePage';

interface GenieDriveSidebarProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  viewState: GenieDrivePageState;
  onViewStateChange: (updater: Partial<GenieDrivePageState> | ((prevState: GenieDrivePageState) => GenieDrivePageState)) => void;
  aiDriveService: AIDriveService | null;
  userId: string | undefined;
  isLoading?: boolean;
  onToggleStar?: (item: AIDriveFile) => void;
}

// Define common MIME type groups for categories
const MIME_TYPE_GROUPS = {
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.oasis.opendocument.text'],
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac'],
  CODE: ['text/javascript', 'text/html', 'text/css', 'application/json', 'text/x-python', 'application/x-javascript'],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip'],
};


export function GenieDriveSidebar({ 
  currentFolderId, 
  onFolderSelect,
  viewState,
  onViewStateChange,
  aiDriveService,
  userId,
  isLoading
}: GenieDriveSidebarProps) {

  const handleCategoryFilter = (mimeTypesToFilter: string[] | undefined) => {
    const currentMimeTypes = viewState?.filterOptions?.mime_types || [];
    let newMimeTypes: string[] | undefined;

    if (mimeTypesToFilter === undefined) {
      newMimeTypes = undefined; 
    } else if (
      currentMimeTypes.length === mimeTypesToFilter.length &&
      currentMimeTypes.every((mime: string) => mimeTypesToFilter.includes(mime))
    ) {
      newMimeTypes = undefined; 
    } else {
      newMimeTypes = mimeTypesToFilter; 
    }
    onViewStateChange(prev => ({ 
      ...prev, 
      filterOptions: { 
        ...prev.filterOptions, 
        mime_types: newMimeTypes 
      } 
    }));
  };

  const isCategoryActive = (mimeTypesToCheck: string[]): boolean => {
    const currentMimeTypes = viewState?.filterOptions?.mime_types || [];
    if (currentMimeTypes.length === 0 && mimeTypesToCheck.length === 0) return true; 
    if (currentMimeTypes.length !== mimeTypesToCheck.length) return false;
    return currentMimeTypes.every((mime: string) => mimeTypesToCheck.includes(mime));
  };

  // Navigation item component
  const NavItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isActive = false,
  }: { 
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button 
      className={cn(
        "flex items-center w-full px-2 py-2 rounded-md text-left text-sm transition-colors duration-150 ease-in-out",
        isActive 
          ? "bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-100 font-medium" 
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-4 w-4 mr-3 flex-shrink-0", isActive ? "text-blue-600 dark:text-blue-300" : "text-gray-500 dark:text-gray-400")} />
      <span className="flex-grow">{label}</span>
    </button>
  );

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-3 overflow-auto h-full flex flex-col space-y-4">
      {/* Main locations */}
      <div className="space-y-1">        <NavItem
          icon={FolderOpen}
          label="My Drive"
          onClick={() => {
            onFolderSelect(null);
            handleCategoryFilter(undefined); 
          }}
          isActive={currentFolderId === null && (!viewState?.filterOptions?.mime_types || viewState.filterOptions.mime_types.length === 0)}
        />
        {/* Placeholder NavItems - functionality to be implemented later */}
        <NavItem 
          icon={Star} 
          label="Starred" 
          onClick={() => {
            onViewStateChange(prev => ({ 
              ...prev, 
              filterOptions: { 
                ...prev.filterOptions, 
                is_starred: !(prev.filterOptions?.is_starred) 
              } 
            }));
            onFolderSelect(null); // Optionally reset folder view or keep current
          }} 
          isActive={!!viewState?.filterOptions?.is_starred}
        />
        <NavItem icon={Share} label="Shared with me" onClick={() => { /* TODO: Implement shared files view */ }} />
        <NavItem icon={Clock} label="Recent" onClick={() => { /* TODO: Implement recent files view */ }} />
        <NavItem icon={Trash} label="Trash" onClick={() => { /* TODO: Implement trash view */ }} />
      </div>
      
      {/* Categories */}
      <div>
        <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
          Categories
        </div>
        <div className="space-y-1">
          <NavItem
            icon={FileText}
            label="Documents"
            onClick={() => handleCategoryFilter(MIME_TYPE_GROUPS.DOCUMENTS)}
            isActive={isCategoryActive(MIME_TYPE_GROUPS.DOCUMENTS)}
          />
          <NavItem
            icon={ImageIcon}
            label="Images"
            onClick={() => handleCategoryFilter(MIME_TYPE_GROUPS.IMAGES)}
            isActive={isCategoryActive(MIME_TYPE_GROUPS.IMAGES)}
          />
          <NavItem
            icon={Film} 
            label="Videos"
            onClick={() => handleCategoryFilter(MIME_TYPE_GROUPS.VIDEOS)}
            isActive={isCategoryActive(MIME_TYPE_GROUPS.VIDEOS)}
          />
          <NavItem
            icon={Music} 
            label="Audio"
            onClick={() => handleCategoryFilter(MIME_TYPE_GROUPS.AUDIO)}
            isActive={isCategoryActive(MIME_TYPE_GROUPS.AUDIO)}
          />
          <NavItem
            icon={CodeIcon} 
            label="Code"
            onClick={() => handleCategoryFilter(MIME_TYPE_GROUPS.CODE)}
            isActive={isCategoryActive(MIME_TYPE_GROUPS.CODE)}
          />
           <NavItem
            icon={FileArchive}
            label="Archives"
            onClick={() => handleCategoryFilter(MIME_TYPE_GROUPS.ARCHIVES)}
            isActive={isCategoryActive(MIME_TYPE_GROUPS.ARCHIVES)}
          />
        </div>
      </div>
      
      {/* Storage section - simplified */}
      <div className="mt-auto pt-2">
        <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
          Storage
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 text-center">
          <Cloud className="h-5 w-5 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Managed by provider
          </p>
        </div>
      </div>
    </div>
  );
}