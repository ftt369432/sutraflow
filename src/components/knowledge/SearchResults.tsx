import React from 'react';
import { SearchResult, AIDocument } from '../../types/ai';
import { DocumentCard, adaptAIDocumentToUnified } from '../common/DocumentCard';

interface SearchResultsProps {
  results: SearchResult[];
  onDocumentClick?: (document: AIDocument) => void;
}

export function SearchResults({ results, onDocumentClick }: SearchResultsProps) {
  // Convert SearchResult to AIDocument format for compatibility
  const convertToDocument = (result: SearchResult): AIDocument => ({
    id: result.id,
    content: result.content,
    title: result.title,
    metadata: {
      source: result.url || 'search',
      title: result.title,
      ...result.metadata
    }
  });

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const document = convertToDocument(result);
        return (
          <div 
            key={result.id} 
            className="relative cursor-pointer" 
            onClick={() => onDocumentClick?.(document)}
          >
            <div className="absolute -left-4 top-4 text-xs text-gray-500">
              {Math.round(result.score * 100)}%
            </div>
            <DocumentCard document={document} />
          </div>
        );
      })}
    </div>
  );
}