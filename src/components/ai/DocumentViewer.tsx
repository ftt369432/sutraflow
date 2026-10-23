import React from 'react';
import { AIDocument } from '../../types/ai';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Download, X } from 'lucide-react';

interface DocumentViewerProps {
  document: AIDocument | null;
  onClose: () => void;
  onDownload: (document: AIDocument) => void;
  renderCodePreview?: (content: string, language: string) => React.ReactNode;
}

export function DocumentViewer({
  document,
  onClose,
  onDownload,
  renderCodePreview
}: DocumentViewerProps) {
  if (!document) return null;

  const getLanguageFromType = (type: string | undefined): string => {
    switch (type) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'rb':
        return 'ruby';
      case 'java':
        return 'java';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'cpp':
      case 'c':
      case 'h':
      case 'hpp':
        return 'cpp';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'json':
        return 'json';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'scss':
      case 'sass':
        return 'scss';
      case 'sql':
        return 'sql';
      case 'sh':
      case 'bash':
        return 'bash';
      case 'xml':
        return 'xml';
      case 'swift':
        return 'swift';
      case 'kt':
      case 'kotlin':
        return 'kotlin';
      case 'php':
        return 'php';
      default:
        return type || 'text';
    }
  };

  const shouldRenderPreview = () => {
    const previewableTypes = [
      'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'java', 'go', 'rs',
      'cpp', 'c', 'h', 'hpp', 'md', 'markdown', 'json', 'yaml',
      'yml', 'html', 'css', 'scss', 'sass', 'sql', 'sh', 'bash',
      'xml', 'swift', 'kt', 'kotlin', 'php'
    ];
    return !!document.type && previewableTypes.includes(document.type);
  };

  const renderContent = () => {
    switch (document.type) {
      case 'image':
        return (
          <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-accent/5">
            <img
              src={document.content}
              alt={document.title || 'Document Content'}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        );
      case 'pdf':
        return (
          <iframe
            src={document.content}
            className="w-full h-[600px] rounded-lg border"
            title={document.title || 'Document Viewer'}
          />
        );
      case 'csv':
        return (
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full border-collapse">
              <tbody>
                {document.content.split('\n').map((row, i) => (
                  <tr key={i} className={i === 0 ? 'font-medium bg-accent/5' : ''}>
                    {row.split(',').map((cell, j) => (
                      <td
                        key={j}
                        className="border px-3 py-2 text-sm"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        if (shouldRenderPreview() && renderCodePreview) {
          return (
            <div className="max-h-[600px] overflow-auto rounded-lg">
              {renderCodePreview(document.content, getLanguageFromType(document.type))}
            </div>
          );
        }
        return (
          <pre className="max-h-[600px] overflow-auto p-4 rounded-lg bg-accent/5 text-sm">
            {document.content}
          </pre>
        );
    }
  };

  return (
    <Dialog open={!!document} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{document.title || 'View Document'}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created on {document.metadata.date ? new Date(document.metadata.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDownload(document)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {renderContent()}
        </div>

        {document.metadata.tags && document.metadata.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {document.metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 