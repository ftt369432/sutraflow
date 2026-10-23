import { useState } from 'react';
import { Star, Trash2, MessageSquare, Search, Plus, FolderPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import type { Message } from '../../types/ai';
import { Input } from '../ui/Input';

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
}

interface ChatHistoryProps {
  conversations?: Conversation[];
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
  onNewChat?: () => void;
  onNewCase?: () => void;
  selectedConversationId?: string | null;
}

function ChatHistoryItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onToggleFavorite
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between py-2 px-3 cursor-pointer transition-colors',
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50 text-foreground'
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {conversation.isFavorite ? (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
        ) : (
          <MessageSquare className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="text-sm truncate">{conversation.title}</span>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 hover:bg-background/80 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(conversation.id);
          }}
        >
          <Star
            className={cn(
              'h-4 w-4',
              conversation.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        </button>
        
        <button
          className="p-1 hover:bg-background/80 rounded text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conversation.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ChatHistory({
  conversations = [],
  onSelectConversation = () => {},
  onDeleteConversation = () => {},
  onToggleFavorite = () => {},
  onNewChat = () => {},
  onNewCase = () => {},
  selectedConversationId
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteConversations = filteredConversations.filter(conv => conv.isFavorite);
  const otherConversations = filteredConversations.filter(conv => !conv.isFavorite);

  return (
    <div className="w-64 flex flex-col h-full border-r bg-card">
      {/* Action Buttons */}
      <div className="p-3 space-y-2 border-b bg-background/50">
        <Button
          variant="secondary"
          className="w-full justify-start gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600"
          onClick={onNewCase}
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Case</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b bg-background/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {favoriteConversations.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1.5 text-sm font-medium text-muted-foreground">
              Favorites
            </div>
            <div>
              {favoriteConversations.map((conversation) => (
                <ChatHistoryItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        <div className="py-2">
          {favoriteConversations.length > 0 && (
            <div className="px-3 py-1.5 text-sm font-medium text-muted-foreground">
              Recent
            </div>
          )}
          <div>
            {otherConversations.map((conversation) => (
              <ChatHistoryItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>

        {filteredConversations.length === 0 && searchQuery && (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
} 