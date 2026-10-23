import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Label } from '../ui/Label';
import { SearchIcon, BookOpen, Briefcase, ListChecks, PenTool, GraduationCap, BarChart, Scale } from 'lucide-react';
import { allNotebookTemplates, businessTemplates, projectTemplates, legalTemplates, createNotebookFromTemplate } from '../../data/notebookTemplates';
import { useNotebookStore } from '../../store/notebookStore';

interface NotebookTemplateGalleryProps {
  onTemplateSelect?: (templateId: string) => void;
  onClose?: () => void;
}

export const NotebookTemplateGallery: React.FC<NotebookTemplateGalleryProps> = ({ 
  onTemplateSelect, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const { createNotebook } = useNotebookStore();
  const [isCreating, setIsCreating] = useState(false);

  const filteredTemplates = allNotebookTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplate(templateId);
    setCustomizationDialogOpen(true);
    
    // Pre-fill customization fields with template defaults
    const template = allNotebookTemplates.find(t => t.id === templateId);
    if (template) {
      setCustomTitle(template.name);
      setCustomDescription(template.description);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;
    
    setIsCreating(true);
    
    try {
      // Get the template data
      const template = allNotebookTemplates.find(t => t.id === selectedTemplate);
      if (!template) throw new Error(`Template with id ${selectedTemplate} not found`);
      
      // Create notebook data from template
      const notebookData = createNotebookFromTemplate(selectedTemplate, {
        title: customTitle,
        description: customDescription
      });
      
      // Create the notebook with template data
      await createNotebook(
        notebookData.title, 
        notebookData.description, 
        {
          sections: notebookData.sections,
          tags: notebookData.tags,
          metadata: notebookData.metadata
        }
      );
      
      // Close dialogs
      setCustomizationDialogOpen(false);
      if (onClose) onClose();
      
      // Notify parent component if needed
      if (onTemplateSelect) onTemplateSelect(selectedTemplate);
    } catch (error) {
      console.error("Error creating notebook from template:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderTemplateIcon = (type: string) => {
    switch (type) {
      case 'business': return <Briefcase className="h-5 w-5 text-blue-500" />;
      case 'project': return <ListChecks className="h-5 w-5 text-green-500" />;
      case 'education': return <GraduationCap className="h-5 w-5 text-purple-500" />;
      case 'creative': return <PenTool className="h-5 w-5 text-orange-500" />;
      case 'research': return <BarChart className="h-5 w-5 text-red-500" />;
      case 'legal': return <Scale className="h-5 w-5 text-indigo-500" />;
      default: return <BookOpen className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderTemplateCard = (template: typeof allNotebookTemplates[0]) => (
    <Card 
      key={template.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleTemplateClick(template.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          {renderTemplateIcon(template.type)}
          <CardTitle className="text-lg">{template.name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Sections:</span> {template.sections.length}
          </div>
          {template.metadata.features.taskIntegration && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Tasks:</span> Enabled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Notebook Templates</h2>
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="project">Projects</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="business" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessTemplates.filter(template => 
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map(renderTemplateCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="project" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectTemplates.filter(template => 
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map(renderTemplateCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="legal" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legalTemplates.filter(template => 
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
              ).map(renderTemplateCard)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={customizationDialogOpen} onOpenChange={setCustomizationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create from Template</DialogTitle>
            <DialogDescription>
              Customize your notebook based on the selected template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notebook-title">Title</Label>
              <Input
                id="notebook-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Notebook title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notebook-description">Description</Label>
              <Input
                id="notebook-description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Notebook description"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomizationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              disabled={!customTitle.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Notebook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 