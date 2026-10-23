/**
 * 🗂️ useConversationSession Hook
 * 
 * Manages persistent conversation sessions in SovereignWorkspace.
 * Synchronously loads from and syncs with localStorage ('ai_conversations'),
 * maintains active conversation tracking, auto-titles conversations based on intent,
 * and provides full delete/pin/clear batch controls.
 * 
 * Adheres strictly to the 500-line modularity rule.
 */
import { useState, useCallback } from 'react';
import type { Message } from '../../../types/ai';
import type { ConversationItem } from '../../../components/ai/FlexibleConversationSidebar';

const CONVERSATIONS_STORAGE_KEY = 'ai_conversations';
const ACTIVE_CONV_STORAGE_KEY = 'ai_active_conversation_id';
const LEGACY_DEFAULT_KEY = 'genieflow_chat_history_default';
const LEGACY_ACTIVE_MSGS_KEY = 'genieflow_active_chat_messages';

function loadInitialConversations(): { convs: ConversationItem[]; activeId: string | null } {
  try {
    const rawConvs = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    let parsedConvs: ConversationItem[] = [];

    if (rawConvs) {
      const raw = JSON.parse(rawConvs);
      if (Array.isArray(raw) && raw.length > 0) {
        parsedConvs = raw.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          messages: Array.isArray(c.messages)
            ? c.messages.map((m: any) => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
              }))
            : []
        }));
      }
    }

    // If no conversations found, check legacy keys to preserve existing user messages
    if (parsedConvs.length === 0) {
      let legacyMsgs: Message[] = [];
      const legacyActive = localStorage.getItem(LEGACY_ACTIVE_MSGS_KEY);
      const legacyDefault = localStorage.getItem(LEGACY_DEFAULT_KEY);
      const source = legacyActive || legacyDefault;

      if (source) {
        try {
          const parsed = JSON.parse(source);
          if (Array.isArray(parsed) && parsed.length > 0) {
            legacyMsgs = parsed.map((m: any) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            }));
          }
        } catch (_e) {}
      }

      const firstUserMsg = legacyMsgs.find(m => m.role === 'user');
      const initialTitle = firstUserMsg
        ? firstUserMsg.content.replace(/[#*`_>]/g, '').trim().slice(0, 32)
        : 'New Mission';

      const initialConv: ConversationItem = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: initialTitle,
        messages: legacyMsgs,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false
      };

      parsedConvs = [initialConv];
      try {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(parsedConvs));
      } catch (_e) {}
    }

    const savedActiveId = localStorage.getItem(ACTIVE_CONV_STORAGE_KEY);
    const activeExists = parsedConvs.some(c => c.id === savedActiveId);
    const chosenId = activeExists && savedActiveId ? savedActiveId : parsedConvs[0]?.id || null;

    if (chosenId) {
      try {
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, chosenId);
      } catch (_e) {}
    }

    return { convs: parsedConvs, activeId: chosenId };
  } catch (err) {
    console.error('Failed to load initial conversations:', err);
    return { convs: [], activeId: null };
  }
}

