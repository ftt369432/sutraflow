import React, { useState, useRef, useEffect } from 'react';
import { Message, AIDocument } from '../../types/ai';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { chatWithDocuments } from '../../services/documentChatService';
import { Guardrails, SafetyLevel } from '../../cortex/Guardrails';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { MessageSquare, Send, Book } from 'lucide-react';

interface RelevantDocument {
  document: AIDocument;
  similarity: number;
}

interface DocumentChatProps {
  initialDocuments?: RelevantDocument[];
}

export function DocumentChat({ initialDocuments }: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { documents } = useKnowledgeBaseStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [relevantDocs, setRelevantDocs] = useState<RelevantDocument[]>(initialDocuments || []);

  // Debug info
  useEffect(() => {
    console.log(`[DocumentChat] Available documents: ${documents.length}`);
    documents.forEach((doc, index) => {
      console.log(`[DocumentChat] Document ${index + 1}:`, {
        id: doc.id,
        title: doc.title || doc.metadata?.title || 'Untitled',
        hasEmbedding: !!doc.embedding,
        embeddingLength: doc.embedding?.length || 0,
        contentLength: doc.content?.length || 0,
        contentPreview: doc.content?.substring(0, 100) + '...'
      });
    });
  }, [documents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 🛡️ SECURITY LAYER: Scan input for prompt injection and data leaks
    const securityDecision = Guardrails.scanInput(input, 'user_message');
    if (securityDecision.level === SafetyLevel.FORBIDDEN) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `⚠️ SECURITY BLOCK: ${securityDecision.reason}`,
        timestamp: new Date()
      }]);
      setInput('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { message, relevantDocuments } = await chatWithDocuments(
        input,
        documents,
        messages
      );

      setRelevantDocs(relevantDocuments);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'system'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100'
                }`}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your documents..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} variant="assistant-primary">
              {isLoading ? (
                <div className="animate-spin">⌛</div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {relevantDocs.length > 0 && (
        <div className="w-64 border-l p-4">
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <Book className="h-4 w-4" />
            Relevant Documents
          </h3>
          <div className="space-y-2">
            {relevantDocs.map((item) => {
              const document = item.document || item;
              const similarity = item.similarity || 0;
              if (!document || !document.id) return null;
              
              return (
                <Card key={document.id} className="p-2">
                  <p className="font-medium text-sm">{document.title || document.metadata?.title || 'Untitled'}</p>
                  <p className="text-xs text-gray-500">
                    Relevance: {Math.round(similarity * 100)}%
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 