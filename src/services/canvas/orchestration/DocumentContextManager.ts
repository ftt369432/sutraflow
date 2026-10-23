/**
 * Document Context Manager
 * 
 * Centralized management of document state and editing context.
 * Maintains conversation continuity and document sessions.
 */

import { DocumentContext } from './CanvasOrchestrator';

export class DocumentContextManager {
  private activeContext: DocumentContext | null = null;
  private documentHistory: Map<string, DocumentContext> = new Map();
  private conversationContextMap: Map<string, string> = new Map(); // conversationId -> documentId

  /**
   * Sets the active document context
   */
  async setActiveContext(context: DocumentContext): Promise<void> {
    this.activeContext = context;
    this.documentHistory.set(context.id, context);
    
    if (context.editingSession.conversationId) {
      this.conversationContextMap.set(
        context.editingSession.conversationId, 
        context.id
      );
    }

    console.log('📋 Active document context set:', {
      id: context.id,
      type: context.type,
      title: context.title
    });
  }

  /**
   * Gets the current active document context
   */
  getActiveContext(): DocumentContext | null {
    return this.activeContext;
  }

  /**
   * Updates existing document context
   */
  async updateContext(context: DocumentContext): Promise<void> {
    this.activeContext = context;
    this.documentHistory.set(context.id, context);
    
    console.log('📋 Document context updated:', context.id);
  }

  /**
   * Finds document by conversation ID
   */
  getDocumentByConversation(conversationId: string): DocumentContext | null {
    const documentId = this.conversationContextMap.get(conversationId);
    return documentId ? this.documentHistory.get(documentId) || null : null;
  }

  /**
   * Checks if a conversation has an active document
   */
  hasActiveDocument(conversationId?: string): boolean {
    if (conversationId) {
      return this.conversationContextMap.has(conversationId);
    }
    return this.activeContext !== null;
  }

  /**
   * Closes document and cleans up context
   */
  async closeDocument(documentId: string): Promise<void> {
    const document = this.documentHistory.get(documentId);
    if (document) {
      document.editingSession.active = false;
      
      if (this.activeContext?.id === documentId) {
        this.activeContext = null;
      }

      // Clean up conversation mapping
      for (const [conversationId, docId] of this.conversationContextMap.entries()) {
        if (docId === documentId) {
          this.conversationContextMap.delete(conversationId);
          break;
        }
      }

      console.log('📋 Document closed:', documentId);
    }
  }

  /**
   * Gets all document contexts
   */
  getAllDocuments(): DocumentContext[] {
    return Array.from(this.documentHistory.values());
  }

  /**
   * Clears all contexts (for testing or reset)
   */
  clearAll(): void {
    this.activeContext = null;
    this.documentHistory.clear();
    this.conversationContextMap.clear();
    
    console.log('📋 All document contexts cleared');
  }

  /**
   * Gets document by ID
   */
  getDocumentById(documentId: string): DocumentContext | null {
    return this.documentHistory.get(documentId) || null;
  }

  /**
   * Updates document content specifically
   */
  async updateDocumentContent(documentId: string, newContent: string): Promise<boolean> {
    const document = this.documentHistory.get(documentId);
    if (document) {
      document.content = newContent;
      document.lastModified = new Date();
      
      if (this.activeContext?.id === documentId) {
        this.activeContext = document;
      }
      
      console.log('📋 Document content updated:', documentId);
      return true;
    }
    return false;
  }

  /**
   * Marks document as being edited
   */
  markDocumentAsEditing(documentId: string, conversationId: string): void {
    const document = this.documentHistory.get(documentId);
    if (document) {
      document.editingSession.active = true;
      document.editingSession.conversationId = conversationId;
      
      // Update conversation mapping
      this.conversationContextMap.set(conversationId, documentId);
      
      console.log('📋 Document marked as editing:', documentId);
    }
  }
}
