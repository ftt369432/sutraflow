import { useState } from 'react';
import { X, Download, Trash2, Star, Bot, Move } from 'lucide-react';
import { Button } from '../ui/Button';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { useSelection } from './EnhancedSelectionContext';

interface BulkActionsToolbarProps {
  onBulkDownload?: () => void;
  onBulkDelete?: () => void;
  onBulkMove?: (folderId: string) => void;
  onBulkStar?: () => void;
  onBulkAssignToAssistant?: (assistantId: string) => void;
}

export function BulkActionsToolbar({
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
  onBulkStar,
  onBulkAssignToAssistant
}: BulkActionsToolbarProps) {
  const { selectedDocuments, clearSelection } = useSelection();
  const { folders } = useKnowledgeBaseStore();
  const { assistants } = useAssistantStore();
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [showAssistantDropdown, setShowAssistantDropdown] = useState(false);

  if (selectedDocuments.size === 0) return null;

  const handleBulkMove = (folderId: string) => {
    onBulkMove?.(folderId);
    setShowMoveDropdown(false);
  };

  const handleBulkAssign = (assistantId: string) => {
    onBulkAssignToAssistant?.(assistantId);
    setShowAssistantDropdown(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedDocuments.size} selected documents?`)) {
      onBulkDelete?.();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center space-x-3">
        {/* Selection Info */}
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            {selectedDocuments.size} selected
          </div>          <Button
            variant="assistant"
            size="sm"
            onClick={clearSelection}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Star */}
          {onBulkStar && (            <Button
              variant="assistant"
              size="sm"
              onClick={onBulkStar}
              className="h-8 px-3"
            >
              <Star className="h-4 w-4 mr-1" />
              Star
            </Button>
          )}

          {/* Move */}
          {onBulkMove && (
            <div className="relative">              <Button
                variant="assistant"
                size="sm"
                onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                className="h-8 px-3"
              >
                <Move className="h-4 w-4 mr-1" />
                Move
              </Button>
              {showMoveDropdown && (
                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[150px]">
                  <button
                    onClick={() => handleBulkMove('')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    📁 Root Folder
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleBulkMove(folder.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      📁 {folder.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assign to Assistant */}
          {onBulkAssignToAssistant && assistants.length > 0 && (
            <div className="relative">              <Button
                variant="assistant"
                size="sm"
                onClick={() => setShowAssistantDropdown(!showAssistantDropdown)}
                className="h-8 px-3"
              >
                <Bot className="h-4 w-4 mr-1" />
                Assign
              </Button>
              {showAssistantDropdown && (
                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[150px]">
                  {assistants.map((assistant) => (
                    <button
                      key={assistant.id}
                      onClick={() => handleBulkAssign(assistant.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <Bot className="h-3 w-3" />
                      <span>{assistant.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Download */}
          {onBulkDownload && (            <Button
              variant="assistant-primary"
              size="sm"
              onClick={onBulkDownload}
              className="h-8 px-3"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}

          {/* Delete */}
          {onBulkDelete && (            <Button
              variant="assistant-secondary"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8 px-3 text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}