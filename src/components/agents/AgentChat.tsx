import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Agent } from '../../types/agent';
import { Avatar } from '../ui/Avatar';
import { Send, Bot, User, Loader2, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: string[];
  loading?: boolean;
}

export interface ProcessMessagePayload {
  message: string;
  files: File[];
  messageHistory: ChatMessage[];
}

export interface ProcessMessageResponse {
  content?: string;
}

interface AgentChatProps {
  agent: Agent;
  onAction: (actionType: string, payload: ProcessMessagePayload) => Promise<ProcessMessageResponse>;
}

export function AgentChat({ agent, onAction }: AgentChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `Hi, I'm ${agent.name}, your ${agent.type} assistant. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: selectedFiles.map(file => file.name),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        loading: true,
      },
    ]);

    setIsLoading(true);

    try {
      const payload: ProcessMessagePayload = {
        message: userMessage.content,
        files: selectedFiles,
        messageHistory: messages.filter(m => m.role !== 'system').concat([userMessage]),
      };
      const response = await onAction('processMessage', payload);

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.content || 'I processed your request.',
                loading: false,
              }
            : msg
        )
      );
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, I encountered an error processing your request.',
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files ?? [])]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'system' ? (
              <Card className="p-3 max-w-[85%] bg-secondary/40">
                <p className="text-sm text-muted-foreground">{message.content}</p>
              </Card>
            ) : (
              <div className="flex gap-2 max-w-[85%]">
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 bg-primary text-primary-foreground shrink-0">
                    <Bot className="w-4 h-4" />
                  </Avatar>
                )}
                <div>
                  <Card
                    className={`p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    }`}
                  >
                    {message.loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <p className="text-sm">Thinking...</p>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.attachments.map((file, i) => (
                                <div
                                  key={i}
                                  className="text-xs py-1 px-2 bg-secondary rounded-md flex items-center gap-1"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {file}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 bg-secondary shrink-0">
                    <User className="w-4 h-4" />
                  </Avatar>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Attachments:</p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="text-xs py-1 px-2 bg-secondary rounded-md flex items-center gap-1"
              >
                <Paperclip className="w-3 h-3" />
                {file.name}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-foreground text-lg leading-none"
                  onClick={() => removeFile(i)}
                  aria-label="Remove file"
                >
                  {"×"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 items-end bg-background">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleFileSelect}
          disabled={isLoading}
          className="shrink-0"
          aria-label="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message or drop files..."
          className="flex-1 resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
        />
        <Button type="submit" disabled={isLoading || (!input.trim() && selectedFiles.length === 0)} className="shrink-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
