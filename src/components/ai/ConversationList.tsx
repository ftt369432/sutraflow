import { Pin, MessageSquare, Star, Trash2, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Conversation } from '../../types/ai';
import PropTypes from 'prop-types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string) => void;
  onEditTitle: (id: string) => void;
}

export function ConversationList({
  conversations,
  currentConversation,
  onSelectConversation,
  onDeleteConversation,
  onPinConversation,
  onEditTitle
}: ConversationListProps) {
  // Sort conversations: pinned first, then by date
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const pinnedConversations = sortedConversations.filter(c => c.pinned);
  const recentConversations = sortedConversations.filter(c => !c.pinned);

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => (
    <div
      className={`group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-primary/5 ${
        currentConversation === conversation.id ? 'bg-primary/10' : ''
      }`}
      onClick={() => onSelectConversation(conversation.id)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {conversation.pinned ? (
            <Pin className="w-4 h-4 text-primary" />
          ) : (
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{conversation.title}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.messages[conversation.messages.length - 1]?.content || 'No messages'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onPinConversation(conversation.id);
          }}
        >
          <Star className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onEditTitle(conversation.id);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-error hover:text-error"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteConversation(conversation.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {pinnedConversations.length > 0 && (
        <div className="space-y-1">
          <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pinned
          </h3>
          {pinnedConversations.map(conversation => (
            <ConversationItem key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
      <div className="mt-4 space-y-1">
        <h3 className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent
        </h3>
        {recentConversations.map(conversation => (
          <ConversationItem key={conversation.id} conversation={conversation} />
        ))}
      </div>
    </div>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    lastMessage: PropTypes.string,
    timestamp: PropTypes.number.isRequired,
    unreadCount: PropTypes.number
  })).isRequired,
  selectedConversationId: PropTypes.string,
  onSelectConversation: PropTypes.func.isRequired,
  onDeleteConversation: PropTypes.func.isRequired
}; 