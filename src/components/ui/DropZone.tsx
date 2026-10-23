import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/utils';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export function DropZone({
  onDrop,
  accept,
  maxSize = 10485760, // 10MB
  className,
  children
}: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
        isDragActive && !isDragReject && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && 'border-muted-foreground/20 hover:border-primary/50',
        className
      )}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <div className="flex flex-col items-center justify-center space-y-2 text-primary">
          <Upload className="w-8 h-8 animate-bounce" />
          <p className="text-sm font-medium">Drop files here</p>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
          <Upload className="w-8 h-8" />
          <p className="text-sm">Drag & drop files here, or click to select files</p>
        </div>
      )}
    </div>
  );
} 