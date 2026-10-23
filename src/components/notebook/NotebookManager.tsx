import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { useWorkflowStore } from '../../store/workflowStore';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { ScrollArea } from '../ui/ScrollArea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  Book, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash, 
  Copy, 
  Share2, 
  FileText, 
  FolderPlus, 
  Link,
  BookOpen,
  Workflow
} from 'lucide-react';
import { format } from 'date-fns';

export function NotebookManager() {
  const { 
    notebooks, 
    notes, 
    createNotebook, 
    updateNotebook, 
    deleteNotebook,
    setActiveNotebook,
    getNotesByNotebook
  } = useNotebookStore();
  
  const { workflows } = useWorkflowStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookDescription, setNewNotebookDescription] = useState('');
  const [newNotebookProject, setNewNotebookProject] = useState<string>('none');
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredNotebooks = notebooks.filter(notebook => 
    notebook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notebook.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) {
      alert('Please enter a notebook name');
      return;
    }
    
    createNotebook({
      name: newNotebookName,
      description: newNotebookDescription,
      projectId: (newNotebookProject && newNotebookProject !== 'none') ? newNotebookProject : undefined
    });
    
    setNewNotebookName('');
    setNewNotebookDescription('');
    setNewNotebookProject('none');
    setIsCreateDialogOpen(false);
  };
  
  const handleEditNotebook = () => {
    if (!selectedNotebook || !newNotebookName.trim()) return;
    
    updateNotebook(selectedNotebook, {
      name: newNotebookName,
      description: newNotebookDescription,
      projectId: (newNotebookProject && newNotebookProject !== 'none') ? newNotebookProject : undefined
    });
    
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteNotebook = (id: string) => {
    if (confirm('Are you sure you want to delete this notebook? All notes inside will be permanently deleted.')) {
      deleteNotebook(id);
    }
  };
  
  const openEditDialog = (notebook: any) => {
    setSelectedNotebook(notebook.id);
    setNewNotebookName(notebook.name);
    setNewNotebookDescription(notebook.description);
    setNewNotebookProject(notebook.projectId || 'none');
    setIsEditDialogOpen(true);
  };
  
  const handleNotebookClick = (notebookId: string) => {
    setActiveNotebook(notebookId);
  };
  
  const getNotebookStats = (notebookId: string) => {
    const notebookNotes = getNotesByNotebook(notebookId);
    const noteCount = notebookNotes.length;
    const lastUpdated = noteCount > 0 
      ? notebookNotes.reduce((latest, note) => 
          new Date(note.updated) > new Date(latest.updated) ? note : latest
        ).updated
      : null;
    
    return { noteCount, lastUpdated };
  };
  
  const getRelatedWorkflows = (notebookId: string) => {
    // In a real app, you would have a proper relation between notebooks and workflows
    // For demo purposes, we'll just return a subset of workflows
    return workflows.filter((_, index) => index % 3 === 0).slice(0, 2);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notebooks</h2>
          <p className="text-muted-foreground">
            Organize your notes and documentation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search notebooks..."
              className="w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </div>
      </div>
      
      {filteredNotebooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Book className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No notebooks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try a different search term' : 'Get started by creating your first notebook'}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Notebook
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotebooks.map(notebook => {
            const { noteCount, lastUpdated } = getNotebookStats(notebook.id);
            const relatedWorkflows = getRelatedWorkflows(notebook.id);
            
            return (
              <Card key={notebook.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      {notebook.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(notebook)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Notebook
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteNotebook(notebook.id)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Notebook
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Notebook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>{notebook.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <div className="text-sm">
                        {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                        {lastUpdated && (
                          <span className="text-muted-foreground ml-2">
                            · Last updated {format(new Date(lastUpdated), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {relatedWorkflows.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Related Workflows</p>
                        <div className="space-y-1">
                          {relatedWorkflows.map(workflow => (
                            <div key={workflow.id} className="flex items-center text-sm">
                              <Workflow className="h-3 w-3 mr-1 text-primary" />
                              {workflow.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {notebook.projectId && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Project</p>
                        <div className="flex items-center text-sm">
                          <Link className="h-3 w-3 mr-1" />
                          {notebook.projectId}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleNotebookClick(notebook.id)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Open Notebook
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Create Notebook Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
            <DialogDescription>
              Create a new notebook to organize your notes and documentation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notebook-name">Name</Label>
              <Input
                id="notebook-name"
                placeholder="Notebook name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notebook-description">Description</Label>
              <Textarea
                id="notebook-description"
                placeholder="Describe the purpose of this notebook"
                rows={3}
                value={newNotebookDescription}
                onChange={(e) => setNewNotebookDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notebook-project">Project (Optional)</Label>
              <Select
                value={newNotebookProject}
                onValueChange={setNewNotebookProject}
              >
                <SelectTrigger id="notebook-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="project-1">Marketing Website</SelectItem>
                  <SelectItem value="project-2">Mobile App Development</SelectItem>
                  <SelectItem value="project-3">Customer Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotebook}>
              Create Notebook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Notebook Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notebook</DialogTitle>
            <DialogDescription>
              Update the details of your notebook
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-notebook-name">Name</Label>
              <Input
                id="edit-notebook-name"
                placeholder="Notebook name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notebook-description">Description</Label>
              <Textarea
                id="edit-notebook-description"
                placeholder="Describe the purpose of this notebook"
                rows={3}
                value={newNotebookDescription}
                onChange={(e) => setNewNotebookDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notebook-project">Project (Optional)</Label>
              <Select
                value={newNotebookProject}
                onValueChange={setNewNotebookProject}
              >
                <SelectTrigger id="edit-notebook-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="project-1">Marketing Website</SelectItem>
                  <SelectItem value="project-2">Mobile App Development</SelectItem>
                  <SelectItem value="project-3">Customer Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditNotebook}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 