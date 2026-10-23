import React from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Copy, Share, Code, Bookmark, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Message } from '../../types/ai';
import PropTypes from 'prop-types';

interface MessageThreadProps {
  messages: Message[];
  onReaction: (messageId: string, reaction: 'like' | 'dislike' | null) => void;
  onCopy: (messageId: string) => void;
  onShare: (messageId: string) => void;
  onToggleCode: (messageId: string) => void;
  onBookmark: (messageId: string) => void;
  reactions: Record<string, 'like' | 'dislike' | null>;
  codeView: Record<string, boolean>;
  bookmarkedMessages: Set<string>;
}

export function MessageThread({
  messages,
  onReaction,
  onCopy,
  onShare,
  onToggleCode,
  onBookmark,
  reactions,
  codeView,
  bookmarkedMessages
}: MessageThreadProps) {
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const MessageActions = ({ message }: { message: Message }) => (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${reactions[message.id] === 'like' ? 'text-primary' : ''}`}
        onClick={() => onReaction(message.id, reactions[message.id] === 'like' ? null : 'like')}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${reactions[message.id] === 'dislike' ? 'text-error' : ''}`}
        onClick={() => onReaction(message.id, reactions[message.id] === 'dislike' ? null : 'dislike')}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onCopy(message.id)}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onShare(message.id)}
      >
        <Share className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${codeView[message.id] ? 'text-primary' : ''}`}
        onClick={() => onToggleCode(message.id)}
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${bookmarkedMessages.has(message.id) ? 'text-primary' : ''}`}
        onClick={() => onBookmark(message.id)}
      >
        <Bookmark className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isSystem = message.role === 'system';
        const showContext = index > 0 && messages[index - 1].role !== message.role;

        return (
          <div
            key={message.id}
            className={`group relative flex gap-4 ${
              isUser ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow ${
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : isSystem
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-background text-foreground'
              }`}
            >
              {isUser ? (
                <User className="h-4 w-4" />
              ) : isSystem ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div className={`group flex flex-col flex-1 gap-2 ${isUser ? 'items-end' : ''}`}>
              {showContext && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{isUser ? 'You' : 'Assistant'}</span>
                  <span>•</span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </div>
              )}
              <div
                className={`relative rounded-lg px-4 py-3 text-sm ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : isSystem
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-accent'
                }`}
              >
                {codeView[message.id] ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {message.content}
                  </pre>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {!isSystem && <MessageActions message={message} />}
              {message.metadata?.processingTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{message.metadata.processingTime}ms</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

MessageThread.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    metadata: PropTypes.shape({
      processingTime: PropTypes.number
    })
  })).isRequired,
  onRetry: PropTypes.func
}; 