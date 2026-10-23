import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    root.setAttribute('data-theme', newTheme);
    
    // Add new theme class
    root.classList.add(newTheme);
    
    // Save preference
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "gleaming-silver-button relative inline-flex items-center justify-center",
        "w-10 h-10 rounded-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        "hover:scale-105 active:scale-95",
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative z-10 transition-transform duration-200">
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-gray-700" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400" />
        )}
      </div>
    </button>
  );
} 