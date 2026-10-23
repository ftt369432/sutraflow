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
  Star,
  Download,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '@/lib/utils';

export interface ConversationItem {
  id: string;
  title: string;
  messages?: any[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  category?: string;
}

interface FlexibleConversationSidebarProps {
  conversations: ConversationItem[];
  currentConversation: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onUpdateConversation?: (id: string, updates: Partial<ConversationItem>) => void;
  onPinConversation?: (id: string) => void;
  onUnpinConversation?: (id: string) => void;
  onExportConversation?: (id: string) => void;
  showStats?: boolean;
  showPinning?: boolean;
  className?: string;
  // Clear chats functionality
  showClearChatsMode?: boolean;
  selectedChatsToDelete?: Set<string>;
  onSelectChatForDeletion?: (id: string) => void;
  onToggleClearChatsMode?: () => void;
  onSelectAllChats?: () => void;
  onDeleteSelectedChats?: () => void;
  onClearAllChats?: () => void;
}

export function FlexibleConversationSidebar({
  conversations,
  currentConversation,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onUpdateConversation,
  onPinConversation,
  onUnpinConversation,
  onExportConversation,
  showStats = true,
  showPinning = true,
  className = "",
  // Clear chats functionality
  showClearChatsMode = false,
  selectedChatsToDelete = new Set(),
  onSelectChatForDeletion,
  onToggleClearChatsMode,
  onSelectAllChats,
  onDeleteSelectedChats,
  onClearAllChats
}: FlexibleConversationSidebarProps) {
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

  const handleEditStart = (conversation: ConversationItem) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
    setShowMenuId(null);
  };

  const handleEditSave = (id: string) => {
    if (editTitle.trim() && onUpdateConversation) {
      onUpdateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handlePin = (id: string) => {
    if (onPinConversation) onPinConversation(id);
    setShowMenuId(null);
  };

  const handleUnpin = (id: string) => {
    if (onUnpinConversation) onUnpinConversation(id);
    setShowMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (onDeleteConversation) onDeleteConversation(id);
    setShowMenuId(null);
  };

  const handleLoadConversation = (id: string) => {
    onSelectConversation(id);
    setShowMenuId(null);
  };

  const handleExport = (id: string) => {
    if (onExportConversation) onExportConversation(id);
    setShowMenuId(null);
  };

  const exportConversationAsText = (conversation: ConversationItem) => {
    const content = [
      `Conversation: ${conversation.title}`,
      `Date: ${conversation.createdAt.toLocaleDateString()} ${conversation.createdAt.toLocaleTimeString()}`,
      `Updated: ${conversation.updatedAt.toLocaleDateString()} ${conversation.updatedAt.toLocaleTimeString()}`,
      '',
      '='.repeat(50),
      ''
    ];

    if (conversation.messages) {
      conversation.messages.forEach((message, index) => {
        const role = message.role === 'user' ? 'You' : 'AI Assistant';
        const timestamp = new Date(message.timestamp).toLocaleString();
        
        content.push(`[${index + 1}] ${role} (${timestamp}):`);
        content.push(message.content || '');
        content.push('');
        content.push('-'.repeat(30));
        content.push('');
      });
    }

    const textContent = content.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sort conversations: pinned first, then by update date
  const sortedConversations = [...conversations].sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by update date (newest first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pinnedCount = conversations.filter(c => c.isPinned).length;

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-slate-900", className)}>
      {/* Clear Chats Header */}
      <div className="p-3 border-b border-border/40 bg-slate-50 dark:bg-slate-800/80">
        <div className="space-y-2">
          <Button 
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              showClearChatsMode 
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300" 
                : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
            )}
            onClick={() => {
              console.log('🧹 FlexibleConversationSidebar: Clear Chats button clicked');
              console.log('🧹 onToggleClearChatsMode function:', onToggleClearChatsMode);
              if (onToggleClearChatsMode) {
                console.log('🧹 Calling onToggleClearChatsMode...');
                onToggleClearChatsMode();
              } else {
                console.error('🧹 onToggleClearChatsMode is not defined!');
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            {showClearChatsMode ? 'Cancel Clear Mode' : 'Clear Chats'}
          </Button>

          {showClearChatsMode && conversations.length > 0 && (
            <div className="space-y-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={onSelectAllChats}
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select All ({selectedChatsToDelete.size})
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedChatsToDelete.size === 0}
                  className="flex-1 text-xs h-8"
                  onClick={onDeleteSelectedChats}
                >
                  Delete ({selectedChatsToDelete.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={onClearAllChats}
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400 border-b border-border/40">
          <div className="flex justify-between">
            <span>{conversations.length} total chats</span>
            {showPinning && <span>{pinnedCount} pinned</span>}
          </div>
        </div>
      )}

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
                  conversation.isPinned && showPinning && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50",
                  currentConversation === conversation.id && "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600"
                )}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => showClearChatsMode ? undefined : handleLoadConversation(conversation.id)}
                >
                  {/* Checkbox for clear mode */}
                  {showClearChatsMode && (
                    <div 
                      className="flex-shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectChatForDeletion) {
                          onSelectChatForDeletion(conversation.id);
                        }
                      }}
                    >
                      {selectedChatsToDelete.has(conversation.id) ? (
                        <CheckSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                      )}
                    </div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                    conversation.isPinned && showPinning
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : currentConversation === conversation.id
                      ? "bg-blue-200 dark:bg-blue-800"
                      : "bg-slate-100 dark:bg-slate-700"
                  )}>
                    {conversation.isPinned && showPinning ? (
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
                            {conversation.title || 'New Chat'}
                          </h3>
                          {conversation.isPinned && showPinning && (
                            <Star className="h-3 w-3 text-blue-500 ml-2 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-500 truncate">
                            {new Date(conversation.updatedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: new Date(conversation.updatedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                          </span>
                          {conversation.messages && conversation.messages.length > 0 && (
                            <span className="text-xs text-slate-400 ml-2">
                              {conversation.messages.length}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Menu */}
                  {editingId !== conversation.id && (onDeleteConversation || onUpdateConversation || (showPinning && onPinConversation)) && (
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
                            {onUpdateConversation && (
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
                            )}
                            {showPinning && onPinConversation && onUnpinConversation && (
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
                            )}
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportConversationAsText(conversation);
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Export as Text
                            </button>
                            {onDeleteConversation && (
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
                            )}
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
