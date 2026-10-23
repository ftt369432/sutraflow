import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { DriveDocument } from '../../types/drive';
import { cleanDocumentTitle } from '../../utils/documentUtils';

interface DocumentGridProps {
  documents: DriveDocument[];
  onSelect: (document: DriveDocument) => void;
}

export function DocumentGrid({ documents, onSelect }: DocumentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <div
          key={document.id}
          onClick={() => onSelect(document)}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow cursor-pointer"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <FileText className="text-blue-500 dark:text-blue-400" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {cleanDocumentTitle(document.name)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(document.uploadDate, 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {document.summary && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {document.summary}
            </p>
          )}

          {document.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(document.size)}</span>
            <div className="flex items-center">
              <Calendar size={12} className="mr-1" />
              {format(document.lastModified, 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}