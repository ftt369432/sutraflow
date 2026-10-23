import React from 'react';
import { AIChat } from '../legal/ai/AIChat';
import { ResearchAssistant } from '../research/ResearchAssistant';

interface ChatLayoutProps {
  // Add any specific props needed for the layout
}

export function ChatLayout({}: ChatLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <AIChat messages={[]} onSend={() => {}} />
        </div>
      </div>

      {/* Research Assistant */}
      <ResearchAssistant />
    </div>
  );
} 