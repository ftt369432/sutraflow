/**
 * Conversation-Document Linking Store
 * 
 * Manages persistent links between conversations and their associated documents.
 * Enables document persistence across conversation switches and sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConversationDocument {
  conversationId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  createdAt: Date;
  lastModified: Date;
  isActive: boolean;
  source: 'ai-generated' | 'ai-drive' | 'template' | 'user-created';
}

interface ConversationDocumentState {
  // State
  links: ConversationDocument[];
  
  // Actions
  linkDocumentToConversation: (
    conversationId: string, 
    documentId: string, 
    title: string,
    type?: string,
    source?: ConversationDocument['source']
  ) => void;
  
  getDocumentsForConversation: (conversationId: string) => ConversationDocument[];
  getAllDocuments: () => ConversationDocument[];
  getDocumentById: (documentId: string) => ConversationDocument | undefined;
  
  updateDocumentTitle: (documentId: string, newTitle: string) => void;
  updateDocumentModified: (documentId: string) => void;
  setDocumentActive: (documentId: string, isActive: boolean) => void;
  
  removeDocumentLink: (documentId: string) => void;
  removeAllLinksForConversation: (conversationId: string) => void;
  
  // Utility
  hasDocumentsForConversation: (conversationId: string) => boolean;
  getActiveDocumentsForConversation: (conversationId: string) => ConversationDocument[];
}

export const useConversationDocumentStore = create<ConversationDocumentState>()(
  persist(
    (set, get) => ({
      // Initial state
      links: [],
      
      // Link a document to a conversation
      linkDocumentToConversation: (conversationId, documentId, title, type = 'document', source = 'ai-generated') => {
        const newLink: ConversationDocument = {
          conversationId,
          documentId,
          documentTitle: title,
          documentType: type,
          createdAt: new Date(),
          lastModified: new Date(),
          isActive: true,
          source
        };
        
        set(state => {
          // Remove existing link for this document (update scenario)
          const filteredLinks = state.links.filter(l => l.documentId !== documentId);
          
          console.log('🔗 Linking document to conversation:', {
            conversationId,
            documentId,
            title,
            source
          });
          
          return {
            links: [...filteredLinks, newLink]
          };
        });
      },
      
      // Get all documents for a conversation
      getDocumentsForConversation: (conversationId) => {
        const documents = get().links.filter(link => link.conversationId === conversationId);
        console.log(`📄 Found ${documents.length} documents for conversation ${conversationId}:`, documents.map(d => d.documentTitle));
        return documents;
      },
      
      // Get all documents
      getAllDocuments: () => {
        return get().links;
      },
      
      // Get document by ID
      getDocumentById: (documentId) => {
        return get().links.find(link => link.documentId === documentId);
      },
      
      // Update document title
      updateDocumentTitle: (documentId, newTitle) => {
        set(state => ({
          links: state.links.map(link =>
            link.documentId === documentId
              ? { ...link, documentTitle: newTitle, lastModified: new Date() }
              : link
          )
        }));
        
        console.log('📝 Updated document title:', { documentId, newTitle });
      },
      
      // Update document last modified time
      updateDocumentModified: (documentId) => {
        set(state => ({
          links: state.links.map(link =>
            link.documentId === documentId
              ? { ...link, lastModified: new Date() }
              : link
          )
        }));
      },
      
      // Set document active state
      setDocumentActive: (documentId, isActive) => {
        set(state => ({
          links: state.links.map(link =>
            link.documentId === documentId
              ? { ...link, isActive }
              : link
          )
        }));
      },
      
      // Remove a document link
      removeDocumentLink: (documentId) => {
        set(state => {
          const linkToRemove = state.links.find(l => l.documentId === documentId);
          console.log('🗑️ Removing document link:', linkToRemove?.documentTitle);
          
          return {
            links: state.links.filter(l => l.documentId !== documentId)
          };
        });
      },
      
      // Remove all links for a conversation
      removeAllLinksForConversation: (conversationId) => {
        set(state => {
          const linksToRemove = state.links.filter(l => l.conversationId === conversationId);
          console.log(`🗑️ Removing ${linksToRemove.length} document links for conversation ${conversationId}`);
          
          return {
            links: state.links.filter(l => l.conversationId !== conversationId)
          };
        });
      },
      
      // Check if conversation has documents
      hasDocumentsForConversation: (conversationId) => {
        return get().links.some(link => link.conversationId === conversationId);
      },
      
      // Get active documents for conversation
      getActiveDocumentsForConversation: (conversationId) => {
        return get().links.filter(link => 
          link.conversationId === conversationId && link.isActive
        );
      }
    }),
    {
      name: 'conversation-documents-storage',
      version: 1,
      // Transform dates when persisting/rehydrating
      partialize: (state) => ({
        links: state.links.map(link => ({
          ...link,
          createdAt: link.createdAt.toISOString(),
          lastModified: link.lastModified.toISOString()
        }))
      }),
      // Restore dates when rehydrating
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.links = state.links.map(link => ({
            ...link,
            createdAt: new Date(link.createdAt),
            lastModified: new Date(link.lastModified)
          }));
        }
      }
    }
  )
);

// Helper function to get functions without state (for use in components)
export const getConversationDocumentActions = () => {
  const store = useConversationDocumentStore.getState();
  return {
    linkDocumentToConversation: store.linkDocumentToConversation,
    getDocumentsForConversation: store.getDocumentsForConversation,
    removeDocumentLink: store.removeDocumentLink,
    updateDocumentTitle: store.updateDocumentTitle,
    updateDocumentModified: store.updateDocumentModified,
    hasDocumentsForConversation: store.hasDocumentsForConversation
  };
};