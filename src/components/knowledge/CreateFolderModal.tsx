import React, { useState } from 'react';
import { X, FolderPlus, Bot } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path for useAuth

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
}

export function CreateFolderModal({ 
  isOpen, 
  onClose, 
  currentFolderId 
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth(); // Get user from useAuth

  const { addFolder, folders } = useKnowledgeBaseStore();
  const { assistants, bulkLinkFolders } = useAssistantStore(); // Changed to bulkLinkFolders

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    
    setIsCreating(true);
    try {
      // Create the folder
      if (!user) {
        console.error('User not authenticated');
        alert('You must be logged in to create a folder.');
        setIsCreating(false);
        return;
      }
      const newFolder = {
        id: crypto.randomUUID(),
        name: folderName.trim(),
        assistantIds: (selectedAssistant && selectedAssistant !== 'none') ? [selectedAssistant] : []
      };

      await addFolder(newFolder);
      
      // If assistant is selected, the folder is already linked via assistantIds
      if (selectedAssistant && selectedAssistant !== 'none') {
        console.log(`[DEBUG] Folder "${newFolder.name}" created and linked to assistant ${selectedAssistant}`);
      }

      // Reset form and close
      setFolderName('');
      setSelectedAssistant('');
      onClose();
      
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setSelectedAssistant('');
    onClose();
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Folder</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentFolder ? `in ${currentFolder.name}` : 'in Knowledge Base'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Folder Name */}
          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder Name
            </label>
            <Input
              id="folder-name"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Untitled folder"
              className="w-full"
              autoFocus
              required
            />
          </div>

          {/* AI Assistant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link to Assistant (Optional)
            </label>
            <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an AI assistant (or leave unlinked)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No assistant</SelectItem>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span>{assistant.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Linking to an assistant allows it to access documents in this folder
            </p>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || isCreating}
              className="flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4" />
                  <span>Create</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}