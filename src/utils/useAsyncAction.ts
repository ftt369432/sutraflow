import { useState, useCallback } from 'react';
import { useNotify } from './notification';
import { useLoadingState } from './loadingState';

interface UseAsyncActionOptions<T> {
  /**
   * Operation ID for loading state management
   */
  operationId: string;
  
  /**
   * Function to execute
   */
  action: (...args: unknown[]) => Promise<T>;

  /**
   * Options for handling success
   */
  onSuccess?: {
    message?: string;
    title?: string;
    callback?: (result: T) => void;
    showNotification?: boolean;
  };
  
  /**
   * Options for handling error
   */
  onError?: {
    message?: string;
    title?: string;
    callback?: (error: Error) => void;
    showNotification?: boolean;
  };
  
  /**
   * If true, will rethrow the error after handling
   */
  rethrow?: boolean;
}

/**
 * A hook for handling async operations with loading states and error handling
 */
export function useAsyncAction<T = unknown>({
  operationId,
  action,
  onSuccess = {
    showNotification: false
  },
  onError = {
    showNotification: true
  },
  rethrow = false
}: UseAsyncActionOptions<T>) {
  const notify = useNotify();
  const { withLoading, isLoading } = useLoadingState();
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (...args: unknown[]) => {
    setError(null);
    
    try {
      const result = await withLoading(operationId, async () => {
        return await action(...args);
      }, {
        showSuccessNotification: false,
        showErrorNotification: false
      });
      
      setData(result);
      
      // Handle success
      if (onSuccess.callback) {
        onSuccess.callback(result);
      }
      
      if (onSuccess.showNotification) {
        notify.success(
          onSuccess.title || 'Success',
          onSuccess.message || 'Operation completed successfully'
        );
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      // Handle error
      if (onError.callback) {
        onError.callback(error);
      }
      
      if (onError.showNotification) {
        notify.error(
          onError.title || 'Error',
          onError.message || error.message || 'An error occurred'
        );
      }
      
      if (rethrow) {
        throw error;
      }
      
      return null;
    }
  }, [action, notify, operationId, onSuccess, onError, rethrow, withLoading]);

  return {
    execute,
    isLoading: isLoading(operationId),
    error,
    data,
    reset: useCallback(() => {
      setError(null);
      setData(null);
    }, [])
  };
}

/**
 * Example usage:
 * 
 * const { execute, isLoading, error } = useAsyncAction({
 *   operationId: 'fetchUserData',
 *   action: async (userId) => {
 *     const response = await api.get(`/users/${userId}`);
 *     return response.data;
 *   },
 *   onSuccess: {
 *     title: 'User Data',
 *     message: 'Successfully fetched user data',
 *     showNotification: true,
 *     callback: (data) => console.log('Got data:', data)
 *   },
 *   onError: {
 *     title: 'Error',
 *     message: 'Failed to fetch user data',
 *     showNotification: true
 *   }
 * });
 * 
 * // Then call execute with appropriate args
 * const handleClick = () => {
 *   execute(userId);
 * };
 */