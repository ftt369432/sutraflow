import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Zap, Brain, Database } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { AIDocument } from '../../types/ai';

interface VectorizationDebuggerProps {
  document: AIDocument;
}

export function VectorizationDebugger({ document }: VectorizationDebuggerProps) {
  const embeddingInfo = {
    exists: !!document.embedding,
    isArray: Array.isArray(document.embedding),
    length: Array.isArray(document.embedding) ? document.embedding.length : 0,
    isValid: document.embedding && Array.isArray(document.embedding) && document.embedding.length > 0
  };

  const metadataInfo = {
    hasTitle: !!document.title,
    hasTags: !!(document.metadata?.tags && document.metadata.tags.length > 0),
    hasContent: !!(document.content && document.content.length > 100),
    hasAISummary: !!((document.metadata as any)?.ai_summary || (document.metadata as any)?.summary),
    vectorized: (document.metadata as any)?.vectorized === true,
    embeddingStatus: (document.metadata as any)?.embedding_status
  };

  const processingScore = () => {
    let score = 0;
    if (embeddingInfo.isValid) score += 40;
    if (metadataInfo.hasAISummary) score += 30;
    if (metadataInfo.hasTags) score += 20;
    if (metadataInfo.hasContent) score += 10;
    return Math.min(score, 100);
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 text-xs">
      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
        <Database className="h-4 w-4" />
        Vectorization Debug Info
      </h4>
      
      {/* Processing Score */}
      <div className="flex items-center justify-between">
        <span>Processing Score:</span>
        <Badge variant={processingScore() >= 80 ? 'default' : processingScore() >= 50 ? 'secondary' : 'destructive'}>
          {processingScore()}%
        </Badge>
      </div>

      {/* Embedding Status */}
      <div className="space-y-2">
        <div className="font-medium text-gray-700 dark:text-gray-300">Embedding:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Exists:</span>
            <span className={embeddingInfo.exists ? 'text-green-600' : 'text-red-600'}>
              {embeddingInfo.exists ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Is Array:</span>
            <span className={embeddingInfo.isArray ? 'text-green-600' : 'text-red-600'}>
              {embeddingInfo.isArray ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Length:</span>
            <span className={embeddingInfo.length > 0 ? 'text-green-600' : 'text-red-600'}>
              {embeddingInfo.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Valid:</span>
            <span className={embeddingInfo.isValid ? 'text-green-600' : 'text-red-600'}>
              {embeddingInfo.isValid ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Status */}
      <div className="space-y-2">
        <div className="font-medium text-gray-700 dark:text-gray-300">Metadata:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Has Title:</span>
            <span className={metadataInfo.hasTitle ? 'text-green-600' : 'text-red-600'}>
              {metadataInfo.hasTitle ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Has Tags:</span>
            <span className={metadataInfo.hasTags ? 'text-green-600' : 'text-red-600'}>
              {metadataInfo.hasTags ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Has Content:</span>
            <span className={metadataInfo.hasContent ? 'text-green-600' : 'text-red-600'}>
              {metadataInfo.hasContent ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>AI Summary:</span>
            <span className={metadataInfo.hasAISummary ? 'text-green-600' : 'text-red-600'}>
              {metadataInfo.hasAISummary ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Vectorized Flag:</span>
            <span className={metadataInfo.vectorized ? 'text-green-600' : 'text-red-600'}>
              {metadataInfo.vectorized ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Embedding Status:</span>
            <span className={metadataInfo.embeddingStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
              {metadataInfo.embeddingStatus || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Raw Data Preview */}
      <details className="mt-2">
        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
          Raw Data Preview
        </summary>
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-32">
          <div><strong>Title:</strong> {document.title}</div>
          <div><strong>Type:</strong> {document.type}</div>
          <div><strong>Content Length:</strong> {document.content?.length || 0}</div>
          <div><strong>Embedding Type:</strong> {typeof document.embedding}</div>
          <div><strong>Metadata:</strong></div>
          <pre className="text-xs overflow-auto">{JSON.stringify(document.metadata, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
} 