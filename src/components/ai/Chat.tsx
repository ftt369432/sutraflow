import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import type { Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

export interface ChatProps {
  messages: Message[];
  onSend: (message: Message) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function Chat({
  messages,
  onSend,
  placeholder = 'Type your message...',
  className,
  disabled = false,
  loading = false,
}: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setInput('');
    await onSend(message);
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex w-full max-w-4xl mx-auto',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'rounded-lg px-4 py-2 max-w-[85%]',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || loading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={disabled || loading || !input.trim()}
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 