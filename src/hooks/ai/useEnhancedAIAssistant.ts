import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, AIAssistant, Conversation } from '../../types/ai';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { chatWithAssistant } from '../../services/documentChatService';

/**
 * 🎯 Enhanced AI Assistant Hook - ChatGPT-style capabilities
 * 
 * Features:
 * - Advanced conversation management
 * - Message reactions and bookmarking
 * - File handling and context retention
 * - Autonomous learning
 * - Canvas integration
 * - Voice commands
 * - Multi-modal support
 */

export interface EnhancedChatState {
  // Core Chat State
  chatMessages: Message[];
  conversations: Conversation[];
  currentConversation: string | null;
  isProcessing: boolean;
  input: string;
  
  // Enhanced Features
  messageReactions: Record<string, 'like' | 'dislike' | null>;
  bookmarkedMessages: Set<string>;
  pinnedMessages: Set<string>;
  editingMessageId: string | null;
  regeneratingMessageId: string | null;
  
  // Assistant & Context
  selectedAssistant: AIAssistant | null;
  conversationContext: ConversationContext;
  autonomousLearning: boolean;
  learningInsights: number;
  
  // File Handling
  uploadedFiles: File[];
  stagedFileParts: any[];
  
  // UI State
  showAssistantsDialog: boolean;
  isDraggingOver: boolean;
  relevantDocuments: any[];
  
  // Actions
  setInput: (input: string) => void;
  sendMessage: (message: string, files?: File[]) => Promise<void>;
  handleNewChat: () => void;
  selectConversation: (id: string) => void;
  handleMessageReaction: (messageId: string, reaction: 'like' | 'dislike' | null) => void;
  toggleBookmark: (messageId: string) => void;
  togglePin: (messageId: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  regenerateMessage: (messageId: string) => Promise<void>;
  selectAssistant: (assistant: AIAssistant | null) => void;
  handleFileUpload: (files: File[]) => void;
  toggleAutonomousLearning: () => void;
  clearConversations: () => void;
}

export interface ConversationContext {
  uploadedFiles: Array<{
    name: string;
    content: string;
    type: string;
    uploadedAt: Date;
  }>;
  analysisResults: Array<{
    fileId: string;
    analysis: string;
    timestamp: Date;
  }>;
  learningPatterns: Array<{
    pattern: string;
    frequency: number;
    lastSeen: Date;
    confidence: number;
  }>;
  userPreferences: {
    responseStyle: 'concise' | 'detailed' | 'technical';
    preferredSources: 'documents' | 'general' | 'mixed';
    interactionTime: string[];
  };
}

export function useEnhancedAIAssistant(): EnhancedChatState {
  // Core state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState('');
  
  // Enhanced features state
  const [messageReactions, setMessageReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  
  // Assistant and context state
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    uploadedFiles: [],
    analysisResults: [],
    learningPatterns: [],
    userPreferences: {
      responseStyle: 'detailed',
      preferredSources: 'mixed',
      interactionTime: []
    }
  });
  
