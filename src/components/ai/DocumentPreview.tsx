import React, { useState } from 'react';
import { AIDocument } from '../../types/ai';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Download, Eye, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DocumentIcon } from '../ui/DocumentIcon';

interface DocumentPreviewProps {
  document: AIDocument;
  onRemove: (id: string) => void;
  onView: (document: AIDocument) => void;
  onDownload: (document: AIDocument) => void;
  onAddTag: (docId: string, tag: string) => void;
  onRemoveTag: (docId: string, tagToRemove: string) => void;
  renderCodePreview?: (content: string, language: string) => React.ReactNode;
}

export function DocumentPreview({
  document,
  onRemove,
  onView,
  onDownload,
  onAddTag,
  onRemoveTag,
  renderCodePreview
}: DocumentPreviewProps) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      onAddTag(document.id, newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const getLanguageFromType = (type: string): string => {
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
        return type;
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

  return (
    <div className={cn(
      'group relative p-4 rounded-lg border bg-card/50 backdrop-blur-sm',
      'hover:bg-accent/10 transition-all duration-200'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DocumentIcon type={document.type || 'file'} />
          </div>
          <div>
            <h4 className="font-medium text-sm">{document.title || 'Untitled Document'}</h4>
            <p className="text-xs text-muted-foreground">
              {document.metadata.date ? new Date(document.metadata.date).toLocaleDateString() : 'No date'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(document)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDownload(document)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onRemove(document.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {document.type === 'image' && document.content && (
        <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-accent/5">
          <img
            src={document.content}
            alt={document.title || 'Document Preview'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      {shouldRenderPreview() && renderCodePreview && document.type && (
        <div className="mt-2 max-h-[200px] overflow-hidden rounded-lg">
          {renderCodePreview(
            document.content.slice(0, 500) + (document.content.length > 500 ? '...' : ''),
            getLanguageFromType(document.type)
          )}
        </div>
      )}
      
      <div className="mt-2 flex flex-wrap gap-1">
        {document.metadata.tags?.map((tag, index) => (
          <span
            key={index}
            className="group/tag inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
          >
            {tag}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 opacity-0 group-hover/tag:opacity-100"
              onClick={() => onRemoveTag(document.id, tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        ))}
        {showTagInput ? (
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Press Enter to add"
            className="h-6 text-xs w-32"
            autoFocus
            onBlur={() => setShowTagInput(false)}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowTagInput(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Tag
          </Button>
        )}
      </div>
    </div>
  );
} 