import React, { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { AIDriveService } from '../../services/drive/aiDriveService';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';

interface GenieDriveUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string | null;
  onSuccess?: () => void;
  aiDriveService: AIDriveService;
  userId: string; // Added userId prop
}

export function GenieDriveUploadModal({ isOpen, onClose, currentFolder, onSuccess, aiDriveService, userId }: GenieDriveUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Create a ref for the file input

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || !userId) {
      setError(!userId ? 'User ID is missing. Cannot upload.' : 'No files selected.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Upload the file using AIDriveService
        await (aiDriveService as any).uploadFile(
          file, 
          currentFolder
        );
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 })); 
      }
      
      // Success - call callback and close
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to upload files:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Drop zone */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <h3 className="text-sm font-medium mb-1">Drag files here or click to upload</h3>
            <p className="text-xs text-gray-500 mb-4">
              PDF, Word, Excel, PowerPoint, images, and other files supported
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              ref={fileInputRef} // Assign the ref to the input
            />
            <label htmlFor="file-upload">
              <Button 
                size="sm" 
                type="button" 
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()} // Add onClick to programmatically click the input
              >
                Browse Files
              </Button>
            </label>
          </div>
          
          {/* File list */}
          {files.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Files to upload:</h3>
              <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center p-3">
                    <div className="flex-shrink-0 mr-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      
                      {/* Upload progress */}
                      {isUploading && uploadProgress[file.name] !== undefined && (
                        <div className="mt-1 h-1 w-full bg-gray-200 rounded overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={uploadFiles} 
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Uploading...
              </>
            ) : (
              'Upload Files'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}