import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreHorizontal, Trash2 } from 'lucide-react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIFolder } from '../../types/ai';
import { useDrop } from 'react-dnd';
import { useSelection } from './EnhancedSelectionContext';
import { FolderActions } from './FolderActions';
import { Button } from '../ui/Button';

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

interface FolderItemProps {
  folder: AIFolder;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  folders: AIFolder[];
  documents: any[];
  onContextMenu: (e: React.MouseEvent, folder: AIFolder) => void;
  selectMode: boolean;
  isSelectedForAction: boolean;
  onToggleSelection: (folderId: string) => void;
}

function FolderItem({ 
  folder, 
  level, 
  selectedFolderId, 
  onSelectFolder, 
  expandedFolders, 
  toggleFolder, 
  folders, 
  documents,
  onContextMenu,
  selectMode,
  isSelectedForAction,
  onToggleSelection,
}: FolderItemProps) {
  const { moveDocument, moveBatchDocuments, setFilesToUpload, setUploaderOpen, setSelectedFolderId } = useKnowledgeBaseStore();
  const { selectedDocuments, clearSelection } = useSelection();

  // Handle native file drops from computer
  const handleNativeFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      console.log(`📁 Dropped ${files.length} files directly into folder: ${folder.name}`);
      setSelectedFolderId(folder.id); // Set target folder
      setFilesToUpload(files); // Set files
      setUploaderOpen(true); // Open uploader
    }
  };

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const [{ isOver: isOverFolder }, dropRef] = useDrop(() => ({
    accept: 'DOCUMENT',
    drop: (item: { id: string, type: 'DOCUMENT', selected: boolean }) => {
      console.log('🎯 DROP EVENT:', { 
        itemId: item.id, 
        folderId: folder.id, 
        folderName: folder.name,
        isMultiSelect: item.selected && selectedDocuments.size > 1,
        selectedCount: selectedDocuments.size 
      });
      
      if (item.selected && selectedDocuments.size > 1) {
        console.log('📦 Batch move:', Array.from(selectedDocuments), '→ folder:', folder.name);
        moveBatchDocuments(Array.from(selectedDocuments), folder.id);
        clearSelection();
      } else {
        console.log('📄 Single move:', item.id, '→ folder:', folder.name);
        moveDocument(item.id, folder.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [folder.id, folder.name, selectedDocuments, moveBatchDocuments, moveDocument, clearSelection]);

  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const childFolders = folders.filter(f => f.parentId === folder.id); // Changed to use parentId
  const documentCount = documents.filter(d => d.folderId === folder.id).length;

  return (
    <div key={folder.id}>
      <div
        ref={dropRef}
        onDrop={handleNativeFileDrop}
        onDragOver={handleNativeDragOver}
        className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-50 rounded-md ${
          isSelected ? 'bg-blue-50' : ''
        } ${isOverFolder ? 'bg-blue-100' : ''}`}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => onSelectFolder(folder.id)}
        onContextMenu={(e) => onContextMenu(e, folder)}
      >
        {selectMode && (
          <input
            type="checkbox"
            checked={isSelectedForAction}
            onChange={() => onToggleSelection(folder.id)}
            onClick={(e) => e.stopPropagation()}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        )}
        <button
          className="p-1 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            toggleFolder(folder.id);
          }}
        >
          {childFolders.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : <span className="w-4"></span>}
        </button>
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-blue-500 ml-1" />
        ) : (
          <Folder className="h-4 w-4 text-blue-500 ml-1" />
        )}
        <span className="ml-2 text-sm truncate">{folder.name}</span>
        <span className="ml-auto text-xs text-gray-500 pr-2">{documentCount}</span>
      </div>
      {isExpanded && childFolders.map(child => 
        <FolderItem
          key={child.id}
          folder={child}
          level={level + 1}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          folders={folders}
          documents={documents}
          onContextMenu={onContextMenu}
          selectMode={selectMode}
          isSelectedForAction={isSelectedForAction}
          onToggleSelection={onToggleSelection}
        />
      )}
    </div>
  );
}

export function FolderTree({ selectedFolderId, onSelectFolder, onRenameFolder, onDeleteFolder }: FolderTreeProps) {
  const { folders, documents, moveDocument, moveBatchDocuments } = useKnowledgeBaseStore();
  const { selectedDocuments, clearSelection } = useSelection();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, folder: AIFolder } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedFoldersForDelete, setSelectedFoldersForDelete] = useState<Set<string>>(new Set());

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'DOCUMENT',
    drop: (item: { id: string, type: 'DOCUMENT', selected: boolean }, monitor) => {
      if (!monitor.didDrop()) {
        if (item.selected && selectedDocuments.size > 1) {
          moveBatchDocuments(Array.from(selectedDocuments), undefined);
          clearSelection();
        } else {
          moveDocument(item.id, undefined);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }));

  const handleContextMenu = (e: React.MouseEvent, folder: AIFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, folder });
  };
  
  const closeContextMenu = () => setContextMenu(null);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  
  const handleToggleSelection = (folderId: string) => {
    const newSelection = new Set(selectedFoldersForDelete);
    if (newSelection.has(folderId)) {
      newSelection.delete(folderId);
    } else {
      newSelection.add(folderId);
    }
    setSelectedFoldersForDelete(newSelection);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedFoldersForDelete.size} selected folders?`)) {
      selectedFoldersForDelete.forEach(onDeleteFolder);
      setSelectedFoldersForDelete(new Set());
      setSelectMode(false);
    }
  };


  return (
    <div 
      className="relative h-full overflow-y-auto" 
      onClick={closeContextMenu} 
      onContextMenu={closeContextMenu}
    >
        <div className="p-2 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
        {!selectMode ? (
          <Button variant="assistant" size="sm" className="w-full justify-start" onClick={() => setSelectMode(true)}>
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Select Folders
          </Button>
        ) : (
          <div className="flex items-center justify-between">
            <Button variant="assistant" size="sm" onClick={() => {
              setSelectMode(false);
              setSelectedFoldersForDelete(new Set());
            }}>
              Cancel
            </Button>
            <Button
              variant="assistant-secondary"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedFoldersForDelete.size === 0}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedFoldersForDelete.size})
            </Button>
          </div>
        )}
      </div>

      <div 
        ref={drop}
        className={`p-2 ${isOver ? 'bg-blue-50' : ''}`}
      >
        <div
          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md ${
            selectedFolderId === null ? 'bg-blue-50' : ''
          }`}
          onClick={() => onSelectFolder(null)}
        >
          {selectMode && <div className="w-4 mr-2 h-4"></div>}
          <Folder className="h-4 w-4 text-blue-500" />
          <span className="ml-2 text-sm font-medium">All Documents</span>
          <span className="ml-auto text-xs text-gray-500">
            {documents.filter(d => !d.folderId).length}
          </span>
        </div>
        {folders
          .filter(f => !f.parentId)
          .map(folder => 
            <FolderItem
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              folders={folders}
              documents={documents}
              onContextMenu={handleContextMenu}
              selectMode={selectMode}
              isSelectedForAction={selectedFoldersForDelete.has(folder.id)}
              onToggleSelection={handleToggleSelection}
            />
          )}
      </div>
      {contextMenu && !selectMode && (
        <FolderActions
          folder={contextMenu.folder}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={closeContextMenu}
          onRename={onRenameFolder}
          onDelete={onDeleteFolder}
        />
      )}
    </div>
  );
}