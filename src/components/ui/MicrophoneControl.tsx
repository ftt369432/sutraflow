import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './Button';
import { useMicrophone } from '../../hooks/useMicrophone';
import { useToast } from '../../hooks/useToast';

interface MicrophoneControlProps {
  onStart?: () => void;
  onStop?: () => void;
  className?: string;
}

export function MicrophoneControl({ onStart, onStop, className = '' }: MicrophoneControlProps) {
  const { toast } = useToast();
  const { isListening, error, toggleMicrophone } = useMicrophone({
    onStart,
    onStop,
    onError: (error) => {
      toast({
        title: 'Microphone Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return (
    <Button
      variant={isListening ? 'default' : 'outline'}
      size="sm"
      onClick={toggleMicrophone}
      className={`relative ${className} ${isListening ? 'bg-primary text-white' : ''}`}
    >
      <div className="relative">
        {isListening ? (
          <>
            <Mic className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </>
        ) : (
          <MicOff className="h-4 w-4" />
        )}
      </div>
      <span className="ml-2 hidden md:inline">
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </span>
    </Button>
  );
}

export function MicrophoneControlMinimal({ onStart, onStop, className = '' }: MicrophoneControlProps) {
  const { isListening, toggleMicrophone } = useMicrophone({
    onStart,
    onStop
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMicrophone}
      className={`w-8 h-8 p-0 relative ${className}`}
    >
      {isListening ? (
        <>
          <Mic className="h-4 w-4 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </>
      ) : (
        <MicOff className="h-4 w-4" />
      )}
    </Button>
  );
} 