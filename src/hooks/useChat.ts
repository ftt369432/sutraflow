import { useState } from 'react';
// import { openAIService } from '../services/ai/openai';
import { mockAIService } from '../services/ai/mockOpenAI';

// Simple chat hook for handling messages
export function useChat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which service to use based on API key presence
  // const service = process.env.VITE_OPENAI_API_KEY ? openAIService : mockAIService;
  const service = mockAIService; // Default to mockAIService

  // Send a message and get a response
  const sendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await service.getCompletion(message);
      setMessages(prev => [...prev, message, response]);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
} 