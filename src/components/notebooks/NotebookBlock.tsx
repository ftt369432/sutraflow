import React, { useState } from 'react';
import { NotebookBlock as NotebookBlockType } from '../../types/notebook';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { RichTextEditor } from './RichTextEditor';
import { Edit2, Trash2, Code, MessageSquare, Image as ImageIcon, Brain, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface NotebookBlockProps {
  block: NotebookBlockType;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<NotebookBlockType>) => void;
}

export const NotebookBlock: React.FC<NotebookBlockProps> = ({
  block,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const blockContent = typeof block.content === 'object' 
    ? JSON.stringify(block.content) 
    : block.content;

  const handleUpdate = (content: string) => {
    onUpdate?.({ content });
  };

  const handleSave = async () => {
    setIsEditing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(blockContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case 'text':
        return <Edit2 size={16} className="text-blue-500" />;
      case 'code':
        return <Code size={16} className="text-purple-500" />;
      case 'ai':
        return <Brain size={16} className="text-emerald-500" />;
      case 'image':
        return <ImageIcon size={16} className="text-pink-500" />;
      default:
        return <MessageSquare size={16} className="text-gray-500" />;
    }
  };

  const renderContent = () => {
    if (!isExpanded) {
      return null;
    }

    switch (block.type) {
      case 'text':
        if (isEditing) {
          return (
            <RichTextEditor
              initialValue={blockContent}
              onChange={handleUpdate}
              onSave={handleSave}
              autoFocus
            />
          );
        }
        return (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: blockContent }}
            onClick={() => setIsEditing(true)}
          />
        );
      case 'ai':
        return (
          <div className="bg-emerald-50 border-l-4 border-emerald-200 p-4 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">AI Generated</span>
              <span className="text-xs text-emerald-600 ml-auto">
                {new Date(block.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="prose max-w-none">
              {blockContent}
            </div>
          </div>
        );
      case 'code':
        return (
          <div className="relative bg-gray-50 rounded-md">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={copyToClipboard}
              >
                {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{blockContent}</code>
            </pre>
          </div>
        );
      case 'image':
        return (
          <div className="relative">
            <img
              src={blockContent}
              alt={block.metadata?.alt || 'Image'}
              className="max-w-full rounded-lg"
            />
            {block.metadata?.caption && (
              <p className="text-sm text-center text-gray-500 mt-2">
                {block.metadata.caption}
              </p>
            )}
          </div>
        );
      default:
        return <div>{blockContent}</div>;
    }
  };

  return (
    <div className="group relative border rounded-md">
      <div className="bg-muted/20 p-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          {getBlockIcon()}
          <span className="text-sm font-medium">{block.type.charAt(0).toUpperCase() + block.type.slice(1)}</span>
          {block.type === 'text' && (
            <span className="text-xs text-gray-500">
              {new Date(block.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {block.type === 'text' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="p-3">
        {renderContent()}
      </div>
    </div>
  );
}; 