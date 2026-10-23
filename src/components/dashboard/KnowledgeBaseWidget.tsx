import React, { useEffect } from 'react';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Loader2 } from 'lucide-react';

export const KnowledgeBaseWidget: React.FC = () => {
  const { documents, folders, loading, error, initialized, loadDocuments } = useKnowledgeBaseStore();

  useEffect(() => {
    if (!initialized && !loading) {
      loadDocuments();
    }
  }, [initialized, loading, loadDocuments]);

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading knowledge base: {error}
      </div>
    );
  }

  const documentCount = documents?.length || 0;
  const folderCount = folders?.length || 0;

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
      <div className="space-y-2">
        <p>Documents: {documentCount}</p>
        <p>Folders: {folderCount}</p>
      </div>
    </div>
  );
};

export default KnowledgeBaseWidget; 