import React, { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle, RefreshCw, Download, Database, Brain } from 'lucide-react';
import { Button } from '../ui/Button';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { DocumentRecovery } from './DocumentRecovery';
import { BatchAIProcessor } from './BatchAIProcessor';

interface StorageManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageManager({ isOpen, onClose }: StorageManagerProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showAIProcessor, setShowAIProcessor] = useState(false);
  
  const { clearStorage, documents } = useKnowledgeBaseStore();

  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      clearStorage();
      setHasCleared(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clearing storage:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRecoveryComplete = (recoveredCount: number) => {
    setShowRecovery(false);
    // Optionally show a success message or refresh
    if (recoveredCount > 0) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  if (showRecovery) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <DocumentRecovery 
          onClose={() => setShowRecovery(false)}
          onRecoveryComplete={handleRecoveryComplete}
        />
      </div>
    );
  }

  if (showAIProcessor) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <BatchAIProcessor 
          onClose={() => setShowAIProcessor(false)}
          onComplete={() => {
            setShowAIProcessor(false);
            // Optionally refresh or show success message
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-[500px] p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Storage Manager
          </h2>
        </div>

        {hasCleared ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Storage Cleared Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The page will refresh automatically...
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 dark:text-amber-200 mb-2">
                  Storage Quota Exceeded
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Your browser's localStorage is full. This happens when uploading many files.
                  Clearing storage will resolve upload errors.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  What happens when you clear storage?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Local document cache will be cleared</li>
                  <li>• Files remain safely stored in your cloud drive</li>
                  <li>• Documents will reload from the server</li>
                  <li>• Upload errors will be resolved</li>
                </ul>
              </div>

              {documents.length === 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                    🔍 Missing Documents?
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                    If your documents disappeared after clearing storage, use Document Recovery to restore them from cloud storage.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRecovery(true)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Recover Documents
                  </Button>
                </div>
              )}

              {documents.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-2">
                    🧠 AI Enhancement Available
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                    Enhance your documents with AI analysis and vector embeddings for better search and organization.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIProcessor(true)}
                    className="flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Process with AI
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isClearing}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleClearStorage}
                disabled={isClearing}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Clear Storage
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 