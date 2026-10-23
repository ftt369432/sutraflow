import React, { useState } from 'react';
import { Edit, Trash2, FolderOpen, Star, Download, Link2, Copy, Move, FileText, Bot, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import type { UnifiedDocument } from '../common/DocumentCard';
import { popOutDocument } from '../../utils/windowUtils';
import { ExternalLink } from 'lucide-react';

interface DocumentContextMenuProps {
  document: UnifiedDocument;
  isOpen: boolean;
  onClose: () => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  onMove?: (folderId: string) => void;
  onToggleStar?: () => void;
  onDuplicate?: () => void;
  onAssignToAssistant?: (assistantId: string) => void;
  onDownload?: () => void;
  onPreview?: () => void;
  position?: { x: number; y: number };
}

export function DocumentContextMenu({
  document,
  isOpen,
  onClose,
  onRename,
  onDelete,
  onMove,
  onToggleStar,
  onDuplicate,
  onAssignToAssistant,
  onDownload,
  onPreview,
  position = { x: 0, y: 0 }
}: DocumentContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(document.title);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [showAssistantOptions, setShowAssistantOptions] = useState(false);
  
  const { folders } = useKnowledgeBaseStore();
  const { assistants } = useAssistantStore();

  if (!isOpen) return null;

  const handleRename = () => {
    if (newName.trim() && newName !== document.title) {
      onRename?.(newName.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleMove = (folderId: string) => {
    onMove?.(folderId);
    setShowMoveOptions(false);
    onClose();
  };

  const handleAssignToAssistant = (assistantId: string) => {
    onAssignToAssistant?.(assistantId);
    setShowAssistantOptions(false);
    onClose();
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Quick Actions */}
        {onPreview && (
          <button
            onClick={() => handleAction(onPreview)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
        )}

        <button
          onClick={() => handleAction(() => popOutDocument(document.title, document.content || '', document.type || 'Document'))}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open in New Window</span>
        </button>
        
        <button
          onClick={() => setIsRenaming(true)}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Rename</span>
        </button>

        <button
          onClick={() => {
            console.log('[DocumentContextMenu] "Move to Folder" button clicked. Current showMoveOptions:', showMoveOptions);
            setShowMoveOptions(true);
            console.log('[DocumentContextMenu] setShowMoveOptions(true) called. New showMoveOptions should be true in next render.');
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Move to Folder</span>
        </button>

        {onDuplicate && (
          <button
            onClick={() => handleAction(onDuplicate)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </button>
        )}

        <button
          onClick={() => setShowAssistantOptions(true)}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Bot className="h-4 w-4" />
          <span>Assign to Assistant</span>
        </button>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        {onToggleStar && (
          <button
            onClick={() => handleAction(onToggleStar)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Star className={`h-4 w-4 ${document.starred ? 'text-yellow-500 fill-current' : ''}`} />
            <span>{document.starred ? 'Remove Star' : 'Add Star'}</span>
          </button>
        )}

        {onDownload && (
          <button
            onClick={() => handleAction(onDownload)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        )}

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
                handleAction(onDelete);
              }
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        )}

        {/* Rename Modal */}
        {isRenaming && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                className="text-sm"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsRenaming(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleRename}
                  disabled={!newName.trim()}
                >
                  Rename
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Move Options */}        
        {showMoveOptions && (
          <>
            {console.log('[DocumentContextMenu] Rendering Move Options. Folders:', folders)}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Move to:
                </div>
                <button
                  onClick={() => handleMove('')}
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  📁 Root Folder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMove(folder.id)}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    📁 {folder.name}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowMoveOptions(false)}
                  className="w-full mt-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Assistant Assignment Options */}
        {showAssistantOptions && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Assign to:
              </div>
              {assistants.map((assistant) => (
                <button
                  key={assistant.id}
                  onClick={() => handleAssignToAssistant(assistant.id)}
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-2"
                >
                  <Bot className="h-3 w-3" />
                  <span>{assistant.name}</span>
                </button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAssistantOptions(false)}
                className="w-full mt-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}