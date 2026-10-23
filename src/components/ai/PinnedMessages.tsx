import React from 'react';
import { Message } from '../../types/ai';
import { Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface PinnedMessagesProps {
  messages: Message[];
  onUnpin: (messageId: string) => void;
  onNavigate: (messageId: string) => void;
}

export function PinnedMessages({ messages, onUnpin, onNavigate }: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (messages.length === 0) return null;

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Pin className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium">Pinned Messages</h3>
            <span className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'group relative p-3 rounded-lg hover:bg-accent/50 transition-colors',
                  'border border-border/50 bg-background/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onNavigate(message.id)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onUnpin(message.id)}
                  >
                    <Pin className="h-4 w-4 text-primary fill-primary" />
                  </Button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10 pointer-events-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 