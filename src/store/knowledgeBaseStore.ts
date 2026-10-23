import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { zustandSafeStorage } from '../utils/safeStorage';
import { v4 as uuidv4 } from 'uuid';

export interface KBDocument {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
  folderId?: string;
  assistantIds?: string[]; // Which assistants have access to this document
  metadata?: Record<string, any> & {
    source?: string;
    title?: string;
    author?: string;
    date?: Date;
    category?: string;
    tags?: string[];
    size?: number;
    created_by?: string;
    ai_summary?: string;
    ai_topics?: string[];
    ai_entities?: string[];
    ai_complexity?: 'simple' | 'moderate' | 'complex';
    ai_metadata?: Record<string, any>;
  };
  lastUpdated: Date;
  status?: 'pending' | 'processing' | 'ready' | 'error';
  retryCount?: number;
  size_bytes?: number; // File size in bytes
  is_folder?: boolean; // Whether this is a folder
  is_starred?: boolean; // Whether this is starred
  shared_with?: string[]; // Who this is shared with
  updated_at?: string; // Update timestamp
  vector_document_id?: string; // Vector document ID for search
  type?: string; // Document type
  created_at?: string; // Creation timestamp
  user_id?: string; // Owner
}

export interface KBFolder {
  id: string;
  name: string;
  description?: string; // Optional description field
  assistantIds: string[];
  parentId?: string | null; // For nested folders
  parent_folder_id?: string | null; // Alternative property name for compatibility
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string; // User ID for ownership
}

interface KBState {
  documents: KBDocument[];
  folders: KBFolder[];
  initialized: boolean;
  loading: boolean;
  error: string | null;
  userId?: string; // Current user ID
  selectedDocumentId?: string | null; // Currently selected document
  documentCache: Map<string, KBDocument>;
  folderCache: Map<string, KBFolder>;
  lastSync: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  filesToUpload?: File[]; // Files to upload queue
  setFilesToUpload?: (files: File[]) => void; // Set files to upload
  aiProcessDocument?: (documentId: string) => Promise<void>; // AI process a document

