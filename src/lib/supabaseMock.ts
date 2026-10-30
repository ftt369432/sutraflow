/**
 * Mock Supabase Client
 * 
 * This provides a minimal mock implementation of the Supabase client
 * for development without requiring a real Supabase instance.
 */

// Sample data for documents
const mockDocuments = [
  {
    id: '1',
    name: 'Project Proposal',
    type: 'document',
    content: 'This is a project proposal for the new initiative...',
    tags: ['proposal', 'project'],
    created_at: '2023-10-15T10:30:00Z',
    updated_at: '2023-10-18T14:20:00Z',
    size: 2048,
    metadata: {
      author: 'John Doe',
      version: '1.2'
    }
  },
  {
    id: '2',
    name: 'Meeting Notes',
    type: 'notes',
    content: 'Meeting with the client team on October 10th...',
    tags: ['meeting', 'notes', 'client'],
    created_at: '2023-10-10T15:00:00Z',
    updated_at: '2023-10-10T16:45:00Z',
    size: 1024,
    metadata: {
      author: 'Jane Smith',
      version: '1.0'
    }
  },
  {
    id: '3',
    name: 'Research Paper',
    type: 'document',
    content: 'Abstract: This research explores the impact of AI on productivity...',
    tags: ['research', 'ai'],
    created_at: '2023-09-25T09:15:00Z',
    updated_at: '2023-10-05T11:30:00Z',
    size: 4096,
    metadata: {
      author: 'Alex Johnson',
      version: '2.1'
    }
  }
];

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Mock implementation of Supabase client
class MockSupabaseClient {
  private data = {
    documents: [...mockDocuments]
  };

  // Generic from method for table selection
  from(table: string) {
    if (table === 'documents') {
      return new MockQueryBuilder(this.data.documents);
    }
    if (table === 'auth') {
      return new MockQueryBuilder([]);
    }
    throw new Error(`Table ${table} not implemented in mock`);
  }

  // Auth methods (simplified mock)
  auth = {
    getSession: async () => ({ 
      data: { 
        session: { 
          user: { id: 'mock-user-id', email: 'user@example.com' },
          access_token: 'mock-token',
          expires_at: Date.now() + 3600000
        } 
      }, 
      error: null 
    }),
    signUp: async () => ({ 
      data: { user: { id: generateId(), email: 'user@example.com' } }, 
      error: null 
    }),
    signIn: async () => ({ 
      data: { user: { id: generateId(), email: 'user@example.com' } }, 
      error: null 
    }),
    signOut: async () => ({ error: null })
  };
}

// Mock query builder to chain methods
class MockQueryBuilder {
  private items: any[];
  private filters: Array<(item: any) => boolean> = [];
  private sortField: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private limitCount: number | null = null;
  private singleResult: boolean = false;
  private headOnly: boolean = false;
  private countExact: boolean = false;

  constructor(items: any[]) {
    this.items = [...items];
  }

  // Select specific columns (simplified - returns all fields)
  select(columns: string | { count: string, head?: boolean } = '*') {
    if (typeof columns === 'object' && columns.count) {
      this.countExact = true;
      if (columns.head) {
        this.headOnly = true;
      }
    }
    return this;
  }

  // Filter by equality
  eq(field: string, value: any) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  // Full text search (simplified)
  textSearch(field: string, query: string) {
    this.filters.push((item) => 
      item[field] && item[field].toLowerCase().includes(query.toLowerCase())
    );
    return this;
  }

  // Sort results
  order(field: string, { ascending = true } = {}) {
    this.sortField = field;
    this.sortDirection = ascending ? 'asc' : 'desc';
    return this;
  }

  // Limit results
  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  // Insert new records
  async insert(data: any | any[]) {
    const newItems = Array.isArray(data) ? data : [data];
    const insertedItems = newItems.map(item => ({
      ...item,
      id: item.id || generateId(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }));
    
    this.items.push(...insertedItems);
    return { data: insertedItems, error: null };
  }

  // Update records
  async update(data: any) {
    const updatedItems: any[] = [];
    
    this.items = this.items.map(item => {
      const shouldUpdate = this.filters.every(filter => filter(item));
      if (shouldUpdate) {
        const updatedItem = {
          ...item,
          ...data,
          updated_at: new Date().toISOString()
        };
        updatedItems.push(updatedItem);
        return updatedItem;
      }
      return item;
    });
    
    return { data: updatedItems, error: null };
  }

  // Delete records
  async delete() {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => !this.filters.every(filter => filter(item)));
    const deleted = initialLength - this.items.length;
    
    return { data: null, count: deleted, error: null };
  }

  // Mark that we want a single result
  single() {
    this.singleResult = true;
    return this;
  }

  // Execute the query
  async then(resolve: (result: { data: any; error: any; count?: number }) => void) {
    try {
      // Check if the table exists
      if (this.items === undefined) {
        resolve({ 
          data: null, 
          error: { 
            code: '42P01', 
            message: 'relation "table" does not exist' 
          } 
        });
        return;
      }

      // Apply all filters
      let result = this.items.filter(item => 
        this.filters.length === 0 || this.filters.every(filter => filter(item))
      );
      
      // Apply sorting if specified
      if (this.sortField) {
        result.sort((a, b) => {
          if (a[this.sortField!] < b[this.sortField!]) 
            return this.sortDirection === 'asc' ? -1 : 1;
          if (a[this.sortField!] > b[this.sortField!]) 
            return this.sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
      
      // Apply limit if specified
      if (this.limitCount !== null) {
        result = result.slice(0, this.limitCount);
      }

      // If this is a count query
      if (this.countExact) {
        if (this.headOnly) {
          resolve({ data: null, count: result.length, error: null });
          return;
        }
        resolve({ data: result, count: result.length, error: null });
        return;
      }
      
      // Return single result if requested
      if (this.singleResult) {
        resolve({ 
          data: result.length > 0 ? result[0] : null, 
          error: null 
        });
      } else {
        resolve({ data: result, error: null });
      }
    } catch (error) {
      resolve({ data: null, error: error as Error });
    }
  }
}

// Export test function for connection
export const testSupabaseConnection = async () => {
  return Promise.resolve(true);
};

// Create and export the supabase client instance
export const supabaseMock = new MockSupabaseClient(); 