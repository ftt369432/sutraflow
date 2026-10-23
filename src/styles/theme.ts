export type Theme = 'light' | 'dark' | 'cyberpunk';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export const themes: Record<Theme, ThemeColors> = {
  light: {
    primary: '#0891b2', // Updated from #0ea5e9 to a richer cyan
    secondary: '#64748b',
    background: '#ffffff',
    text: '#1e293b',
    accent: '#3b82f6'
  },
  dark: {
    primary: '#22d3ee', // Updated from #60a5fa to a brighter cyan
    secondary: '#c0d4f5',
    background: '#0f172a', // Updated from #0c1222 to a richer dark blue
    text: '#ffffff',
    accent: '#38bdf8' // Updated from #4287ff to a cyan accent
  },
  cyberpunk: {
    primary: '#00fff0',
    secondary: '#ff00ff',
    background: '#000033',
    text: '#ffffff',
    accent: '#f0f000'
  }
};

export const theme = {
  colors: {
    primary: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
    },
    success: {
      light: '#86efac',
      DEFAULT: '#10b981', // Updated from #22c55e to a more vibrant green
      dark: '#047857',    // Updated from #15803d to a richer dark green
    },
    warning: {
      light: '#fde047',
      DEFAULT: '#f59e0b', // Updated from #eab308 to a more vibrant amber
      dark: '#b45309',    // Updated from #a16207 to a richer dark amber
    },
    error: {
      light: '#fca5a5',
      DEFAULT: '#f43f5e', // Updated from #ef4444 to a richer rose
      dark: '#be185d',    // Updated from #b91c1c to a richer dark rose
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    // Adding more color options
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    // Adding elegant shadow options
    'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    'glow': '0 0 15px rgba(66, 153, 225, 0.5)',
  },
};