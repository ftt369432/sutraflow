import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Palette
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export interface GmailLabel {
  id: string;
  name: string;
  color?: string;
  type: 'user' | 'system';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

interface GoogleTagsManagerProps {
  labels: GmailLabel[];
  selectedLabels: string[];
  onAddLabel: (name: string, color?: string) => Promise<void>;
  onRemoveLabel: (labelId: string) => Promise<void>;
  onUpdateLabel: (labelId: string, updates: Partial<GmailLabel>) => Promise<void>;
  onApplyLabels: (emailIds: string[], labelIds: string[]) => Promise<void>;
  onRemoveLabels: (emailIds: string[], labelIds: string[]) => Promise<void>;
  onFilterByLabel: (labelId: string) => void;
  selectedEmails?: string[];
  className?: string;
}

const GMAIL_COLORS = [
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', 
  '#0099ff', '#9900ff', '#ff00ff', '#ff0099', '#999999'
];

export function GoogleTagsManager({
  labels,
  selectedLabels,
  onAddLabel,
  onRemoveLabel,
  onUpdateLabel,
  onApplyLabels,
  onRemoveLabels,
  onFilterByLabel,
  selectedEmails = [],
  className
}: GoogleTagsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(GMAIL_COLORS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userLabels = labels.filter(label => label.type === 'user');
  const systemLabels = labels.filter(label => label.type === 'system');
  
  const filteredUserLabels = userLabels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error('Label name is required');
      return;
    }

    setIsLoading(true);
    try {
      await onAddLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName('');
      setNewLabelColor(GMAIL_COLORS[0]);
      setIsCreateDialogOpen(false);
      toast.success('Label created successfully');
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await onRemoveLabel(labelId);
      toast.success('Label deleted successfully');
    } catch (error) {
      console.error('Error deleting label:', error);
      toast.error('Failed to delete label');
    }
  };

  const handleApplyLabelToSelected = async (labelId: string) => {
    if (selectedEmails.length === 0) {
      toast.error('No emails selected');
      return;
    }

    try {
      await onApplyLabels(selectedEmails, [labelId]);
      toast.success('Label applied to selected emails');
    } catch (error) {
      console.error('Error applying label:', error);
      toast.error('Failed to apply label');
    }
  };

  const handleRemoveLabelFromSelected = async (labelId: string) => {
    if (selectedEmails.length === 0) {
      toast.error('No emails selected');
      return;
    }

    try {
      await onRemoveLabels(selectedEmails, [labelId]);
      toast.success('Label removed from selected emails');
    } catch (error) {
      console.error('Error removing label:', error);
      toast.error('Failed to remove label');
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Gmail Labels
        </h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Label
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Label</DialogTitle>
              <DialogDescription>
                Create a new Gmail label to organize your emails.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Label Name
                </label>
                <Input
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Enter label name"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {GMAIL_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        newLabelColor === color 
                          ? 'border-gray-800 dark:border-gray-200 scale-110' 
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateLabel} disabled={isLoading}>
                Create Label
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search labels..."
          className="pl-10"
        />
      </div>

      {/* Active Filters */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {selectedLabels.map((labelId) => {
            const label = labels.find(l => l.id === labelId);
            if (!label) return null;
            
            return (
              <Badge
                key={labelId}
                variant="secondary"
                className="gap-1 cursor-pointer"
                style={{ backgroundColor: label.color }}
                onClick={() => onFilterByLabel('')} // Clear filter
              >
                {label.name}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* User Labels */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Your Labels
        </h4>
        
        {filteredUserLabels.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No labels found
          </p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filteredUserLabels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
              >
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => onFilterByLabel(label.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color || '#999999' }}
                  />
                  <span className="text-sm truncate">{label.name}</span>
                  {label.messagesUnread > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {label.messagesUnread}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {selectedEmails.length > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApplyLabelToSelected(label.id)}
                        className="h-8 w-8 p-0"
                        title="Apply to selected"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveLabelFromSelected(label.id)}
                        className="h-8 w-8 p-0"
                        title="Remove from selected"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-3 w-3" />
                        Edit label
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-red-600"
                        onClick={() => handleDeleteLabel(label.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete label
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Labels */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          System Labels
        </h4>
        
        <div className="space-y-1">
          {systemLabels.slice(0, 5).map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => onFilterByLabel(label.id)}
            >
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-gray-400" />
                <span className="text-sm">{label.name}</span>
                {label.messagesUnread > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {label.messagesUnread}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
