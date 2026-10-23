import { useCallback } from 'react';
import { useGlobalStore } from '../store';

export function useLoading() {
  const { loading, setLoading } = useGlobalStore();

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      return await promise;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return {
    loading,
    setLoading,
    withLoading
  };
} 