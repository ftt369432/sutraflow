import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean;
  autoCollapse: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  toggleAutoCollapse: () => void;
  setAutoCollapse: (enabled: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: true,
      autoCollapse: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      toggleAutoCollapse: () => set((state) => ({ autoCollapse: !state.autoCollapse })),
      setAutoCollapse: (enabled) => set({ autoCollapse: enabled }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
); 