import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Notebook as NotebookType, NotebookSection, NotebookBlock } from '../types/notebook';
import { generateNotebookResponse, analyzeNotebook } from '../services/ai/notebookAI';

interface NotebookStore {
  notebooks: NotebookType[];
  activeNotebookId: string | null;
  activeNoteId: string | null;
  isLoading: boolean;
  error: string | null;
  selectedNotebook: NotebookType | null;
  
  // Actions
  createNotebook: (
    title: string, 
    description: string, 
    templateData?: {
      sections?: Record<string, unknown>[];
    tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ) => Promise<void>;
  updateNotebook: (id: string, updates: Partial<NotebookType>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  selectNotebook: (id: string) => void;
  addSection: (notebookId: string, title: string) => Promise<void>;
  updateSection: (notebookId: string, sectionId: string, updates: Partial<NotebookSection>) => Promise<void>;
  deleteSection: (notebookId: string, sectionId: string) => Promise<void>;
  addBlock: (notebookId: string, sectionId: string, block: Omit<NotebookBlock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBlock: (notebookId: string, sectionId: string, blockId: string, updates: Partial<NotebookBlock>) => Promise<void>;
  deleteBlock: (notebookId: string, sectionId: string, blockId: string) => Promise<void>;
  generateAIResponse: (notebookId: string, message: string, context?: { currentSection?: string; currentBlock?: string }) => Promise<void>;
  analyzeNotebook: (notebookId: string) => Promise<void>;
}

export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set, get: () => NotebookStore) => ({
      notebooks: [],
      activeNotebookId: null,
      activeNoteId: null,
      isLoading: false,
      error: null,
      selectedNotebook: null,
      
      createNotebook: async (
        title: string, 
        description: string, 
        templateData?: {
          sections?: Record<string, unknown>[];
        tags?: string[];
          metadata?: Record<string, unknown>;
        }
      ) => {
        set({ isLoading: true, error: null });
        try {
          const newNotebook: NotebookType = {
            id: crypto.randomUUID(),
            title,
            description,
            sections: (templateData?.sections as unknown as NotebookSection[]) || [],
            tags: templateData?.tags || [],
            isFavorite: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastModified: new Date(),
            ...(templateData?.metadata ? { metadata: templateData.metadata } : {})
          };
          
          set(state => ({
            notebooks: [...state.notebooks, newNotebook],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create notebook', isLoading: false });
        }
      },
      
      updateNotebook: async (id: string, updates: Partial<NotebookType>) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook => 
              notebook.id === id 
                ? { ...notebook, ...updates, updatedAt: new Date(), lastModified: new Date() }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === id
              ? { ...state.selectedNotebook, ...updates, updatedAt: new Date(), lastModified: new Date() }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update notebook', isLoading: false });
        }
      },
      
      deleteNotebook: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.filter(notebook => notebook.id !== id),
            activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId,
            selectedNotebook: state.selectedNotebook?.id === id ? null : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete notebook', isLoading: false });
        }
      },
      
      selectNotebook: (id: string) => {
        const notebook = get().notebooks.find(n => n.id === id);
        set({ selectedNotebook: notebook || null });
      },
      
      addSection: async (notebookId: string, title: string) => {
        set({ isLoading: true, error: null });
        try {
          const newSection: NotebookSection = {
            id: crypto.randomUUID(),
            title,
            blocks: [],
            order: get().notebooks.find(n => n.id === notebookId)?.sections.length || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? { ...notebook, sections: [...notebook.sections, newSection], updatedAt: new Date(), lastModified: new Date() }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? { ...state.selectedNotebook, sections: [...state.selectedNotebook.sections, newSection], updatedAt: new Date(), lastModified: new Date() }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add section', isLoading: false });
        }
      },
      
      updateSection: async (notebookId: string, sectionId: string, updates: Partial<NotebookSection>) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? { ...section, ...updates, updatedAt: new Date() }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, ...updates, updatedAt: new Date() }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update section', isLoading: false });
        }
      },
      
