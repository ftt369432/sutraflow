import React, { useEffect, useState } from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { AIDriveFile } from '../../services/drive/aiDriveService';
import { Skeleton } from '../ui/skeleton';
import { extractWordText } from '../../utils/documentUtils';
import { GenieDrivePDFViewer } from './GenieDrivePDFViewer';

// PDF worker is configured globally in src/lib/pdfWorkerSetup.ts

interface GenieDriveDocumentPreviewProps {
  file: AIDriveFile;
  aiDriveService: any; // Complex service interface
}

export const GenieDriveDocumentPreview: React.FC<GenieDriveDocumentPreviewProps> = ({
  file,
  aiDriveService,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePDFContent = async (blob: Blob) => {
    try {
      setPdfUrl(URL.createObjectURL(blob));
      setContent('PDF document active in Premium Viewer.');
    } catch (err) {
      console.error('PDF setup failed:', err);
      throw new Error(`Failed to initialize PDF viewer: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDownload = async () => {
    try {
      const url = await aiDriveService.downloadFile(file.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const loadContent = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const url = await aiDriveService.downloadFile(file.id);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const responseClone = response.clone();

      if (file.mime_type?.includes('pdf')) {
        const blob = await response.blob();
        await handlePDFContent(blob);
      } else if (file.mime_type?.includes('word') || file.mime_type?.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        try {
          const blob = await response.blob();
          const extractedText = await extractWordText(blob);
          setContent(extractedText);
        } catch (_mammothError) {
          console.warn('Word document extraction failed, trying fallback:', _mammothError);
          try {
            const text = await responseClone.text();
            setContent(text || 'Could not extract content from this Word document.');
          } catch (_fallbackError) {
            setContent('Could not extract content from this Word document.');
          }
        }
      } else if (file.mime_type?.startsWith('image/')) {
        const blob = await response.blob();
        setImageUrl(URL.createObjectURL(blob));
        setContent('Image file loaded - content preview not available');
      } else {
        const text = await response.text();
        setContent(text || 'No content available');
      }
      
    } catch (err) {
      console.error('Error loading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
      setContent('Failed to load document content. This might be due to an unsupported file format or corrupted file.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadContent();
  }, [file, aiDriveService]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [imageUrl, pdfUrl]);

  if (isLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 dark:bg-red-800/50 rounded-full p-2">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-1">Document Load Error</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
        
        {content && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Document Content</h4>
            <div className="bg-white dark:bg-gray-900 rounded border p-3 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {content}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ───── PREMIUM PDF VIEWER ─────
  if (file.mime_type?.includes('pdf') && pdfUrl) {
    return (
      <GenieDrivePDFViewer
        pdfUrl={pdfUrl}
        fileName={file.name}
        fileId={file.id}
        aiDriveService={aiDriveService}
        onDownload={handleDownload}
      />
    );
  }

  // Render image
  if (file.mime_type?.startsWith('image/') && imageUrl) {
    return (
      <div className="w-full h-full overflow-auto p-4">
        <div className="mb-4">
          <img 
            src={imageUrl} 
            alt={file.name} 
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        </div>
        {content && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Extracted Text:</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{content}</pre>
          </div>
        )}
      </div>
    );
  }

  // Render text content
  if (content) {
    return (
      <div className="w-full h-full overflow-auto p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">{content}</pre>
      </div>
    );
  }

  return <div className="p-4 text-gray-500 dark:text-gray-400">No preview available</div>;
};
