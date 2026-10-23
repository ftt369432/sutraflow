import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { LeftPanel } from './LeftPanel';
import { AIChat } from '../ai/AIChat';
import { useAgentStore } from '../../store/agentStore';
import type { Message } from '../../types/ai';

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  isFavorite?: boolean;
  unread?: boolean;
}

export function MainLayout() {
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>();

  // Agent state from store
  const {
    agents,
    selectedAgentId,
    selectAgent,
    createAgent,
    deleteAgent,
    updateAgentStatus
  } = useAgentStore();

  // Conversation handlers
  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: nanoid(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversationId(newConversation.id);
  };

  const handleNewCase = () => {
    const newConversation: Conversation = {
      id: nanoid(),
      title: 'New Case',
      messages: [],
      timestamp: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversationId(newConversation.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (selectedConversationId === id) {
      setSelectedConversationId(undefined);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id ? { ...conv, isFavorite: !conv.isFavorite } : conv
      )
    );
  };

  // Agent handlers
  const handleCreateAgent = () => {
    // For now, create a default research agent
    createAgent(
      'New Research Agent',
      'research',
      ['web-search', 'document-analysis', 'natural-language']
    );
  };

  const selectedConversation = conversations.find(
    conv => conv.id === selectedConversationId
  );

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId) return;

    const newMessage: Message = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage]
            }
          : conv
      )
    );
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <LeftPanel
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectConversation={setSelectedConversationId}
        onSelectAgent={selectAgent}
        onNewChat={handleNewChat}
        onNewCase={handleNewCase}
        onCreateAgent={handleCreateAgent}
        onDeleteConversation={handleDeleteConversation}
        onToggleFavorite={handleToggleFavorite}
      />

      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <AIChat
            messages={selectedConversation.messages}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a conversation or start a new one</p>
          </div>
        )}
      </main>
    </div>
  );
} 