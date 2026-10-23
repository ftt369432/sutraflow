import { useState, useEffect, useCallback } from 'react';
import { documentService } from '../lib/database';
import { useSupabase } from '../providers/SupabaseProvider';
import type { Document } from '../types/documents';

export function useDocuments() {
  const { user } = useSupabase();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents when user changes
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = useCallback(async (document: Omit<Document, 'id'>) => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newDoc = await documentService.createDocument(document);
      
      if (newDoc) {
        setDocuments(prev => [...prev, newDoc]);
      }
      
      return newDoc;
    } catch (err) {
      console.error('Error adding document:', err);
      setError('Failed to add document. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDoc = await documentService.updateDocument(id, updates);
      
      if (updatedDoc) {
        setDocuments(prev => 
          prev.map(doc => doc.id === id ? updatedDoc : doc)
        );
      }
      
      return updatedDoc;
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteDocument = useCallback(async (id: string) => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await documentService.deleteDocument(id);
      
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const searchDocuments = useCallback(async (query: string) => {
    if (!user) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await documentService.searchDocuments(query);
    } catch (err) {
      console.error('Error searching documents:', err);
      setError('Failed to search documents. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    searchDocuments
  };
} 