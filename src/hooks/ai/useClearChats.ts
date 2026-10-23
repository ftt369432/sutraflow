import { useState, useCallback } from 'react';
import type { Conversation } from '../../types/ai';

export interface ClearChatsState {
  showClearChatsMode: boolean;
  selectedChatsToDelete: Set<string>;
  handleToggleClearChatsMode: () => void;
  handleSelectChatForDeletion: (chatId: string) => void;
  handleSelectAllChats: () => void;
  handleDeleteSelectedChats: () => void;
  handleClearAllChats: () => void;
}

export function useClearChats(
  conversations: Conversation[],
  onConversationsUpdate: (conversations: Conversation[]) => void,
  currentConversation: string | null,
  onCurrentConversationChange: (id: string | null) => void
): ClearChatsState {
  const [showClearChatsMode, setShowClearChatsMode] = useState(false);
  const [selectedChatsToDelete, setSelectedChatsToDelete] = useState<Set<string>>(new Set());

  const handleToggleClearChatsMode = useCallback(() => {
    console.log('🧹 Clear Chats Mode Toggled:', !showClearChatsMode);
    setShowClearChatsMode(!showClearChatsMode);
    setSelectedChatsToDelete(new Set()); // Clear selections when toggling
  }, [showClearChatsMode]);

  const handleSelectChatForDeletion = useCallback((chatId: string) => {
    setSelectedChatsToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllChats = useCallback(() => {
    if (selectedChatsToDelete.size === conversations.length) {
      // Unselect all
      setSelectedChatsToDelete(new Set());
    } else {
      // Select all
      setSelectedChatsToDelete(new Set(conversations.map(conv => conv.id)));
    }
  }, [selectedChatsToDelete.size, conversations]);

  const handleDeleteSelectedChats = useCallback(() => {
    if (selectedChatsToDelete.size === 0) return;

    // Create confirmation message
    const selectedCount = selectedChatsToDelete.size;
    const isCurrentChatSelected = currentConversation && selectedChatsToDelete.has(currentConversation);
    
    if (confirm(`Are you sure you want to delete ${selectedCount} chat${selectedCount > 1 ? 's' : ''}?`)) {
      // Filter out selected chats
      const updatedConversations = conversations.filter(conv => !selectedChatsToDelete.has(conv.id));
      onConversationsUpdate(updatedConversations);
      
      // Update localStorage
      localStorage.setItem('ai_conversations', JSON.stringify(updatedConversations));
      
      // Handle current conversation if it was deleted
      if (isCurrentChatSelected) {
        if (updatedConversations.length > 0) {
          onCurrentConversationChange(updatedConversations[0].id);
        } else {
          onCurrentConversationChange(null); // Will trigger new chat creation
        }
      }
      
      // Reset clear mode
      setSelectedChatsToDelete(new Set());
      setShowClearChatsMode(false);
      
      console.log(`✅ Deleted ${selectedCount} chat${selectedCount > 1 ? 's' : ''} successfully`);
    }
  }, [selectedChatsToDelete, conversations, currentConversation, onConversationsUpdate, onCurrentConversationChange]);

  const handleClearAllChats = useCallback(() => {
    if (conversations.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ALL ${conversations.length} chats? This action cannot be undone.`)) {
      onConversationsUpdate([]);
      localStorage.setItem('ai_conversations', JSON.stringify([]));
      onCurrentConversationChange(null); // Will trigger new chat creation
      setSelectedChatsToDelete(new Set());
      setShowClearChatsMode(false);
      
      console.log(`✅ Cleared all ${conversations.length} chats successfully`);
    }
  }, [conversations.length, onConversationsUpdate, onCurrentConversationChange]);

  return {
    showClearChatsMode,
    selectedChatsToDelete,
    handleToggleClearChatsMode,
    handleSelectChatForDeletion,
    handleSelectAllChats,
    handleDeleteSelectedChats,
    handleClearAllChats,
  };
}
