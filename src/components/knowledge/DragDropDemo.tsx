import React from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface DragDropDemoProps {
  className?: string;
}

export function DragDropDemo({ className = '' }: DragDropDemoProps) {
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5 text-blue-600" />
        Multi-File Drag & Drop
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Drag multiple files anywhere on the page
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Drop up to 50 files at once from your computer
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Smart file validation
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Visual feedback for accepted/rejected files
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Batch upload with progress
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Upload queue with individual file progress
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Supported formats:
            </span>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            TXT, MD, PDF, DOC, DOCX, XLSX, PPTX, Google Docs, Images
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Tip:</strong> Files will be added to the currently selected folder, 
              or root if no folder is selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 