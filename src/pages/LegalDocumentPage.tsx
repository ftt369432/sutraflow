import React, { useEffect, useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { LegalDocumentService, LegalDocument } from '../services/legalDoc/legalDocumentService';
import { LegalCaseService, CaseLawSearchResult } from '../services/legalDoc/caseService';
import { StyleAnalysisService } from '../services/legalDoc/styleAnalysisService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/Dialog';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { FileText, Search, Plus, Trash2, Edit, Eye, BookOpen, Clock, Tag } from 'lucide-react';

export function LegalDocumentPage() {
  const supabase = useSupabase();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [searchResults, setSearchResults] = useState<CaseLawSearchResult[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newDocumentOpen, setNewDocumentOpen] = useState<boolean>(false);
  
  // Services
  const documentService = new LegalDocumentService();
  const caseService = new LegalCaseService();
  const styleService = new StyleAnalysisService();
  
  // Form states
  const [newDocument, setNewDocument] = useState<Partial<LegalDocument>>({
    title: '',
    content: '',
    document_type: 'brief',
    status: 'draft',
    tags: []
  });
  
  useEffect(() => {
    // Get the current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadDocuments(user.id);
      }
      setIsLoading(false);
    };
    
    getCurrentUser();
  }, [supabase]);
  
  const loadDocuments = async (userId: string) => {
    try {
      setIsLoading(true);
      const docs = await documentService.listDocuments(userId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Search for cases
      const results = await caseService.searchCaseLaw({
        query: searchQuery,
        limit: 5
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching for cases:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateDocument = async () => {
    if (!user || !newDocument.title || !newDocument.content) return;
    
    try {
      setIsLoading(true);
      const createdDoc = await documentService.createDocument(newDocument as LegalDocument, user.id);
      setDocuments([createdDoc, ...documents]);
      setNewDocumentOpen(false);
      setNewDocument({
        title: '',
        content: '',
        document_type: 'brief',
        status: 'draft',
        tags: []
      });
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
      if (selectedDocument?.id === id) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };
  
  const handleOpenDocument = (document: LegalDocument) => {
    setSelectedDocument(document);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Published</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Legal Documents</h1>
        <div className="flex space-x-4">
          <Dialog open={newDocumentOpen} onOpenChange={setNewDocumentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input
                    id="title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select 
                    value={newDocument.document_type} 
                    onValueChange={(value) => setNewDocument({...newDocument, document_type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">Brief</SelectItem>
                      <SelectItem value="memo">Memo</SelectItem>
                      <SelectItem value="petition">Petition</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tags" className="text-right">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="Enter tags separated by commas"
                    onChange={(e) => setNewDocument({
                      ...newDocument, 
                      tags: e.target.value.split(',').map(tag => tag.trim())
                    })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right">Content</Label>
                  <Textarea
                    id="content"
                    value={newDocument.content}
                    onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                    className="col-span-3 min-h-[200px]"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setNewDocumentOpen(false)} className="mr-2">
                  Cancel
                </Button>
                <Button onClick={handleCreateDocument} disabled={!newDocument.title || !newDocument.content}>
                  Create Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="search">Case Law Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium">No documents yet</h3>
              <p className="text-gray-500 mt-2">Create your first document to get started</p>
              <Button onClick={() => setNewDocumentOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="cursor-pointer" onClick={() => handleOpenDocument(doc)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-gray-500" />
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell>{doc.document_type}</TableCell>
                      <TableCell>{getStatusBadge(doc.status || 'draft')}</TableCell>
                      <TableCell>
                        {doc.created_at && new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags && doc.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" 
                            onClick={() => handleOpenDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" 
                            onClick={() => doc.id && handleDeleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {selectedDocument && (
            <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
              <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <DialogTitle>{selectedDocument.title}</DialogTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{selectedDocument.document_type}</Badge>
                      {getStatusBadge(selectedDocument.status || 'draft')}
                    </div>
                  </div>
                </DialogHeader>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="mr-1 h-4 w-4" />
                    {selectedDocument.created_at && 
                     `Created: ${new Date(selectedDocument.created_at).toLocaleDateString()}`}
                    {selectedDocument.updated_at && selectedDocument.created_at !== selectedDocument.updated_at && 
                     ` (Updated: ${new Date(selectedDocument.updated_at).toLocaleDateString()})`}
                    
                    <div className="ml-4 flex items-center">
                      <Tag className="mr-1 h-4 w-4" />
                      {selectedDocument.tags && selectedDocument.tags.join(', ')}
                    </div>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none border p-4 rounded-md bg-card">
                    {selectedDocument.content.split('\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for case law..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </Card>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card key={result.id} className="p-4">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-bold">{result.name}</h3>
                    <Badge variant="outline">{result.court}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {result.citation} ({result.date})
                  </div>
                  <p className="mt-2">{result.summary}</p>
                  <div className="mt-4 flex justify-between">
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <BookOpen className="mr-1 h-4 w-4" />
                      Read Full Case
                    </a>
                    <Button size="sm" variant="outline">
                      Cite in Document
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : searchQuery && !isLoading ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-gray-500 mt-2">Try different search terms</p>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
} 