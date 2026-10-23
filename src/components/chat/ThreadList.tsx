import React from 'react';
import { Pin, Trash2, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { formatDistanceToNow } from 'date-fns';

export const ThreadList: React.FC = () => {
  const {
    threads,
    currentThreadId,
    setCurrentThread,
    deleteThread,
    pinThread,
    unpinThread
  } = useChatStore();

  // Sort threads: pinned first, then by last updated
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.lastUpdated.getTime() - a.lastUpdated.getTime();
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Chat Threads</h2>
        <span className="text-sm text-gray-500">{threads.length} threads</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedThreads.map(thread => (
          <div
            key={thread.id}
            className={`group flex cursor-pointer items-center justify-between border-b p-4 hover:bg-gray-50 ${
              currentThreadId === thread.id ? 'bg-gray-50' : ''
            }`}
            onClick={() => setCurrentThread(thread.id)}
          >
            <div className="flex flex-1 items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <div className="flex-1 truncate">
                <h3 className="font-medium">{thread.title}</h3>
                <p className="text-sm text-gray-500">
                  {thread.messages.length} messages ·{' '}
                  {formatDistanceToNow(thread.lastUpdated, { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="ml-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  thread.isPinned ? unpinThread(thread.id) : pinThread(thread.id);
                }}
                className={`rounded p-1 hover:bg-gray-200 ${
                  thread.isPinned ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <Pin className="h-4 w-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this thread?')) {
                    deleteThread(thread.id);
                  }
                }}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {thread.isPinned && (
              <Pin className="ml-2 h-4 w-4 text-primary" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 