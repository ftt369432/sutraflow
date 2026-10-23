import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { useToast } from '../ui/useToast';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string | null;
}

export function CreateNoteModal({ isOpen, onClose, currentFolderId }: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createNote } = useKnowledgeBaseStore((state) => ({
    createNote: state.createNote
  }));
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your note.",
        type: "error",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createNote({
        title,
        content,
        folderId: currentFolderId || undefined,
      });
      
      toast({
        title: "Success!",
        description: "Your note has been created.",
      });
      
      // Reset form and close modal
      setTitle('');
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "There was a problem creating your note. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {
      if (isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            <span>Create Quick Note</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full min-h-[200px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
