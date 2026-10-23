import React from 'react';
import { Upload, Brain } from 'lucide-react';

interface DocumentAnalysisProps {
  analyzing: boolean;
}

export function DocumentAnalysis({ analyzing }: DocumentAnalysisProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Document Analysis
      </h2>

      {analyzing ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Analyzing document...
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Upload a document to analyze
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
}