import { useState, useCallback, useEffect, useRef } from 'react';

interface UseDragAndDropOptions {
  onFilesDropped?: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  disabled?: boolean;
}

interface UseDragAndDropReturn {
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  dragProps: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  fileCount: number;
  reset: () => void;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}): UseDragAndDropReturn {
  const {
    onFilesDropped,
    acceptedFileTypes = [],
    maxFiles = Infinity,
    disabled = false
  } = options;

  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragAccept, setIsDragAccept] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const dragCounter = useRef(0);

  const validateFiles = useCallback((files: File[]): boolean => {
    if (disabled) return false;
    if (files.length > maxFiles) return false;
    
    if (acceptedFileTypes.length > 0) {
      return files.every(file => {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        return acceptedFileTypes.some(type => {
          if (type.startsWith('.')) {
            return fileName.endsWith(type);
          }
          if (type.includes('/*')) {
            return fileType.startsWith(type.replace('/*', ''));
          }
          return fileType === type;
        });
      });
    }
    
    return true;
  }, [acceptedFileTypes, maxFiles, disabled]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounter.current += 1;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const files = Array.from(e.dataTransfer.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);
      
      if (files.length > 0) {
        setIsDragActive(true);
        setFileCount(files.length);
        
        const isValid = validateFiles(files);
        setIsDragAccept(isValid);
        setIsDragReject(!isValid);
      }
    }
  }, [disabled, validateFiles]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    dragCounter.current -= 1;
    
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragActive(false);
      setIsDragAccept(false);
      setIsDragReject(false);
      setFileCount(0);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // Set the dropEffect to indicate that we can accept the drop
    if (isDragAccept) {
      e.dataTransfer.dropEffect = 'copy';
    } else if (isDragReject) {
      e.dataTransfer.dropEffect = 'none';
    }
  }, [disabled, isDragAccept, isDragReject]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragActive(false);
    setIsDragAccept(false);
    setIsDragReject(false);
    setFileCount(0);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 0 && validateFiles(files)) {
      onFilesDropped?.(files);
    }
  }, [disabled, validateFiles, onFilesDropped]);

  const reset = useCallback(() => {
    setIsDragActive(false);
    setIsDragAccept(false);
    setIsDragReject(false);
    setFileCount(0);
    dragCounter.current = 0;
  }, []);

  // Global event listeners for better UX
  useEffect(() => {
    if (disabled) return;

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      reset();
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [disabled, reset]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    isDragActive,
    isDragAccept,
    isDragReject,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    fileCount,
    reset,
  };
} 