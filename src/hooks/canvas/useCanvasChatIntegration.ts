/**
 * Canvas Chat Integration Hook
 * 
 * Provides functionality for integrating canvas with chat system
 */

import { useState, useCallback } from 'react';

export interface CanvasChatIntegration {
  sendToCanvas: (content: string) => void;
  sendToChat: (content: string) => void;
  isIntegrationActive: boolean;
  toggleIntegration: () => void;
}

export const useCanvasChatIntegration = (): CanvasChatIntegration => {
  const [isIntegrationActive, setIsIntegrationActive] = useState(false);

  const sendToCanvas = useCallback((content: string) => {
    console.log('Sending content to canvas:', content);
    // Implementation for sending content to canvas
  }, []);

  const sendToChat = useCallback((content: string) => {
    console.log('Sending content to chat:', content);
    // Implementation for sending content to chat
  }, []);

  const toggleIntegration = useCallback(() => {
    setIsIntegrationActive(prev => !prev);
  }, []);

  return {
    sendToCanvas,
    sendToChat,
    isIntegrationActive,
    toggleIntegration,
  };
};
