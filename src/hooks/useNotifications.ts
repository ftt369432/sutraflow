import { useCallback } from 'react';
import { useGlobalStore } from '../store';

export function useNotifications() {
  const { addNotification, removeNotification } = useGlobalStore();

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addNotification({ message, type });
  }, [addNotification]);

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    removeNotification
  };
} 