      deleteSection: async (notebookId: string, sectionId: string) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.filter(section => section.id !== sectionId),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.filter(section => section.id !== sectionId),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete section', isLoading: false });
        }
      },
      
      addBlock: async (notebookId: string, sectionId: string, block: Omit<NotebookBlock, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
          const newBlock: NotebookBlock = {
            ...block,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? { ...section, blocks: [...section.blocks, newBlock], updatedAt: new Date() }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? { ...section, blocks: [...section.blocks, newBlock], updatedAt: new Date() }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add block', isLoading: false });
        }
      },
      
      updateBlock: async (notebookId: string, sectionId: string, blockId: string, updates: Partial<NotebookBlock>) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? {
                            ...section,
                            blocks: section.blocks.map(block =>
                              block.id === blockId
                                ? { ...block, ...updates, updatedAt: new Date() }
                                : block
                            ),
                            updatedAt: new Date(),
                          }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? {
                          ...section,
                          blocks: section.blocks.map(block =>
                            block.id === blockId
                              ? { ...block, ...updates, updatedAt: new Date() }
                              : block
                          ),
                          updatedAt: new Date(),
                        }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update block', isLoading: false });
        }
      },
      
      deleteBlock: async (notebookId: string, sectionId: string, blockId: string) => {
        set({ isLoading: true, error: null });
        try {
          set(state => ({
            notebooks: state.notebooks.map(notebook =>
              notebook.id === notebookId
                ? {
                    ...notebook,
                    sections: notebook.sections.map(section =>
                      section.id === sectionId
                        ? {
                            ...section,
                            blocks: section.blocks.filter(block => block.id !== blockId),
                            updatedAt: new Date(),
                          }
                        : section
                    ),
                    updatedAt: new Date(),
                    lastModified: new Date(),
                  }
                : notebook
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId
              ? {
                  ...state.selectedNotebook,
                  sections: state.selectedNotebook.sections.map(section =>
                    section.id === sectionId
                      ? {
                          ...section,
                          blocks: section.blocks.filter(block => block.id !== blockId),
                          updatedAt: new Date(),
                        }
                      : section
                  ),
                  updatedAt: new Date(),
                  lastModified: new Date(),
                }
              : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete block', isLoading: false });
        }
      },
      
      generateAIResponse: async (notebookId: string, message: string, context?: { currentSection?: string; currentBlock?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const notebook = get().notebooks.find(n => n.id === notebookId);
          if (!notebook) throw new Error('Notebook not found');

          const response = await generateNotebookResponse(notebook, message, context);
          
          if (context?.currentSection) {
            await get().addBlock(notebookId, context.currentSection, {
              type: 'ai',
              content: response.content,
              metadata: response.metadata,
            });
          }

          set({ isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to generate AI response', isLoading: false });
        }
      },
      
      analyzeNotebook: async (notebookId: string) => {
        set({ isLoading: true, error: null });
        try {
          const notebook = get().notebooks.find(n => n.id === notebookId);
          if (!notebook) throw new Error('Notebook not found');

          const analyzedNotebook = await analyzeNotebook(notebook);
          
          set(state => ({
            notebooks: state.notebooks.map(n =>
              n.id === notebookId ? analyzedNotebook : n
            ),
            selectedNotebook: state.selectedNotebook?.id === notebookId ? analyzedNotebook : state.selectedNotebook,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to analyze notebook', isLoading: false });
        }
      },
    }),
    {
      name: 'notebook-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState: unknown, currentState: NotebookStore): NotebookStore => {
        if (typeof persistedState !== 'object' || persistedState === null) {
          return currentState; // No valid persisted state, return current
        }

        // Type assertion for the expected shape of the persisted state
        const oldState = persistedState as Partial<{ notebooks: Record<string, unknown>[], activeNotebookId: string | null, activeNoteId: string | null, selectedNotebook: Record<string, unknown> | null }>;

        let migratedNotebooks: NotebookType[] = currentState.notebooks;

        if (Array.isArray(oldState.notebooks)) {
          migratedNotebooks = oldState.notebooks.map((notebook: Record<string, unknown>): NotebookType => {
            const mappedSections = (Array.isArray(notebook.sections) ? notebook.sections : [])
              .map(s => {
                if (typeof s === 'object' && s !== null && 'id' in s && 'title' in s && 'blocks' in s && 'order' in s) {
                  // Further ensure blocks are correctly typed if necessary
                  const subBlocks = (Array.isArray((s as any).blocks) ? (s as any).blocks : []).map((b: Record<string, unknown>) => {
                    if (typeof b === 'object' && b !== null && 'id' in b && 'type' in b && 'content' in b) {
                      return {
                        ...b,
                        createdAt: b.createdAt ? new Date(b.createdAt as string) : new Date(),
                        updatedAt: b.updatedAt ? new Date(b.updatedAt as string) : new Date(),
                      } as NotebookBlock;
                    }
                    return null;
                  }).filter(Boolean) as NotebookBlock[];
                  return { 
                    ...(s as object), // spread existing valid properties
                    id: s.id as string,
                    title: s.title as string,
                    blocks: subBlocks,
                    order: s.order as number,
                    createdAt: s.createdAt ? new Date(s.createdAt as string) : new Date(),
                    updatedAt: s.updatedAt ? new Date(s.updatedAt as string) : new Date(),
                  } as NotebookSection;
                }
                return null; // Skip malformed sections
              })
              .filter(Boolean) as NotebookSection[];

            const mappedTitle = typeof notebook.name === 'object' && notebook.name !== null 
              ? (notebook.name as { name: string }).name 
              : (notebook.title as string || notebook.name as string || 'Untitled');
            
            const mappedDescription = typeof notebook.name === 'object' && notebook.name !== null
              ? (notebook.name as { description: string }).description
              : (notebook.description as string || '');
          
          return {
              id: notebook.id as string || crypto.randomUUID(),
              title: mappedTitle,
              description: mappedDescription,
              sections: mappedSections,
              tags: Array.isArray(notebook.tags) ? notebook.tags.map(String) : [],
              createdAt: notebook.createdAt ? new Date(notebook.createdAt as string) : new Date(),
              updatedAt: notebook.updatedAt ? new Date(notebook.updatedAt as string) : new Date(),
              lastModified: notebook.lastModified ? new Date(notebook.lastModified as string) : (notebook.updatedAt ? new Date(notebook.updatedAt as string) : new Date()),
              isFavorite: typeof notebook.isFavorite === 'boolean' ? notebook.isFavorite : false,
              isArchived: typeof notebook.isArchived === 'boolean' ? notebook.isArchived : false,
              isPublic: typeof notebook.isPublic === 'boolean' ? notebook.isPublic : false,
              metadata: typeof notebook.metadata === 'object' && notebook.metadata !== null ? notebook.metadata : {},
              folderId: notebook.folderId as string | undefined,
              icon: notebook.icon as string | undefined,
              color: notebook.color as string | undefined,
              version: typeof notebook.version === 'number' ? notebook.version : 1,
              lastAccessed: notebook.lastAccessed ? new Date(notebook.lastAccessed as string) : new Date(),
              isTemplate: typeof notebook.isTemplate === 'boolean' ? notebook.isTemplate : false,
            } as NotebookType;
          });
        }
        
        // Migrate selectedNotebook if it exists and has an old structure
        let migratedSelectedNotebook: NotebookType | null = currentState.selectedNotebook;
        if (oldState.selectedNotebook && typeof oldState.selectedNotebook === 'object' && 'id' in oldState.selectedNotebook) {
            const sn = oldState.selectedNotebook as Record<string, unknown>;
            // Try to find it in the already migrated notebooks list for consistency, or migrate it standalone
            const foundInMigrated = migratedNotebooks.find(nb => nb.id === sn.id);
            if (foundInMigrated) {
                migratedSelectedNotebook = foundInMigrated;
            } else {
                 // Standalone migration for selectedNotebook if not in the main list (should be rare)
                const mappedSections = (Array.isArray(sn.sections) ? sn.sections : [])
                  .map(s => {
                    if (typeof s === 'object' && s !== null && 'id' in s && 'title' in s && 'blocks' in s && 'order' in s) {
                       const subBlocks = (Array.isArray((s as any).blocks) ? (s as any).blocks : []).map((b: Record<string, unknown>) => {
                        if (typeof b === 'object' && b !== null && 'id' in b && 'type' in b && 'content' in b) {
                          return {
                            ...b,
                            createdAt: b.createdAt ? new Date(b.createdAt as string) : new Date(),
                            updatedAt: b.updatedAt ? new Date(b.updatedAt as string) : new Date(),
                          } as NotebookBlock;
                        }
                        return null;
                      }).filter(Boolean) as NotebookBlock[];
                      return { 
                        ...(s as object),
                        id: s.id as string, title: s.title as string, blocks: subBlocks, order: s.order as number,
                        createdAt: s.createdAt ? new Date(s.createdAt as string) : new Date(),
                        updatedAt: s.updatedAt ? new Date(s.updatedAt as string) : new Date(),
                       } as NotebookSection;
                    }
                    return null;
                  }).filter(Boolean) as NotebookSection[];

                migratedSelectedNotebook = {
                    id: sn.id as string || crypto.randomUUID(),
                    title: typeof sn.name === 'object' && sn.name !== null ? (sn.name as {name: string}).name : (sn.title as string || sn.name as string || 'Untitled'),
                    description: typeof sn.name === 'object' && sn.name !== null ? (sn.name as {description: string}).description : (sn.description as string || ''),
                    sections: mappedSections,
                    tags: Array.isArray(sn.tags) ? sn.tags.map(String) : [],
                    createdAt: sn.createdAt ? new Date(sn.createdAt as string) : new Date(),
                    updatedAt: sn.updatedAt ? new Date(sn.updatedAt as string) : new Date(),
                    lastModified: sn.lastModified ? new Date(sn.lastModified as string) : (sn.updatedAt ? new Date(sn.updatedAt as string) : new Date()),
                    isFavorite: typeof sn.isFavorite === 'boolean' ? sn.isFavorite : false,
                    isArchived: typeof sn.isArchived === 'boolean' ? sn.isArchived : false,
                    isPublic: typeof sn.isPublic === 'boolean' ? sn.isPublic : false,
                    metadata: typeof sn.metadata === 'object' && sn.metadata !== null ? sn.metadata : {},
                    folderId: sn.folderId as string | undefined,
                    icon: sn.icon as string | undefined,
                    color: sn.color as string | undefined,
                    version: typeof sn.version === 'number' ? sn.version : 1,
                    lastAccessed: sn.lastAccessed ? new Date(sn.lastAccessed as string) : new Date(),
                    isTemplate: typeof sn.isTemplate === 'boolean' ? sn.isTemplate : false,
                } as NotebookType;
            }
        }


        // Merge all parts of the state, preferring persisted simple values if they exist
        const mergedState: NotebookStore = {
          ...currentState,
          // Persist simple, non-migrated properties directly if they exist on oldState
          ...(oldState.activeNotebookId !== undefined && { activeNotebookId: oldState.activeNotebookId }),
          ...(oldState.activeNoteId !== undefined && { activeNoteId: oldState.activeNoteId }),
          // Overwrite with migrated complex properties
          notebooks: migratedNotebooks,
          selectedNotebook: migratedSelectedNotebook,
          // Ensure isLoading and error are reset from currentState, not persisted
          isLoading: currentState.isLoading,
          error: currentState.error,
        };
        
        return mergedState;
      },
    }
  )
);