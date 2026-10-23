import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
}

export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved, (key, value) => {
      if (key === 'timestamp') return new Date(value);
      return value;
    }) : [];
  });

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }]);
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  return { messages, addMessage, clearMessages, setMessages };
} 