import React from 'react';
import { 
  ChevronRight, Grid, List, SlidersHorizontal, Search, 
  ArrowUp, ArrowDown, SortAsc,
  FileText as FileIcon, // Renamed to avoid conflict with File type
  Image as ImageIcon,
  Film as VideoIcon,
  Music as AudioIcon,
  Archive as ArchiveIcon,
  FileCode as CodeIcon,
  Folder as FolderIcon, // For filtering by folder type
  Star as StarIcon, // For starred filter
  MessageSquare, // For AI Assistant link
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
// import { GenieDriveViewState } from '../../types/geniedrive'; // Replaced by GenieDrivePageState
import { GenieDrivePageState, SortByOptions } from '../../pages/GenieDrivePage'; // Import the new state type
import { AIDriveFile } from '../../services/drive/aiDriveService'; // For path items
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../ui/DropdownMenu';
import { KnowledgeBaseCreateButton } from '../knowledge/KnowledgeBaseCreateButton'; // Import the KB button
// import { Badge } from '../ui/Badge'; // Badge was unused

interface GenieDriveHeaderProps {
  viewState: GenieDrivePageState; // Use the new state type
  onViewStateChange: (newState: GenieDrivePageState) => void; // Use the new state type
  onUploadClick: () => void;
  onCreateFolderClick?: () => void;
  // Add new props for other actions if needed, similar to KnowledgeBaseCreateButtonProps
  onCreateDocument?: () => void; 
  onCreateNote?: () => void;
  onLinkToKnowledgeBase?: () => void;
  path: AIDriveFile[]; // For breadcrumbs, using AIDriveFile
  onNavigatePath: (folderId: string | null) => void; // For breadcrumb navigation
}

export function GenieDriveHeader({
  viewState,
  onViewStateChange,
  onUploadClick,
  onCreateFolderClick,
  onLinkToKnowledgeBase,
  path,
  onNavigatePath
}: GenieDriveHeaderProps) {
  const navigate = useNavigate();
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    onViewStateChange({
      ...viewState,
      searchTerm
    });
  };

  const handleViewModeChange = (mode: 'grid' | 'list' | 'compact') => {
    onViewStateChange({
      ...viewState,
      viewMode: mode
    });
  };

  const handleSortChange = (field: SortByOptions, direction: 'asc' | 'desc') => {
    onViewStateChange({
      ...viewState,
      sortOptions: {
        field,
        direction
      }
    });
  };

  const handleMimeTypeFilterChange = (mimeType: string) => {
    const currentMimeTypes = viewState.filterOptions.mime_types || [];
    const newMimeTypes = currentMimeTypes.includes(mimeType)
      ? currentMimeTypes.filter((mt: string) => mt !== mimeType)
      : [...currentMimeTypes, mimeType];
    
    onViewStateChange({
      ...viewState,
      filterOptions: {
        ...viewState.filterOptions,
        mime_types: newMimeTypes.length > 0 ? newMimeTypes : undefined
      }
    });
  };

  const toggleStarredFilter = () => {
    onViewStateChange({
      ...viewState,
      filterOptions: {
        ...viewState.filterOptions,
        is_starred: !viewState.filterOptions.is_starred
      }
    });
  };

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      <button
        key="root"
        className="text-blue-600 hover:underline"
        onClick={() => onNavigatePath(null)} // Use onNavigatePath
      >
        My Drive
      </button>
    ];
    
    path.forEach((folder, index) => {
      breadcrumbs.push(
        <ChevronRight key={`sep-${folder.id || index}`} className="h-4 w-4 text-gray-400 mx-1" />
      );
      breadcrumbs.push(
        <button
          key={folder.id || `folder-${index}`}
          className={`hover:underline ${index === path.length - 1 ? 'text-gray-700 font-medium' : 'text-blue-600'}`}
          onClick={() => onNavigatePath(folder.id!)} // Use onNavigatePath, ensure id exists
        >
          {folder.name}
        </button>
      );
    });
    
    return breadcrumbs;
  };

  const sortOptionsMap = {
    name: 'Name',
    created_at: 'Date Created',
    updated_at: 'Date Modified',
    size: 'Size'
  };

  const currentSortLabel = `${sortOptionsMap[viewState.sortOptions.field]} (${viewState.sortOptions.direction === 'asc' ? 'Asc' : 'Desc'})`;

  const mimeTypeFilters = [
    { label: 'Documents', mime: 'application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: FileIcon },
    { label: 'Images', mime: 'image/', icon: ImageIcon },
    { label: 'Videos', mime: 'video/', icon: VideoIcon },
    { label: 'Audio', mime: 'audio/', icon: AudioIcon },
    { label: 'Archives', mime: 'application/zip,application/x-rar-compressed', icon: ArchiveIcon },
    { label: 'Code', mime: 'text/javascript,text/html,text/css,application/json', icon: CodeIcon },
    { label: 'Folders', mime: 'application/x-directory', icon: FolderIcon },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 sticky top-0 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-sm">
          {renderBreadcrumbs()}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/knowledge-base')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:border-primary/40 transition-colors"
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Knowledge Base</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/ai-assistant')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">AI Chat</span>
          </Button>
          
          {/* Replace GenieDriveCreateButton with KnowledgeBaseCreateButton */}
          <KnowledgeBaseCreateButton 
            onUploadFiles={onUploadClick} 
            onCreateFolder={onCreateFolderClick || (() => {})}
            // Pass other handlers if you add them to props
            // onCreateDocument={props.onCreateDocument} 
            // onCreateNote={props.onCreateNote}
            // onAssignToAssistant={() => {}} // Or implement if needed for Drive
            // onAIProcess={() => {}} // Or implement if needed for Drive
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Search files & folders..."
            className="pl-10 pr-4 py-2.5 text-sm w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            value={viewState.searchTerm || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="shimmer-glass" size="sm" className="h-9 px-3 rounded-lg shimmer-button-energy">
                <SortAsc className="h-4 w-4 mr-2" /> 
                <span className="text-sm hidden sm:inline">{currentSortLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {Object.entries(sortOptionsMap).map(([fieldString, label]) => (
                <React.Fragment key={fieldString}>
                  <DropdownMenuItem onClick={() => handleSortChange(fieldString as GenieDrivePageState['sortOptions']['field'], 'asc')}>
                    <ArrowUp className="h-4 w-4 mr-2" /> {label} (Asc)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange(fieldString as GenieDrivePageState['sortOptions']['field'], 'desc')}>
                    <ArrowDown className="h-4 w-4 mr-2" /> {label} (Desc)
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="border rounded-md flex dark:border-gray-600">
            <Button
              variant={viewState.viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('grid')}
              className="h-8 w-8 rounded-r-none"
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewState.viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('list')}
              className="h-8 w-8 rounded-l-none border-l-0 dark:border-l dark:border-gray-600"
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Filter options">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={viewState.filterOptions.is_starred}
                onCheckedChange={toggleStarredFilter}
              >
                <StarIcon className={`h-4 w-4 mr-2 ${viewState.filterOptions.is_starred ? 'text-yellow-500' : ''}`} /> Starred
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {mimeTypeFilters.map(filter => (
                <DropdownMenuCheckboxItem
                  key={filter.label}
                  checked={(viewState.filterOptions.mime_types || []).some(
                    (mt: string) => filter.mime.split(',').includes(mt) || mt.startsWith(filter.mime)
                  )}
                  onCheckedChange={() => handleMimeTypeFilterChange(filter.mime)}
                >
                  <filter.icon className="h-4 w-4 mr-2" /> {filter.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}