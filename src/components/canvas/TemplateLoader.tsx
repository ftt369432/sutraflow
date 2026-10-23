import React, { useState } from 'react';
import { FileUp, FileText, Scale, Building, FileCheck, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface TemplateLoaderProps {
  onTemplateLoad: (files: FileList) => void;
  children?: React.ReactNode;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
}

const templateCategories: TemplateCategory[] = [
  {
    id: 'letterhead',
    name: 'Letterheads',
    description: 'Professional business letterheads and headers',
    icon: <Building className="h-4 w-4" />,
    examples: ['Law firm letterheads', 'Business headers', 'Official correspondence']
  },
  {
    id: 'pleading',
    name: 'Pleading Papers',
    description: 'Legal pleading formats and court documents',
    icon: <Scale className="h-4 w-4" />,
    examples: ['Court pleadings', 'Motion templates', 'Case captions']
  },
  {
    id: 'contracts',
    name: 'Contract Templates',
    description: 'Standard contract formats and agreements',
    icon: <FileCheck className="h-4 w-4" />,
    examples: ['Service agreements', 'Employment contracts', 'NDAs']
  },
  {
    id: 'legal',
    name: 'Legal Documents',
    description: 'General legal document templates',
    icon: <FileText className="h-4 w-4" />,
    examples: ['Legal briefs', 'Memorandums', 'Legal opinions']
  }
];

export function TemplateLoader({ onTemplateLoad, children }: TemplateLoaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onTemplateLoad(files);
      setIsOpen(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      onTemplateLoad(files);
      setIsOpen(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-xs">
            <FileUp className="h-3 w-3 mr-1" />
            Load Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Load Document Templates
          </DialogTitle>
          <DialogDescription>
            Upload letterheads, pleading papers, contracts, and other document templates that the AI can use to create professional documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateCategories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {category.examples.map((example, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Upload Area */}
          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="p-8 text-center">
              <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-lg font-medium mb-2">
                {isDragOver ? 'Drop templates here' : 'Upload Template Files'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              
              <input
                type="file"
                id="template-dialog-input"
                className="hidden"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.txt,.md"
                aria-label="Upload template files"
                title="Upload template files"
              />
              
              <Button
                variant="outline"
                onClick={() => document.getElementById('template-dialog-input')?.click()}
                className="mb-3"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              
              <div className="text-xs text-muted-foreground">
                Supports: PDF, Word (.doc, .docx), Text (.txt, .md)
              </div>
            </div>
          </Card>

          {/* Usage Instructions */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium text-sm mb-2">How Templates Work</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Upload your letterheads, pleading papers, and document templates</li>
              <li>• The AI will analyze the structure and formatting</li>
              <li>• Templates become available for creating new documents</li>
              <li>• The AI adapts content to match your template styles</li>
              <li>• Templates are saved for future use in all documents</li>
            </ul>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateLoader;
