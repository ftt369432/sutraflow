import React, { useState } from 'react';
import { NotebookList } from '../components/notebooks/NotebookList';
import { NotebookDetail } from '../components/notebooks/NotebookDetail';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BookOpen, Plus, Search, Filter, LayoutTemplate } from 'lucide-react';
import { useNotebookStore } from '../store/notebookStore';
import { Dialog, DialogContent } from '../components/ui/Dialog';
import { NotebookTemplateGallery } from '../components/notebooks/NotebookTemplateGallery';

export const NotebooksPage: React.FC = () => {
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    favorites: false,
    recent: false,
  });
  const { createNotebook, notebooks } = useNotebookStore();
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false);

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
  };

  const handleBackToList = () => {
    setActiveNotebookId(null);
  };

  const handleCreateNotebook = async () => {
    try {
      // Create a new notebook
      await createNotebook('New Notebook', 'Add description here');
      
      // Find the newly created notebook (it should be the last one in the list)
      const newNotebooks = [...notebooks].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      if (newNotebooks.length > 0) {
        // Set the newly created notebook as active
        setActiveNotebookId(newNotebooks[0].id);
      }
    } catch (error) {
      console.error('Failed to create notebook:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    console.log(`Selected template: ${templateId}`);
    // The NotebookTemplateGallery component handles notebook creation
    
    // After creation, we can find the newly created notebook and set it as active
    const newNotebooks = [...notebooks].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    if (newNotebooks.length > 0) {
      setActiveNotebookId(newNotebooks[0].id);
    }
    
    setTemplatesDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      {!activeNotebookId ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="text-primary" size={28} />
                Notebooks
              </h1>
              <p className="text-gray-500 mt-2">
                Organize your thoughts, research, and ideas with AI-powered assistance
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setTemplatesDialogOpen(true)}>
                <LayoutTemplate size={18} />
                <span>From Template</span>
              </Button>
              <Button className="gap-2" onClick={handleCreateNotebook}>
                <Plus size={18} />
                <span>New Notebook</span>
              </Button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter size={16} />
              <span>Filters</span>
            </Button>
          </div>

          <NotebookList onSelectNotebook={handleSelectNotebook} />
          
          <Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <NotebookTemplateGallery 
                onTemplateSelect={handleTemplateSelect}
                onClose={() => setTemplatesDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <NotebookDetail notebookId={activeNotebookId} onBack={handleBackToList} />
      )}
    </div>
  );
}; 