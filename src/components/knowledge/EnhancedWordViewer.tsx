import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, Download, RefreshCw } from 'lucide-react';

/**
 * Enhanced Word Document Preview Component
 * 
 * This component provides a better viewing experience for Word documents
 * by using the docx-preview library to render them with formatting preserved.
 * 
 * NOTE: This is a proof-of-concept implementation. To fully implement this:
 * 1. Install the docx-preview library with: npm install docx-preview
 * 2. Import and use it as shown in the commented code below
 */

interface EnhancedWordViewerProps {
  documentId: string;
  title: string;
  content?: string;
  fileUrl?: string;
  onClose?: () => void;
}

export function EnhancedWordViewer({
  documentId, 
  title,
  content,
  fileUrl,
  onClose
}: EnhancedWordViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    async function renderWordDocument() {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!fileUrl) {
          setError('No document URL provided');
          setIsLoading(false);
          return;
        }
        
        // Fetch the document
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Render using docx-preview
        // NOTE: Uncomment and use the actual library in production
        /*
        import { renderAsync } from 'docx-preview';
        
        await renderAsync(arrayBuffer, containerRef.current!, null, {
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
          defaultFont: {
            family: 'Arial',
            size: 11
          },
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true
        });
        */
        
        // This is just a placeholder for the demo - remove in actual implementation
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-8 bg-white">
              <h1 class="text-2xl font-bold mb-4">${title}</h1>
              <div class="prose">
                <p class="mb-4">
                  This is a placeholder for the enhanced Word document preview. 
                  In a real implementation, the document would be rendered here with proper formatting.
                </p>
                <p class="mb-4">
                  To implement this feature, install docx-preview and uncomment the code in the component.
                </p>
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p class="text-sm text-blue-800">
                    Document ID: ${documentId}<br/>
                    File URL: ${fileUrl}
                  </p>
                </div>
              </div>
            </div>
          `;
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering Word document:', err);
        setError(err instanceof Error ? err.message : 'Unknown error rendering document');
        setIsLoading(false);
      }
    }
    
    renderWordDocument();
  }, [documentId, fileUrl, title]);
  
  const handleRetry = () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    setIsLoading(true);
    setError(null);
    
    // Re-trigger the effect
    const timer = setTimeout(() => {
      // Force effect to run again by changing a dependency
      setIsLoading(true);
    }, 100);
    
    return () => clearTimeout(timer);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="font-medium truncate max-w-md">{title}</div>
        <div className="flex items-center space-x-2">
          {error && (
            <button
              onClick={handleRetry}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Retry loading"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {fileUrl && (
            <a 
              href={fileUrl}
              download={title}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Download original document"
            >
              <Download size={16} />
            </a>
          )}
        </div>
      </div>
      
      {/* Document container */}
      <div className="flex-grow overflow-auto relative bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="flex flex-col items-center">
              <Loader2 size={36} className="animate-spin text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Loading document...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="max-w-md p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle size={20} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error loading document</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button 
                    onClick={handleRetry} 
                    className="mt-3 px-3 py-1 text-xs bg-white border border-red-300 rounded text-red-700 hover:bg-red-50"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* This is where the document will be rendered */}
        <div ref={containerRef} className="document-container min-h-full" />
      </div>
    </div>
  );
}

// Example of how to use this component:
/*
<EnhancedWordViewer 
  documentId="doc-123"
  title="Sample Document.docx"
  fileUrl="https://example.com/document.docx"
/>
*/
