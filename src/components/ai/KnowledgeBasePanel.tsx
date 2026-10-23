import React from 'react';
import { BookOpen, ExternalLink, FileText, Star, Pin } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { DocumentReference } from '../../types/ai';

interface KnowledgeBasePanelProps {
  relevantDocuments: any[];
  onDocumentClick?: (documentId: string) => void;
  onPin?: (document: any) => void;
}

export function KnowledgeBasePanel({ relevantDocuments, onDocumentClick, onPin }: KnowledgeBasePanelProps) {
  if (!relevantDocuments || relevantDocuments.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">Knowledge Base</h3>
        </div>
        <div className="text-sm text-gray-500 text-center py-8">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No knowledge base sources used in this conversation.</p>
          <p className="text-xs mt-1">Select an assistant with linked documents to see relevant sources.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">Knowledge Base Sources</h3>
        <Badge variant="secondary" className="text-xs">
          {relevantDocuments.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {relevantDocuments.map((doc, index) => {
          const document = doc.document;
          const similarity = doc.similarity;

          return (
            <Card
              key={document.id || index}
              draggable
              onDragStart={(e) => {
                const dragData = {
                  id: document.id,
                  name: document.metadata?.title || document.title || 'Untitled Document'
                };
                e.dataTransfer.setData('text/plain', `[AIDriveFile]:${dragData.id}:${dragData.name}`);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => {
                if (onDocumentClick) onDocumentClick(document.id);
                // Telepathy: Auto-pin on click
                if (onPin) onPin(document);
              }}
            >
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {document.metadata?.title || document.title || 'Untitled Document'}
                    </h4>
                    {similarity && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">
                          {Math.round(similarity * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {document.metadata?.category && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {document.metadata.category}
                    </Badge>
                  )}

                  <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                    {document.content?.substring(0, 150)}
                    {document.content?.length > 150 && '...'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {document.metadata?.source && (
                        <span>Source: {document.metadata.source}</span>
                      )}
                      {document.metadata?.author && (
                        <span>• {document.metadata.author}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onPin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPin(document);
                          }}
                          title="Pin to chat"
                        >
                          <Pin className="h-3 w-3 text-blue-500" />
                        </Button>
                      )}
                      {onDocumentClick && (
                        <Button
                          variant="assistant"
                          size="sm"
                          className="text-xs h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDocumentClick(document.id);
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Knowledge Base Active</span>
        </div>
        <p className="text-xs text-blue-700">
          Responses are enhanced with relevant information from your knowledge base documents.
          Similarity scores show how relevant each document is to your question.
        </p>
      </div>
    </div>
  );
} 