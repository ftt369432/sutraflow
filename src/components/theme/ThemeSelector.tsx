import React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import type { ThemeMode, ThemeColor, ThemeStyle } from '../../store/themeStore';
import { cn } from '../../lib/utils';

const THEME_MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
];

const THEME_COLORS: { value: ThemeColor; label: string; class: string }[] = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'green', label: 'Green', class: 'bg-emerald-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
];

const THEME_STYLES: { value: ThemeStyle; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
];

export function ThemeSelector() {
  const { mode, style, color, setMode, setStyle, setColor } = useThemeStore();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[240px]">
      {/* Mode Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEME_MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg",
                "transition-colors duration-200",
                mode === value
                  ? "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {THEME_STYLES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStyle(value)}
              className={cn(
                "flex items-center justify-center p-2 rounded-lg",
                "transition-colors duration-200",
                style === value
                  ? "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Accent Color</h3>
        <div className="grid grid-cols-5 gap-2">
          {THEME_COLORS.map(({ value, label, class: bgClass }) => (
            <button
              key={value}
              onClick={() => setColor(value)}
              className="relative flex items-center justify-center"
              title={label}
            >
              <div className={cn("w-8 h-8 rounded-full", bgClass)} />
              {color === value && (
                <Check className="absolute h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}