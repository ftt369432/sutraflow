import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIAssistant, AIFolder, AIDocument } from '../types/ai';
import { useKnowledgeBaseStore } from './knowledgeBaseStore';
import {
  getAssistants as getAssistantsAPI,
  createAssistant as createAssistantAPI,
  updateAssistant as updateAssistantAPI,
  deleteAssistant as deleteAssistantAPI,
  defaultAssistants,
} from '../services/assistantService';
import { AssistantPricingService } from '../services/AssistantPricingService';

// Type for folders without document details - extend from AIFolder but make documents optional
interface FolderWithoutDocs extends Omit<AIFolder, 'documents'> {
  documents?: never;
}

interface AssistantState {
  assistants: AIAssistant[];
  loading: boolean;
  error: string | null;
  fetchAssistants: () => Promise<void>;
  addAssistant: (assistant: Omit<AIAssistant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAssistant: (id: string, updates: Partial<AIAssistant>) => Promise<void>;
  removeAssistant: (id: string) => Promise<void>;
  getAssistantById: (id: string) => AIAssistant | undefined;
  linkFolderToAssistant: (assistantId: string, folderId: string) => Promise<void>;
  assignFolderToAssistant: (assistantId: string, folderId: string) => Promise<void>; // Alias for script compatibility
  unlinkFolderFromAssistant: (assistantId: string, folderId: string) => Promise<void>;
  bulkLinkFolders: (assistantId: string, folders: FolderWithoutDocs[]) => Promise<void>;
  getAssistantFolders: (assistantId: string) => string[];
  // Tier management methods
  getFreeAssistants: () => AIAssistant[];
  getPremiumAssistants: () => AIAssistant[];
  getAssistantsByCategory: (category: string) => AIAssistant[];
  getAssistantPrice: (assistantName: string, isAddOn?: boolean) => number;
  validateUserAccess: (assistantId: string, userTier: string) => boolean;
  revertToSnapshot: (assistantId: string, snapshotId: string) => Promise<void>;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: [],
      loading: false,
      error: null,

      fetchAssistants: async () => {
        set({ loading: true, error: null });
        try {
          const assistants = await getAssistantsAPI();
          set({ assistants, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      addAssistant: async (assistant) => {
        try {
          const newAssistant = await createAssistantAPI(assistant);
          set((state) => ({ assistants: [...state.assistants, newAssistant] }));
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      updateAssistant: async (id, updates) => {
        try {
          const current = get().assistants.find(a => a.id === id);
          let updatedUpdates = { ...updates };
          
          if (current) {
            // Check if critical settings are changing
            const hasCriticalChanges = 
              (updates.system_prompt !== undefined && updates.system_prompt !== current.system_prompt) ||
              (updates.capabilities !== undefined && JSON.stringify(updates.capabilities) !== JSON.stringify(current.capabilities)) ||
              (updates.name !== undefined && updates.name !== current.name) ||
              (updates.description !== undefined && updates.description !== current.description);

            if (hasCriticalChanges) {
              // Create a snapshot of the current state BEFORE applying changes
              const snapshot = {
                id: `snapshot-${Date.now()}`,
                timestamp: new Date().toISOString(),
                name: current.name,
                description: current.description || '',
                system_prompt: current.system_prompt || '',
                capabilities: current.capabilities || [],
                changeDescription: (updates.metadata?.changeReason as string) || 'System settings updated'
              };

              const existingMetadata = current.metadata || {};
              const existingSnapshots = (existingMetadata.snapshots as any[]) || [];
              
              // Keep last 15 snapshots
              const newSnapshots = [snapshot, ...existingSnapshots].slice(0, 15);
              
              updatedUpdates.metadata = {
                ...existingMetadata,
                snapshots: newSnapshots
              };
            }
          }

          const updatedAssistant = await updateAssistantAPI(id, updatedUpdates);
          set((state) => ({
            assistants: state.assistants.map((a) => (a.id === id ? updatedAssistant : a)),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      revertToSnapshot: async (assistantId, snapshotId) => {
        try {
          const assistant = get().assistants.find(a => a.id === assistantId);
          if (!assistant) throw new Error("Assistant not found");

          const snapshots = (assistant.metadata?.snapshots as any[]) || [];
          const targetSnapshot = snapshots.find(s => s.id === snapshotId);
          if (!targetSnapshot) throw new Error("Snapshot not found");

          // Restore settings from snapshot
          const updates = {
            name: targetSnapshot.name,
            description: targetSnapshot.description,
            system_prompt: targetSnapshot.system_prompt,
            capabilities: targetSnapshot.capabilities,
            metadata: {
              ...assistant.metadata,
              lastRevertTimestamp: new Date().toISOString()
            }
          };

          const updatedAssistant = await updateAssistantAPI(assistantId, updates);
          set((state) => ({
            assistants: state.assistants.map((a) => (a.id === assistantId ? updatedAssistant : a)),
          }));
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      removeAssistant: async (id) => {
        try {
          await deleteAssistantAPI(id);
          set((state) => ({ assistants: state.assistants.filter((a) => a.id !== id) }));
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      getAssistantById: (id) => {
        if (!id) return undefined;
        const normalized = id.toLowerCase().replace(/^asst-/, '').replace(/[_-]/g, ' ');
        const found = get().assistants.find((a) => 
          a.id === id || 
          a.id === `asst-${id}` || 
          id === `asst-${a.id}` || 
          a.name.toLowerCase() === normalized ||
          a.name.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase().replace(/^asst-/, '')
        );
        if (found) return found;

        // Fallback to default fleet so built-in assistants (e.g. Legal Eagle) always resolve
        const defaultMatch = defaultAssistants.find(a => 
          `asst-${a.name.toLowerCase().replace(/\s+/g, '-')}` === id ||
          a.name.toLowerCase() === normalized ||
          a.name.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase().replace(/^asst-/, '')
        );
        if (defaultMatch) {
          return {
            id,
            name: defaultMatch.name,
            description: defaultMatch.description,
            system_prompt: defaultMatch.system_prompt,
            isActive: defaultMatch.isActive,
            avatar: defaultMatch.avatar,
            metadata: defaultMatch.metadata,
            capabilities: defaultMatch.capabilities,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as AIAssistant;
        }
        return undefined;
      },

      assignFolderToAssistant: async (assistantId, folderId) => {
        // Alias for linkFolderToAssistant to support existing utility scripts
        return get().linkFolderToAssistant(assistantId, folderId);
      },

      getAssistantFolders: (assistantId: string): string[] => {
        const assistant = get().assistants.find((a) => a.id === assistantId);
        if (!assistant) {
          console.error(`[assistantStore] Assistant with ID ${assistantId} not found.`);
          return [];
        }

        // Get folder IDs from knowledgeBase (primary source)
        if (assistant.knowledgeBase && assistant.knowledgeBase.length > 0) {
          const folderIds = assistant.knowledgeBase.map(folder => folder.id);
          console.log(`[assistantStore] Found ${folderIds.length} folders for assistant: ${assistant.name}`);
          return folderIds;
        }

        // Fallback to linkedFolders (legacy field)
        if (assistant.linkedFolders && assistant.linkedFolders.length > 0) {
          console.log(`[assistantStore] Using legacy linkedFolders for assistant: ${assistant.name}`);
          return [...assistant.linkedFolders]; // Return a copy to avoid mutations
        }

        return [];
      },

      linkFolderToAssistant: async (assistantId, folderId) => {
        const state = get();
        const assistant = state.assistants.find(a => a.id === assistantId);

        if (!assistant) {
          const errorMsg = `[DEBUG] ❌ Assistant ${assistantId} not found in state!`;
          console.error(errorMsg);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }

        const knowledgeBaseStore = useKnowledgeBaseStore.getState();
        const folder = knowledgeBaseStore.folders.find((f) => f.id === folderId);

        if (!folder) {
          const errorMsg = `[DEBUG] ❌ Folder ${folderId} not found in knowledgeBaseStore`;
          console.error(errorMsg);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }

        const isAlreadyLinked =
          (assistant.knowledgeBase?.some(f => f.id === folderId)) ||
          (assistant.linkedFolders?.includes(folderId));

        if (isAlreadyLinked) {
          console.log(`[DEBUG] 🔄 Folder ${folderId} already linked to assistant ${assistantId}, skipping update.`);
          return;
        }

        const folderForKnowledgeBase: AIFolder = {
          id: folder.id,
          name: folder.name,
          documents: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          parent_folder_id: null
        };

        const updatedKnowledgeBase = [...(assistant.knowledgeBase || []), folderForKnowledgeBase];
        const updatedLinkedFolders = [...new Set([...(assistant.linkedFolders || []), folderId])];

        try {
          console.log(`[DEBUG] 🔄 Calling updateAssistantAPI for linking`);
          console.log(`[DEBUG] 📊 Payload size:`, 
            JSON.stringify({ knowledgeBase: updatedKnowledgeBase, linkedFolders: updatedLinkedFolders }).length, 
            'bytes');
          
          const startTime = Date.now();
          const updatedAssistant = await updateAssistantAPI(assistantId, {
            knowledgeBase: updatedKnowledgeBase,
            linkedFolders: updatedLinkedFolders,
          });
          const endTime = Date.now();
          
          console.log(`[DEBUG] ⏱️ API call took ${endTime - startTime}ms`);
          console.log(`[DEBUG] ✅ API call successful. Updating store.`);
          
          set(state => ({
            assistants: state.assistants.map((a) =>
              a.id === assistantId ? updatedAssistant : a
            ),
            error: null,
          }));
          console.log(`[DEBUG] 🏁 Completed linkFolderToAssistant`);
          // Return void as per interface
        } catch (error) {
          const errorMsg = `[DEBUG] ❌ Error linking folder via API: ${(error as Error).message}`;
          console.error(errorMsg, error);
          set({ error: errorMsg });
          throw error;
        }
      },

      unlinkFolderFromAssistant: async (assistantId, folderId) => {
        const state = get();
        const assistant = state.assistants.find(a => a.id === assistantId);

        if (!assistant) {
          const errorMsg = `[DEBUG] ❌ Assistant ${assistantId} not found in state!`;
          console.error(errorMsg);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }

        const updatedKnowledgeBase = assistant.knowledgeBase?.filter(f => f.id !== folderId) || [];
        const updatedLinkedFolders = assistant.linkedFolders?.filter(id => id !== folderId) || [];

        try {
          console.log(`[DEBUG] 🔄 Calling updateAssistantAPI for unlinking`);
          console.log(`[DEBUG] 📊 Payload size:`, 
            JSON.stringify({ knowledgeBase: updatedKnowledgeBase, linkedFolders: updatedLinkedFolders }).length, 
            'bytes');
          
          const startTime = Date.now();
          const updatedAssistant = await updateAssistantAPI(assistantId, {
            knowledgeBase: updatedKnowledgeBase,
            linkedFolders: updatedLinkedFolders,
          });
          const endTime = Date.now();
          
          console.log(`[DEBUG] ⏱️ API call took ${endTime - startTime}ms`);
          console.log(`[DEBUG] ✅ API call successful. Updating store.`);
          
          set(state => ({
            assistants: state.assistants.map((a) =>
              a.id === assistantId ? updatedAssistant : a
            ),
            error: null,
          }));
          console.log(`[DEBUG] 🏁 Completed unlinkFolderFromAssistant`);
          // Return void as per interface
        } catch (error) {
          const errorMsg = `[DEBUG] ❌ Error unlinking folder via API: ${(error as Error).message}`;
          console.error(errorMsg, error);
          set({ error: errorMsg });
          throw error;
        }
      },

      bulkLinkFolders: async (assistantId, folders) => {
        const state = get();
        const assistant = state.assistants.find(a => a.id === assistantId);

        if (!assistant) {
          const errorMsg = `[DEBUG] ❌ Assistant ${assistantId} not found in state!`;
          console.error(errorMsg);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }

        const knowledgeBaseStore = useKnowledgeBaseStore.getState();
        // Map folders and filter out any that don't exist in the knowledge base
        const validFolders = folders
          .map(folder => {
            const fullFolder = knowledgeBaseStore.folders.find(f => f.id === folder.id);
            if (!fullFolder) {
              console.warn(`[DEBUG] ❌ Folder ${folder.id} not found in knowledge base, skipping.`);
              return null;
            }
            return {
              id: fullFolder.id,
              name: fullFolder.name,
              documents: [] as AIDocument[], // Explicitly type as AIDocument[]
              createdAt: new Date(),
              updatedAt: new Date(),
              parent_folder_id: null,
            } as AIFolder; // Cast the result to AIFolder
          })
          .filter((f): f is AIFolder => f !== null);

        if (validFolders.length === 0) {
          const errorMsg = '[DEBUG] ❌ No valid folders to link.';
          console.error(errorMsg);
          set({ error: errorMsg });
          throw new Error(errorMsg);
        }

        const updatedLinkedFolders = validFolders.map(f => f.id);

        try {
          console.log(`[DEBUG] 🔄 Calling updateAssistantAPI for bulk linking`);
          const updatedAssistant = await updateAssistantAPI(assistantId, {
            knowledgeBase: validFolders,
            linkedFolders: updatedLinkedFolders,
          });

          console.log(`[DEBUG] ✅ API call successful. Updating store.`);
          set(state => ({
            assistants: state.assistants.map((a) =>
              a.id === assistantId ? updatedAssistant : a
            ),
            error: null,
          }));
          console.log(`[DEBUG] 🏁 Completed bulkLinkFolders`);
        } catch (error) {
          const errorMsg = `[DEBUG] ❌ Error bulk linking folders via API: ${(error as Error).message}`;
          console.error(errorMsg, error);
          set({ error: errorMsg });
          throw error;
        }
      },
      
      // 🎯 Tier Management Methods
      getFreeAssistants: () => {
        return get().assistants.filter(assistant => 
          assistant.metadata?.tier === 'free'
        );
      },

      getPremiumAssistants: () => {
        return get().assistants.filter(assistant => 
          assistant.metadata?.tier === 'premium'
        );
      },

      getAssistantsByCategory: (category: string) => {
        return get().assistants.filter(assistant => 
          assistant.metadata?.category === category
        );
      },

      getAssistantPrice: (assistantName: string, isAddOn = false) => {
        const assistant = get().assistants.find(a => a.name === assistantName);
        if (!assistant?.metadata) return 0;
        
        const priceKey = isAddOn ? 'addOnPrice' : 'basePrice';
        return assistant.metadata[priceKey] as number || 0;
      },

      validateUserAccess: (assistantId: string, userTier: string) => {
        const assistant = get().getAssistantById(assistantId);
        if (!assistant) return false;
        
        // Free tier can only access free assistants
        if (userTier === 'free') {
          return assistant.metadata?.tier === 'free';
        }
        
        // Premium and enterprise can access all
        return true;
      },
    }),
    {
      name: 'assistant-storage',
    }
  )
);
