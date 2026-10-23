import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { 
  CanvasWindow, 
  DocumentContent, 
  CanvasAgent, 
  ContentType, 
  AgentSpecialization,
  AITask,
  ProgressReport,
  WindowPosition,
  WindowSize 
} from '../types/canvas';

interface CanvasState {
  // Windows and Documents
  windows: CanvasWindow[];
  activeWindowId: string | null;
  documents: Record<string, DocumentContent>;
  
  // Chat Integration - NEW for persistence
  conversationDocuments: Record<string, string[]>; // conversationId -> documentIds[]
  documentConversations: Record<string, string>; // documentId -> conversationId
  
  // AI Agents
  agents: Record<string, CanvasAgent>;
  tasks: Record<string, AITask>;
  
  // UI State
  isCanvasEnabled: boolean;
  lastAnalysis: unknown;
  
  // Edit History - NEW for undo/redo
  editHistory: Record<string, DocumentEditHistory>;
  
  // Canvas Toggle Function
  toggleCanvasEnabled: () => void;
  
  // Window Management
  createWindow: (contentType: ContentType, initialContent?: string) => string;
  closeWindow: (windowId: string) => void;
  setActiveWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: WindowPosition) => void;
  updateWindowSize: (windowId: string, size: WindowSize) => void;
  dockWindow: (windowId: string, isDocked: boolean) => void;
  minimizeWindow: (windowId: string, isMinimized: boolean) => void;
  
  // Document Management
  createDocument: (contentType: ContentType, title?: string) => string;
  updateDocument: (documentId: string, updates: Partial<DocumentContent>) => void;
  updateDocumentContent: (documentId: string, content: string) => void;
  updateDocumentTitle: (documentId: string, title: string) => void; // NEW
  deleteDocument: (documentId: string) => void;
  
  // Chat Integration Methods - NEW
  linkDocumentToConversation: (documentId: string, conversationId: string) => void;
  unlinkDocumentFromConversation: (documentId: string) => void;
  getDocumentsForConversation: (conversationId: string) => string[];
  getConversationForDocument: (documentId: string) => string | null;
  
  // Edit History Methods - NEW for undo/redo
  saveEditState: (documentId: string, content: string, title: string) => void;
  undo: (documentId: string) => boolean;
  redo: (documentId: string) => boolean;
  canUndo: (documentId: string) => boolean;
  canRedo: (documentId: string) => boolean;
  
  // Agent Management
  createAgent: (documentId: string, specialization: AgentSpecialization) => string;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<CanvasAgent>) => void;
  assignAgentToSection: (agentId: string, sectionId: string) => void;
  
  // Task Management
  createTask: (agentId: string, type: string, description: string) => string;
  updateTask: (taskId: string, updates: Partial<AITask>) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string, result?: unknown) => void;
  failTask: (taskId: string, error: string) => void;
  
  // Progress Tracking
  getDocumentProgress: (documentId: string) => ProgressReport;
  getActiveAgents: (documentId: string) => CanvasAgent[];
  getAgentTasks: (agentId: string) => AITask[];
  
  // Utility Functions
  getWindow: (windowId: string) => CanvasWindow | undefined;
  getDocument: (documentId: string) => DocumentContent | undefined;
  getAgent: (agentId: string) => CanvasAgent | undefined;
  getTask: (taskId: string) => AITask | undefined;
  
  // Reset and Cleanup
  reset: () => void;
  cleanupInactiveAgents: () => void;
}

// NEW: Edit history interface for undo/redo
interface DocumentEditHistory {
  states: Array<{
    content: string;
    title: string;
    timestamp: Date;
  }>;
  currentIndex: number;
  maxStates: number;
}

const createInitialDocument = (contentType: ContentType, title?: string): DocumentContent => {
  const defaultTitles: Record<ContentType, string> = {
    'legal_contract': 'Untitled Contract',
    'business_plan': 'Business Plan',
    'academic_paper': 'Research Paper',
    'formal_letter': 'Formal Letter',
    'technical_report': 'Technical Report',
    'presentation': 'Presentation',
    'email_template': 'Email Template',
    'petition': 'Legal Petition',
    'legal_brief': 'Legal Brief',
    'research': 'Research Project',
    'contract_review': 'Contract Review',
    'case_timeline': 'Case Timeline',
    'visualizer': 'Project Visualizer',
    'custom_document': 'Untitled Document'
  };

  return {
    id: nanoid(),
    title: title || defaultTitles[contentType],
    content: '',
    contentType,
    structure: [],
    metadata: {
      wordCount: 0,
      readingTime: 0,
      language: 'en',
      tags: [],
      citations: [],
      complexity: 'simple',
      completionProgress: 0
    },
    version: 1,
    lastModified: new Date(),
    collaborators: []
  };
};

