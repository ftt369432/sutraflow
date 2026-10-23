import React, { useState } from 'react';
import { Plus, Save, Tag, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';

interface SavedPrompt {
  id: string;
  name: string;
  content: string;
  category: 'work' | 'learning' | 'productivity' | 'custom';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface PromptLibraryProps {
  prompts: SavedPrompt[];
  onSavePrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSelectPrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string) => void;
}

export function PromptLibrary({
  prompts,
  onSavePrompt,
  onSelectPrompt,
  onDeletePrompt
}: PromptLibraryProps) {
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<SavedPrompt['category']>('custom');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    if (!name || !content) return;

    onSavePrompt({
      name,
      content,
      category,
      tags
    });

    setName('');
    setContent('');
    setCategory('custom');
    setTags([]);
    setShowNewPrompt(false);
  };

  const handleAddTag = () => {
    if (!newTag) return;
    setTags(prev => [...new Set([...prev, newTag])]);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const categories: SavedPrompt['category'][] = ['work', 'learning', 'productivity', 'custom'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Prompt Library</h2>
        <Dialog open={showNewPrompt} onOpenChange={setShowNewPrompt}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Prompt Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter prompt name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter prompt content..."
                  className="w-full h-32 px-3 py-2 text-sm rounded-md border border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SavedPrompt['category'])}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background"
                  aria-label="Select prompt category"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-error"
                        aria-label={`Remove ${tag} tag`}
                        title={`Remove ${tag} tag`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPrompt(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Prompt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map(prompt => (
          <div
            key={prompt.id}
            className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onSelectPrompt(prompt)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{prompt.name}</h3>
              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-primary/10">
                {prompt.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {prompt.content}
            </p>
            <div className="flex flex-wrap gap-1">
              {prompt.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-primary/5 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 