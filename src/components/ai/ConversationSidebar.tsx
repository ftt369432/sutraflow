import { MessageSquare, Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAIStore } from '../../store/aiStore';
import { formatDistanceToNow } from 'date-fns';

export function ConversationSidebar() {
  const {
    conversationHistory,
    loadConversation,
    deleteConversation,
    clearMessages,
  } = useAIStore();

  const startNewChat = () => {
    clearMessages();
  };

  return (
    <div className="w-64 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <Button 
          className="w-full"
          onClick={startNewChat}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversationHistory.map((conversation) => (
          <div
            key={conversation.id}
            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer group"
            onClick={() => loadConversation(conversation.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <div className="truncate">
                <div className="font-medium text-sm truncate">
                  {conversation.title || 'New Conversation'}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conversation.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 