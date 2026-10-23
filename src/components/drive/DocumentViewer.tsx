import React from 'react';
import { ArrowLeft, Download, Share2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import type { DriveDocument } from '../../types/drive';
import { cleanDocumentTitle } from '../../utils/documentUtils';

interface DocumentViewerProps {
  document: DriveDocument;
  onClose: () => void;
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
            {cleanDocumentTitle(document.name)}
          </h2>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Download size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Share2 size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="prose dark:prose-invert max-w-none">
          {/* Document content would be rendered here */}
          <p className="text-gray-600 dark:text-gray-300">
            Document viewer content placeholder
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Document Details
          </h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Size</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {formatFileSize(document.size)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {document.type}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Uploaded</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {format(document.uploadDate, 'PPP')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Modified</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {format(document.lastModified, 'PPP')}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
              >
                <Tag size={12} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
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