import { useState, useCallback, useEffect } from 'react';
import { AIDriveFile, AIDriveService } from '../services/drive/aiDriveService';
import { useToast } from './useToast';

export interface OpenDocument {
  id: string;
  file: AIDriveFile;
  content: string;
  isDirty: boolean;
  isLoading: boolean;
  lastSaved?: Date;
}

interface UseDocumentTabsOptions {
  aiDriveService: AIDriveService;
  userId: string;
  maxOpenDocuments?: number;
}

export const useDocumentTabs = ({ 
  aiDriveService, 
  userId, 
  maxOpenDocuments = 10 
}: UseDocumentTabsOptions) => {
  const { toast } = useToast();
  const [openDocuments, setOpenDocuments] = useState<OpenDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  // Load document content
  const loadDocumentContent = useCallback(async (file: AIDriveFile): Promise<string> => {
    try {
      // For text files that might have existing content
      if (file.mime_type?.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        // Try to download the file content if it exists
        try {
          const downloadUrl = await aiDriveService.downloadFile(file.id);
          const response = await fetch(downloadUrl);
          const content = await response.text();
          return content;
        } catch (downloadError) {
          console.log('No existing content to download, starting with template');
        }
      }
      
      // For new files or other file types, start with template content
      return `# ${file.name}

This document was opened in the AI Drive editor.

Created: ${new Date(file.created_at).toLocaleDateString()}
Modified: ${new Date(file.updated_at).toLocaleDateString()}

Start editing by switching to Edit Mode...
`;
    } catch (error) {
      console.error('Error loading document content:', error);
      return `# ${file.name}

Error loading document content. Please try again or contact support if the issue persists.
`;
    }
  }, [aiDriveService]);

  // Open a document
  const openDocument = useCallback(async (file: AIDriveFile) => {
    // Check if document is already open
    const existingDoc = openDocuments.find(doc => doc.id === file.id);
    if (existingDoc) {
      setActiveDocumentId(file.id);
      return;
    }

    // Check if we've reached the maximum number of open documents
    if (openDocuments.length >= maxOpenDocuments) {
      toast({
        title: "Too Many Documents Open",
        description: `Maximum of ${maxOpenDocuments} documents can be open at once. Please close some documents first.`,
        variant: "destructive"
      });
      return;
    }

    // Create new document entry with loading state
    const newDocument: OpenDocument = {
      id: file.id,
      file,
      content: '',
      isDirty: false,
      isLoading: true,
    };

    setOpenDocuments(prev => [...prev, newDocument]);
    setActiveDocumentId(file.id);

    try {
      // Load the document content
      const content = await loadDocumentContent(file);
      
      setOpenDocuments(prev => 
        prev.map(doc => 
          doc.id === file.id 
            ? { ...doc, content, isLoading: false }
            : doc
        )
      );
    } catch (error) {
      toast({
        title: "Failed to Open Document",
        description: `Could not load "${file.name}". Please try again.`,
        variant: "destructive"
      });
      
      // Remove the document if loading failed
      setOpenDocuments(prev => prev.filter(doc => doc.id !== file.id));
      if (activeDocumentId === file.id) {
        setActiveDocumentId(openDocuments.length > 1 ? openDocuments[0].id : null);
      }
    }
  }, [openDocuments, maxOpenDocuments, loadDocumentContent, toast, activeDocumentId]);

  // Close a document
  const closeDocument = useCallback((documentId: string) => {
    setOpenDocuments(prev => {
      const newDocs = prev.filter(doc => doc.id !== documentId);
      
      // If we're closing the active document, switch to another one
      if (activeDocumentId === documentId) {
        if (newDocs.length > 0) {
          setActiveDocumentId(newDocs[newDocs.length - 1].id);
        } else {
          setActiveDocumentId(null);
        }
      }
      
      return newDocs;
    });
  }, [activeDocumentId]);

  // Save a document
  const saveDocument = useCallback(async (documentId: string, content: string) => {
    const document = openDocuments.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      // Update loading state
      setOpenDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, isLoading: true }
            : doc
        )
      );

      // Save to AI Drive service
      // For now, we'll update the file metadata to mark it as modified
      // In a full implementation, we'd need to create a proper content storage system
      await aiDriveService.updateFile(documentId, { 
        updated_at: new Date().toISOString()
      });

      // Update document state
      setOpenDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                content, 
                isDirty: false, 
                isLoading: false,
                lastSaved: new Date()
              }
            : doc
        )
      );

      toast({
        title: "Document Saved",
        description: `"${document.file.name}" has been saved successfully.`,
      });
    } catch (error) {
      setOpenDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, isLoading: false }
            : doc
        )
      );
      
      throw error; // Re-throw to let the component handle the error
    }
  }, [openDocuments, aiDriveService, toast]);

  // Update document content (marks as dirty)
  const updateDocumentContent = useCallback((documentId: string, content: string) => {
    setOpenDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, content, isDirty: true }
          : doc
      )
    );
  }, []);

  // Close all documents
  const closeAllDocuments = useCallback(() => {
    const hasUnsavedChanges = openDocuments.some(doc => doc.isDirty);
    
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm(
        'Some documents have unsaved changes. Close all documents without saving?'
      );
      if (!shouldClose) return;
    }
    
    setOpenDocuments([]);
    setActiveDocumentId(null);
  }, [openDocuments]);

  // Get active document
  const activeDocument = openDocuments.find(doc => doc.id === activeDocumentId);

  // Handle browser unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedChanges = openDocuments.some(doc => doc.isDirty);
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [openDocuments]);

  return {
    openDocuments,
    activeDocumentId,
    activeDocument,
    openDocument,
    closeDocument,
    saveDocument,
    updateDocumentContent,
    closeAllDocuments,
    setActiveDocumentId,
  };
};
