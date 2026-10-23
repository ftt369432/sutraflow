import { create } from 'zustand';

export type CommandCategory = 'all' | 'commands' | 'models' | 'legal' | 'assistants' | 'files' | 'skins';

interface QuickActionState {
  isPaletteOpen: boolean;
  searchTerm: string;
  activeCategory: CommandCategory;
  recentActionIds: string[];
  setPaletteOpen: (open: boolean) => void;
  setSearchTerm: (term: string) => void;
  setActiveCategory: (category: CommandCategory) => void;
  togglePalette: () => void;
  recordActionExecution: (actionId: string) => void;
}

export const useQuickActions = create<QuickActionState>((set) => ({
  isPaletteOpen: false,
  searchTerm: '',
  activeCategory: 'all',
  recentActionIds: [],
  setPaletteOpen: (open: boolean) => set({ isPaletteOpen: open }),
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setActiveCategory: (category: CommandCategory) => set({ activeCategory: category }),
  togglePalette: () => set((state) => ({ isPaletteOpen: !state.isPaletteOpen })),
  recordActionExecution: (actionId: string) => set((state) => {
    const filtered = state.recentActionIds.filter(id => id !== actionId);
    return {
      recentActionIds: [actionId, ...filtered].slice(0, 8)
    };
  })
}));
