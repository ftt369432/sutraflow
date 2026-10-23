import React from 'react';
import type { AIDocument } from '../../types/ai';
import { adaptAIDocumentToUnified } from '../common/DocumentCard';
import { CreateDocumentModal } from './CreateDocumentModal';
import { CreateFolderModal } from './CreateFolderModal';
import { CreateNoteModal } from './CreateNoteModal';
import { UnpackWorkspaceModal } from './UnpackWorkspaceModal';
import { RenameModal } from './RenameModal';
import { AssistantFolderManager } from './AssistantFolderManager';
import { TaskLinker } from './TaskLinker';
import { BatchAIProcessor } from './BatchAIProcessor';
import { StorageManager } from './StorageManager';
import { DocumentRecovery } from './DocumentRecovery';
import { FullDocumentViewer } from './FullDocumentViewer';
import { DocumentUploader } from './DocumentUploader';

interface KnowledgeBaseModalsProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedFolderId: string | null;
  selectedDocuments: string[];
  selectedItemsForAssistant: Array<{ id: string; name: string; type: 'folder' | 'document' }>;
  isUploaderOpen: boolean;
  setUploaderOpen: (open: boolean) => void;
  filesToUpload: File[];
  isRenameModalOpen: boolean;
  setIsRenameModalOpen: (open: boolean) => void;
  itemToRename: { id: string; name: string; type: 'file' | 'folder' } | null;
  setItemToRename: (item: { id: string; name: string; type: 'file' | 'folder' } | null) => void;
  fullViewDocument: AIDocument | null;
  setFullViewDocument: (doc: AIDocument | null) => void;
  documents: AIDocument[];
  handleCreateFolder: (name: string, parentId?: string | null) => Promise<any>;
  handleRename: (newName: string) => Promise<void>;
  handleRecoveryComplete: (count: number) => void;
  onToggleStar: (document: AIDocument) => void;
}

export const KnowledgeBaseModals: React.FC<KnowledgeBaseModalsProps> = ({
  activeModal,
  setActiveModal,
  selectedFolderId,
  selectedDocuments,
  selectedItemsForAssistant,
  isUploaderOpen,
  setUploaderOpen,
  filesToUpload,
  isRenameModalOpen,
  setIsRenameModalOpen,
  itemToRename,
  setItemToRename,
  fullViewDocument,
  setFullViewDocument,
  handleCreateFolder,
  handleRename,
  handleRecoveryComplete,
  onToggleStar
}) => {
  return (
    <>
      {/* Create Document Modal */}
      {activeModal === 'createDocument' && (
        <CreateDocumentModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          currentFolderId={selectedFolderId}
        />
      )}

      {/* Create Folder Modal */}
      {activeModal === 'createFolder' && (
        <CreateFolderModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          currentFolderId={selectedFolderId}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* Document Uploader Modal */}
      {isUploaderOpen && (
        <DocumentUploader
          isOpen={isUploaderOpen}
          onClose={() => setUploaderOpen(false)}
          folderId={selectedFolderId}
          initialFiles={filesToUpload}
        />
      )}

      {/* Assistant Folder Manager */}
      {activeModal === 'assignToAssistant' && (
        <AssistantFolderManager
          onClose={() => setActiveModal(null)}
          selectedItems={selectedItemsForAssistant}
        />
      )}

      {/* Task Linker */}
      {activeModal === 'taskLinker' && (
        <TaskLinker isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* AI Batch Processor */}
      {activeModal === 'aiProcessor' && (
        <BatchAIProcessor
          key={`batch-ai-processor-${selectedDocuments.join('-')}`}
          onClose={() => setActiveModal(null)}
          documentIds={Array.from(selectedDocuments)}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* Storage Manager */}
      {activeModal === 'storageManager' && (
        <StorageManager isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      {/* Document Recovery */}
      {activeModal === 'documentRecovery' && (
        <DocumentRecovery
          onClose={() => setActiveModal(null)}
          onRecoveryComplete={handleRecoveryComplete}
        />
      )}

      {/* Rename Modal */}
      {itemToRename && (
        <RenameModal
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setItemToRename(null);
          }}
          itemType={itemToRename.type}
          currentName={itemToRename.name}
          onRename={handleRename}
        />
      )}

      {/* Create Note Modal */}
      {activeModal === 'createNote' && (
        <CreateNoteModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          currentFolderId={selectedFolderId}
        />
      )}

      {/* Full Document Viewer */}
      {fullViewDocument && (
        <FullDocumentViewer
          document={adaptAIDocumentToUnified(fullViewDocument)}
          isOpen={Boolean(fullViewDocument)}
          onClose={() => setFullViewDocument(null)}
          onEdit={(doc) => console.log('Edit document:', doc.id)}
          onToggleStar={() => onToggleStar(fullViewDocument)}
          onDownload={(doc) => console.log('Download document:', doc.id)}
        />
      )}

      {/* Unpack Workspace Modal */}
      {activeModal === 'unpackWorkspace' && (
        <UnpackWorkspaceModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}
    </>
  );
};
