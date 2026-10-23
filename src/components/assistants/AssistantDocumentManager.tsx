import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore, type KBDocument } from '../../store/knowledgeBaseStore';
import { useLearningSystem } from '../../hooks/useLearningSystem';
import DocumentReprocessing from '../documents/DocumentReprocessing';
import { DocumentProcessingUtility } from '../../services/DocumentProcessingUtility';

/**
 * Component to integrate document reprocessing into the assistant detail page
 */
const AssistantDocumentManager: React.FC = () => {
  const { assistantId } = useParams<{ assistantId: string }>();
  const { getAssistantById } = useAssistantStore();
  const { documents } = useKnowledgeBaseStore();
  const [assistantDocuments, setAssistantDocuments] = useState<KBDocument[]>([]);
  const [reprocessingStatus, setReprocessingStatus] = useState<string | null>(null);

  // Use our learning system hook
  const { reprocessDocuments, insights } = useLearningSystem(assistantId || '');

  // Get assistant and its linked documents
  useEffect(() => {
    if (!assistantId) return;
    
    const assistant = getAssistantById(assistantId);
    if (!assistant) {
      console.error(`Assistant with ID ${assistantId} not found`);
      return;
    }
    
    // Get folder IDs linked to this assistant
    const folderIds = assistant.knowledgeBase?.map(folder => folder.id) || [];
    
    // Filter documents to only include those in the assistant's folders
    const assistantDocs = documents.filter(doc => 
      doc.folderId && folderIds.includes(doc.folderId)
    );
    
    setAssistantDocuments(assistantDocs);
    
    // Check if reprocessing is needed
    const isReprocessNeeded = DocumentProcessingUtility.isReprocessingNeeded(assistantId);
    if (isReprocessNeeded) {
      setReprocessingStatus('Documents may need reprocessing');
    } else {
      setReprocessingStatus(null);
    }
  }, [assistantId, documents, getAssistantById]);

  // Handler to reprocess all linked documents
  const handleReprocessAllDocuments = async () => {
    if (!assistantId || assistantDocuments.length === 0) return;
    
    setReprocessingStatus('Reprocessing documents...');
    
    try {
      const result = await reprocessDocuments(assistantDocuments, {
        deduplicateContent: true,
        forceReprocess: false
      });
      
      if (result.success) {
        setReprocessingStatus(`Successfully reprocessed ${result.processed} documents.`);
        // After a few seconds, clear the status
        setTimeout(() => setReprocessingStatus(null), 5000);
      } else {
        setReprocessingStatus(`Reprocessing completed with some errors: ${result.processed} processed, ${result.errors?.length || 0} errors.`);
      }
    } catch (error) {
      console.error('Error reprocessing documents:', error);
      setReprocessingStatus(`Error reprocessing documents: ${error}`);
    }
  };

  return (
    <div className="assistant-document-manager">
      <h2>Document Management</h2>
      
      <div className="document-status">
        <p>
          <strong>Linked Documents:</strong> {assistantDocuments.length}
        </p>
        
        {reprocessingStatus && (
          <div className="status-message">
            {reprocessingStatus}
          </div>
        )}
        
        {insights.reprocessingNeeded && (
          <div className="warning-message">
            It's been a while since documents were last processed. 
            Consider reprocessing to ensure the assistant has the latest information.
          </div>
        )}
        
        {assistantDocuments.length > 0 && (
          <div className="reprocessing-container">
            <DocumentReprocessing 
              assistantId={assistantId || ''} 
              documents={assistantDocuments}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantDocumentManager;
