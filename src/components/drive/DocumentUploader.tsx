import React, { useState } from 'react';
import { DocumentDropzone } from '../documents/DocumentDropzone';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface DocumentUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
}

export function DocumentUploader({ onUpload }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFilesDrop = async (files: File[]) => {
    try {
      setUploading(true);
      await onUpload(files);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      {uploading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <DocumentDropzone onFilesDrop={handleFilesDrop} />
    </div>
  );
}