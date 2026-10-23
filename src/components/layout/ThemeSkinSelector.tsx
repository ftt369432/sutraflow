import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { SkinId } from '../../config/themes';
import { cn } from '../../lib/utils';

export function ThemeSkinSelector() {
  const { currentSkin, setSkin, skins, isDark, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border",
          "bg-white/70 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-cyan-400 text-slate-700 dark:text-slate-200 shadow-sm"
        )}
        title="Switch Skin (Each skin supports Light & Dark mode)"
      >
        <Palette className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
        <span className="hidden md:inline font-medium text-[11px]">{currentSkin.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 py-2 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Skin Suite
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme();
              }}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Click to toggle between Dark Mode and Light Mode"
            >
              {isDark ? (
                <>
                  <Moon className="w-3 h-3 text-cyan-400" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="py-1 space-y-0.5">
            {skins.map((skin) => {
              const isSelected = currentSkin.id === skin.id;
              return (
                <button
                  key={skin.id}
                  onClick={() => {
                    setSkin(skin.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors text-xs",
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-slate-800/80 text-indigo-900 dark:text-white font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {/* Color dot swatch */}
                  <span
                    className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 border border-black/10 shadow-sm"
                    style={{ backgroundColor: skin.accentColor }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate">{skin.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {skin.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 text-center">
            Toggle ☀️/🌙 in header to view light/dark edition
          </div>
        </div>
      )}
    </div>
  );
}
