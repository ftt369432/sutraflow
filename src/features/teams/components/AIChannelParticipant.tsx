/**
 * AIChannelParticipant - Integrates AI into team channels
 * Listens for @AI mentions and responds intelligently
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { MentionDetector } from '../../../lib/ai/detection/mentionDetector';
import { ContextExtractor } from '../../../lib/ai/detection/contextExtractor';
import { ResponseGenerator } from '../../../lib/ai/processing/responseGenerator';
import { MessageExecutor } from '../../../lib/ai/execution/messageExecutor';
import type { Team, Page, Thread } from '../../../types/team';

interface AIChannelParticipantProps {
  team: Team | null;
  page: Page | null;
  messages: Thread[];
  pinnedDriveFiles?: any[];
  onNewMessage?: (message: Thread) => void;
  postMessage?: (pageId: string, content: string) => Promise<Thread | null>;
}

export const AIChannelParticipant: React.FC<AIChannelParticipantProps> = ({
  team,
  page,
  messages,
  pinnedDriveFiles,
  onNewMessage,
  postMessage: postMessageProp
}) => {
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);

  /**
   * Process incoming messages for AI mentions
   */
  const processMessage = useCallback(async (message: Thread) => {
    // Skip if already processed this message
    if (message.id === lastProcessedMessageId) {
      return;
    }

    // Skip AI's own messages
    if (message.user_id === 'ai-assistant') {
      return;
    }

    console.log('🔍 [AIChannelParticipant] Processing message:', message.content);

    // LAYER 1: Detection
    const detection = MentionDetector.detect(message.content);

    if (!detection.isAIMention) {
      console.log('❌ [AIChannelParticipant] No AI mention detected, skipping');
      return;
    }

    console.log('✅ [AIChannelParticipant] AI mentioned! Detection:', detection);

    // Mark as processed
    setLastProcessedMessageId(message.id);
    setIsThinking(true);

    try {
      // Step 1: Extract context
      setThinkingMessage('Analyzing your request...');
      const context = await ContextExtractor.extract(team, page, messages, pinnedDriveFiles);
      console.log('📦 [AIChannelParticipant] Context extracted:', context);

      // Step 2: Generate response
      setThinkingMessage('Thinking...');
      const response = await ResponseGenerator.generate(
        detection.extractedPrompt,
        context,
        detection.command,
        {
          style: context.channelType === 'private' ? 'casual' : 'professional'
        }
      );
      console.log('🤖 [AIChannelParticipant] Response generated:', response);

      // Step 3: Create and post message
      setThinkingMessage('Posting response...');
      const formattedContent = MessageExecutor.formatAIMessage(response);

      // Post to channel using proper TeamContext method if available
      if (postMessageProp && page) {
        await postMessageProp(page.id, formattedContent);
        console.log('✅ [AIChannelParticipant] AI response posted via TeamContext');
      } else if (onNewMessage) {
        // Fallback to direct message object for demo
        const aiMessage = MessageExecutor.createAIMessage(response);
        const validation = MessageExecutor.validateMessage(aiMessage);
        if (!validation.valid) {
          console.error('❌ [AIChannelParticipant] Invalid message:', validation.error);
          throw new Error(validation.error);
        }
        onNewMessage(aiMessage);
        console.log('✅ [AIChannelParticipant] AI response posted via callback');
      } else {
        console.warn('⚠️ [AIChannelParticipant] No posting method available');
      }

    } catch (error) {
      console.error('❌ [AIChannelParticipant] Error processing message:', error);

      // Post error message
      const errorContent = `I encountered an error processing your request. Please try again or rephrase your question.\n\n_Error: ${error instanceof Error ? error.message : 'Unknown error'}_`;
      
      if (postMessageProp && page) {
        await postMessageProp(page.id, errorContent);
      } else if (onNewMessage) {
        const errorMessage = MessageExecutor.createAIMessage({
          content: errorContent,
          confidence: 0
        });
        onNewMessage(errorMessage);
      }

    } finally {
      setIsThinking(false);
      setThinkingMessage('');
    }
  }, [team, page, messages, onNewMessage, lastProcessedMessageId]);

  /**
   * Monitor for new messages
   */
  useEffect(() => {
    if (!messages || messages.length === 0) {
      return;
    }

    // Get the most recent message
    const latestMessage = messages[messages.length - 1];

    // Process it
    processMessage(latestMessage);
  }, [messages, processMessage]);

  // Skip rendering if no active page
  if (!page || !team) {
    return null;
  }

  /**
   * Render thinking indicator
   */
  if (!isThinking) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 bg-blue-50 border-l-4 border-blue-400 rounded-r">
      <Sparkles className="h-4 w-4 animate-pulse" />
      <span className="font-medium">AI Assistant</span>
      <span className="text-blue-500">•</span>
      <span>{thinkingMessage}</span>
    </div>
  );
};

export default AIChannelParticipant;
