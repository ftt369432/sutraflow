import React, { useState, useEffect } from 'react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { AIDocument, AIFolder } from '../../types/ai';
import { useUser } from '../../hooks/useUser';
import { Button } from '../ui/Button';
import { AlertCircle, FolderPlus, Check } from 'lucide-react';

export function DocumentOrphanFixer() {
  const { documents, folders, addFolder, moveDocument } = useKnowledgeBaseStore();
  const { user } = useUser();
  const [orphanedDocuments, setOrphanedDocuments] = useState<AIDocument[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [recoveryFolderId, setRecoveryFolderId] = useState<string | null>(null);

  useEffect(() => {
    // Find all documents without a folderId
    const orphaned = documents.filter(doc => !doc.folderId);
    setOrphanedDocuments(orphaned);
  }, [documents]);

  const createOrGetRecoveryFolder = async () => {
    if (!user?.id) return null;

    // Check if a recovery folder already exists
    const existingFolder = folders.find(
      folder => folder.name === 'Recovered Documents' && folder.userId === user.id
    );

    if (existingFolder) {
      setRecoveryFolderId(existingFolder.id);
      return existingFolder.id;
    }

    // Create a new recovery folder
    const folderData = {
      name: 'Recovered Documents',
      parentId: null,
      userId: user.id
    };

    const createdFolder = await addFolder(folderData);
    if (createdFolder) {
      setRecoveryFolderId(createdFolder.id);
      return createdFolder.id;
    }
    
    return null;
  };

  const fixOrphanedDocuments = async () => {
    if (!user?.id) {
      alert('You need to be logged in to fix orphaned documents');
      return;
    }

    setIsFixing(true);
    
    try {
      const folderId = recoveryFolderId || await createOrGetRecoveryFolder();
      if (!folderId) {
        alert('Failed to create or get recovery folder');
        setIsFixing(false);
        return;
      }

      // Move each orphaned document to the recovery folder
      for (const doc of orphanedDocuments) {
        await moveDocument(doc.id, folderId);
      }

      // Update the orphaned documents list
      setOrphanedDocuments(documents.filter(doc => !doc.folderId));
      setIsFixed(true);
    } catch (error) {
      console.error('Error fixing orphaned documents:', error);
      alert('An error occurred while fixing orphaned documents');
    } finally {
      setIsFixing(false);
    }
  };

  if (orphanedDocuments.length === 0 && !isFixed) {
    return null; // Don't show anything if no orphaned documents
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        {isFixed ? (
          <div className="flex-shrink-0">
            <Check className="h-5 w-5 text-green-600" />
          </div>
        ) : (
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
        )}
        
        <div className="flex-1">
          {isFixed ? (
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                Orphaned documents fixed!
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                All {orphanedDocuments.length} documents were moved to the "Recovered Documents" folder.
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {orphanedDocuments.length} document(s) have no folder assignment
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                These documents are not accessible to AI assistants. Click the button below to move them to a "Recovered Documents" folder.
              </p>
              
              <Button
                onClick={fixOrphanedDocuments}
                disabled={isFixing}
                className="mt-3 inline-flex items-center"
                variant="secondary"
                size="sm"
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                {isFixing ? 'Fixing...' : 'Fix Orphaned Documents'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
