import React from 'react';
import { FileText, ExternalLink, Edit3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useCanvasStore } from '../../stores/canvasStore';
import { cn } from '../../lib/utils';

interface ConversationCanvasLinksProps {
  conversationId: string;
  className?: string;
}

export function ConversationCanvasLinks({ conversationId, className }: ConversationCanvasLinksProps) {
  const { getDocumentsForConversation, documents } = useCanvasStore();
  
  const linkedDocumentIds = getDocumentsForConversation(conversationId);
  const linkedDocuments = linkedDocumentIds.map(id => documents[id]).filter(Boolean);
  
  if (linkedDocuments.length === 0) {
    return null;
  }

  const openDocument = (documentId: string) => {
    const url = `/canvas?document=${documentId}&conversation=${conversationId}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={cn('mt-4', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Canvas Documents</span>
          <Badge variant="secondary" className="text-xs">
            {linkedDocuments.length}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {linkedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.metadata.wordCount} words</span>
                    <span>•</span>
                    <span>{doc.lastModified.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDocument(doc.id)}
                className="h-8 w-8 p-0"
                title="Open in Canvas"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConversationCanvasLinks;