import { useState, useEffect } from 'react';

interface UseVoiceCommandsProps {
  onCommand: (command: string) => void;
}

export function useVoiceCommands({ onCommand }: UseVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    // Mock implementation
    console.log('Started listening');
    setIsListening(true);
  };

  const stopListening = () => {
    // Mock implementation
    console.log('Stopped listening');
    setIsListening(false);
  };

  return {
    isListening,
    startListening,
    stopListening
  };
} 