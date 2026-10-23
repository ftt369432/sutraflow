import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, AIModel } from '../types/ai';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  category?: string;
}

interface AIState {
  messages: Message[];
  isLoading: boolean;
  selectedModel: AIModel;
  linkedDocs: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
  }>;
  conversationHistory: Conversation[];
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void; // New function to update existing message
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  saveConversation: (title?: string) => void;
  deleteConversation: (id: string) => void;
  loadConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  pinConversation: (id: string) => void;
  unpinConversation: (id: string) => void;
  cleanupEmptyConversations: () => void;
  setSelectedModel: (model: AIModel) => void;
  startNewConversation: () => void;
}

// Enhanced title generation helper function
const generateContextualTitle = (content: string): string => {
  const normalizedContent = content.toLowerCase().trim();
  
  // Specific legal/professional patterns
  const specificPatterns = [
    { pattern: /panel\s+qme.*delay/i, title: 'Panel QME Delay' },
    { pattern: /petition.*additional.*panel\s+qme/i, title: 'Petition for Additional Panel QME' },
    { pattern: /petition.*panel\s+qme/i, title: 'Panel QME Petition' },
    { pattern: /qme.*report/i, title: 'QME Report' },
    { pattern: /qme.*evaluation/i, title: 'QME Evaluation' },
    { pattern: /workers.*compensation/i, title: 'Workers Compensation' },
    { pattern: /wcab.*hearing/i, title: 'WCAB Hearing' },
    { pattern: /lien.*conference/i, title: 'Lien Conference' },
    { pattern: /medical.*report/i, title: 'Medical Report' },
    { pattern: /disability.*rating/i, title: 'Disability Rating' },
  ];

  // Science/educational patterns
  const sciencePatterns = [
    { pattern: /black\s+hole/i, title: 'Black Holes' },
    { pattern: /quantum/i, title: 'Quantum Physics' },
    { pattern: /relativity/i, title: 'Relativity Theory' },
    { pattern: /gravity/i, title: 'Gravity' },
    { pattern: /solar\s+system/i, title: 'Solar System' },
    { pattern: /evolution/i, title: 'Evolution' },
    { pattern: /photosynthesis/i, title: 'Photosynthesis' },
    { pattern: /genetics/i, title: 'Genetics' },
  ];

  // Professional patterns
  const professionalPatterns = [
    { pattern: /contract.*review/i, title: 'Contract Review' },
    { pattern: /legal.*advice/i, title: 'Legal Advice' },
    { pattern: /case.*analysis/i, title: 'Case Analysis' },
    { pattern: /discovery.*request/i, title: 'Discovery Request' },
    { pattern: /deposition/i, title: 'Deposition' },
    { pattern: /settlement/i, title: 'Settlement Discussion' },
    { pattern: /appeal/i, title: 'Appeal Process' },
  ];

  // Technical patterns
  const techPatterns = [
    { pattern: /api.*integration/i, title: 'API Integration' },
    { pattern: /database.*design/i, title: 'Database Design' },
    { pattern: /react.*component/i, title: 'React Component' },
    { pattern: /typescript.*error/i, title: 'TypeScript Error' },
    { pattern: /debugging/i, title: 'Debugging' },
    { pattern: /code.*review/i, title: 'Code Review' },
  ];

  // General topic patterns
  const generalPatterns = [
    { pattern: /calendar|schedule|meeting|appointment/i, title: 'Calendar & Scheduling' },
    { pattern: /task|todo|remind|deadline/i, title: 'Task Management' },
    { pattern: /email|message|send|reply/i, title: 'Email & Communication' },
    { pattern: /document|file|upload|pdf/i, title: 'Document Management' },
    { pattern: /write|draft|create|compose/i, title: 'Content Creation' },
    { pattern: /analyze|review|check|examine/i, title: 'Analysis & Review' },
    { pattern: /calculate|math|formula/i, title: 'Calculations' },
    { pattern: /translate|translation/i, title: 'Translation' },
    { pattern: /recipe|cooking|food/i, title: 'Cooking & Recipes' },
    { pattern: /travel|trip|vacation/i, title: 'Travel Planning' },
    { pattern: /health|medical|symptom/i, title: 'Health & Medical' },
    { pattern: /finance|budget|money|investment/i, title: 'Finance & Money' },
  ];

  // Check all pattern arrays in order of specificity
  const allPatterns = [
    ...specificPatterns,
    ...sciencePatterns, 
    ...professionalPatterns,
    ...techPatterns,
    ...generalPatterns
  ];

  // Find matching pattern
  for (const topic of allPatterns) {
    if (topic.pattern.test(content)) {
      return topic.title;
    }
  }

  // Extract key terms for custom title
  const keyTerms = extractKeyTerms(content);
  if (keyTerms.length > 0) {
    const title = keyTerms.slice(0, 3).join(' ');
    return title.length > 40 ? title.substring(0, 37) + '...' : title;
  }

  // Fallback to first meaningful words
  const words = content.trim().split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word.toLowerCase()))
    .slice(0, 4);
  
  if (words.length > 0) {
    const title = words.join(' ');
    return title.length > 40 ? title.substring(0, 37) + '...' : title;
  }

  return 'New Chat';
};

// Helper function to check if a conversation has meaningful content
const hasMeaningfulContent = (messages: Message[]): boolean => {
  const hasRealUserMessage = messages.some(m => 
    m.role === 'user' && 
    m.content && 
    m.content.trim().length > 0 && 
    m.content.trim() !== 'New conversation'
  );
  
  const hasRealAssistantMessage = messages.some(m => 
    m.role === 'assistant' && 
    m.content && 
    m.content.trim().length > 0
  );
  
  return hasRealUserMessage && hasRealAssistantMessage;
};

