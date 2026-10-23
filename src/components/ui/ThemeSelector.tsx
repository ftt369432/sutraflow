import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border transition-colors duration-200",
      "bg-paper/50 border-primary/30",
      className
    )}>
      <Palette className="h-4 w-4 text-primary" />
      <select
        value={currentTheme.id}
        onChange={(e) => setTheme(e.target.value as any)}
        className={cn(
          "bg-transparent text-primary outline-none",
          "border-none cursor-pointer transition-colors duration-200",
          "hover:text-accent focus:text-accent"
        )}
      >
        {themes.map(theme => (
          <option
            key={theme.id}
            value={theme.id}
            className="bg-paper text-primary"
          >
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
} 