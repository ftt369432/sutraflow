import React from 'react';
import { cn } from '../../lib/utils';
import type { ThemeId } from '../../config/themes';

interface CyberpunkEffectsProps {
  mode?: 'normal' | 'turbo' | 'cyborg';
  theme?: ThemeId;
  className?: string;
}

export function CyberpunkEffects({ mode, theme = 'cyberpunk', className }: CyberpunkEffectsProps) {
  const getModeColors = () => {
    // If mode is provided, use legacy color scheme
    if (mode) {
      switch (mode) {
        case 'normal':
          return {
            primary: 'from-cyberpunk-neon/20',
            secondary: 'to-cyberpunk-neon/5'
          };
        case 'turbo':
          return {
            primary: 'from-cyberpunk-pink/20',
            secondary: 'to-cyberpunk-pink/5'
          };
        case 'cyborg':
          return {
            primary: 'from-cyberpunk-yellow/20',
            secondary: 'to-cyberpunk-yellow/5'
          };
        default:
          return {
            primary: 'from-cyberpunk-neon/20',
            secondary: 'to-cyberpunk-neon/5'
          };
      }
    }

    // Use theme-based colors
    switch (theme) {
      case 'cyberpunk':
        return {
          primary: 'from-cyberpunk-neon/20',
          secondary: 'to-cyberpunk-neon/5'
        };
      case 'tokyo-night':
        return {
          primary: 'from-[#7aa2f7]/20',
          secondary: 'to-[#7aa2f7]/5'
        };
      case 'synthwave':
        return {
          primary: 'from-[#ff7edb]/20',
          secondary: 'to-[#ff7edb]/5'
        };
      case 'matrix':
        return {
          primary: 'from-[#00ff00]/20',
          secondary: 'to-[#00ff00]/5'
        };
      case 'light':
      case 'dark':
      case 'minimal':
      default:
        return {
          primary: 'from-primary/20',
          secondary: 'to-primary/5'
        };
    }
  };

  const colors = getModeColors();

  return (
    <div className={cn('pointer-events-none fixed inset-0 z-30', className)}>
      {/* Ambient Glow */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b opacity-30',
        colors.primary,
        colors.secondary
      )} />

      {/* Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Scan Lines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.04)_3px,rgba(255,255,255,0.04)_3px)] animate-scan" />

      {/* Glitch Effect */}
      <div className="absolute inset-0 opacity-20 animate-glitch-1">
        <div className={cn(
          'absolute inset-0 translate-x-[10px] bg-gradient-to-r',
          colors.primary,
          'mix-blend-screen'
        )} />
      </div>
      <div className="absolute inset-0 opacity-20 animate-glitch-2">
        <div className={cn(
          'absolute inset-0 -translate-x-[10px] bg-gradient-to-l',
          colors.secondary,
          'mix-blend-screen'
        )} />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.4)_70%)]" />
    </div>
  );
} 