export function useConversationSession() {
  const [initial] = useState(() => loadInitialConversations());
  const [conversations, setConversations] = useState<ConversationItem[]>(initial.convs);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initial.activeId);
  const [showClearChatsMode, setShowClearChatsMode] = useState(false);
  const [selectedChatsToDelete, setSelectedChatsToDelete] = useState<Set<string>>(new Set());

  // Save conversations to localStorage whenever they change
  const persistConversations = useCallback((updated: ConversationItem[]) => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist conversations to localStorage:', e);
    }
  }, []);

  // 📝 Update messages of the active conversation
  const syncActiveMessages = useCallback((messages: Message[]) => {
    setConversations(prev => {
      let targetId = currentConversationId;
      if (!targetId && prev.length > 0) {
        targetId = prev[0].id;
      }
      if (!targetId) {
        targetId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setCurrentConversationId(targetId);
        try { localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, targetId); } catch (_e) {}
      }

      const index = prev.findIndex(c => c.id === targetId);
      const firstUserMsg = messages.find(m => m.role === 'user');
      let title = firstUserMsg
        ? firstUserMsg.content.replace(/[#*`_>]/g, '').trim().slice(0, 32)
        : 'New Mission';

      if (index === -1) {
        const newConv: ConversationItem = {
          id: targetId,
          title,
          messages,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false
        };
        const next = [newConv, ...prev];
        persistConversations(next);
        return next;
      }

      const target = prev[index];
      let newTitle = target.title;
      if (target.title === 'New Mission' || target.title === 'New Chat' || !target.title) {
        if (firstUserMsg && firstUserMsg.content.trim()) {
          const clean = firstUserMsg.content.replace(/[#*`_>]/g, '').trim();
          newTitle = clean.length > 34 ? clean.slice(0, 32) + '...' : clean;
        }
      }

      const updatedConv: ConversationItem = {
        ...target,
        title: newTitle,
        messages,
        updatedAt: new Date()
      };

      const next = [...prev];
      next[index] = updatedConv;

      persistConversations(next);
      return next;
    });

    // Also persist active messages fallback
    try {
      localStorage.setItem(LEGACY_ACTIVE_MSGS_KEY, JSON.stringify(messages));
    } catch (_e) {}
  }, [currentConversationId, persistConversations]);

  // 🆕 Create new chat
  const handleNewChat = useCallback(() => {
    const newConv: ConversationItem = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'New Mission',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false
    };

    setConversations(prev => {
      const next = [newConv, ...prev];
      persistConversations(next);
      return next;
    });

    setCurrentConversationId(newConv.id);
    try {
      localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, newConv.id);
      localStorage.removeItem(LEGACY_ACTIVE_MSGS_KEY);
    } catch (_e) {}
    return newConv;
  }, [persistConversations]);

  // 🎯 Select conversation
  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    try {
      localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, id);
    } catch (_e) {}
  }, []);

  // 🗑️ Delete single conversation
  const handleDeleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      persistConversations(next);

      if (currentConversationId === id) {
        const nextActive = next.length > 0 ? next[0].id : null;
        setCurrentConversationId(nextActive);
        try {
          if (nextActive) {
            localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, nextActive);
          } else {
            localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY);
          }
        } catch (_e) {}
      }
      return next;
    });
  }, [currentConversationId, persistConversations]);

  // 📌 Pin / Unpin
  const handlePinConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.map(c => c.id === id ? { ...c, isPinned: true } : c);
      persistConversations(next);
      return next;
    });
  }, [persistConversations]);

  const handleUnpinConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.map(c => c.id === id ? { ...c, isPinned: false } : c);
      persistConversations(next);
      return next;
    });
  }, [persistConversations]);

  // ✏️ Update conversation (e.g. rename)
  const handleUpdateConversation = useCallback((id: string, updates: Partial<ConversationItem>) => {
    setConversations(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c);
      persistConversations(next);
      return next;
    });
  }, [persistConversations]);

  // 🧹 Clear chats batch actions
  const handleToggleClearChatsMode = useCallback(() => {
    setShowClearChatsMode(prev => !prev);
    setSelectedChatsToDelete(new Set());
  }, []);

  const handleSelectChatForDeletion = useCallback((id: string) => {
    setSelectedChatsToDelete(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAllChats = useCallback(() => {
    if (selectedChatsToDelete.size === conversations.length) {
      setSelectedChatsToDelete(new Set());
    } else {
      setSelectedChatsToDelete(new Set(conversations.map(c => c.id)));
    }
  }, [conversations, selectedChatsToDelete.size]);

  const handleDeleteSelectedChats = useCallback(() => {
    if (selectedChatsToDelete.size === 0) return;
    setConversations(prev => {
      const next = prev.filter(c => !selectedChatsToDelete.has(c.id));
      persistConversations(next);

      if (currentConversationId && selectedChatsToDelete.has(currentConversationId)) {
        const nextActive = next.length > 0 ? next[0].id : null;
        setCurrentConversationId(nextActive);
        try {
          if (nextActive) localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, nextActive);
          else localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY);
        } catch (_e) {}
      }
      return next;
    });
    setSelectedChatsToDelete(new Set());
    setShowClearChatsMode(false);
  }, [selectedChatsToDelete, currentConversationId, persistConversations]);

  const handleClearAllChats = useCallback(() => {
    setConversations([]);
    persistConversations([]);
    setCurrentConversationId(null);
    try {
      localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY);
      localStorage.removeItem(LEGACY_ACTIVE_MSGS_KEY);
    } catch (_e) {}
    setSelectedChatsToDelete(new Set());
    setShowClearChatsMode(false);
  }, [persistConversations]);

  // Get current active conversation
  const activeConversation = conversations.find(c => c.id === currentConversationId) || null;

  return {
    conversations,
    currentConversationId,
    activeConversation,
    syncActiveMessages,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
    handlePinConversation,
    handleUnpinConversation,
    handleUpdateConversation,
    showClearChatsMode,
    selectedChatsToDelete,
    handleToggleClearChatsMode,
    handleSelectChatForDeletion,
    handleSelectAllChats,
    handleDeleteSelectedChats,
    handleClearAllChats
  };
}
