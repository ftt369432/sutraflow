export const cyberpunkTheme = {
  colors: {
    primary: {
      neon: '#0ff',
      pink: '#ff00ff',
      yellow: '#f0f',
      accent: '#0ff',
    },
    background: {
      dark: '#000033',
      darker: '#000022',
      card: 'rgba(0, 0, 51, 0.7)',
    },
    text: {
      primary: '#0ff',
      secondary: '#ff00ff',
      accent: '#f0f',
    },
    border: {
      neon: '#0ff',
      glow: '0 0 10px #0ff',
    },
  },
  effects: {
    glowText: 'text-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 15px #0ff;',
    glowBox: 'box-shadow: 0 0 5px #0ff, 0 0 10px #0ff, inset 0 0 5px #0ff;',
    scanline: 'linear-gradient(transparent 50%, rgba(0, 255, 255, 0.05) 50%)',
  },
};

export const cyberpunkStyles = {
  text: {
    glow: 'animate-glow text-cyberpunk-neon',
    neon: 'text-cyberpunk-neon font-mono',
    glitch: 'animate-glitch text-cyberpunk-pink',
  },
  container: {
    base: 'bg-cyberpunk-dark border border-cyberpunk-neon rounded-lg p-4',
    glow: 'shadow-neon bg-cyberpunk-darker',
    grid: 'bg-cyberpunk-grid bg-opacity-10',
  },
  button: {
    neon: 'bg-transparent border border-cyberpunk-neon text-cyberpunk-neon hover:bg-cyberpunk-neon hover:text-cyberpunk-dark transition-all duration-300',
    hologram: 'bg-cyberpunk-neon bg-opacity-20 text-cyberpunk-neon border-none hover:bg-opacity-30',
  },
  effects: {
    scanline: 'before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-scanline before:pointer-events-none before:animate-scanline',
    flicker: 'animate-flicker',
    pulse: 'animate-pulse-neon',
  }
}; 