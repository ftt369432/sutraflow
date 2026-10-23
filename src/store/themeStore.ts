import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'default' | 'cyberpunk' | 'modern' | 'minimal';
export type ThemeColor = 'blue' | 'cyan' | 'green' | 'rose' | 'amber';

interface ThemeState {
  mode: ThemeMode;
  style: ThemeStyle;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  setColor: (color: ThemeColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      style: 'default',
      color: 'blue',
      setMode: (mode) => set({ mode }),
      setStyle: (style) => set({ style }),
      setColor: (color) => set({ color }),
    }),
    {
      name: 'theme-storage',
    }
  )
);