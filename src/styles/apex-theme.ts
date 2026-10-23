// APEX Consulting Group Brand Color System
// Dark Steel Shimmery & Navy Steel Shimmery Theme

export const apexColors = {
  // Primary Steel (Dark Steel Shimmery)
  steel: {
    50: '#f8fafc',
    100: '#f1f5f9', 
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Navy Steel (Navy Steel Shimmery)
  navySteel: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0', 
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0c1427',
  }
};

export const apexGradients = {
  // Primary - Dark Steel Shimmery
  primary: 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800',
  primaryHover: 'hover:from-slate-700 hover:via-slate-800 hover:to-slate-900',
  
  // Secondary - Navy Steel Shimmery  
  secondary: 'bg-gradient-to-r from-slate-800 via-slate-900 to-blue-900',
  secondaryHover: 'hover:from-slate-900 hover:via-blue-900 hover:to-blue-800',
  
  // Light Steel
  light: 'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600',
  lightHover: 'hover:from-slate-500 hover:via-slate-600 hover:to-slate-700',
  
  // Background gradients
  backgroundLight: 'bg-gradient-to-br from-slate-50 to-slate-100',
  backgroundDark: 'bg-gradient-to-br from-slate-900 to-slate-800',
  
  // Card backgrounds
  cardLight: 'bg-gradient-to-r from-slate-50 to-slate-100',
  cardMedium: 'bg-gradient-to-r from-slate-100 to-slate-200',
};

export const apexShadows = {
  steel: 'shadow-lg shadow-slate-500/25',
  steelHover: 'hover:shadow-xl hover:shadow-slate-600/30',
  glow: 'shadow-lg shadow-slate-400/20',
};

export const apexEffects = {
  shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
  transform: 'transition-all duration-300 transform hover:scale-[1.02]',
  border: 'border border-slate-500/30 backdrop-blur-sm',
};

// Complete button class combinations
export const apexButtonStyles = {
  primary: `${apexGradients.primary} ${apexGradients.primaryHover} text-white ${apexShadows.steel} ${apexShadows.steelHover} ${apexEffects.transform} ${apexEffects.border} ${apexEffects.shimmer}`,
  secondary: `${apexGradients.secondary} ${apexGradients.secondaryHover} text-white ${apexShadows.steel} ${apexShadows.steelHover} ${apexEffects.transform} border border-blue-800/40 ${apexEffects.shimmer}`,
  light: `${apexGradients.light} ${apexGradients.lightHover} text-white ${apexShadows.glow} hover:shadow-lg ${apexEffects.transform} border border-slate-400/30 ${apexEffects.shimmer}`,
};

export default {
  colors: apexColors,
  gradients: apexGradients,
  shadows: apexShadows,
  effects: apexEffects,
  buttons: apexButtonStyles,
};
