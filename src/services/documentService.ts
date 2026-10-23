import { useKnowledgeBaseStore } from '../store/knowledgeBaseStore';

export interface Document {
  id: string;
  content?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export class DocumentService {
  async getDocument(id: string): Promise<Document | null> {
    const store = useKnowledgeBaseStore.getState();
    const doc = store.documents.find(d => d.id === id);
    
    if (!doc) {
      return null;
    }

    // Document content should already be loaded in the store
    return doc;
  }

  async getAllDocuments(): Promise<Document[]> {
    const store = useKnowledgeBaseStore.getState();
    return store.documents;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const store = useKnowledgeBaseStore.getState();
    await store.updateDocument(id, {
      ...updates,
      metadata: {
        ...store.documents.find(d => d.id === id)?.metadata,
        last_modified: new Date().toISOString()
      }
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const store = useKnowledgeBaseStore.getState();
    await store.deleteDocument(id);
  }

  async createDocument(doc: Partial<Document>): Promise<string> {
    const store = useKnowledgeBaseStore.getState();
    const id = crypto.randomUUID();
    await store.addDocument({
      title: (doc.metadata?.title as string) || 'Untitled Document',
      content: doc.content || '',
      embedding: doc.embedding,
      metadata: {
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
        ...doc.metadata
      }
    });
    return id;
  }
} 