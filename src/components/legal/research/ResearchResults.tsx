import React from 'react';
import { FileText, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { ResearchResult } from '../../../types/legal';

interface ResearchResultsProps {
  results: ResearchResult[];
  loading: boolean;
}

export function ResearchResults({ results, loading }: ResearchResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <FileText className="text-blue-500 dark:text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {result.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {result.citation}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <TrendingUp size={16} className="text-green-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {(result.relevance * 100).toFixed(0)}% match
              </span>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {result.summary}
          </p>

          <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1" />
            {format(result.date, 'MMMM d, yyyy')}
          </div>
        </div>
      ))}
    </div>
  );
}