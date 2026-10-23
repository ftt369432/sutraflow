import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAIStore } from '../store/aiStore';
import { useAIProvider, MultimodalPart } from '../hooks/useAIProvider';
import type { Message, AIModel } from '../types/ai';
import { ProfessionalModeService } from '../services/legalDoc/professionalModeService';
import { useSupabase } from '../providers/SupabaseProvider';

export interface AIConfig {
  professionalMode: boolean;
}

export interface AIContextType {
  messages: Message[];
  isLoading: boolean;
  selectedModel: AIModel;
  sendMessage: (parts: Array<MultimodalPart>, mode: 'chat' | 'task' | 'email', options?: { systemPrompt?: string }) => Promise<string>;
  setSelectedModel: (model: AIModel) => void;
  clearMessages: () => void;
  startNewConversation: () => void;
  professionalMode: boolean;
  toggleProfessionalMode: () => void;
  professionalService: ProfessionalModeService | null;
}

export const AIContext = createContext<AIContextType>({
  messages: [],
  isLoading: false,
  selectedModel: { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    capabilities: ['chat', 'text-generation'],
    contextSize: 32000
  },
  sendMessage: async () => '',
  setSelectedModel: () => {},
  clearMessages: () => {},
  startNewConversation: () => {},
  professionalMode: false,
  toggleProfessionalMode: () => {},
  professionalService: null,
});

export function AIProvider({ children }: { children: React.ReactNode }) {
  const {
    messages,
    isLoading,
    selectedModel,
    addMessage,
    updateMessage, // Add this
    setLoading,
    setSelectedModel,
    clearMessages,
    startNewConversation,
  } = useAIStore();

  const { sendMessage: sendToAI } = useAIProvider();

  const [professionalMode, setProfessionalMode] = useState<boolean>(false);
  const [professionalService, setProfessionalService] = useState<ProfessionalModeService | null>(null);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    if (!professionalService && supabase) {
      setProfessionalService(new ProfessionalModeService(supabase));
    }
  }, [professionalService, supabase]);

  const toggleProfessionalMode = useCallback(() => {
    setProfessionalMode(prev => !prev);
  }, []);

  const sendMessage = useCallback(async (
    parts: Array<MultimodalPart>, 
    mode: 'chat' | 'task' | 'email', 
    options?: { 
      systemPrompt?: string,
      streamingEnabled?: boolean,
      onPartialResponse?: (partialText: string) => void  // Callback for streaming updates
    }
  ): Promise<string> => {
    console.log('[AIContext] sendMessage called. Parts:', parts, 'Mode:', mode, 'Options:', options);
    setLoading(true);
    
    // Extract user's text message for local display and professional enhancement
    // Assumes the primary user text input is the first text part if multiple parts are sent.
    // Or, we might need a convention, e.g., the last text part is the main user message.
    // For now, let's find the first text part to consider as the main message for history.
    const firstTextPart = parts.find((part): part is { text: string } => 'text' in part && !options?.systemPrompt);
    const userTextContent = firstTextPart ? firstTextPart.text : '';
    console.log('[AIContext] User text content for history:', userTextContent);
    // A more robust way would be to have AIAssistantPage explicitly pass the text content intended for history.

    const userMessageForHistory: Message = {
      id: new Date().getTime().toString(),
      content: userTextContent, // Use extracted text for history
      role: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessageForHistory);
    
    try {
      let textToEnhance = userTextContent;
      if (professionalMode && professionalService && user && textToEnhance) {
        console.log('[AIContext] Enhancing prompt with professionalMode.');
        textToEnhance = await professionalService.enhancePrompt(
          user.id,
          textToEnhance,
          messages, // aIStore messages for context
          professionalMode
        );
      }

      // Construct final parts for the API
      // If textToEnhance was modified, we need to update it in the parts array or reconstruct parts.
      // This part needs careful handling to correctly place the (potentially enhanced) user text
      // relative to system prompts and image data.
      
      // For simplicity now, assuming sendToAI from useAIProvider correctly handles systemPrompt from options
      // and the `parts` array contains all other user inputs (text, images).
      // If `textToEnhance` changed the user's text, `parts` should reflect that before this call.
      // Let's assume `parts` passed to this function already contains the user's primary text message
      // and any image data. The `options.systemPrompt` will be handled by `sendToAI`.
      console.log('[AIContext] About to call sendToAI (from useAIProvider). Parts:', parts, 'Options:', options);
      
      // Create a temporary assistant message that will be updated during streaming
      let tempAssistantMessage: Message | null = null;
      if (options?.streamingEnabled && options?.onPartialResponse) {
        tempAssistantMessage = {
          id: (new Date().getTime() + 1).toString(),
          content: '', // Will be updated during streaming
          role: 'assistant',
          timestamp: new Date(),
        };
        // Add an initial empty message that will be updated
        addMessage(tempAssistantMessage);
      }
      
      const response = await sendToAI(parts, { 
        systemPrompt: options?.systemPrompt,
        streamingEnabled: options?.streamingEnabled,
        onStreamUpdate: (partialText) => {
          // Update the UI with partial responses
          if (options?.onPartialResponse) {
            options.onPartialResponse(partialText);
          }
          
          // Update the temporary message content if it exists
          if (tempAssistantMessage) {
            updateMessage(tempAssistantMessage.id, { content: partialText });
          }
        }
      });
      
      console.log('[AIContext] sendToAI call returned. Response:', response);
      
      // If we were streaming, we've already added and updated the message, so don't add it again
      if (tempAssistantMessage) {
        return response;
      }
      
      const assistantMessage: Message = {
        id: (new Date().getTime() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          model: selectedModel.id,
          provider: selectedModel.provider
        }
      };
      addMessage(assistantMessage);
      
      return response;
    } catch (error) {
      console.error('[AIContext] Error in sendMessage:', error);
      const errorMessage: Message = {
        id: (new Date().getTime() + 1).toString(),
        content: error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred',
        role: 'assistant',
        timestamp: new Date()
      };
      addMessage(errorMessage);
      throw error;
    } finally {
      console.log('[AIContext] sendMessage finally block. Setting loading to false.');
      setLoading(false);
    }
  }, [setLoading, sendToAI, professionalMode, professionalService, user, messages, selectedModel, addMessage]);

  return (
    <AIContext.Provider value={{
      messages,
      isLoading,
      selectedModel,
      sendMessage,
      setSelectedModel,
      clearMessages,
      startNewConversation,
      professionalMode,
      toggleProfessionalMode,
      professionalService,
    }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
} 