// Helper function to extract key terms
const extractKeyTerms = (content: string): string[] => {
  const words = content.toLowerCase().split(/\s+/);
  const keyTerms: string[] = [];
  
  // Look for important nouns and adjectives
  const importantWords = words.filter(word => 
    word.length > 3 && 
    !commonWords.includes(word) &&
    !stopWords.includes(word)
  );

  // Capitalize first letter of each word
  return importantWords.slice(0, 5).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  );
};

// Common words to filter out
const commonWords = [
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 
  'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'they', 'we', 
  'say', 'her', 'she', 'he', 'his', 'him', 'has', 'had', 'can', 'could', 'would',
  'should', 'will', 'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'get',
  'got', 'have', 'very', 'just', 'now', 'then', 'here', 'there', 'where', 'when',
  'what', 'who', 'why', 'how', 'about', 'tell', 'me', 'you', 'your', 'my', 'our'
];

const stopWords = [
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 
  'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 
  'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
];

// Auto-cleanup function to remove empty conversations
const initializeStore = () => {
  // Get the store state and clean up empty conversations
  setTimeout(() => {
    const store = useAIStore.getState();
    if (store.conversationHistory.length > 0) {
      store.cleanupEmptyConversations();
    }
  }, 1000); // Small delay to let the store initialize
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      selectedModel: {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        capabilities: ['chat', 'text-generation'],
        contextSize: 32000
      },
      linkedDocs: [],
      conversationHistory: [],

      addMessage: (message) =>
        set((state) => {
          const newMessages = [...state.messages, message];
          
          // Auto-save conversation after assistant responses (to create chat history)
          if (message.role === 'assistant' && newMessages.length >= 2) {
            // Only save if we have meaningful content from both user and assistant
            if (!hasMeaningfulContent(newMessages)) {
              return { messages: newMessages };
            }
            
            // Check if this is a new conversation (not loaded from history)
            const isNewConversation = !state.conversationHistory.some(conv => 
              conv.messages.length === newMessages.length - 1 &&
              conv.messages.every((msg, idx) => msg.id === newMessages[idx]?.id)
            );
            
            if (isNewConversation) {
              // This is a new conversation, save it
              const firstUserMessage = newMessages.find(m => m.role === 'user' && m.content?.trim());
              let smartTitle = 'New Chat';
              
              if (firstUserMessage) {
                const content = firstUserMessage.content || '';
                
                // Enhanced intelligent title generation
                smartTitle = generateContextualTitle(content);
              }

              const newConversation: Conversation = {
                id: Date.now().toString(),
                title: smartTitle,
                messages: newMessages,
                createdAt: new Date(),
                updatedAt: new Date(),
                isPinned: false
              };

              return {
                messages: newMessages,
                conversationHistory: [newConversation, ...state.conversationHistory]
              };
            }
          }
          
          return { messages: newMessages };
        }),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map(message => 
            message.id === id ? { ...message, ...updates } : message
          )
        })),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      clearMessages: () =>
        set({ messages: [] }),

      saveConversation: (title) =>
        set((state) => {
          // Don't save empty conversations
          if (!hasMeaningfulContent(state.messages)) {
            return state; // Don't save empty conversations
          }
          
          // Generate smart title if none provided
          let smartTitle = title;
          if (!smartTitle && state.messages.length > 0) {
            const firstUserMessage = state.messages.find(m => m.role === 'user' && m.content?.trim());
            if (firstUserMessage) {
              const content = firstUserMessage.content || '';
              smartTitle = generateContextualTitle(content);
            }
          }

          const newConversation: Conversation = {
            id: Date.now().toString(),
            title: smartTitle || `Conversation ${state.conversationHistory.length + 1}`,
            messages: state.messages,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false
          };

          return {
            conversationHistory: [newConversation, ...state.conversationHistory]
          };
        }),

      deleteConversation: (id) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.filter(
            (conv) => conv.id !== id
          )
        })),

      loadConversation: (id) =>
        set((state) => {
          const conversation = state.conversationHistory.find(
            (conv) => conv.id === id
          );
          return conversation
            ? { messages: conversation.messages }
            : state;
        }),

      setSelectedModel: (model) =>
        set({ selectedModel: model }),

      startNewConversation: () =>
        set({ messages: [], linkedDocs: [] }),

      updateConversation: (id, updates) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.map(conv =>
            conv.id === id 
              ? { ...conv, ...updates, updatedAt: new Date() }
              : conv
          )
        })),

      pinConversation: (id) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.map(conv =>
            conv.id === id 
              ? { ...conv, isPinned: true, updatedAt: new Date() }
              : conv
          )
        })),

      unpinConversation: (id) =>
        set((state) => ({
          conversationHistory: state.conversationHistory.map(conv =>
            conv.id === id 
              ? { ...conv, isPinned: false, updatedAt: new Date() }
              : conv
          )
        })),

      cleanupEmptyConversations: () =>
        set((state) => ({
          conversationHistory: state.conversationHistory.filter(conv =>
            hasMeaningfulContent(conv.messages)
          )
        }))
    }),
    {
      name: 'ai-storage',
      partialize: (state: AIState) => ({
        conversationHistory: state.conversationHistory,
        selectedModel: state.selectedModel,
      })
    }
  )
);

// Initialize the store and cleanup on app start
initializeStore();