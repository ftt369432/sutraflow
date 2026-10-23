import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../lib/utils';

export function CyberpunkBackground() {
  const { style, color } = useThemeStore();

  if (style !== 'cyberpunk') return null;

  const getAccentColor = () => {
    switch (color) {
      case 'blue': return 'from-blue-500/20 to-blue-500/5';
      case 'cyan': return 'from-cyan-500/20 to-cyan-500/5';
      case 'green': return 'from-emerald-500/20 to-emerald-500/5';
      case 'rose': return 'from-rose-500/20 to-rose-500/5';
      case 'amber': return 'from-amber-500/20 to-amber-500/5';
      default: return 'from-blue-500/20 to-blue-500/5';
    }
  };

  return (
    <>
      {/* Grid Background */}
      <div className="fixed inset-0 bg-cyberpunk-darker bg-cyberpunk-grid bg-[size:50px_50px] opacity-20" />
      
      {/* Animated Scanlines */}
      <div className="fixed inset-0 bg-scanline animate-scanline opacity-5" />
      
      {/* Vignette Effect with accent color */}
      <div className={cn(
        "fixed inset-0 bg-gradient-radial opacity-50",
        getAccentColor()
      )} />
      
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "absolute w-1 h-1 rounded-full opacity-50",
              `bg-${color}-500`
            )}
            animate={{
              x: ['0%', '100%', '0%'],
              y: ['0%', '100%', '0%'],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: -Math.random() * 10,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </>
  );
} 