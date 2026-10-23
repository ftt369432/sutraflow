import React, { useState, useEffect } from 'react';
import { X, Brain, Link, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAssistantStore } from '../../store/assistantStore';
import { genieDriveKnowledgeBaseService } from '../../services/genieDriveKnowledgeBaseService';
import { AIDriveFile } from '../../services/drive/aiDriveService';

interface GenieDriveLinkToKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: AIDriveFile[];
  selectedFolders?: AIDriveFile[];
}

interface LinkingResult {
  fileId: string;
  fileName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  type: 'file' | 'folder';
}

export function GenieDriveLinkToKnowledgeBaseModal({ 
  isOpen, 
  onClose, 
  selectedFiles,
  selectedFolders = []
}: GenieDriveLinkToKnowledgeBaseModalProps) {
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkingResults, setLinkingResults] = useState<LinkingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [includeFolderContents, setIncludeFolderContents] = useState(true);
  
  const { assistants } = useAssistantStore();
  const totalItems = selectedFiles.length + selectedFolders.length;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAssistantId('');
      setIsLinking(false);
      setLinkingResults([]);
      setShowResults(false);
      setIncludeFolderContents(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLinkFiles = async () => {
    if (totalItems === 0) return;

    setIsLinking(true);
    setShowResults(true);

    // Initialize results for files and folders
    const initialResults: LinkingResult[] = [
      ...selectedFiles.map(file => ({
      fileId: file.id,
      fileName: file.name,
        status: 'pending' as const,
        type: 'file' as const
      })),
      ...selectedFolders.map(folder => ({
        fileId: folder.id,
        fileName: folder.name,
        status: 'pending' as const,
        type: 'folder' as const
      }))
    ];
    setLinkingResults(initialResults);

    // Process individual files
    for (const file of selectedFiles) {
      try {
        const result = await genieDriveKnowledgeBaseService.linkFileToKnowledgeBase(
          file,
          selectedAssistantId || undefined,
          true // auto sync
        );

        setLinkingResults(prev => prev.map(r => 
          r.fileId === file.id 
            ? { 
                ...r, 
                status: result.success ? 'success' : 'error',
                error: result.error 
              }
            : r
        ));

      } catch (error) {
        setLinkingResults(prev => prev.map(r => 
          r.fileId === file.id 
            ? { 
                ...r, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : r
        ));
      }
    }

    // Process folders
    for (const folder of selectedFolders) {
      try {
        const result = await genieDriveKnowledgeBaseService.linkFolderToKnowledgeBase(
          folder,
          selectedAssistantId || undefined,
          true, // auto sync
          includeFolderContents // recursive
        );

        setLinkingResults(prev => prev.map(r => 
          r.fileId === folder.id 
            ? { 
                ...r, 
                status: result.success ? 'success' : 'error',
                error: result.errors.length > 0 ? result.errors.join(', ') : undefined
              }
            : r
        ));

      } catch (error) {
        setLinkingResults(prev => prev.map(r => 
          r.fileId === folder.id 
            ? { 
                ...r, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : r
        ));
      }
    }

    setIsLinking(false);
  };

  const handleClose = () => {
    setSelectedAssistantId('');
    setIsLinking(false);
    setLinkingResults([]);
    setShowResults(false);
    onClose();
  };

  const successCount = linkingResults.filter(r => r.status === 'success').length;
  const errorCount = linkingResults.filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <Brain className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Link to Knowledge Base
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connect {totalItems} item{totalItems !== 1 ? 's' : ''} to AI assistants
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLinking}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {!showResults ? (
            <div className="space-y-6">
              {/* File List */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Selected Files
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {selectedFiles.map(file => (
                    <div key={file.id} className="flex items-center space-x-3 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder List */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Selected Folders
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {selectedFolders.map(folder => (
                    <div key={folder.id} className="flex items-center space-x-3 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {folder.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder Options */}
              {selectedFolders.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Folder Options
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="includeFolderContents"
                        checked={includeFolderContents}
                        onChange={(e) => setIncludeFolderContents(e.target.checked)}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor="includeFolderContents" 
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Include all files in subfolders (recursive)
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                      When enabled, all files within selected folders and their subfolders will be linked to the Knowledge Base.
                    </p>
                  </div>
                </div>
              )}

              {/* Assistant Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  AI Assistant (Optional)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select an assistant to automatically organize files in their knowledge base folder.
                </p>
                <select
                  value={selectedAssistantId}
                  onChange={(e) => setSelectedAssistantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">General Knowledge Base</option>
                  {assistants.map(assistant => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name} ({assistant.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Benefits Info */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Link className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Knowledge Base Integration
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                      <li>• AI assistants can reference these files in conversations</li>
                      <li>• Files are processed for semantic search and context</li>
                      <li>• Automatic synchronization when files are updated</li>
                      <li>• Enhanced AI responses with relevant file content</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isLinking ? 'Linking Items...' : 'Linking Complete'}
                </h3>
                {!isLinking && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {successCount} successful, {errorCount} errors
                  </p>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {linkingResults.map(result => (
                  <div 
                    key={result.fileId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {result.status === 'pending' && (
                          <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                        )}
                        {result.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {result.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {result.fileName}
                      </span>
                    </div>
                    {result.error && (
                      <span className="text-xs text-red-500 dark:text-red-400 max-w-xs truncate">
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            {!showResults ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLinking}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkFiles}
                  disabled={totalItems === 0 || isLinking}
                  className="flex items-center space-x-2"
                >
                  <Brain className="h-4 w-4" />
                  <span>Link to Knowledge Base</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={handleClose}
                disabled={isLinking}
                className="flex items-center space-x-2"
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Done</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 