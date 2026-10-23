export type ThemeId = 'light' | 'dark' | 'cyberpunk' | 'tokyo-night' | 'synthwave' | 'matrix' | 'minimal';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    background: string;
    paper: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  effects?: {
    enableGlow?: boolean;
    enableScanlines?: boolean;
    enableGrid?: boolean;
    enableGlitch?: boolean;
  };
}

export type SkinId = 
  | 'nous-obsidian' 
  | 'classic-genieflow' 
  | 'steel-metallic' 
  | 'matrix-cyber' 
  | 'executive-gold';

export interface SkinDefinition {
  id: SkinId;
  name: string;
  tagline: string;
  cssClass: string;
  accentColor: string;
  darkBadge: string;
  lightBadge: string;
}

export const SKINS: SkinDefinition[] = [
  {
    id: 'nous-obsidian',
    name: 'Sutra Obsidian',
    tagline: 'Deep space titanium & cyan intelligence (Default)',
    cssClass: 'skin-nous-obsidian',
    accentColor: '#2563eb',
    darkBadge: 'Titanium Deep Space',
    lightBadge: 'Crystalline Slate',
  },
  {
    id: 'classic-genieflow',
    name: 'Classic Sutra',
    tagline: 'Original Chi-Shimmer blue-steel & raised glass bubbles',
    cssClass: 'theme-classic-genieflow',
    accentColor: '#2563eb',
    darkBadge: 'Dark Blue-Steel Gleam',
    lightBadge: 'Soft Chi-Shimmer Light',
  },
  {
    id: 'steel-metallic',
    name: 'Steel Metallic',
    tagline: 'Dribbble brushed platinum & dark steel shimmery',
    cssClass: 'skin-steel-metallic',
    accentColor: '#94a3b8',
    darkBadge: 'Dark Steel Shimmery',
    lightBadge: 'Brushed Platinum Light',
  },
  {
    id: 'matrix-cyber',
    name: 'Matrix Cyber',
    tagline: 'Digital rain onyx & phosphor green',
    cssClass: 'skin-matrix-cyber',
    accentColor: '#10b981',
    darkBadge: 'Phosphor Green Onyx',
    lightBadge: 'Jade Mint Parchment',
  },
  {
    id: 'executive-gold',
    name: 'Executive Gold',
    tagline: 'Midnight navy & champagne gold',
    cssClass: 'skin-executive-gold',
    accentColor: '#eab308',
    darkBadge: 'Midnight Navy & Gold',
    lightBadge: 'Champagne Ivory Light',
  },
];

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean blue-steel and gold light theme',
    colors: {
      background: '#ffffff',
      paper: '#f8fafc',
      primary: '#2c5282', // Deeper blue-steel
      secondary: '#4a5568',
      accent: '#d4af37', // Gold accent
      border: '#e2e8f0',
      text: {
        primary: '#2d3748',
        secondary: '#4a5568',
        muted: '#718096',
      },
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modern blue-steel and gold dark theme',
    colors: {
      background: '#0f172a', // Dark blue-steel
      paper: '#1e293b', // Slightly lighter blue-steel
      primary: '#90cdf4', // Light blue for text/primary elements
      secondary: '#a0aec0',
      accent: '#f6e05e', // Gold accent
      border: '#2d3748',
      text: {
        primary: '#f7fafc',
        secondary: '#cbd5e0',
        muted: '#718096',
      },
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'High-tech, neon-infused cyberpunk aesthetic',
    colors: {
      background: '#000033',
      paper: '#000044',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      border: '#00ffff20',
      text: {
        primary: '#ffffff',
        secondary: '#00ffff',
        muted: '#00ffff80',
      },
    },
    effects: {
      enableGlow: true,
      enableScanlines: true,
      enableGrid: true,
      enableGlitch: true,
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Inspired by Tokyo\'s neon-lit nightscape',
    colors: {
      background: '#1a1b26',
      paper: '#24283b',
      primary: '#7aa2f7',
      secondary: '#bb9af7',
      accent: '#f7768e',
      border: '#414868',
      text: {
        primary: '#c0caf5',
        secondary: '#7aa2f7',
        muted: '#565f89',
      },
    },
    effects: {
      enableGlow: true,
      enableGrid: true,
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: '80s retro synthwave aesthetic',
    colors: {
      background: '#2b213a',
      paper: '#241b2f',
      primary: '#ff7edb',
      secondary: '#799bff',
      accent: '#f97e72',
      border: '#ff7edb20',
      text: {
        primary: '#ffffff',
        secondary: '#ff7edb',
        muted: '#ff7edb80',
      },
    },
    effects: {
      enableGlow: true,
      enableGrid: true,
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Digital rain matrix style',
    colors: {
      background: '#000000',
      paper: '#0a0a0a',
      primary: '#00ff00',
      secondary: '#00cc00',
      accent: '#008800',
      border: '#00ff0020',
      text: {
        primary: '#00ff00',
        secondary: '#00cc00',
        muted: '#00880080',
      },
    },
    effects: {
      enableScanlines: true,
      enableGlitch: true,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, distraction-free interface',
    colors: {
      background: '#fafafa',
      paper: '#ffffff',
      primary: '#171717',
      secondary: '#525252',
      accent: '#737373',
      border: '#e5e5e5',
      text: {
        primary: '#171717',
        secondary: '#525252',
        muted: '#737373',
      },
    },
  },
]; 