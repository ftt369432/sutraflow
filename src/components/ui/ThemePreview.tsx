import React from 'react';
import { Theme } from '../../config/themes';
import { cn } from '../../lib/utils';

interface ThemePreviewProps {
  theme: Theme;
  isActive?: boolean;
  onClick?: () => void;
}

export function ThemePreview({ theme, isActive, onClick }: ThemePreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-2 rounded-lg border transition-all duration-200",
        "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
        isActive ? "border-primary" : "border-primary/10",
      )}
    >
      <div className="aspect-video w-full rounded-md overflow-hidden relative">
        {/* Preview Background */}
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: theme.colors.background }}
        />

        {/* Preview Content */}
        <div className="relative p-2 h-full flex flex-col">
          {/* Header */}
          <div 
            className="h-3 rounded-sm mb-2" 
            style={{ backgroundColor: theme.colors.paper }}
          />

          {/* Content Blocks */}
          <div className="flex-1 flex gap-2">
            <div className="flex-1 space-y-1">
              <div 
                className="h-2 w-3/4 rounded-sm" 
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div 
                className="h-2 w-1/2 rounded-sm" 
                style={{ backgroundColor: theme.colors.secondary }}
              />
              <div 
                className="h-2 w-2/3 rounded-sm" 
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
            <div 
              className="w-1/3 rounded-sm" 
              style={{ backgroundColor: theme.colors.paper }}
            />
          </div>

          {/* Effects Preview */}
          {theme.effects && (
            <div className="absolute inset-0 pointer-events-none">
              {theme.effects.enableGlow && (
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{ 
                    background: `radial-gradient(circle at 50% 50%, ${theme.colors.primary}40 0%, transparent 70%)` 
                  }}
                />
              )}
              {theme.effects.enableGrid && (
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(to right, ${theme.colors.primary}20 1px, transparent 1px),
                                  linear-gradient(to bottom, ${theme.colors.primary}20 1px, transparent 1px)`,
                  backgroundSize: '8px 8px'
                }} />
              )}
              {theme.effects.enableScanlines && (
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, ${theme.colors.primary}, transparent 2px)`,
                  backgroundSize: '100% 4px'
                }} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 text-left">
        <div className="text-sm font-medium text-text-primary">{theme.name}</div>
        <div className="text-xs text-text-muted truncate">{theme.description}</div>
      </div>
    </button>
  );
} 