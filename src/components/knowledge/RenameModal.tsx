import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog';
import { useToast } from '../ui/useToast';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'folder' | 'document';
  currentName: string;
  onRename: (newName: string) => Promise<void>;
}

export function RenameModal({
  isOpen,
  onClose,
  itemType,
  currentName,
  onRename
}: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: `${itemType} name cannot be empty`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onRename(name);
      toast({
        title: "Renamed successfully",
        description: `${itemType} has been renamed to "${name}"`,
      });
      onClose();
    } catch (error) {
      console.error('Error renaming:', error);
      toast({
        title: "Error",
        description: `Failed to rename ${itemType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {itemType}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={`Enter ${itemType} name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
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
              disabled={isSubmitting || !name.trim() || name === currentName}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
