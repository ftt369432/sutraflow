import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Theme as ThemeConfig, 
  ThemeId, 
  themes as configThemes, 
  SkinId, 
  SkinDefinition, 
  SKINS 
} from '../config/themes';

// Define theme types
export type Theme = ThemeId | 'system';

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themes: ThemeConfig[];
  currentTheme: ThemeConfig;
  // Dual-mode skin suite additions
  currentSkin: SkinDefinition;
  setSkin: (skinId: SkinId) => void;
  skins: SkinDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  const [currentSkinId, setCurrentSkinId] = useState<SkinId>('nous-obsidian');

  // Find active skin definition
  const currentSkin = SKINS.find(s => s.id === currentSkinId) || SKINS[0];

  const getDefaultTheme = (): ThemeConfig => {
    if (typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeId = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme as ThemeId;
      return configThemes.find(t => t.id === themeId) || configThemes[0];
    }
    return configThemes[0];
  };

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(configThemes[0]);

  // Apply both Skin class and Dark/Light mode to DOM
  const applySkinAndMode = (skinId: SkinId, darkState: boolean) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    // 1. Manage Dark / Light Mode classes on both root & body
    if (darkState) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }

    // 2. Manage Skin classes on both root & body
    SKINS.forEach(skin => {
      root.classList.remove(skin.cssClass);
      body.classList.remove(skin.cssClass);
    });
    const targetSkin = SKINS.find(s => s.id === skinId) || SKINS[0];
    root.classList.add(targetSkin.cssClass);
    body.classList.add(targetSkin.cssClass);
    root.setAttribute('data-skin', skinId);
    body.setAttribute('data-skin', skinId);
    root.setAttribute('data-theme', darkState ? 'dark' : 'light');
    body.setAttribute('data-theme', darkState ? 'dark' : 'light');
  };

  useEffect(() => {
    // 1. Initialize Skin
    const savedSkin = localStorage.getItem('nous_skin') as SkinId;
    const initialSkin = SKINS.some(s => s.id === savedSkin) ? savedSkin : 'nous-obsidian';
    setCurrentSkinId(initialSkin);

    // 2. Initialize Dark/Light Mode
    const savedTheme = localStorage.getItem('theme') as Theme;
    let initialDark = false;
    if (savedTheme === 'dark') {
      initialDark = true;
    } else if (savedTheme === 'light') {
      initialDark = false;
    } else if (typeof window !== 'undefined') {
      initialDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setTheme(savedTheme || 'system');
    setIsDark(initialDark);
    setCurrentTheme(getDefaultTheme());
    applySkinAndMode(initialSkin, initialDark);
  }, []);

  const handleSkinChange = (newSkinId: SkinId) => {
    setCurrentSkinId(newSkinId);
    localStorage.setItem('nous_skin', newSkinId);

    // If user picks Nous Obsidian or Matrix Cyber, ensure dark mode is active
    // so they immediately experience the obsidian titanium / matrix cyber terminal aesthetic
    let nextDark = isDark;
    if (newSkinId === 'nous-obsidian' || newSkinId === 'matrix-cyber') {
      if (!isDark) {
        nextDark = true;
        setIsDark(true);
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
      }
    }
    applySkinAndMode(newSkinId, nextDark);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    let newDark = isDark;
    if (newTheme === 'dark') {
      newDark = true;
    } else if (newTheme === 'light') {
      newDark = false;
    } else if (typeof window !== 'undefined') {
      newDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(newDark);
    applySkinAndMode(currentSkinId, newDark);
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    setTheme(nextDark ? 'dark' : 'light');
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    applySkinAndMode(currentSkinId, nextDark);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark,
      setTheme: handleThemeChange,
      toggleTheme,
      themes: configThemes,
      currentTheme,
      currentSkin,
      setSkin: handleSkinChange,
      skins: SKINS
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}