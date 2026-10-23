import { useState, useCallback, useEffect } from 'react';

interface UseMicrophoneOptions {
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: Error) => void;
}

export function useMicrophone(options: UseMicrophoneOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      setIsListening(true);
      setError(null);
      options.onStart?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to access microphone');
      setError(error);
      options.onError?.(error);
    }
  }, [options]);

  const stopListening = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsListening(false);
    options.onStop?.();
  }, [stream, options]);

  const toggleMicrophone = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    isListening,
    error,
    startListening,
    stopListening,
    toggleMicrophone
  };
} 