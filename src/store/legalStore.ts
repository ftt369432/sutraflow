import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LegalCase, ResearchResult, AIMessage } from '../types/legal';

interface LegalState {
  cases: LegalCase[];
  savedResearch: ResearchResult[];
  aiHistory: AIMessage[];
  addCase: (legalCase: LegalCase) => void;
  updateCase: (id: string, updates: Partial<LegalCase>) => void;
  deleteCase: (id: string) => void;
  saveResearch: (result: ResearchResult) => void;
  removeResearch: (id: string) => void;
  addAIMessage: (message: AIMessage) => void;
  clearAIHistory: () => void;
}

export const useLegalStore = create<LegalState>()(
  persist(
    (set) => ({
      cases: [],
      savedResearch: [],
      aiHistory: [],
      addCase: (legalCase) =>
        set((state) => ({
          cases: [...state.cases, legalCase],
        })),
      updateCase: (id, updates) =>
        set((state) => ({
          cases: state.cases.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteCase: (id) =>
        set((state) => ({
          cases: state.cases.filter((c) => c.id !== id),
        })),
      saveResearch: (result) =>
        set((state) => ({
          savedResearch: [...state.savedResearch, result],
        })),
      removeResearch: (id) =>
        set((state) => ({
          savedResearch: state.savedResearch.filter((r) => r.id !== id),
        })),
      addAIMessage: (message) =>
        set((state) => ({
          aiHistory: [...state.aiHistory, message],
        })),
      clearAIHistory: () =>
        set({
          aiHistory: [],
        }),
    }),
    {
      name: 'legal-storage',
    }
  )
);