const createInitialAgent = (documentId: string, specialization: AgentSpecialization): CanvasAgent => {
  return {
    id: nanoid(),
    specialization,
    documentId,
    status: 'idle',
    currentSection: null,
    taskList: [],
    lastActivity: new Date(),
    progress: 0
  };
};

const createInitialTask = (agentId: string, type: string, description: string): AITask => {
  return {
    id: nanoid(),
    agentId,
    type,
    description,
    status: 'pending',
    priority: 'medium',
    estimatedTime: 30, // 30 minutes default
    dependencies: [],
    createdAt: new Date()
  };
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      // Initial State
      windows: [],
      activeWindowId: null,
      documents: {},
      conversationDocuments: {}, // NEW: conversation -> documents mapping
      documentConversations: {}, // NEW: document -> conversation mapping
      agents: {},
      tasks: {},
      editHistory: {}, // NEW: edit history for undo/redo
      isCanvasEnabled: false, // Default to closed for new chats
      lastAnalysis: null,
      
      // Canvas Toggle
      toggleCanvasEnabled: () => {
        set((state) => ({ isCanvasEnabled: !state.isCanvasEnabled }));
      },

      // Window Management
      createWindow: (contentType: ContentType, initialContent?: string) => {
        const documentId = get().createDocument(contentType);
        const document = get().documents[documentId];
        
        if (initialContent && document) {
          get().updateDocumentContent(documentId, initialContent);
        }

        const windowId = nanoid();
        const newWindow: CanvasWindow = {
          id: windowId,
          contentType,
          document: get().documents[documentId],
          agents: [],
          position: { x: 100 + (get().windows.length * 20), y: 100 + (get().windows.length * 20) },
          size: { width: 800, height: 600 },
          isDocked: false,
          isMinimized: false,
          zIndex: 1000 + get().windows.length
        };

        set(state => ({
          windows: [...state.windows, newWindow],
          activeWindowId: windowId
        }));

        return windowId;
      },

      closeWindow: (windowId: string) => {
        set(state => ({
          windows: state.windows.filter(w => w.id !== windowId),
          activeWindowId: state.activeWindowId === windowId ? null : state.activeWindowId
        }));
      },

      setActiveWindow: (windowId: string) => {
        set({ activeWindowId: windowId });
      },

      updateWindowPosition: (windowId: string, position: WindowPosition) => {
        set(state => ({
          windows: state.windows.map(w => 
            w.id === windowId ? { ...w, position } : w
          )
        }));
      },

      updateWindowSize: (windowId: string, size: WindowSize) => {
        set(state => ({
          windows: state.windows.map(w => 
            w.id === windowId ? { ...w, size } : w
          )
        }));
      },

      dockWindow: (windowId: string, isDocked: boolean) => {
        set(state => ({
          windows: state.windows.map(w => 
            w.id === windowId ? { ...w, isDocked } : w
          )
        }));
      },

      minimizeWindow: (windowId: string, isMinimized: boolean) => {
        set(state => ({
          windows: state.windows.map(w => 
            w.id === windowId ? { ...w, isMinimized } : w
          )
        }));
      },

      // Document Management
      createDocument: (contentType: ContentType, title?: string) => {
        const document = createInitialDocument(contentType, title);
        
        set(state => ({
          documents: {
            ...state.documents,
            [document.id]: document
          }
        }));

        return document.id;
      },

      updateDocument: (documentId: string, updates: Partial<DocumentContent>) => {
        set(state => {
          // If document doesn't exist, create a basic one first
          if (!state.documents[documentId]) {
            // Create a minimal document structure if it doesn't exist
            const newDocument: DocumentContent = {
              id: documentId,
              title: updates.title || 'Untitled Document',
              content: updates.content || '',
              contentType: updates.contentType || 'custom_document',
              structure: updates.structure || [],
              metadata: {
                wordCount: 0,
                readingTime: 0,
                language: 'en',
                tags: [],
                citations: [],
                complexity: 'simple',
                completionProgress: 0,
                ...updates.metadata
              },
              version: 1,
              lastModified: new Date(),
              collaborators: updates.collaborators || []
            };
            
            return {
              documents: {
                ...state.documents,
                [documentId]: { ...newDocument, ...updates, lastModified: new Date() }
              }
            };
          }
          
          // Document exists, update normally
          return {
            documents: {
              ...state.documents,
              [documentId]: {
                ...state.documents[documentId],
                ...updates,
                lastModified: new Date()
              }
            }
          };
        });

        // Update windows that reference this document
        set(state => ({
          windows: state.windows.map(w => 
            w.document?.id === documentId && state.documents[documentId]
              ? { ...w, document: state.documents[documentId] }
              : w
          )
        }));
      },

      updateDocumentContent: (documentId: string, content: string) => {
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

        set(state => ({
          documents: {
            ...state.documents,
            [documentId]: {
              ...state.documents[documentId],
              content,
              metadata: {
                ...state.documents[documentId].metadata,
                wordCount,
                readingTime
              },
              lastModified: new Date()
            }
          }
        }));

        // Update windows
        set(state => ({
          windows: state.windows.map(w => 
            w.document.id === documentId 
              ? { ...w, document: state.documents[documentId] }
              : w
          )
        }));
      },

      deleteDocument: (documentId: string) => {
        set(state => {
          const { [documentId]: _deleted, ...remainingDocuments } = state.documents;
          return { documents: remainingDocuments };
        });

        // Close associated windows
        set(state => ({
          windows: state.windows.filter(w => w.document.id !== documentId)
        }));

        // Remove associated agents
        set(state => ({
          agents: Object.fromEntries(
            Object.entries(state.agents).filter(([_, agent]) => agent.documentId !== documentId)
          )
        }));

        // Clean up conversation links and edit history
        set(state => {
          const conversationId = state.documentConversations[documentId];
          const { [documentId]: _deletedConversation, ...remainingDocConversations } = state.documentConversations;
          const { [documentId]: _deletedHistory, ...remainingHistory } = state.editHistory;
          
          const conversationDocuments = conversationId ? {
            ...state.conversationDocuments,
            [conversationId]: state.conversationDocuments[conversationId]?.filter(id => id !== documentId) || []
          } : state.conversationDocuments;

          return {
            documentConversations: remainingDocConversations,
            editHistory: remainingHistory,
            conversationDocuments
          };
        });
      },

      // NEW: Document title update with history tracking
      updateDocumentTitle: (documentId: string, title: string) => {
        const state = get();
        const document = state.documents[documentId];
        if (!document) return;

        // Save current state to history before updating
        get().saveEditState(documentId, document.content, document.title);

        set(state => ({
          documents: {
            ...state.documents,
            [documentId]: {
              ...state.documents[documentId],
              title,
              lastModified: new Date()
            }
          }
        }));

        // Update windows
        set(state => ({
          windows: state.windows.map(w => 
            w.document.id === documentId 
              ? { ...w, document: state.documents[documentId] }
              : w
          )
        }));
      },

      // NEW: Chat Integration Methods
      linkDocumentToConversation: (documentId: string, conversationId: string) => {
        set(state => ({
          documentConversations: {
            ...state.documentConversations,
            [documentId]: conversationId
          },
          conversationDocuments: {
            ...state.conversationDocuments,
            [conversationId]: [...(state.conversationDocuments[conversationId] || []), documentId]
          }
        }));
      },

      unlinkDocumentFromConversation: (documentId: string) => {
        set(state => {
          const conversationId = state.documentConversations[documentId];
          const { [documentId]: _deleted, ...remainingDocConversations } = state.documentConversations;
          
          const conversationDocuments = conversationId ? {
            ...state.conversationDocuments,
            [conversationId]: state.conversationDocuments[conversationId]?.filter(id => id !== documentId) || []
          } : state.conversationDocuments;

          return {
            documentConversations: remainingDocConversations,
            conversationDocuments
          };
        });
      },

      getDocumentsForConversation: (conversationId: string) => {
        return get().conversationDocuments[conversationId] || [];
      },

      getConversationForDocument: (documentId: string) => {
        return get().documentConversations[documentId] || null;
      },

      // NEW: Edit History Methods for Undo/Redo
      saveEditState: (documentId: string, content: string, title: string) => {
        set(state => {
          const history = state.editHistory[documentId] || {
            states: [],
            currentIndex: -1,
            maxStates: 50
          };

          // Remove any states after current index (when user makes new changes after undo)
          const newStates = history.states.slice(0, history.currentIndex + 1);
          
          // Add new state
          newStates.push({
            content,
            title,
            timestamp: new Date()
          });

          // Limit history size
          if (newStates.length > history.maxStates) {
            newStates.shift();
          }

          return {
            editHistory: {
              ...state.editHistory,
              [documentId]: {
                states: newStates,
                currentIndex: newStates.length - 1,
                maxStates: history.maxStates
              }
            }
          };
        });
      },

      undo: (documentId: string) => {
        const state = get();
        const history = state.editHistory[documentId];
        
        if (!history || history.currentIndex <= 0) {
          return false; // Cannot undo
        }

        const previousState = history.states[history.currentIndex - 1];
        
        set(prevState => ({
          documents: {
            ...prevState.documents,
            [documentId]: {
              ...prevState.documents[documentId],
              content: previousState.content,
              title: previousState.title,
              lastModified: new Date()
            }
          },
          editHistory: {
            ...prevState.editHistory,
            [documentId]: {
              ...history,
              currentIndex: history.currentIndex - 1
            }
          }
        }));

        // Update windows
        set(state => ({
          windows: state.windows.map(w => 
            w.document.id === documentId 
              ? { ...w, document: state.documents[documentId] }
              : w
          )
        }));

        return true;
      },

      redo: (documentId: string) => {
        const state = get();
        const history = state.editHistory[documentId];
        
        if (!history || history.currentIndex >= history.states.length - 1) {
          return false; // Cannot redo
        }

        const nextState = history.states[history.currentIndex + 1];
        
        set(prevState => ({
          documents: {
            ...prevState.documents,
            [documentId]: {
              ...prevState.documents[documentId],
              content: nextState.content,
              title: nextState.title,
              lastModified: new Date()
            }
          },
          editHistory: {
            ...prevState.editHistory,
            [documentId]: {
              ...history,
              currentIndex: history.currentIndex + 1
            }
          }
        }));

        // Update windows
        set(state => ({
          windows: state.windows.map(w => 
            w.document.id === documentId 
              ? { ...w, document: state.documents[documentId] }
              : w
          )
        }));

        return true;
      },

      canUndo: (documentId: string) => {
        const history = get().editHistory[documentId];
        return history ? history.currentIndex > 0 : false;
      },

      canRedo: (documentId: string) => {
        const history = get().editHistory[documentId];
        return history ? history.currentIndex < history.states.length - 1 : false;
      },

      // Agent Management
      createAgent: (documentId: string, specialization: AgentSpecialization) => {
        const agent = createInitialAgent(documentId, specialization);
        
        set(state => ({
          agents: {
            ...state.agents,
            [agent.id]: agent
          }
        }));

        // Add agent to relevant windows
        set(state => ({
          windows: state.windows.map(w => 
            w.document.id === documentId 
              ? { ...w, agents: [...w.agents, agent] }
              : w
          )
        }));

        return agent.id;
      },

      removeAgent: (agentId: string) => {
        const agent = get().agents[agentId];
        if (!agent) return;

        set(state => {
          const { [agentId]: _deleted, ...remainingAgents } = state.agents;
          return { agents: remainingAgents };
        });

        // Remove agent from windows
        set(state => ({
          windows: state.windows.map(w => ({
            ...w,
            agents: w.agents.filter(a => a.id !== agentId)
          }))
        }));

        // Remove agent's tasks
        set(state => ({
          tasks: Object.fromEntries(
            Object.entries(state.tasks).filter(([_, task]) => task.agentId !== agentId)
          )
        }));
      },

      updateAgent: (agentId: string, updates: Partial<CanvasAgent>) => {
        set(state => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              ...updates,
              lastActivity: new Date()
            }
          }
        }));

        // Update agent in windows
        set(state => ({
          windows: state.windows.map(w => ({
            ...w,
            agents: w.agents.map(a => 
              a.id === agentId ? { ...a, ...updates, lastActivity: new Date() } : a
            )
          }))
        }));
      },

      assignAgentToSection: (agentId: string, sectionId: string) => {
        get().updateAgent(agentId, { currentSection: sectionId });
      },

      // Task Management
      createTask: (agentId: string, type: string, description: string) => {
        const task = createInitialTask(agentId, type, description);
        
        set(state => ({
          tasks: {
            ...state.tasks,
            [task.id]: task
          }
        }));

        // Add task to agent
        const agent = get().agents[agentId];
        if (agent) {
          get().updateAgent(agentId, {
            taskList: [...agent.taskList, task]
          });
        }

        return task.id;
      },

      updateTask: (taskId: string, updates: Partial<AITask>) => {
        set(state => ({
          tasks: {
            ...state.tasks,
            [taskId]: {
              ...state.tasks[taskId],
              ...updates
            }
          }
        }));

        // Update task in agent's task list
        const task = get().tasks[taskId];
        if (task) {
          const agent = get().agents[task.agentId];
          if (agent) {
            get().updateAgent(task.agentId, {
              taskList: agent.taskList.map(t => t.id === taskId ? { ...t, ...updates } : t)
            });
          }
        }
      },

      startTask: (taskId: string) => {
        get().updateTask(taskId, {
          status: 'in_progress',
          startedAt: new Date()
        });
      },

      completeTask: (taskId: string, result?: unknown) => {
        get().updateTask(taskId, {
          status: 'completed',
          completedAt: new Date(),
          result
        });
      },

      failTask: (taskId: string, error: string) => {
        get().updateTask(taskId, {
          status: 'failed',
          completedAt: new Date(),
          error
        });
      },

      // Progress Tracking
      getDocumentProgress: (documentId: string): ProgressReport => {
        const document = get().documents[documentId];
        const agents = Object.values(get().agents).filter(a => a.documentId === documentId);
        const allTasks = Object.values(get().tasks).filter(t => 
          agents.some(a => a.id === t.agentId)
        );

        const completedTasks = allTasks.filter(t => t.status === 'completed').length;
        const totalTasks = allTasks.length;
        const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const sectionsCompleted = document?.structure.filter(s => s.status === 'completed').length || 0;
        const sectionsTotal = document?.structure.length || 0;

        const agentProgress = agents.map(agent => ({
          agentId: agent.id,
          specialization: agent.specialization,
          progress: agent.progress,
          currentTask: agent.taskList.find(t => t.status === 'in_progress')?.description
        }));

        const remainingTasks = allTasks.filter(t => t.status !== 'completed');
        const estimatedTimeRemaining = remainingTasks.reduce((sum, task) => sum + task.estimatedTime, 0);

        return {
          documentId,
          overallProgress,
          sectionsCompleted,
          sectionsTotal,
          agentProgress,
          estimatedTimeRemaining,
          qualityScore: Math.min(overallProgress + 10, 100) // Simple quality calculation
        };
      },

      getActiveAgents: (documentId: string) => {
        return Object.values(get().agents).filter(a => 
          a.documentId === documentId && a.status !== 'idle'
        );
      },

      getAgentTasks: (agentId: string) => {
        return Object.values(get().tasks).filter(t => t.agentId === agentId);
      },

      // Utility Functions
      getWindow: (windowId: string) => {
        return get().windows.find(w => w.id === windowId);
      },

      getDocument: (documentId: string) => {
        return get().documents[documentId];
      },

      getAgent: (agentId: string) => {
        return get().agents[agentId];
      },

      getTask: (taskId: string) => {
        return get().tasks[taskId];
      },

      // Reset and Cleanup
      reset: () => {
        set({
          windows: [],
          activeWindowId: null,
          documents: {},
          agents: {},
          tasks: {},
          lastAnalysis: null
        });
      },

      cleanupInactiveAgents: () => {
        const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
        
        set(state => ({
          agents: Object.fromEntries(
            Object.entries(state.agents).filter(([_, agent]) => 
              agent.lastActivity > cutoffTime || agent.status === 'working'
            )
          )
        }));
      }
    }),
    {
      name: 'canvas-store',
      partialize: (state) => ({
        documents: state.documents,
        isCanvasEnabled: state.isCanvasEnabled
      })
    }
  )
);

// Expose store globally for testing and debugging
if (typeof window !== 'undefined') {
  (window as any).useCanvasStore = useCanvasStore;
} 