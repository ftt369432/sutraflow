/**
 * Conversation State Management for Canvas Surgical Editing
 * 
 * Manages conversation-document locking to prevent accidental new document creation
 * when users are continuing to work on existing documents.
 */

export interface ConversationSession {
  conversationId: string;
  activeDocumentId: string | null;
  editingMode: boolean;
  lastActivity: number;
  documentType: string;
  lockReason: string;
}

export class ConversationState {
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Locks a conversation to a specific document for continued editing
   */
  lockToDocument(conversationId: string, documentId: string, documentType: string, reason: string = 'Document editing started'): void {
    console.log('🔒 Locking conversation to document:', {
      conversationId,
      documentId,
      documentType,
      reason
    });

    this.sessions.set(conversationId, {
      conversationId,
      activeDocumentId: documentId,
      editingMode: true,
      lastActivity: Date.now(),
      documentType,
      lockReason: reason
    });
  }

  /**
   * Updates activity timestamp for an active session
   */
  updateActivity(conversationId: string): void {
    const session = this.sessions.get(conversationId);
    if (session) {
      session.lastActivity = Date.now();
      console.log('⏰ Updated conversation activity:', conversationId);
    }
  }

  /**
   * Checks if conversation should continue editing existing document
   */
  shouldContinueEditing(conversationId: string): boolean {
    const session = this.sessions.get(conversationId);
    
    if (!session || !session.editingMode || !session.activeDocumentId) {
      return false;
    }

    const timeSinceLastEdit = Date.now() - session.lastActivity;
    const isWithinTimeout = timeSinceLastEdit < this.SESSION_TIMEOUT;

    console.log('🔍 Checking if should continue editing:', {
      conversationId,
      hasActiveDocument: !!session.activeDocumentId,
      editingMode: session.editingMode,
      timeSinceLastEdit: Math.round(timeSinceLastEdit / 1000) + 's',
      withinTimeout: isWithinTimeout,
      shouldContinue: isWithinTimeout
    });

    if (!isWithinTimeout) {
      console.log('⏱️ Session timeout reached, releasing document lock');
      this.releaseDocument(conversationId);
      return false;
    }

    return true;
  }

  /**
   * Gets the active document for a conversation
   */
  getActiveDocument(conversationId: string): string | null {
    const session = this.sessions.get(conversationId);
    return session?.activeDocumentId || null;
  }

  /**
   * Gets session info for debugging/UI
   */
  getSessionInfo(conversationId: string): ConversationSession | null {
    return this.sessions.get(conversationId) || null;
  }

  /**
   * Clear conversation state for multi-document requests
   */
  clearConversationState(conversationId: string, reason: string = 'Multi-document request'): void {
    console.log('🧹 Clearing conversation state:', { conversationId, reason });
    this.sessions.delete(conversationId);
  }

  /**
   * Clear all conversation states (for debugging)
   */
  clearAllStates(): void {
    console.log('🧹 Clearing all conversation states');
    this.sessions.clear();
  }

  /**
   * Explicitly releases document lock (user wants new document)
   */
  releaseDocument(conversationId: string, reason: string = 'User requested new document'): void {
    const session = this.sessions.get(conversationId);
    if (session) {
      console.log('🔓 Releasing document lock:', {
        conversationId,
        documentId: session.activeDocumentId,
        reason
      });
      
      session.editingMode = false;
      session.activeDocumentId = null;
      session.lockReason = reason;
    }
  }

  /**
   * Checks if user input explicitly requests new document creation
   */
  isNewDocumentRequest(userInput: string): boolean {
    const newDocumentKeywords = [
      'create new', 'new document', 'start fresh', 'new petition',
      'new motion', 'new brief', 'create a new', 'start a new',
      'begin new', 'fresh document', 'new file'
    ];

    const input = userInput.toLowerCase();
    return newDocumentKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Checks if user input indicates continuation of existing work
   */
  isContinuationRequest(userInput: string): boolean {
    const continuationKeywords = [
      'put that in', 'add that to', 'include that', 'put all that',
      'add it to', 'update with', 'continue with', 'keep working',
      'add this to', 'put this in', 'append to', 'insert into'
    ];

    const input = userInput.toLowerCase();
    return continuationKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Cleanup expired sessions (housekeeping)
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [conversationId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(conversationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired conversation sessions`);
    }
  }

  /**
   * Gets all active sessions (for debugging)
   */
  getActiveSessions(): ConversationSession[] {
    this.cleanupExpiredSessions();
    return Array.from(this.sessions.values()).filter(s => s.editingMode);
  }
}

// Singleton instance
let conversationStateInstance: ConversationState | null = null;

export function getConversationState(): ConversationState {
  if (!conversationStateInstance) {
    conversationStateInstance = new ConversationState();
  }
  return conversationStateInstance;
}

export function resetConversationState(): void {
  conversationStateInstance = null;
}