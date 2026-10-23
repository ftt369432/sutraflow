import React, { useState } from 'react';
import { Save, Download, Pin, Copy, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  isPinned: boolean;
  lastUpdated: Date;
}

interface ChatManagerProps {
  currentThread: ChatThread;
  onThreadUpdate: (thread: ChatThread) => void;
  onThreadPin: (threadId: string) => void;
}

export const ChatManager: React.FC<ChatManagerProps> = ({
  currentThread,
  onThreadUpdate,
  onThreadPin
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleCopyThread = () => {
    const threadText = currentThread.messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(threadText);
    toast.success('Chat thread copied to clipboard');
  };

  const handleDownloadThread = () => {
    const threadContent = {
      ...currentThread,
      messages: currentThread.messages.map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(threadContent, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-thread-${currentThread.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Chat thread downloaded');
  };

  const handlePinThread = () => {
    onThreadPin(currentThread.id);
    toast.success(currentThread.isPinned ? 'Thread unpinned' : 'Thread pinned');
  };

  const handleSaveThread = () => {
    // Save to local storage
    const savedThreads = JSON.parse(localStorage.getItem('chatThreads') || '[]');
    const existingIndex = savedThreads.findIndex((t: ChatThread) => t.id === currentThread.id);
    
    if (existingIndex >= 0) {
      savedThreads[existingIndex] = currentThread;
    } else {
      savedThreads.push(currentThread);
    }
    
    localStorage.setItem('chatThreads', JSON.stringify(savedThreads));
    toast.success('Chat thread saved');
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="rounded-full bg-primary p-2 text-white shadow-lg hover:bg-primary/90"
      >
        <Archive className="h-5 w-5" />
      </button>

      {showOptions && (
        <div className="flex flex-col space-y-2 rounded-lg bg-white p-2 shadow-lg">
          <button
            onClick={handleCopyThread}
            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-gray-100"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Thread</span>
          </button>

          <button
            onClick={handleDownloadThread}
            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-gray-100"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>

          <button
            onClick={handlePinThread}
            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-gray-100"
          >
            <Pin className={`h-4 w-4 ${currentThread.isPinned ? 'text-primary' : ''}`} />
            <span>{currentThread.isPinned ? 'Unpin' : 'Pin'}</span>
          </button>

          <button
            onClick={handleSaveThread}
            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-gray-100"
          >
            <Save className="h-4 w-4" />
            <span>Save Thread</span>
          </button>
        </div>
      )}
    </div>
  );
}; 