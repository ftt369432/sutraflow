import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  isPinned: boolean;
  lastUpdated: Date;
  assistantId?: string;
}

interface ChatStore {
  threads: ChatThread[];
  currentThreadId: string | null;
  pinnedThreads: string[];
  
  // Actions
  createThread: (title: string, assistantId?: string) => string;
  addMessage: (threadId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateThread: (threadId: string, updates: Partial<ChatThread>) => void;
  deleteThread: (threadId: string) => void;
  pinThread: (threadId: string) => void;
  unpinThread: (threadId: string) => void;
  setCurrentThread: (threadId: string) => void;
  
  // Getters
  getCurrentThread: () => ChatThread | null;
  getPinnedThreads: () => ChatThread[];
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      threads: [],
      currentThreadId: null,
      pinnedThreads: [],

      createThread: (title, assistantId) => {
        const id = crypto.randomUUID();
        const newThread: ChatThread = {
          id,
          title,
          messages: [],
          isPinned: false,
          lastUpdated: new Date(),
          assistantId
        };

        set(state => ({
          threads: [...state.threads, newThread],
          currentThreadId: id
        }));

        return id;
      },

      addMessage: (threadId, message) => {
        set(state => {
          const thread = state.threads.find(t => t.id === threadId);
          if (!thread) return state;

          const newMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date()
          };

          const updatedThread = {
            ...thread,
            messages: [...thread.messages, newMessage],
            lastUpdated: new Date()
          };

          return {
            threads: state.threads.map(t => 
              t.id === threadId ? updatedThread : t
            )
          };
        });
      },

      updateThread: (threadId, updates) => {
        set(state => ({
          threads: state.threads.map(thread =>
            thread.id === threadId
              ? { ...thread, ...updates, lastUpdated: new Date() }
              : thread
          )
        }));
      },

      deleteThread: (threadId) => {
        set(state => ({
          threads: state.threads.filter(t => t.id !== threadId),
          currentThreadId: state.currentThreadId === threadId 
            ? null 
            : state.currentThreadId,
          pinnedThreads: state.pinnedThreads.filter(id => id !== threadId)
        }));
      },

      pinThread: (threadId) => {
        set(state => ({
          pinnedThreads: [...state.pinnedThreads, threadId],
          threads: state.threads.map(t =>
            t.id === threadId ? { ...t, isPinned: true } : t
          )
        }));
      },

      unpinThread: (threadId) => {
        set(state => ({
          pinnedThreads: state.pinnedThreads.filter(id => id !== threadId),
          threads: state.threads.map(t =>
            t.id === threadId ? { ...t, isPinned: false } : t
          )
        }));
      },

      setCurrentThread: (threadId) => {
        set({ currentThreadId: threadId });
      },

      getCurrentThread: () => {
        const state = get();
        return state.threads.find(t => t.id === state.currentThreadId) || null;
      },

      getPinnedThreads: () => {
        const state = get();
        return state.threads.filter(t => t.isPinned);
      }
    }),
    {
      name: 'chat-store',
      version: 1,
      partialize: (state) => ({
        threads: state.threads,
        pinnedThreads: state.pinnedThreads
      })
    }
  )
); 