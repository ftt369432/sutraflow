/**
 * Simple Canvas Overlay
 * 
 * Minimal, clean canvas display for Simple Mode.
 * Shows one document at a time in overlay style.
 * 
 * Design Philosophy:
 * - No tabs, no history, no complex controls
 * - Focus on content with essential actions only
 * - Clean, distraction-free reading experience
 * 
 * @module components/canvas/SimpleCanvasOverlay
 */

import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface SimpleCanvasDocument {
  id: string;
  title: string;
  content: string;
  type?: string;
  createdAt?: Date;
}

interface SimpleCanvasOverlayProps {
  /** Document to display */
  document: SimpleCanvasDocument;
  
  /** Close handler */
  onClose: () => void;
  
  /** Optional className for container */
  className?: string;
  
  /** Show download button */
  allowDownload?: boolean;
  
  /** Show copy button */
  allowCopy?: boolean;
}

/**
 * Simple Canvas Overlay Component
 * 
 * @example
 * ```tsx
 * const [showCanvas, setShowCanvas] = useState(false);
 * const [document, setDocument] = useState<SimpleCanvasDocument | null>(null);
 * 
 * // When AI generates document
 * setDocument({
 *   id: 'doc-1',
 *   title: 'Demand Letter',
 *   content: '# Demand Letter\n\n...',
 *   type: 'legal-document'
 * });
 * setShowCanvas(true);
 * 
 * return (
 *   <>
 *     {showCanvas && document && (
 *       <SimpleCanvasOverlay
 *         document={document}
 *         onClose={() => setShowCanvas(false)}
 *       />
 *     )}
 *   </>
 * );
 * ```
 */
export const SimpleCanvasOverlay: React.FC<SimpleCanvasOverlayProps> = ({
  document,
  onClose,
  className = '',
  allowDownload = true,
  allowCopy = true
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Copy content to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('📋 Content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Download document as .md file
   */
  const handleDownload = () => {
    try {
      const blob = new Blob([document.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = `${document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      console.log('💾 Document downloaded:', document.title);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      className={`
        fixed inset-0 z-50
        bg-white dark:bg-gray-900
        flex flex-col
        ${isFullscreen ? '' : 'md:inset-4 md:rounded-xl md:shadow-2xl'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="
        flex items-center justify-between
        px-4 md:px-6 py-3 md:py-4
        border-b border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
      ">
        {/* Title Section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {document.title}
            </h2>
            {document.type && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {document.type}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {allowCopy && (
            <button
              onClick={handleCopy}
              className="
                p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors duration-200
                group
              "
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
              )}
            </button>
          )}

          {allowDownload && (
            <button
              onClick={handleDownload}
              className="
                p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-colors duration-200
                group
              "
              title="Download as Markdown"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors duration-200
              group
              hidden md:block
            "
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
            )}
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors duration-200
              group
            "
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="
        flex-1 overflow-auto
        px-4 md:px-8 py-6 md:py-8
        bg-gray-50 dark:bg-gray-950
      ">
        <div className="
          max-w-4xl mx-auto
          prose prose-lg dark:prose-invert
          prose-headings:font-semibold
          prose-h1:text-3xl prose-h1:mb-4
          prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-gray-700 dark:prose-p:text-gray-300
          prose-p:leading-relaxed
          prose-a:text-blue-600 dark:prose-a:text-blue-400
          prose-strong:text-gray-900 dark:prose-strong:text-gray-100
          prose-code:text-sm prose-code:bg-gray-200 dark:prose-code:bg-gray-800
          prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800
          prose-ul:list-disc prose-ol:list-decimal
          prose-li:text-gray-700 dark:prose-li:text-gray-300
        ">
          <ReactMarkdown>
            {document.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer (Optional - shows metadata) */}
      {document.createdAt && (
        <div className="
          px-4 md:px-6 py-2
          border-t border-gray-200 dark:border-gray-700
          bg-gray-50 dark:bg-gray-900
        ">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Created {document.createdAt.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};
