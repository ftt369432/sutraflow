import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from 'sonner';
import {
  FolderIcon,
  FileIcon,
  UsersIcon,
  StarIcon,
  ArrowUpDownIcon,
  PlusCircleIcon,
  UploadCloudIcon,
  AlertTriangle as AlertTriangleIcon,
} from 'lucide-react';
import { GenieDriveFileActionsMenu } from './GenieDriveFileActionsMenu';
import { GenieDriveUploadModal } from './GenieDriveUploadModal';
import { AIDriveFile, AIDriveUser } from '@/services/drive/aiDriveService'; 
import { 
    GenieDrivePageState,
    SortByOptions,      
    SortDirectionOptions 
} from '@/pages/GenieDrivePage';

interface GenieDriveFileListProps {
  items: AIDriveFile[];
  viewState: GenieDrivePageState;
  onViewStateChange: (updater: Partial<GenieDrivePageState> | ((prevState: GenieDrivePageState) => GenieDrivePageState)) => void;
  onItemClick: (item: AIDriveFile) => void;
  onItemOpen: (item: AIDriveFile) => void;
  onToggleStar: (item: AIDriveFile) => void;
  onRenameItem: (item: AIDriveFile, newName: string) => void; 
  onDeleteItem: (item: AIDriveFile) => void;
  onMoveItem: (item: AIDriveFile) => void;
  onCopyItem: (item: AIDriveFile) => void;
  onDownloadItem: (item: AIDriveFile) => void;
  onShareItem: (item: AIDriveFile, sharedWith: AIDriveUser[]) => void;
  onLinkFolderRequest?: (item: AIDriveFile) => void;
  selectedItems: Set<string>; 
  isLoading?: boolean;
  error?: string | null; 
  onCreateFolderRequest: () => void;
  aiDriveService: any; 
  userId: string;
}

