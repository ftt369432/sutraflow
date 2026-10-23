import { useState, useCallback, useEffect } from 'react';
import type { Message, Conversation } from '../../types/ai';

export interface ChatState {
  chatMessages: Message[];
  conversations: Conversation[];
  currentConversation: string | null;
  isProcessing: boolean;
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setCurrentConversation: React.Dispatch<React.SetStateAction<string | null>>;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  handleNewChat: () => void;
  handleSelectConversation: (id: string) => void;
  cleanupEmptyConversations: () => void;
}

export function useChatState(): ChatState {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('ai_conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed);
        
        // Set first conversation as current if available
        if (parsed.length > 0 && !currentConversation) {
          setCurrentConversation(parsed[0].id);
          setChatMessages(parsed[0].messages || []);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  }, []);

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('ai_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const handleNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      model: 'gpt-4', // Default model
      provider: 'openai' // Default provider
    };

    // Add to conversations
    setConversations(prev => [newConversation, ...prev]);
    
    // Set as current
    setCurrentConversation(newConversation.id);
    setChatMessages([]);
    
    console.log('🆕 Created new chat:', newConversation.id);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setCurrentConversation(id);
      setChatMessages(conversation.messages || []);
      console.log('💬 Selected conversation:', id);
    }
  }, [conversations]);

  const cleanupEmptyConversations = useCallback(() => {
    setConversations(prev => {
      const nonEmpty = prev.filter(conv => 
        conv.messages && conv.messages.length > 0
      );
      
      if (nonEmpty.length !== prev.length) {
        console.log(`🧹 Cleaned up ${prev.length - nonEmpty.length} empty conversations`);
        localStorage.setItem('ai_conversations', JSON.stringify(nonEmpty));
      }
      
      return nonEmpty;
    });
  }, []);

  // Auto-cleanup empty conversations periodically
  useEffect(() => {
    const interval = setInterval(cleanupEmptyConversations, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [cleanupEmptyConversations]);

  return {
    chatMessages,
    conversations,
    currentConversation,
    isProcessing,
    setChatMessages,
    setConversations,
    setCurrentConversation,
    setIsProcessing,
    handleNewChat,
    handleSelectConversation,
    cleanupEmptyConversations,
  };
}
