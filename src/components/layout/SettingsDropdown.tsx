import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Monitor, Moon, Sun, Cpu } from 'lucide-react';
import { Button } from '../ui/Button';
import { useThemeStore } from '../../store/themeStore';

export function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, style, setMode, setStyle } = useThemeStore();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsOpen(false)} 
            />

            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="p-2">
                <h3 className="mb-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Theme Settings
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                    className="flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {mode === 'light' ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : (
                      <Sun className="mr-2 h-4 w-4" />
                    )}
                    <span>{mode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                  <button
                    onClick={() => setStyle(style === 'default' ? 'cyberpunk' : 'default')}
                    className="flex w-full items-center rounded-md px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {style === 'default' ? (
                      <Cpu className="mr-2 h-4 w-4" />
                    ) : (
                      <Monitor className="mr-2 h-4 w-4" />
                    )}
                    <span>{style === 'default' ? 'Cyberpunk Mode' : 'Default Mode'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 