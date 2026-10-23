import React, { useState } from 'react';
import { Search, Bot } from 'lucide-react';
import { BotBuilder } from '../bot/BotBuilder';

type Tab = 'research' | 'bot-builder';

interface ResearchAssistantProps {
  previousData?: { id: string; content: string }[];
  onSaveBot?: (bot: { name: string; actions: any[] }) => void;
}

export function ResearchAssistant({ previousData = [], onSaveBot }: ResearchAssistantProps) {
  const [activeTab, setActiveTab] = useState<Tab>('research');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'research'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('research')}
        >
          <Search size={16} />
          <span>Research</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'bot-builder'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('bot-builder')}
        >
          <Bot size={16} />
          <span>Bot Builder</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'research' ? (
          <div className="h-full p-4 space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search the web..."
                className="w-full p-2 pr-8 rounded-lg border dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Research results */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Sample result item */}
                <div className="p-3 rounded-lg bg-white dark:bg-gray-700 shadow">
                  <h3 className="font-medium mb-1">Search Result Title</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Preview of the search result content...
                  </p>
                  <a 
                    href="#" 
                    className="text-xs text-blue-500 hover:underline mt-2 block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <BotBuilder previousData={previousData} onSave={onSaveBot} />
        )}
      </div>
    </div>
  );
} 