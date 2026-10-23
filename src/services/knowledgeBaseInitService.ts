// Knowledge Base Initialization Service
// Ensures secure and reliable loading of knowledge base data

import { useKnowledgeBaseStore, initializeKnowledgeBase } from '../store/knowledgeBaseStore';
import { supabase } from '../lib/supabase';

export class KnowledgeBaseInitService {
  private static instance: KnowledgeBaseInitService;
  private initialized = false;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  static getInstance(): KnowledgeBaseInitService {
    if (!KnowledgeBaseInitService.instance) {
      KnowledgeBaseInitService.instance = new KnowledgeBaseInitService();
    }
    return KnowledgeBaseInitService.instance;
  }

  /**
   * Initialize knowledge base with retry logic and health checks
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log('[KBInit] Already initialized');
      return true;
    }

    console.log('[KBInit] Starting knowledge base initialization...');

    while (this.retryCount < this.maxRetries) {
      try {
        // Check authentication first
        await this.verifyAuthentication();
        
        // Check database connectivity
        await this.checkDatabaseHealth();
        
        // Initialize knowledge base store
        await this.initializeStore();
        
        // Verify data loaded
        await this.verifyDataLoaded();
        
        this.initialized = true;
        this.retryCount = 0;
        
        console.log('[KBInit] ✅ Knowledge base initialized successfully');
        return true;
        
      } catch (error) {
        this.retryCount++;
        const isLastAttempt = this.retryCount >= this.maxRetries;
        
        console.error(`[KBInit] Initialization attempt ${this.retryCount} failed:`, error);
        
        if (isLastAttempt) {
          console.error('[KBInit] ❌ All initialization attempts failed');
          return false;
        }
        
        console.log(`[KBInit] Retrying in ${this.retryDelay}ms... (${this.retryCount}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        
        // Exponential backoff
        this.retryDelay *= 1.5;
      }
    }
    
    return false;
  }

  /**
   * Verify user is authenticated
   */
  private async verifyAuthentication(): Promise<void> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(`Authentication check failed: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log(`[KBInit] ✅ User authenticated: ${user.id}`);
  }

  /**
   * Check database connectivity and table access
   */
  private async checkDatabaseHealth(): Promise<void> {
    try {
      // Test folders table
      const { error: foldersError } = await supabase
        .from('folders')
        .select('count')
        .limit(1);
      
      if (foldersError) {
        console.warn('[KBInit] Folders table access issue:', foldersError);
        // Don't fail completely - continue with limited functionality
      } else {
        console.log('[KBInit] ✅ Folders table accessible');
      }
      
      // Test documents table
      const { error: docsError } = await supabase
        .from('documents')
        .select('count')
        .limit(1);
      
      if (docsError) {
        console.warn('[KBInit] Documents table access issue:', docsError);
        // Don't fail completely - continue with limited functionality
      } else {
        console.log('[KBInit] ✅ Documents table accessible');
      }
      
    } catch (error) {
      console.warn('[KBInit] Database health check encountered issues:', error);
      // Don't throw - allow initialization to continue
    }
  }

  /**
   * Initialize the knowledge base store
   */
  private async initializeStore(): Promise<void> {
    try {
      await initializeKnowledgeBase();
      console.log('[KBInit] ✅ Store initialized');
    } catch (error) {
      console.error('[KBInit] Store initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify that data was loaded successfully
   */
  private async verifyDataLoaded(): Promise<void> {
    const store = useKnowledgeBaseStore.getState();
    
    if (!store.initialized) {
      throw new Error('Store not marked as initialized');
    }
    
    console.log(`[KBInit] ✅ Data verification: ${store.folders.length} folders, ${store.documents.length} documents`);
    
    // Check for critical errors
    if (store.error) {
      console.warn(`[KBInit] Store has error state: ${store.error}`);
      // Don't fail completely - the error might be recoverable
    }
    
    // Check connection status
    if (store.connectionStatus === 'disconnected') {
      console.warn('[KBInit] Store is disconnected but proceeding with cached data');
    }
  }

  /**
   * Force refresh the knowledge base
   */
  async forceRefresh(): Promise<boolean> {
    console.log('[KBInit] Force refreshing knowledge base...');
    
    try {
      const store = useKnowledgeBaseStore.getState();
      await store.syncWithSupabase();
      
      console.log('[KBInit] ✅ Force refresh completed');
      return true;
    } catch (error) {
      console.error('[KBInit] Force refresh failed:', error);
      return false;
    }
  }

  /**
   * Reset and reinitialize
   */
  async reset(): Promise<boolean> {
    console.log('[KBInit] Resetting knowledge base...');
    
    const store = useKnowledgeBaseStore.getState();
    store.reset();
    
    this.initialized = false;
    this.retryCount = 0;
    this.retryDelay = 2000;
    
    return await this.initialize();
  }

  /**
   * Get current status
   */
  getStatus(): {
    initialized: boolean;
    retryCount: number;
    storeStatus: {
      folders: number;
      documents: number;
      connectionStatus: string;
      error: string | null;
    };
  } {
    const store = useKnowledgeBaseStore.getState();
    
    return {
      initialized: this.initialized,
      retryCount: this.retryCount,
      storeStatus: {
        folders: store.folders.length,
        documents: store.documents.length,
        connectionStatus: store.connectionStatus,
        error: store.error
      }
    };
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.initialized = false;
    this.retryCount = 0;
    this.retryDelay = 2000;
    console.log('[KBInit] Cleanup completed');
  }
}

// Export singleton instance
export const knowledgeBaseInitService = KnowledgeBaseInitService.getInstance();

// Auto-initialize on module load if user is authenticated
export const autoInitializeKnowledgeBase = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Initialize in background without blocking
      knowledgeBaseInitService.initialize().catch(error => {
        console.warn('[KBInit] Background initialization failed:', error);
      });
    }
  } catch (error) {
    console.warn('[KBInit] Auto-initialization check failed:', error);
  }
};