  // Enhanced Actions
  loadDocuments: () => Promise<void>;
  addDocument: (doc: Omit<KBDocument, 'id' | 'lastUpdated'>) => Promise<void>;
  createNote: (note: Omit<KBDocument, 'id' | 'lastUpdated'>) => Promise<void>; // Alias for addDocument
  updateDocument: (id: string, updates: Partial<KBDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  removeDocument: (id: string) => Promise<void>; // Alias for deleteDocument
  moveDocument: (documentId: string, folderId: string | null | undefined) => Promise<void>;
  moveBatchDocuments: (documentIds: string[], folderId?: string | null) => Promise<void>;
  setSelectedDocumentId: (id: string | null) => void; // For UI state
  addFolder: (folder: Omit<KBFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<KBFolder>;
  updateFolder: (id: string, updates: Partial<KBFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  linkAssistantToFolder: (folderId: string, assistantId: string) => Promise<void>;
  unlinkAssistantFromFolder: (folderId: string, assistantId: string) => Promise<void>;
  retryFailedDocuments: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  initializeFromSupabase: () => Promise<void>;
  reset: () => void;
  healthCheck: () => Promise<boolean>;
}

export const useKnowledgeBaseStore = create<KBState>()(
  persist(
    (set, get) => ({
      documents: [],
      folders: [],
      initialized: false,
      loading: false,
      error: null,
      selectedDocumentId: null,
      documentCache: new Map(),
      folderCache: new Map(),
      lastSync: null,
      connectionStatus: 'disconnected',
      filesToUpload: [],
      setFilesToUpload: (files: File[]) => {
        set({ filesToUpload: files });
      },
      aiProcessDocument: async (documentId: string) => {
        // Placeholder implementation for AI processing
        console.log(`[KBStore] AI processing document: ${documentId}`);
        // This would call actual AI processing service
      },

      loadDocuments: async () => {
        const state = get();
        if (state.loading) {
          console.log('[KBStore] Already loading, skipping...');
          return;
        }

        set({ loading: true, error: null, connectionStatus: 'connecting' });

        try {
          console.log('[KBStore] Starting document load...');

          // Check authentication first
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw new Error(`Authentication error: ${authError.message}`);
          if (!user) throw new Error('User not authenticated');

          console.log(`[KBStore] Authenticated user: ${user.id}`);

          // Check if we need to sync (every 2 minutes for better responsiveness)
          const lastSyncTime = state.lastSync ?
            (state.lastSync instanceof Date ? state.lastSync : new Date(state.lastSync)) :
            null;

          const shouldSync = !lastSyncTime ||
            isNaN(lastSyncTime.getTime()) ||
            (new Date().getTime() - lastSyncTime.getTime()) > 2 * 60 * 1000;

          if (shouldSync) {
            console.log('[KBStore] Syncing with Supabase...');
            await get().syncWithSupabase();
          } else {
            console.log('[KBStore] Using cached data (synced recently)');
          }

          set({
            initialized: true,
            loading: false,
            connectionStatus: 'connected',
            error: null
          });

          console.log(`[KBStore] Load completed: ${get().documents.length} docs, ${get().folders.length} folders`);
        } catch (error) {
          console.error('[KBStore] Error loading documents:', error);

          const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
          set({
            error: errorMessage,
            loading: false,
            connectionStatus: 'disconnected'
          });

          // Try to use cached data if available
          if (state.documentCache.size > 0 || state.folderCache.size > 0) {
            console.log('[KBStore] Using cached data after error');
            set({
              documents: Array.from(state.documentCache.values()),
              folders: Array.from(state.folderCache.values()),
              connectionStatus: 'disconnected' // Keep disconnected status
            });
          }

          throw error;
        }
      },

      syncWithSupabase: async () => {
        try {
          console.log('[KBStore] Starting Supabase sync...');

          // Verify authentication
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!user) throw new Error('User not authenticated');

          // Load documents with error handling
          let documents: KBDocument[] = [];
          try {
            // 1. Fetch from legacy 'documents' table
            const { data: supabaseDocs, error: docsError } = await supabase
              .from('documents')
              .select('*')
              .order('created_at', { ascending: false });

            if (!docsError && supabaseDocs) {
              documents = supabaseDocs.map(doc => ({
                id: doc.id,
                title: doc.name || doc.title || 'Untitled',
                content: doc.content || '',
                embedding: doc.embedding,
                folderId: doc.folder_id,
                metadata: doc.metadata || {},
                lastUpdated: new Date(doc.updated_at || doc.created_at),
                status: doc.embedding ? 'ready' as const : 'pending' as const,
                retryCount: 0
              }));
            }

            // 2. Fetch from new 'ai_drive_files' table (Agent Output)
            const { data: driveFiles, error: driveError } = await supabase
              .from('ai_drive_files')
              .select('*')
              .eq('is_folder', false)
              .order('created_at', { ascending: false });

            if (!driveError && driveFiles) {
              const driveDocs: KBDocument[] = driveFiles.map(file => ({
                id: file.id,
                title: file.name || 'Untitled Agent Output',
                content: file.content_preview || file.ocr_text || '', // Use content_preview if available
                embedding: file.embedding,
                folderId: file.parent_id,
                metadata: {
                  ...file.ai_metadata,
                  source: 'ai_drive',
                  ai_summary: file.ai_summary,
                  ai_topics: file.ai_topics,
                  ai_entities: file.ai_entities,
                  size: file.size,
                  mime_type: file.mime_type
                },
                lastUpdated: new Date(file.updated_at || file.created_at),
                status: file.ai_confidence ? 'ready' as const : 'pending' as const,
                retryCount: 0,
                type: 'agent_artifact'
              }));

              // Merge and remove duplicates by ID
              const existingIds = new Set(documents.map(d => d.id));
              driveDocs.forEach(doc => {
                if (!existingIds.has(doc.id)) {
                  documents.push(doc);
                }
              });
            }
          } catch (docError) {
            console.error('[KBStore] Document loading error:', docError);
          }

          // Load folders with fallback handling
          let folders: KBFolder[] = [];
          try {
            // Try with assistant_ids first
            const { data: supabaseFolders, error: foldersError } = await supabase
              .from('folders')
              .select('id, name, assistant_ids, created_at, updated_at');

            if (foldersError) {
              console.warn('[KBStore] Folders query with assistant_ids failed, using fallback:', foldersError);

              // Fallback without assistant_ids column
              const { data: basicFolders, error: basicError } = await supabase
                .from('folders')
                .select('id, name, created_at, updated_at');

              if (basicError) {
                console.error('[KBStore] Basic folders query also failed:', basicError);
                // Continue with empty folders rather than failing
              } else {
                folders = (basicFolders || []).map(folder => ({
                  id: folder.id,
                  name: folder.name,
                  assistantIds: [],
                  createdAt: folder.created_at ? new Date(folder.created_at) : new Date(),
                  updatedAt: folder.updated_at ? new Date(folder.updated_at) : new Date()
                }));
              }
            } else {
              folders = (supabaseFolders || []).map(folder => ({
                id: folder.id,
                name: folder.name,
                assistantIds: Array.isArray(folder.assistant_ids) ? folder.assistant_ids : [],
                createdAt: folder.created_at ? new Date(folder.created_at) : new Date(),
                updatedAt: folder.updated_at ? new Date(folder.updated_at) : new Date()
              }));
            }

            // Also fetch folders from the new 'ai_drive_files' table
            const { data: driveFolders, error: driveFoldersError } = await supabase
              .from('ai_drive_files')
              .select('*')
              .eq('is_folder', true);

            if (!driveFoldersError && driveFolders) {
              const driveKBFolders = driveFolders.map(folder => ({
                id: folder.id,
                name: folder.name || 'Untitled Folder',
                assistantIds: [],
                parentId: folder.parent_id,
                createdAt: folder.created_at ? new Date(folder.created_at) : new Date(),
                updatedAt: folder.updated_at ? new Date(folder.updated_at) : new Date(),
                userId: folder.user_id
              }));
              
              const existingFolderIds = new Set(folders.map(f => f.id));
              driveKBFolders.forEach(f => {
                if (!existingFolderIds.has(f.id)) {
                  folders.push(f);
                }
              });
            }
          } catch (folderError) {
            console.error('[KBStore] Folder loading error:', folderError);
          }

          // Update caches
          const newDocCache = new Map<string, KBDocument>();
          const newFolderCache = new Map<string, KBFolder>();

          documents.forEach(doc => newDocCache.set(doc.id, doc));
          folders.forEach(folder => newFolderCache.set(folder.id, folder));

          set({
            documents,
            folders,
            documentCache: newDocCache,
            folderCache: newFolderCache,
            lastSync: new Date(),
            connectionStatus: 'connected'
          });

          console.log(`[KBStore] Sync completed: ${documents.length} documents, ${folders.length} folders`);
        } catch (error) {
          console.error('[KBStore] Critical sync error:', error);
          set({ connectionStatus: 'disconnected' });
          throw error;
        }
      },

      addFolder: async (folderData: Omit<KBFolder, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User must be logged in to create a folder');

          const folderId = uuidv4();
          const folder: KBFolder = {
            id: folderId,
            name: folderData.name,
            description: folderData.description,
            assistantIds: folderData.assistantIds || [],
            parentId: folderData.parentId || folderData.parent_folder_id,
            parent_folder_id: folderData.parent_folder_id || folderData.parentId,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Try to save with assistant_ids column first
          let error;
          try {
            const result = await supabase
              .from('folders')
              .insert([{
                id: folder.id,
                name: folder.name,
                user_id: user.id,
                parent_folder_id: folder.parent_folder_id,
                assistant_ids: folder.assistantIds
              }])
              .select()
              .single();
            error = result.error;
          } catch (insertError) {
            // Fallback for databases without assistant_ids column
            console.warn('[KBStore] Inserting folder without assistant_ids column');
            const result = await supabase
              .from('folders')
              .insert([{
                id: folder.id,
                name: folder.name,
                user_id: user.id,
                parent_folder_id: folder.parent_folder_id
              }])
              .select()
              .single();
            error = result.error;
          }

          if (error) throw error;

          // Update local state
          const state = get();
          state.folderCache.set(folder.id, folder);

          set(state => ({
            folders: [...state.folders, folder],
            folderCache: state.folderCache
          }));

          console.log(`[KBStore] Added folder: ${folder.name} (${folder.id})`);
          return folder;
        } catch (error) {
          console.error('[KBStore] Error adding folder:', error);
          throw error;
        }
      },

      updateFolder: async (id: string, updates: Partial<KBFolder>) => {
        try {
          const updateData: any = {};
          if (updates.name !== undefined) updateData.name = updates.name;
          if (updates.assistantIds !== undefined) updateData.assistant_ids = updates.assistantIds;

          const { error } = await supabase
            .from('folders')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

          // Update local state
          const state = get();
          const existingFolder = state.folderCache.get(id);
          if (existingFolder) {
            const updatedFolder = {
              ...existingFolder,
              ...updates,
              updatedAt: new Date()
            };
            state.folderCache.set(id, updatedFolder);
          }

          set(state => ({
            folders: state.folders.map(folder =>
              folder.id === id ? { ...folder, ...updates, updatedAt: new Date() } : folder
            ),
            folderCache: state.folderCache
          }));

          console.log(`[KBStore] Updated folder: ${id}`);
        } catch (error) {
          console.error('[KBStore] Error updating folder:', error);
          throw error;
        }
      },

      deleteFolder: async (id: string) => {
        try {
          const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Update local state
          const state = get();
          state.folderCache.delete(id);

          set(state => ({
            folders: state.folders.filter(folder => folder.id !== id),
            folderCache: state.folderCache
          }));

          console.log(`[KBStore] Deleted folder: ${id}`);
        } catch (error) {
          console.error('[KBStore] Error deleting folder:', error);
          throw error;
        }
      },

      linkAssistantToFolder: async (folderId: string, assistantId: string) => {
        const state = get();
        const folder = state.folders.find(f => f.id === folderId);
        if (!folder) throw new Error('Folder not found');

        const updatedAssistantIds = [...new Set([...folder.assistantIds, assistantId])];
        await get().updateFolder(folderId, { assistantIds: updatedAssistantIds });
      },

      unlinkAssistantFromFolder: async (folderId: string, assistantId: string) => {
        const state = get();
        const folder = state.folders.find(f => f.id === folderId);
        if (!folder) throw new Error('Folder not found');

        const updatedAssistantIds = folder.assistantIds.filter(id => id !== assistantId);
        await get().updateFolder(folderId, { assistantIds: updatedAssistantIds });
      },

      addDocument: async (docData: Omit<KBDocument, 'id' | 'lastUpdated'>) => {
        try {
          let user: any = null;
          try {
            const authRes = await supabase.auth.getUser();
            user = authRes.data?.user;
          } catch {
            // Ignore auth lookup error in offline/demo mode
          }

          const docId = (docData as any).id || uuidv4();
          const doc: KBDocument = {
            id: docId,
            title: docData.title,
            content: docData.content,
            embedding: docData.embedding,
            folderId: docData.folderId,
            metadata: docData.metadata || {},
            lastUpdated: new Date(),
            status: docData.status || 'pending',
            retryCount: docData.retryCount || 0
          };

          if (user) {
            try {
              const { error } = await supabase
                .from('documents')
                .insert([{
                  id: doc.id,
                  user_id: user.id,
                  name: doc.title,
                  content: doc.content,
                  embedding: doc.embedding,
                  folder_id: doc.folderId,
                  metadata: doc.metadata,
                  type: 'text'
                }]);

              if (error) {
                console.warn('[KBStore] Remote persistence note:', error.message);
              }
            } catch (err) {
              console.warn('[KBStore] Remote persistence bypass:', err);
            }
          }

          // Update local state
          const state = get();
          state.documentCache.set(doc.id, doc);

          set(state => ({
            documents: [...state.documents.filter(d => d.id !== doc.id), doc],
            documentCache: state.documentCache
          }));

          console.log(`[KBStore] Added document: ${doc.title} (${doc.id})`);
          return doc;
        } catch (error) {
          console.error('[KBStore] Error adding document:', error);
          throw error;
        }
      },

      createNote: async (noteData: Omit<KBDocument, 'id' | 'lastUpdated'>) => {
        // createNote is an alias for addDocument for better semantic clarity
        return get().addDocument(noteData);
      },

      updateDocument: async (id: string, updates: Partial<KBDocument>) => {
        try {
          const state = get();
          const existingDoc = state.documents.find(d => d.id === id) || state.documentCache.get(id);
          const isDriveDoc = existingDoc?.type === 'agent_artifact' || existingDoc?.metadata?.source === 'ai_drive';

          if (isDriveDoc) {
            const driveUpdateData: any = {};
            if (updates.title !== undefined) driveUpdateData.name = updates.title;
            if (updates.content !== undefined) driveUpdateData.content_preview = updates.content;
            if (updates.embedding !== undefined) driveUpdateData.embedding = updates.embedding;
            if (updates.folderId !== undefined) driveUpdateData.parent_id = updates.folderId;
            if (updates.metadata !== undefined) driveUpdateData.ai_metadata = updates.metadata;

            if (Object.keys(driveUpdateData).length > 0) {
              const { error } = await supabase
                .from('ai_drive_files')
                .update(driveUpdateData)
                .eq('id', id);

              if (error) throw error;
            }
          } else {
            const updateData: any = {};
            if (updates.title !== undefined) updateData.name = updates.title;
            if (updates.content !== undefined) updateData.content = updates.content;
            if (updates.embedding !== undefined) updateData.embedding = updates.embedding;
            if (updates.folderId !== undefined) updateData.folder_id = updates.folderId;
            if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

            const { error } = await supabase
              .from('documents')
              .update(updateData)
              .eq('id', id);

            if (error) throw error;
          }

          // Update local state
          const currentState = get();
          const cachedDoc = currentState.documentCache.get(id);
          if (cachedDoc) {
            const updatedDoc = {
              ...cachedDoc,
              ...updates,
              lastUpdated: new Date()
            };
            currentState.documentCache.set(id, updatedDoc);
          }

          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === id ? { ...doc, ...updates, lastUpdated: new Date() } : doc
            ),
            documentCache: state.documentCache
          }));

          console.log(`[KBStore] Updated document: ${id}`);
        } catch (error) {
          console.error('[KBStore] Error updating document:', error);
          throw error;
        }
      },

      deleteDocument: async (id: string) => {
        try {
          const state = get();
          const existingDoc = state.documents.find(d => d.id === id) || state.documentCache.get(id);
          const isDriveDoc = existingDoc?.type === 'agent_artifact' || existingDoc?.metadata?.source === 'ai_drive';

          if (isDriveDoc) {
            const { error } = await supabase
              .from('ai_drive_files')
              .delete()
              .eq('id', id);

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('documents')
              .delete()
              .eq('id', id);

            if (error) throw error;
          }

          // Update local state
          const currentState = get();
          currentState.documentCache.delete(id);

          set(state => ({
            documents: state.documents.filter(doc => doc.id !== id),
            documentCache: state.documentCache
          }));

          console.log(`[KBStore] Deleted document: ${id}`);
        } catch (error) {
          console.error('[KBStore] Error deleting document:', error);
          throw error;
        }
      },

      retryFailedDocuments: async () => {
        const state = get();
        const failedDocs = state.documents.filter(
          doc => doc.status === 'error' && (doc.retryCount || 0) < 3
        );

        console.log(`[KBStore] Retrying ${failedDocs.length} failed documents`);

        for (const doc of failedDocs) {
          try {
            await get().updateDocument(doc.id, {
              status: 'pending',
              retryCount: (doc.retryCount || 0) + 1
            });
          } catch (error) {
            console.error(`[KBStore] Error retrying document ${doc.id}:`, error);
          }
        }
      },

      initializeFromSupabase: async () => {
        try {
          await get().syncWithSupabase();
          set({ initialized: true });
          console.log('[KBStore] Initialization completed');
        } catch (error) {
          console.error('[KBStore] Initialization failed:', error);
          throw error;
        }
      },

      healthCheck: async () => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) return false;

