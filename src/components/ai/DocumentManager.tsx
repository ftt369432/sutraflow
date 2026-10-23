import React, { useState, useCallback } from 'react';
import { FileText, Image, File, Trash2, Upload, FolderOpen, Download, Tag, Filter, Search, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { useDropzone } from 'react-dropzone';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import type { AIDocument } from '../../types/ai';
import { cn } from '../../lib/utils';
import { cleanDocumentTitle } from '../../utils/documentUtils';

interface DocumentManagerProps {
  documents: AIDocument[];
  selectedDocs: AIDocument[];
  onSelectDocument: (doc: AIDocument) => void;
  onDeselectDocument: (docId: string) => void;
  onUploadDocument: (file: File) => Promise<void>;
  onDeleteDocument: (docId: string) => void;
}

export function DocumentManager({
  documents,
  selectedDocs,
  onSelectDocument,
  onDeselectDocument,
  onUploadDocument,
  onDeleteDocument
}: DocumentManagerProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    try {
      await Promise.all(Array.from(files).map(onUploadDocument));
      setShowUpload(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    }
  };

  const getDocumentIcon = (type: AIDocument['type']) => {
    switch (type) {
      case 'txt':
      case 'doc':
      case 'docx':
      case 'pdf':
      case 'md':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <Input
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.md,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-sm text-primary hover:text-primary/80"
                >
                  Click to upload or drag and drop
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports: TXT, PDF, DOC, DOCX, MD, JPG, PNG
                </p>
              </div>
              {uploadError && (
                <p className="text-sm text-error">{uploadError}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => {
          const isSelected = selectedDocs.some(d => d.id === doc.id);
          return (
            <div
              key={doc.id}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => {
                if (isSelected) {
                  onDeselectDocument(doc.id);
                } else {
                  onSelectDocument(doc);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDocumentIcon(doc.type)}
                  <div>
                    <h3 className="font-medium text-sm">{cleanDocumentTitle(doc.title)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {doc.metadata.size ? formatFileSize(doc.metadata.size) : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-error hover:text-error hover:bg-error/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {doc.metadata.tags && doc.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {doc.metadata.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-primary/5 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 