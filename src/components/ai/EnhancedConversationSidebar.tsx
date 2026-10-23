import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Plus, 
  Edit3, 
  Pin, 
  PinOff, 
  Check, 
  X, 
  MoreVertical,
  Clock,
  Hash,
  Star
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAIStore } from '../../store/aiStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationItem {
  id: string;
  title: string;
  messages: any[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  category?: string;
}

export function ConversationSidebar() {
  const {
    conversationHistory,
    loadConversation,
    deleteConversation,
    clearMessages,
    updateConversation,
    pinConversation,
    unpinConversation
  } = useAIStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const generateSmartTitle = (messages: any[]) => {
    if (!messages || messages.length === 0) return 'New Chat';
    
    // Get the first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    const content = firstUserMessage.content || '';
    
    // Extract key topics or patterns
    const topics = [
      { pattern: /calendar|schedule|meeting|appointment/i, title: 'Calendar Discussion' },
      { pattern: /task|todo|remind|deadline/i, title: 'Task Management' },
      { pattern: /email|message|send|reply/i, title: 'Email Assistance' },
      { pattern: /legal|law|case|court|wcab/i, title: 'Legal Consultation' },
      { pattern: /document|file|upload|pdf/i, title: 'Document Review' },
      { pattern: /code|programming|function|debug/i, title: 'Code Assistance' },
      { pattern: /write|draft|create|compose/i, title: 'Content Creation' },
      { pattern: /analyze|review|check|examine/i, title: 'Analysis Request' },
      { pattern: /help|how|what|explain/i, title: 'Help & Support' },
    ];

    // Check for topic matches
    for (const topic of topics) {
      if (topic.pattern.test(content)) {
        const timestamp = new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        return `${topic.title} - ${timestamp}`;
      }
    }

    // Extract first meaningful words (up to 4 words, max 30 chars)
    const words = content.trim().split(' ').slice(0, 4);
    let title = words.join(' ');
    
    if (title.length > 30) {
      title = title.substring(0, 27) + '...';
    } else if (title.length < 3) {
      title = 'New Chat';
    }

    // Add timestamp for uniqueness
    const timestamp = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${title} - ${timestamp}`;
  };

  const startNewChat = () => {
    clearMessages();
  };

  const handleEditStart = (conversation: ConversationItem) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
    setShowMenuId(null);
  };

  const handleEditSave = (id: string) => {
    if (editTitle.trim()) {
      updateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handlePin = (id: string) => {
    pinConversation(id);
    setShowMenuId(null);
  };

  const handleUnpin = (id: string) => {
    unpinConversation(id);
    setShowMenuId(null);
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
    setShowMenuId(null);
  };

  const handleLoadConversation = (id: string) => {
    loadConversation(id);
    setShowMenuId(null);
  };

  // Sort conversations: pinned first, then by update date
  const sortedConversations = [...conversationHistory].sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by update date (newest first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Auto-generate titles for conversations without proper titles
  useEffect(() => {
    conversationHistory.forEach(conversation => {
      if (conversation.title === 'New Conversation' || conversation.title.startsWith('Conversation ')) {
        const smartTitle = generateSmartTitle(conversation.messages);
        if (smartTitle !== conversation.title) {
          updateConversation(conversation.id, { title: smartTitle });
        }
      }
    });
  }, [conversationHistory, updateConversation]);

  return (
    <div className="w-80 border-r h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-slate-800">
        <Button 
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium"
          onClick={startNewChat}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 border-b">
        <div className="flex justify-between">
          <span>{conversationHistory.length} total chats</span>
          <span>{conversationHistory.filter(c => c.isPinned).length} pinned</span>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No conversations yet
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative rounded-lg transition-all duration-200",
                  "hover:bg-white hover:shadow-sm dark:hover:bg-slate-800",
                  conversation.isPinned && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50"
                )}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => handleLoadConversation(conversation.id)}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                    conversation.isPinned 
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : "bg-slate-100 dark:bg-slate-700"
                  )}>
                    {conversation.isPinned ? (
                      <Pin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === conversation.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(conversation.id);
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          className="h-7 text-sm"
                          placeholder="Chat title..."
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSave(conversation.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEditCancel}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                            {conversation.title}
                          </h3>
                          {conversation.isPinned && (
                            <Star className="h-3 w-3 text-blue-500 ml-2 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                          </span>
                          <Hash className="h-3 w-3 text-slate-400 ml-1" />
                          <span className="text-xs text-slate-500">
                            {conversation.messages.length} messages
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Menu */}
                  {editingId !== conversation.id && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 transition-opacity",
                          showMenuId === conversation.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenuId(showMenuId === conversation.id ? null : conversation.id);
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {/* Dropdown Menu */}
                      {showMenuId === conversation.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(conversation);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit Title
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                conversation.isPinned ? handleUnpin(conversation.id) : handlePin(conversation.id);
                              }}
                            >
                              {conversation.isPinned ? (
                                <>
                                  <PinOff className="h-4 w-4" />
                                  Unpin Chat
                                </>
                              ) : (
                                <>
                                  <Pin className="h-4 w-4" />
                                  Pin Chat
                                </>
                              )}
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(conversation.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Chat
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenuId(null)}
        />
      )}
    </div>
  );
}
