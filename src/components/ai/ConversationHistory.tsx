import { ScrollArea } from '../ui/ScrollArea';
import { Button } from '../ui/Button';
import { Trash2, RotateCcw } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useAIStore, type Conversation } from '../../store/aiStore';
import type { Message } from '../../types/ai';

interface ConversationHistoryProps {
  onClose: () => void;
}

export function ConversationHistory({ onClose }: ConversationHistoryProps) {
  const { clearMessages } = useAI();
  const { conversationHistory, loadConversation } = useAIStore();

  const getConversationPreview = (messages: Message[]) => {
    const firstMessage = messages.find(m => m.role === 'user')?.content;
    return firstMessage ? `${firstMessage.substring(0, 50)}...` : 'Empty conversation';
  };

  const handleRestoreConversation = (id: string) => {
    loadConversation(id);
    if (onClose) onClose();
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-xl">
      <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
      {conversationHistory.length === 0 ? (
        <p className="text-gray-400">No saved conversations yet.</p>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-2">
            {conversationHistory.map((conversation: Conversation, index: number) => (
              <div
                key={index}
                className="p-3 hover:bg-gray-700 rounded-lg group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm truncate w-48" title={conversation.title}>
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getConversationPreview(conversation.messages)}
                    </p>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRestoreConversation(conversation.id)}
                      title="Restore conversation"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      <div className="mt-4 flex justify-end">
        <Button 
          variant="destructive" 
          onClick={() => { clearMessages(); }}
          title="Clear current chat and history (if implemented)"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat & History
        </Button>
      </div>
    </div>
  );
} 