const GenieDriveFileList: React.FC<GenieDriveFileListProps> = ({
  items, 
  viewState,
  onViewStateChange,
  onItemClick,
  onItemOpen,
  onToggleStar,
  onRenameItem,
  onDeleteItem,
  onMoveItem,
  onCopyItem,
  onDownloadItem,
  onShareItem,
  onLinkFolderRequest,
  selectedItems, 
  isLoading,
  error,
  onCreateFolderRequest,
  aiDriveService,
  userId,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleSort = useCallback((field: SortByOptions) => { 
    const newDirection: SortDirectionOptions =
      viewState.sortOptions.field === field && viewState.sortOptions.direction === 'asc'
        ? 'desc'
        : 'asc';
    onViewStateChange({ sortOptions: { field, direction: newDirection } });
  }, [viewState.sortOptions, onViewStateChange]);

  const filteredAndSortedItems = useMemo(() => {
    let processedItems = [...items];

    if (viewState.sortOptions.field) {
      processedItems.sort((a, b) => {
        // Always keep folders at the top regardless of sort direction
        if (a.is_folder && !b.is_folder) return -1;
        if (!a.is_folder && b.is_folder) return 1;

        const field = viewState.sortOptions.field;
        const direction = viewState.sortOptions.direction === 'asc' ? 1 : -1;

        let valA = a[field as keyof AIDriveFile];
        let valB = b[field as keyof AIDriveFile];
        
        if (field === 'name') { 
            valA = String(a.name).toLowerCase();
            valB = String(b.name).toLowerCase();
        } else if (field === 'updated_at' || field === 'created_at') { 
            valA = new Date(a[field as 'created_at' | 'updated_at']!).getTime();
            valB = new Date(b[field as 'created_at' | 'updated_at']!).getTime();
        } else if (field === 'size') { // Corrected to 'size'
            valA = a.size ?? 0;
            valB = b.size ?? 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * direction;
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * direction;
        }
        return String(valA).localeCompare(String(valB)) * direction;
      });
    }
    return processedItems;
  }, [items, viewState.sortOptions]);

  const handleSelectAll = useCallback(() => {
    const currentAllIds = filteredAndSortedItems.map(item => item.id);
    const allSelected = currentAllIds.length > 0 && currentAllIds.every(id => selectedItems.has(id));

    const newSelectedItemsSet = new Set(selectedItems);
    if (allSelected) {
      currentAllIds.forEach(id => newSelectedItemsSet.delete(id));
    } else {
      currentAllIds.forEach(id => newSelectedItemsSet.add(id));
    }
    onViewStateChange(prev => ({ ...prev, selectedItems: Array.from(newSelectedItemsSet) }));
  }, [filteredAndSortedItems, selectedItems, onViewStateChange]);

  const handleItemSelect = useCallback((itemId: string, isSelected: boolean) => {
    const newSelectedItemsSet = new Set(selectedItems);
    if (isSelected) {
      newSelectedItemsSet.add(itemId);
    } else {
      newSelectedItemsSet.delete(itemId);
    }
    onViewStateChange(prev => ({ ...prev, selectedItems: Array.from(newSelectedItemsSet) }));
  }, [selectedItems, onViewStateChange]);
  
  const getFileIcon = (file: AIDriveFile) => {
    if (file.is_folder) return <FolderIcon className="mr-2 h-5 w-5 text-blue-500" />;
    return <FileIcon className="mr-2 h-5 w-5 text-gray-500" />;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertTriangleIcon className="h-12 w-12 mb-4" />
        <p className="text-xl">Error loading files: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 h-full flex flex-col">
      {showUploadModal && (
        <GenieDriveUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { 
            toast.success(`File(s) scheduled for upload!`);
            setShowUploadModal(false);
          }}
          currentFolder={viewState.currentFolderId} 
          aiDriveService={aiDriveService}
          userId={userId}
        />
      )}

      {viewState.viewMode === 'list' ? (
        <div className="overflow-auto flex-grow">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:border-b">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={filteredAndSortedItems.length > 0 && selectedItems.size === filteredAndSortedItems.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all files"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted/50">
                  Name <ArrowUpDownIcon className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead onClick={() => handleSort('size')} className="cursor-pointer hover:bg-muted/50">
                  Size <ArrowUpDownIcon className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => handleSort('updated_at')} className="cursor-pointer hover:bg-muted/50">
                  Last Modified <ArrowUpDownIcon className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>Shared</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedItems.map((item) => (
                <TableRow 
                    key={item.id} 
                    onClick={() => item.is_folder ? onItemOpen(item) : onItemClick(item)}
                    onDoubleClick={() => onItemOpen(item)}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedItems.has(item.id) ? 'bg-muted' : ''}`}
                    data-testid={`file-row-${item.id}`}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                      aria-label={`Select file ${item.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium flex items-center">
                    {getFileIcon(item)}
                    <span className="ml-2 truncate" title={item.name}>{item.name}</span>
                    {item.ai_enabled && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-bold uppercase tracking-wider flex-shrink-0" title="AI Memory Enabled">
                        AI
                      </span>
                    )}
                    {item.is_starred && <StarIcon className="ml-2 h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                  </TableCell>
                  <TableCell>{item.is_folder ? 'Folder' : item.mime_type || 'File'}</TableCell>
                  <TableCell>{item.size ? `${(item.size / 1024).toFixed(2)} KB` : (item.is_folder ? '--' : '0 KB')}</TableCell>
                  <TableCell>{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {item.shared_with && item.shared_with.length > 0 ? (
                      <UsersIcon className="h-5 w-5 text-blue-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <GenieDriveFileActionsMenu
                      item={item}
                      onRenameRequest={() => {
                        const newName = prompt('Enter new name:', item.name);
                        if (newName) onRenameItem(item, newName);
                      }}
                      onDeleteRequest={() => onDeleteItem(item)}
                      onMoveRequest={() => onMoveItem(item)}
                      onCopyRequest={() => onCopyItem(item)}
                      onShareRequest={() => {
                        const email = prompt('Share with (email):');
                        if (email) onShareItem(item, [{ id: email } as AIDriveUser]); 
                      }}
                      onDownloadRequest={!item.is_folder ? () => onDownloadItem(item) : undefined}
                      onLinkToKnowledgeBaseRequest={item.is_folder && onLinkFolderRequest ? () => onLinkFolderRequest(item) : undefined}
                      onToggleStarRequest={() => onToggleStar(item)}
                      isStarred={!!item.is_starred}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : ( 
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-auto flex-grow">
          {filteredAndSortedItems.map((item) => (
            <div 
                key={item.id} 
                className={`border rounded-lg p-3 flex flex-col items-center justify-center space-y-2 hover:shadow-md cursor-pointer relative group ${selectedItems.has(item.id) ? 'ring-2 ring-primary shadow-lg' : ''}`}
                onClick={() => onItemClick(item)}
                onDoubleClick={() => onItemOpen(item)}
                data-testid={`file-grid-item-${item.id}`}
            >
              <div onClick={(e) => e.stopPropagation()} className="absolute top-2 left-2 z-10">
                <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                    aria-label={`Select file ${item.name}`}
                />
              </div>
              <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                 <GenieDriveFileActionsMenu
                    item={item}
                    onRenameRequest={() => {
                        const newName = prompt('Enter new name:', item.name);
                        if (newName) onRenameItem(item, newName);
                      }}
                    onDeleteRequest={() => onDeleteItem(item)}
                    onMoveRequest={() => onMoveItem(item)}
                    onCopyRequest={() => onCopyItem(item)}
                     onShareRequest={() => {
                        const email = prompt('Share with (email):');
                        if (email) onShareItem(item, [{ id: email } as AIDriveUser]);
                    }}
                    onDownloadRequest={!item.is_folder ? () => onDownloadItem(item) : undefined}
                    onLinkToKnowledgeBaseRequest={item.is_folder && onLinkFolderRequest ? () => onLinkFolderRequest(item) : undefined}
                    onToggleStarRequest={() => onToggleStar(item)}
                    isStarred={!!item.is_starred}
                />
              </div>
              <div className="flex flex-col items-center justify-center pt-6 text-center">
                {getFileIcon(item)}
                <span className="text-sm font-medium truncate w-full mt-2" title={item.name}>{item.name}</span>
                <div className="flex items-center gap-1 mt-1">
                  {item.ai_enabled && (
                    <span className="px-1 text-[9px] bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold uppercase" title="AI Memory Enabled">
                      AI
                    </span>
                  )}
                  {item.is_starred && <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.size ? `${(item.size / 1024).toFixed(2)} KB` : (item.is_folder ? 'Folder' : '0 KB')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredAndSortedItems.length === 0 && !isLoading && (
        <div className="text-center py-10 text-muted-foreground flex-grow flex flex-col justify-center items-center">
          <FolderIcon size={48} className="mb-4 text-gray-400" />
          <p className="text-lg">This folder is empty.</p>
          <div className="mt-4 space-x-2">
            <Button onClick={() => setShowUploadModal(true)} variant="default">
                <UploadCloudIcon className="mr-2 h-4 w-4" /> Upload Files
            </Button>
            <Button onClick={onCreateFolderRequest} variant="outline">
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Create Folder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenieDriveFileList;