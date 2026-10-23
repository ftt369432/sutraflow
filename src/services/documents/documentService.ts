import type { Document } from '../../types';

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: 1024 * 1024,
    createdAt: new Date(),
    updatedAt: new Date(),
    content: 'This is a mock PDF document for a project proposal.',
    metadata: {
      author: 'Mock User'
    }
  },
  {
    id: '2',
    name: 'Meeting Notes.docx',
    type: 'document',
    size: 512 * 1024,
    createdAt: new Date(),
    updatedAt: new Date(),
    content: 'Mock content for meeting notes in a docx file.',
    metadata: {
      author: 'Mock User'
    }
  }
];

/**
 * Document Service
 * Provides methods to access and manipulate documents
 */
export class DocumentService {
  /**
   * Get all documents
   */
  async getDocuments(): Promise<Document[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockDocuments), 500);
    });
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const document = mockDocuments.find(doc => doc.id === id);
    return Promise.resolve(document || null);
  }

  /**
   * Search documents by query
   */
  async searchDocuments(query: string): Promise<Document[]> {
    if (!query) return this.getDocuments();
    
    const normalizedQuery = query.toLowerCase();
    const filteredDocs = mockDocuments.filter(doc => 
      doc.name.toLowerCase().includes(normalizedQuery) || 
      doc.content.toLowerCase().includes(normalizedQuery)
    );
    
    return Promise.resolve(filteredDocs);
  }
}

// For backward compatibility
export async function fetchDocuments(): Promise<Document[]> {
  const service = new DocumentService();
  return service.getDocuments();
}