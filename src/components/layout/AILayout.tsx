import React from 'react';
import { Brain, Settings, Bell } from 'lucide-react';
import { Button } from '../ui/Button';

interface AILayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AILayout({ 
  children, 
  title, 
  subtitle = 'v2.0', 
  icon = <Brain />,
  actions
}: AILayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyberpunk-dark to-cyberpunk-darker">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-cyberpunk-grid opacity-5 pointer-events-none" />
      <div className="fixed inset-0 bg-scanline opacity-5 pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="border-b border-cyberpunk-neon/20 bg-cyberpunk-dark/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 text-cyberpunk-neon animate-glow">
                {icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {title}
                  <span className="ml-2 text-cyberpunk-neon">{subtitle}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {actions}
              <div className="flex items-center gap-2 border-l border-cyberpunk-neon/20 pl-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-cyberpunk-neon/20 bg-cyberpunk-dark/50 mt-8">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm text-gray-400">
            <div>
              Sutra AI Suite
            </div>
            <div className="flex items-center gap-4">
              <span>Status: Online</span>
              <span>•</span>
              <span>Response Time: 120ms</span>
              <span>•</span>
              <span>Model: GPT-4 Turbo</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 