import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface EditableDocumentTitleProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  className?: string;
}

export const EditableDocumentTitle: React.FC<EditableDocumentTitleProps> = ({
  title,
  onTitleChange,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== title) {
      onTitleChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={(e) => {
            // Only save on blur if not clicking save/cancel buttons
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!relatedTarget || (!relatedTarget.closest('[title="Save title"]') && !relatedTarget.closest('[title="Cancel editing"]'))) {
              handleSave();
            }
          }}
          className="h-8 text-sm font-semibold"
          placeholder="Document title..."
          autoFocus
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-8 w-8 p-0"
          title="Save title"
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
          title="Cancel editing"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartEdit}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit document title"
      >
        <Edit3 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default EditableDocumentTitle;