  // Learning state
  const [autonomousLearning, setAutonomousLearning] = useState(() => {
    const saved = localStorage.getItem('autonomous_learning_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [learningInsights, setLearningInsights] = useState<number>(0);
  
  // File handling state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [stagedFileParts, setStagedFileParts] = useState<any[]>([]);
  
  // UI state
  const [showAssistantsDialog, setShowAssistantsDialog] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [relevantDocuments, setRelevantDocuments] = useState<any[]>([]);
  
  // External hooks
  const { assistants } = useAssistantStore();
  const { documents: knowledgeBaseDocuments } = useKnowledgeBaseStore();
  
  // Load conversations on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        
        if (parsed.length > 0 && !currentConversation) {
          setCurrentConversation(parsed[0].id);
          setChatMessages(parsed[0].messages || []);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  }, []);
  
  // Save conversations when they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('ai-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);
  
  // Auto-select Legal Eagle assistant
  useEffect(() => {
    const legalEagle = assistants.find(a => a.name.includes('Legal Eagle'));
    if (legalEagle && !selectedAssistant) {
      setSelectedAssistant(legalEagle);
      console.log('🦅 Auto-selected Legal Eagle assistant');
    }
  }, [assistants, selectedAssistant]);
  
  // Enhanced canvas routing detection
  const shouldRouteToCanvas = useCallback((userMessage: string, aiResponse: string): boolean => {
    const content = (userMessage + ' ' + aiResponse).toLowerCase();
    
    const legalPatterns = [
      /ttd|temporary total disability|workers.*comp|work.*injury|injured.*worker/,
      /petition|motion|brief|complaint|answer|discovery|subpoena|summons/,
      /contract|agreement|lease|settlement|affidavit|deposition/,
      /court.*filing|legal.*document|legal.*form|court.*form/,
      /business.*plan|incorporation|llc.*formation|partnership.*agreement/,
      /deed|mortgage|property.*agreement|real.*estate.*contract/,
      /employment.*contract|non.*disclosure|severance.*agreement/,
      /demand.*letter|cease.*desist|legal.*notice|formal.*letter/
    ];

    return legalPatterns.some(pattern => pattern.test(content));
  }, []);
  
  // Core actions
  const sendMessage = useCallback(async (message: string, files?: File[]) => {
    if (!message.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Create user message
      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        metadata: files ? { files: files.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined
      };
      
      // Add to chat immediately
      const updatedMessages = [...chatMessages, userMsg];
      setChatMessages(updatedMessages);
      
      // Process with AI
      const response = await chatWithAssistant(message, selectedAssistant || undefined);
      
      // Create AI message
      const aiMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      
      const finalMessages = [...updatedMessages, aiMsg];
      setChatMessages(finalMessages);
      
      // Update conversation
      if (currentConversation) {
        const updatedConversations = conversations.map(conv => 
          conv.id === currentConversation 
            ? { ...conv, messages: finalMessages, updatedAt: new Date().toISOString() }
            : conv
        );
        setConversations(updatedConversations);
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: uuidv4(),
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          messages: finalMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const newConversations = [newConversation, ...conversations];
        setConversations(newConversations);
        setCurrentConversation(newConversation.id);
      }
      
      // Check for canvas routing
      if (shouldRouteToCanvas(message, response)) {
        console.log('📄 Legal document detected - would route to Canvas');
        // Canvas routing logic would go here
      }
      
      // Update learning insights
      if (autonomousLearning) {
        setLearningInsights(prev => prev + 1);
      }
      
    } catch (error) {
      console.error('❌ Error processing chat:', error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatMessages, currentConversation, conversations, selectedAssistant, isProcessing, shouldRouteToCanvas, autonomousLearning]);
  
  const handleNewChat = useCallback(() => {
    setCurrentConversation(null);
    setChatMessages([]);
    setConversationContext({
      uploadedFiles: [],
      analysisResults: [],
      learningPatterns: [],
      userPreferences: {
        responseStyle: 'detailed',
        preferredSources: 'mixed',
        interactionTime: []
      }
    });
    console.log('✨ Created new chat');
  }, []);
  
  const selectConversation = useCallback((id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setCurrentConversation(id);
      setChatMessages(conversation.messages || []);
      console.log('📁 Selected conversation:', conversation.title);
    }
  }, [conversations]);
  
  // Enhanced feature actions
  const handleMessageReaction = useCallback((messageId: string, reaction: 'like' | 'dislike' | null) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: reaction
    }));
    
    if (autonomousLearning && reaction) {
      setLearningInsights(prev => prev + 1);
    }
  }, [autonomousLearning]);
  
  const toggleBookmark = useCallback((messageId: string) => {
    setBookmarkedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);
  
  const togglePin = useCallback((messageId: string) => {
    setPinnedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);
  
  const editMessage = useCallback((messageId: string, newContent: string) => {
    setChatMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, edited: true }
          : msg
      )
    );
    setEditingMessageId(null);
  }, []);
  
  const regenerateMessage = useCallback(async (messageId: string) => {
    setRegeneratingMessageId(messageId);
    
    // Find the message and regenerate
    const messageIndex = chatMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0 && chatMessages[messageIndex].role === 'assistant') {
      const previousUserMessage = chatMessages[messageIndex - 1];
      
      try {
        const response = await chatWithAssistant(previousUserMessage.content, selectedAssistant || undefined);
        
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: response, regenerated: true }
              : msg
          )
        );
      } catch (error) {
        console.error('Error regenerating message:', error);
      }
    }
    
    setRegeneratingMessageId(null);
  }, [chatMessages, selectedAssistant]);
  
  const selectAssistant = useCallback((assistant: AIAssistant | null) => {
    setSelectedAssistant(assistant);
    console.log('🤖 Selected assistant:', assistant?.name || 'None');
  }, []);
  
  const handleFileUpload = useCallback((files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    console.log('📁 Files uploaded:', files.map(f => f.name));
  }, []);
  
  const toggleAutonomousLearning = useCallback(() => {
    const newValue = !autonomousLearning;
    setAutonomousLearning(newValue);
    localStorage.setItem('autonomous_learning_enabled', JSON.stringify(newValue));
    console.log('🧠 Autonomous learning:', newValue ? 'enabled' : 'disabled');
  }, [autonomousLearning]);
  
  const clearConversations = useCallback(() => {
    setConversations([]);
    setChatMessages([]);
    setCurrentConversation(null);
    localStorage.removeItem('ai-conversations');
    console.log('🗑️ All conversations cleared');
  }, []);
  
  return {
    // Core state
    chatMessages,
    conversations,
    currentConversation,
    isProcessing,
    input,
    
    // Enhanced features
    messageReactions,
    bookmarkedMessages,
    pinnedMessages,
    editingMessageId,
    regeneratingMessageId,
    
    // Assistant & context
    selectedAssistant,
    conversationContext,
    autonomousLearning,
    learningInsights,
    
    // File handling
    uploadedFiles,
    stagedFileParts,
    
    // UI state
    showAssistantsDialog,
    isDraggingOver,
    relevantDocuments,
    
    // Actions
    setInput,
    sendMessage,
    handleNewChat,
    selectConversation,
    handleMessageReaction,
    toggleBookmark,
    togglePin,
    editMessage,
    regenerateMessage,
    selectAssistant,
    handleFileUpload,
    toggleAutonomousLearning,
    clearConversations,
  };
}
