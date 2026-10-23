import React, { useState, useEffect } from 'react';
import { Maximize, Edit, Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const LayoutGuideOverlay = () => {
  const [showGuide, setShowGuide] = useState(false);

  // Check if user has seen the guide
  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_layout_guide');
    if (!hasSeen) setShowGuide(true);
  }, []);

  if (!showGuide) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-xl w-full bg-background rounded-3xl shadow-2xl border border-border/40 overflow-hidden flex flex-col">
        <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <h2 className="text-3xl font-bold mb-2">Double Screen Mode</h2>
          <p className="opacity-90">Maximize your productivity with an agentic layout.</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
              <Maximize size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Detach Panels</h3>
              <p className="text-muted-foreground text-sm">Click the "Detach" button on the Email, Browser, or Knowledge Base panels to pop them into a separate window for your second monitor.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600">
              <Edit size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Reorganize Layout</h3>
              <p className="text-muted-foreground text-sm">Click the "Layout" button in the top bar to enter edit mode. Drag and drop panels to change their order.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-600">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Drive Interaction</h3>
              <p className="text-muted-foreground text-sm">Drag files directly from the AI Drive panel into the Chat or Canvas to import them instantly.</p>
            </div>
          </div>
          <Button
            className="w-full h-14 rounded-2xl text-lg font-bold mt-4"
            onClick={() => {
              setShowGuide(false);
              localStorage.setItem('has_seen_layout_guide', 'true');
            }}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};
