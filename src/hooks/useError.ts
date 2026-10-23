import { useCallback } from 'react';
import { useGlobalStore } from '../store';
import { useNotifications } from './useNotifications';

export function useError() {
  const { setError } = useGlobalStore();
  const { showError } = useNotifications();

  const handleError = useCallback((error: Error | string) => {
    const message = error instanceof Error ? error.message : error;
    setError(message);
    showError(message);
  }, [setError, showError]);

  return {
    handleError
  };
} 