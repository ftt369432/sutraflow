import React from 'react';
import { Bookmark, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { ResearchResult } from '../../../types/legal';
import { useLegalStore } from '../../../store/legalStore';

export function SavedResearch() {
  const { savedResearch, removeResearch } = useLegalStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Saved Research
      </h2>

      {savedResearch.length === 0 ? (
        <div className="text-center py-8">
          <Bookmark className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No saved research yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedResearch.map((result) => (
            <div
              key={result.id}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {result.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {result.citation}
                  </p>
                </div>
                <button
                  onClick={() => removeResearch(result.id)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  ×
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Calendar size={12} className="mr-1" />
                  {format(result.date, 'MMM d, yyyy')}
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp size={12} className="mr-1" />
                  {(result.relevance * 100).toFixed(0)}% match
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}