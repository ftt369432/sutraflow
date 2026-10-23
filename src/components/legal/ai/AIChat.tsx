import React from 'react';
import type { AIMessage } from '../../../types/legal';
import { generateLegalResponse } from '../../../services/ai/legalAssistant';
import { Chat } from '../../ai/Chat';
import type { Message } from '../../../types/ai';

interface AIChatProps {
  messages: AIMessage[];
  onSend: (message: AIMessage) => void;
}

export function AIChat({ messages, onSend }: AIChatProps) {
  // Convert legal messages to base messages
  const baseMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    attachments: msg.attachments,
    metadata: msg.metadata
  }));

  const handleSend = async (message: Message) => {
    onSend({
      ...message,
      metadata: {
        ...message.metadata,
        domain: 'legal'
      }
    } as AIMessage);
  };

  const handleGenerateResponse = async (messages: Message[]) => {
    const legalMessages = messages.map(msg => ({
      ...msg,
      metadata: {
        ...msg.metadata,
        domain: 'legal'
      }
    })) as AIMessage[];

    return generateLegalResponse(legalMessages);
  };

  return (
    <Chat
      messages={baseMessages}
      onSend={handleSend}
      onGenerateResponse={handleGenerateResponse}
      placeholder="Ask a legal question..."
      className="bg-white dark:bg-gray-800"
    />
  );
}