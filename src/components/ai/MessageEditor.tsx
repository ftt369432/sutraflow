import React, { useState, useEffect } from 'react';
import { Message } from '../../types/ai';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Save, X } from 'lucide-react';

interface MessageEditorProps {
  message: Message;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function MessageEditor({ message, onSave, onCancel }: MessageEditorProps) {
  const [content, setContent] = useState(message.content);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    setContent(message.content);
  }, [message]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsEdited(e.target.value !== message.content);
  };

  const handleSave = () => {
    if (content.trim() && isEdited) {
      onSave(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-4 p-4 bg-background rounded-lg border">
      <Textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Edit your message..."
        className="min-h-[100px] resize-none"
        autoFocus
      />
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!content.trim() || !isEdited}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">⌘</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to cancel
      </div>
    </div>
  );
} 