import React, { useState } from 'react';
import { AIChat } from '../../components/legal/ai/AIChat';
import { DocumentAnalysis } from '../../components/legal/ai/DocumentAnalysis';
import { AIHistory } from '../../components/legal/ai/AIHistory';
import type { AIMessage } from '../../types/legal';

export function LegalAIAssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-300">AI-powered legal analysis and assistance</p>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        <div className="col-span-2 flex flex-col">
          <AIChat
            messages={messages}
            onSend={(message) => setMessages([...messages, message])}
          />
        </div>
        <div className="space-y-6">
          <DocumentAnalysis analyzing={analyzing} />
          <AIHistory messages={messages} />
        </div>
      </div>
    </div>
  );
}