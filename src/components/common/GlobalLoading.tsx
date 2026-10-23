import React from 'react';
import { useGlobalStore } from '../../store';

export function GlobalLoading() {
  const { loading } = useGlobalStore();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
} 