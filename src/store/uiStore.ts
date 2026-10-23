import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
  toggleDeveloperMode: () => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  toggleSettingsModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      developerMode: false,
      setDeveloperMode: (enabled) => set({ developerMode: enabled }),
      toggleDeveloperMode: () => set((state) => ({ developerMode: !state.developerMode })),
      settingsModalOpen: false,
      setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
      toggleSettingsModal: () => set((state) => ({ settingsModalOpen: !state.settingsModalOpen })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ developerMode: state.developerMode }), // Don't persist modal open state across refreshes
    }
  )
);
