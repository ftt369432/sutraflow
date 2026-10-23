import { useCallback, useState } from 'react';
import type { AIModel } from '../types/ai';
import { geminiSimplifiedService } from '../services/gemini-simplified';
import { getEnv } from '../config/env';

// Define and Export the part type for multimodal input
export type MultimodalPart = {text: string} | {inlineData: {mimeType: string, data: string}};

// Define default model for Gemini
const defaultGeminiModel: AIModel = {
  id: 'gemini-1.5-flash',
  name: 'Gemini 1.5 Flash',
  provider: 'gemini',
  capabilities: ['chat', 'text-generation'],
  contextSize: 32000
};

export function useAIProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Always use Gemini as the provider
  const defaultProvider = 'gemini';
  
  const sendMessage = useCallback(async (
    userInputParts: Array<MultimodalPart>, 
    options?: { 
      modelId?: string, 
      systemPrompt?: string,
      streamingEnabled?: boolean,
      onStreamUpdate?: (text: string) => void
    }
  ): Promise<string> => {
    console.log('[useAIProvider] sendMessage called. UserInputParts:', userInputParts, 'Options:', options);
    setIsLoading(true);
    setError(null);
    
    try {
      const finalParts: Array<MultimodalPart> = [];

      if (options?.systemPrompt) {
        console.log('[useAIProvider] Adding system prompt to parts:', options.systemPrompt);
        finalParts.push({text: options.systemPrompt});
      }
      
      // Add user input parts. If a system prompt was added, and the first user part is text,
      // prepend "User: " to it for clarity or structure as a new turn.
      // For now, we'll just add them. The Gemini API handles turns in a sequence of parts.
      userInputParts.forEach(part => {
        finalParts.push(part);
      });
      console.log('[useAIProvider] Final parts before sending to service:', finalParts);

      if (finalParts.length === 0) {
         console.error('[useAIProvider] Attempted to send empty message parts.');
         throw new Error("Cannot send empty message parts.");
      }

      // Make sure at least one part is text if only a system prompt is present, or if only images are sent.
      // Some models might require at least one text part.
      // For now, assuming the caller (AIAssistantPage) will ensure valid part combinations.
      // Check if streaming is enabled in options
      const enableStreaming = options?.streamingEnabled !== undefined ? options.streamingEnabled : true;
      const onStreamingUpdate = options?.onStreamUpdate;
      
      if (enableStreaming && onStreamingUpdate) {
        console.log('[useAIProvider] Using streaming completion with onStreamUpdate callback');
        const streamStartTime = new Date();
        let chunkCount = 0;
        const chunks: string[] = [];
        
        const response = await geminiSimplifiedService.getCompletionStreaming(finalParts, {
          onUpdate: (text) => {
            chunkCount++;
            // Only store every 5th chunk to avoid excessive memory usage
            if (chunkCount % 5 === 0) {
              chunks.push(text);
            }
            onStreamingUpdate(text);
          }
        });
        
        const streamEndTime = new Date();
        const streamDurationMs = streamEndTime.getTime() - streamStartTime.getTime();
        
        console.log(`[useAIProvider] Streaming completed in ${streamDurationMs}ms, received ${chunkCount} chunks`);
        
        // Add streaming metrics to analytics or logging
        try {
          // If we have an analytics service, log the metrics
          // analyticsService?.logStreamingMetrics({
          //   durationMs: streamDurationMs,
          //   chunkCount,
          //   messageLength: response.length,
          //   avgChunkSizeChars: response.length / chunkCount
          // });
        } catch (analyticsError) {
          console.error('[useAIProvider] Error logging streaming metrics:', analyticsError);
        }
        
        return response;
      } else {
        console.log('[useAIProvider] Using standard completion (streaming disabled or no callback provided)');
        const response = await geminiSimplifiedService.getCompletion(finalParts, {
          // model option was removed previously as geminiSimplifiedService handles its default model
        });
        console.log('[useAIProvider] geminiSimplifiedService.getCompletion returned. Response:', response);
        return response;
      }
    } catch (error) {
      console.error('[useAIProvider] Error in sendMessage:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    } finally {
      console.log('[useAIProvider] sendMessage finally block. Setting isLoading to false.');
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error
  };
}