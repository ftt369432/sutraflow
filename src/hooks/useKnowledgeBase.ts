import { useState, useCallback, useEffect } from 'react';
import type { AIDocument, SearchResult, Folder } from '../types/ai';
import { useAssistantStore } from '../store/assistantStore';

interface UseKnowledgeBaseOptions {
  enableDriveSync?: boolean;
  autoIndex?: boolean;
  maxResults?: number;
  assistantId?: string;
}

export function useKnowledgeBase(options: UseKnowledgeBaseOptions = {}) {
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [driveDocuments, setDriveDocuments] = useState<AIDocument[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const { getAssistantFolders } = useAssistantStore();

  // Initialize drive sync
  useEffect(() => {
    if (options.enableDriveSync) {
      syncDriveDocuments();
    }
  }, [options.enableDriveSync]);

  // Load documents from linked folders if assistantId is provided
  useEffect(() => {
    if (options.assistantId) {
      loadAssistantKnowledgeBase(options.assistantId);
    }
  }, [options.assistantId]);

  const loadAssistantKnowledgeBase = async (assistantId: string) => {
    try {
      setIsLoading(true);
      const folderIds = getAssistantFolders(assistantId);
      
      // Load documents from linked folders
      let knowledgeBaseDocs: AIDocument[] = [];
      
      for (const folderId of folderIds) {
        const folderDocs = await loadFolderDocuments(folderId);
        knowledgeBaseDocs = [...knowledgeBaseDocs, ...folderDocs];
      }
      
      setDocuments(prev => {
        // Merge with existing documents, avoiding duplicates
        const existingIds = new Set(prev.map(doc => doc.id));
        const newDocs = knowledgeBaseDocs.filter(doc => !existingIds.has(doc.id));
        return [...prev, ...newDocs];
      });
    } catch (err) {
      console.error('Error loading assistant knowledge base:', err);
      setError('Failed to load assistant knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderDocuments = async (folderId: string): Promise<AIDocument[]> => {
    try {
      // For now we'll just filter existing documents by folder ID
      // In a real implementation, this would load from a database or storage
      return [...documents, ...driveDocuments].filter(doc => doc.folderId === folderId);
    } catch (err) {
      console.error(`Error loading folder documents for folder ${folderId}:`, err);
      return [];
    }
  };

  const syncDriveDocuments = async () => {
    try {
      setSyncStatus('syncing');
      // TODO: Implement Google Drive API integration
      // const driveFiles = await fetchDriveFiles();
      // const processedDocs = await processDriveFiles(driveFiles);
      // setDriveDocuments(processedDocs);
      setSyncStatus('idle');
    } catch (err) {
      setSyncStatus('error');
      setError('Failed to sync drive documents');
    }
  };

  // Create a new folder in the knowledge base
  const createFolder = useCallback(async (folderName: string, parentFolderId: string | null = null): Promise<Folder> => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      parentId: parentFolderId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  // Add a document to the knowledge base
  const addDocument = useCallback(async (doc: AIDocument) => {
    setIsLoading(true);
    try {
      // Generate embedding for the document
      if (options.autoIndex) {
        setIsIndexing(true);
        // TODO: Implement embedding generation
        // const embedding = await generateEmbedding(doc.content);
        // doc.embedding = embedding;
      }
      setDocuments(prev => [...prev, doc]);
      setIsIndexing(false);
    } catch (err) {
      setError('Failed to add document');
    } finally {
      setIsLoading(false);
    }
  }, [options.autoIndex]);

  // Add a document to a specific folder
  const addDocumentToFolder = useCallback(async (doc: AIDocument, folderId: string) => {
    setIsLoading(true);
    try {
      // Update the document with the folder ID
      const docWithFolder = {
        ...doc,
        folderId
      };
      
      // Add to documents collection
      await addDocument(docWithFolder);
      
      return true;
    } catch (err) {
      setError('Failed to add document to folder');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [addDocument]);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setDriveDocuments(prev => prev.filter(d => d.id !== docId));
  }, []);

  const updateDocument = useCallback(async (documentId: string, updates: Partial<AIDocument>) => {
    setIsLoading(true);
    try {
      if (updates.content && options.autoIndex) {
        setIsIndexing(true);
        // TODO: Implement embedding update
        // const embedding = await generateEmbedding(updates.content);
        // updates.embedding = embedding;
      }
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, ...updates } : doc
      ));
      setIsIndexing(false);
    } catch (err) {
      setError('Failed to update document');
    } finally {
      setIsLoading(false);
    }
  }, [options.autoIndex]);

  const searchDocuments = useCallback(async (query: string): Promise<SearchResult[]> => {
    setIsLoading(true);
    try {
      // TODO: Implement semantic search with embeddings
      const results = documents.concat(driveDocuments)
        .filter(doc => 
          doc.title?.toLowerCase().includes(query.toLowerCase()) ||
          doc.content.toLowerCase().includes(query.toLowerCase())
        )
        .map(doc => ({
          document: doc,
          similarity: 1 // Placeholder for actual similarity score
        }))
        .slice(0, options.maxResults || 5);
      
      return results;
    } catch (err) {
      setError('Failed to search documents');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [documents, driveDocuments, options.maxResults]);

  // New function to search documents within specific folders
  const searchFolderDocuments = useCallback(async (query: string, folderIds: string[]): Promise<SearchResult[]> => {
    setIsLoading(true);
    try {
      // Get all documents from specified folders
      const folderDocuments = [...documents, ...driveDocuments].filter(
        doc => doc.folderId && folderIds.includes(doc.folderId)
      );
      
      // Search within those documents
      const results = folderDocuments
        .filter(doc => 
          doc.title?.toLowerCase().includes(query.toLowerCase()) ||
          doc.content.toLowerCase().includes(query.toLowerCase())
        )
        .map(doc => ({
          document: doc,
          similarity: 1 // Placeholder for actual similarity score
        }))
        .slice(0, options.maxResults || 5);
      
      return results;
    } catch (err) {
      setError('Failed to search folder documents');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [documents, driveDocuments, options.maxResults]);

  const getDocumentById = useCallback((id: string) => {
    return documents.find(doc => doc.id === id) || driveDocuments.find(doc => doc.id === id);
  }, [documents, driveDocuments]);

  const getDocumentsByFolder = useCallback((folderId: string | null) => {
    return [...documents, ...driveDocuments].filter(doc => doc.folderId === folderId);
  }, [documents, driveDocuments]);

  const getFolderById = useCallback((id: string) => {
    return folders.find(folder => folder.id === id);
  }, [folders]);

  const getAllFolders = useCallback(() => {
    return folders;
  }, [folders]);

  const analyzeDocument = useCallback(async (documentId: string) => {
    const document = getDocumentById(documentId);
    if (!document) return null;

    try {
      setIsLoading(true);
      // TODO: Implement AI analysis
      const insights = {
        keyPoints: [],
        topics: [],
        sentiment: 'neutral' as const,
        entities: [],
        readingTime: Math.ceil(document.content.split(' ').length / 200),
        relevance: 1
      };

      // Update document with insights
      await updateDocument(documentId, { 
        metadata: { 
          ...document.metadata,
          // Insights should be stored separately, not directly in metadata
        } 
      });
      
      return insights;
    } catch (err) {
      setError('Failed to analyze document');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getDocumentById, updateDocument]);

  return {
    documents: documents.concat(driveDocuments),
    isLoading,
    isIndexing,
    error,
    syncStatus,
    folders,
    addDocument,
    removeDocument,
    updateDocument,
    searchDocuments,
    searchFolderDocuments,
    getDocumentById,
    getDocumentsByFolder,
    analyzeDocument,
    syncDriveDocuments,
    createFolder,
    getFolderById,
    getAllFolders,
    addDocumentToFolder,
    loadAssistantKnowledgeBase
  };
}