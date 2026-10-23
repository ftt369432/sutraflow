import React from 'react';
import { FileText, Image, File } from 'lucide-react';
import { AIDocument } from '../../types/ai';

interface DocumentIconProps {
  type: AIDocument['type'];
  className?: string;
}

export function DocumentIcon({ type, className = 'w-6 h-6' }: DocumentIconProps) {
  switch (type) {
    case 'image':
      return <Image className={className} />;
    case 'pdf':
    case 'md':
    case 'markdown':
    case 'csv':
    case 'json':
      return <FileText className={className} />;
    default:
      return <File className={className} />;
  }
} 