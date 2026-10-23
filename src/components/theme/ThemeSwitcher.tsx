import React from 'react';
import { Monitor, Moon, Sun, Zap, Bot, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';
import type { ThemeType, ThemeMode, ThemeStyle } from '../../config/themes';

interface ThemeOption {
  value: ThemeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  className?: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <Sun className="h-5 w-5" />,
    description: 'Clean and bright for daytime use',
    className: 'hover:bg-slate-100'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <Moon className="h-5 w-5" />,
    description: 'Easy on the eyes in low light',
    className: 'hover:bg-gray-800/20'
  },
  {
    value: 'tokyo-night',
    label: 'Tokyo Night',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Inspired by Tokyo\'s nightlife',
    className: 'hover:bg-[#7aa2f7]/20'
  },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    icon: <Zap className="h-5 w-5" />,
    description: 'High contrast neon aesthetics',
    className: 'hover:bg-[#00fff9]/20'
  },
  {
    value: 'cyborg',
    label: 'Cyborg',
    icon: <Bot className="h-5 w-5" />,
    description: 'Mechanical and industrial feel',
    className: 'hover:bg-[#ff4d4d]/20'
  }
];

const modeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light Mode', icon: <Sun className="h-5 w-5" /> },
  { value: 'dark', label: 'Dark Mode', icon: <Moon className="h-5 w-5" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-5 w-5" /> }
];

const styleOptions: { value: ThemeStyle; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'cyberpunk', label: 'Cyberpunk' }
];

export function ThemeSwitcher() {
  const { theme, mode, style, setTheme, setMode, setStyle } = useTheme();

  return (
    <div className="p-6 space-y-6 bg-paper border border-border rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Theme Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {modeOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={`flex flex-col items-center justify-center p-3 ${
                mode === option.value 
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-primary/5'
              }`}
              onClick={() => setMode(option.value)}
            >
              {option.icon}
              <span className="mt-1 text-xs">{option.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Theme Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {styleOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={`justify-start ${
                style === option.value 
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-primary/5'
              }`}
              onClick={() => setStyle(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Color Themes</h3>
        <div className="grid gap-2">
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={`w-full justify-start gap-3 p-4 transition-all duration-200 ${
                theme === option.value 
                  ? 'bg-primary/10 border-2 border-primary/30'
                  : `hover:bg-primary/5 border-2 border-transparent ${option.className}`
              }`}
              onClick={() => setTheme(option.value)}
            >
              <div className={`p-2 rounded-full ${
                theme === option.value 
                  ? 'bg-primary text-white' 
                  : 'bg-primary/10'
              }`}>
                {option.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className={`font-medium ${
                  theme === option.value ? 'text-primary' : 'text-text-primary'
                }`}>
                  {option.label}
                </span>
                <span className="text-xs text-text-secondary">
                  {option.description}
                </span>
              </div>
              {theme === option.value && (
                <div className="ml-auto">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                </div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThemeSwitcherMinimal() {
  const { theme, mode, setTheme, setMode } = useTheme();
  
  const toggleTheme = () => {
    if (mode === 'system') {
      setMode('dark');
      setTheme('dark');
    } else if (mode === 'dark') {
      setMode('light');
      setTheme('light');
    } else {
      setMode('system');
    }
  };

  const currentTheme = themeOptions.find(t => t.value === theme);
  const currentMode = modeOptions.find(m => m.value === mode);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 hover:bg-primary/5 border border-transparent hover:border-primary/20"
    >
      <div className="p-1.5 rounded-full bg-primary/10">
        {currentMode?.icon || currentTheme?.icon}
      </div>
      <span className="hidden md:inline text-text-primary font-medium">
        {currentMode?.label || currentTheme?.label}
      </span>
    </Button>
  );
} 