          // Test basic connectivity
          const { error: testError } = await supabase.from('folders').select('count').limit(1);
          return !testError;
        } catch {
          return false;
        }
      },

      // Missing methods that are called by other services
      removeDocument: async (id: string) => {
        try {
          await get().deleteDocument(id);
          console.log(`[KBStore] Removed document: ${id}`);
        } catch (error) {
          console.error('[KBStore] Error removing document:', error);
          throw error;
        }
      },

      moveDocument: async (documentId: string, folderId: string | null | undefined) => {
        try {
          const targetFolderId = folderId || null;
          await get().updateDocument(documentId, { folderId: targetFolderId });
          console.log(`[KBStore] Moved document ${documentId} to folder ${targetFolderId}`);
        } catch (error) {
          console.error('[KBStore] Error moving document:', error);
          throw error;
        }
      },

      moveBatchDocuments: async (documentIds: string[], folderId?: string | null) => {
        try {
          const targetFolderId = folderId || null;
          const promises = documentIds.map(id => get().updateDocument(id, { folderId: targetFolderId }));
          await Promise.all(promises);
          console.log(`[KBStore] Moved ${documentIds.length} documents to folder ${targetFolderId || 'root'}`);
        } catch (error) {
          console.error('[KBStore] Error moving batch documents:', error);
          throw error;
        }
      },

      setSelectedDocumentId: (id: string | null) => {
        set({ selectedDocumentId: id });
      },

      reset: () => {
        set({
          documents: [],
          folders: [],
          initialized: false,
          loading: false,
          error: null,
          documentCache: new Map(),
          folderCache: new Map(),
          lastSync: null,
          connectionStatus: 'disconnected'
        });
        console.log('[KBStore] Store reset completed');
      }
    }),
    {
      name: 'knowledge-base-store',
      version: 2, // Increment version for cache invalidation
      storage: zustandSafeStorage as any, // Type assertion to bypass storage type issues
      partialize: (state) => ({
        documents: state.documents.slice(0, 100), // Increased limit
        folders: state.folders,
        lastSync: state.lastSync,
        initialized: state.initialized,
        loading: false,
        error: null,
        selectedDocumentId: state.selectedDocumentId,
        userId: state.userId,
        documentCache: new Map(),
        folderCache: new Map(),
        connectionStatus: 'disconnected' as const,
        filesToUpload: [],
        // Required methods (will be rehydrated)
        loadDocuments: state.loadDocuments,
        addDocument: state.addDocument,
        createNote: state.createNote,
        updateDocument: state.updateDocument,
        deleteDocument: state.deleteDocument,
        removeDocument: state.removeDocument,
        moveDocument: state.moveDocument,
        moveBatchDocuments: state.moveBatchDocuments,
        setSelectedDocumentId: state.setSelectedDocumentId,
        setFilesToUpload: state.setFilesToUpload,
        aiProcessDocument: state.aiProcessDocument,
        addFolder: state.addFolder,
        updateFolder: state.updateFolder,
        deleteFolder: state.deleteFolder,
        linkAssistantToFolder: state.linkAssistantToFolder,
        unlinkAssistantFromFolder: state.unlinkAssistantFromFolder,
        retryFailedDocuments: state.retryFailedDocuments,
        syncWithSupabase: state.syncWithSupabase,
        initializeFromSupabase: state.initializeFromSupabase,
        healthCheck: state.healthCheck,
        reset: state.reset
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[KBStore] Successfully rehydrated from storage');
          // Reinitialize caches as Maps since they don't serialize
          state.documentCache = new Map();
          state.folderCache = new Map();
          state.loading = false;
          state.error = null;
          state.connectionStatus = 'disconnected'; // Will be updated on next sync
        } else {
          console.warn('[KBStore] Failed to rehydrate - starting with empty state');
        }
      }
    }
  )
);

// Export a helper function to initialize the store
export const initializeKnowledgeBase = async () => {
  const store = useKnowledgeBaseStore.getState();
  if (!store.initialized) {
    try {
      await store.loadDocuments();
    } catch (error) {
      console.error('[KBStore] Failed to initialize:', error);
      // Don't throw to allow app to continue with cached data
    }
  }
};
