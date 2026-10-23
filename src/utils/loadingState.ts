import { useState, useCallback } from 'react';
import { useNotify } from './notification';
import { toast } from 'sonner';

/**
 * Type for the loading state by operation ID
 */
export type LoadingState = {
  [key: string]: boolean;
};

/**
 * Options for withLoading function
 */
export interface WithLoadingOptions {
  errorTitle?: string;
  successTitle?: string;
  successMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
}

// Fallback notification when context is not available
const fallbackNotify = {
  success: (title: string, message: string) => {
    toast.success(title, { description: message });
  },
  error: (title: string, message: string) => {
    toast.error(title, { description: message });
  },
  apiError: (error: Error | { message?: string }, defaultMessage: string) => {
    const errorMessage = (error as { message?: string })?.message || defaultMessage;
    toast.error('Error', { description: errorMessage });
  }
};

/**
 * Hook for managing loading states
 * @returns Loading state utilities
 */
export function useLoadingState() {
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  
  // Always call the hook, even if we might not use its result
  const notifyFromContext = useNotify();
  
  // Use the context-based notify if available, otherwise use fallback
  const safeNotify = useCallback((method: 'success' | 'error' | 'apiError', ...args: unknown[]) => {
    try {
      // @ts-expect-error - Deliberately ignoring for dynamic dispatch
      return notifyFromContext[method](...args);
    } catch {
      console.warn('Notification context not available, using fallback');
      // @ts-expect-error - Deliberately ignoring for dynamic dispatch
      return fallbackNotify[method](...args);
    }
  }, [notifyFromContext, fallbackNotify]); // Added dependencies

  /**
   * Start loading for an operation
   * @param operationId The operation identifier
   */
  const startLoading = useCallback((operationId: string) => {
    setLoadingState((prev) => ({ ...prev, [operationId]: true }));
  }, []);

  /**
   * Stop loading for an operation
   * @param operationId The operation identifier
   */
  const stopLoading = useCallback((operationId: string) => {
    setLoadingState((prev) => ({ ...prev, [operationId]: false }));
  }, []);

  /**
   * Check if an operation is loading
   * @param operationId The operation identifier
   * @returns True if the operation is loading
   */
  const isLoading = useCallback(
    (operationId: string) => {
      return !!loadingState[operationId];
    },
    [loadingState]
  );

  /**
   * Check if any operation is loading
   * @returns True if any operation is loading
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingState).some((loading) => loading);
  }, [loadingState]);

  /**
   * Wrapper for async functions to handle loading state
   * @param operationId The operation identifier
   * @param asyncFn The async function to execute
   * @param options Options for success/error handling
   * @returns Promise with the result of the async function
   */
  const withLoading = useCallback(
    async <T>(
      operationId: string,
      asyncFn: () => Promise<T>,
      options?: WithLoadingOptions
    ): Promise<T> => {
      const {
        successTitle = 'Success',
        successMessage = 'Operation completed successfully',
        showSuccessNotification = false,
        showErrorNotification = true,
      } = options || {};

      startLoading(operationId);
      
      try {
        const result = await asyncFn();
        
        if (showSuccessNotification) {
          safeNotify('success', successTitle, successMessage);
        }
        
        return result;
      } catch (error) {
        if (showErrorNotification) {
          safeNotify('apiError', error, `Error during operation: ${operationId}`);
        }
        throw error;
      } finally {
        // Always stop loading, even if there was an error
        stopLoading(operationId);
      }
    },
    [startLoading, stopLoading, safeNotify]
  );

  return {
    loadingState,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    withLoading,
  };
}

/**
 * Higher-order function for wrapping async API calls with loading state
 * @param asyncFn The async function to wrap
 * @param options Loading options
 * @returns The wrapped function with loading state management
 */
export function createLoadingHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  _asyncFn: T, 
  _operationId: string, 
  _options: WithLoadingOptions = {}
): (loadingStateHook: ReturnType<typeof useLoadingState>) => (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return (loadingStateHook: ReturnType<typeof useLoadingState>) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Explicitly cast the result of withLoading to ensure type compatibility
      return await loadingStateHook.withLoading(
        _operationId,
        () => _asyncFn(...args),
        _options 
      ) as ReturnType<T>;
    };
  };
}