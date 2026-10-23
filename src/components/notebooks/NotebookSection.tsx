import React from 'react';
import { NotebookSection as NotebookSectionType, NotebookBlock } from '../../types/notebook';
import { NotebookBlock as NotebookBlockComponent } from './NotebookBlock';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface NotebookSectionProps {
  section: NotebookSectionType;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<NotebookSectionType>) => void;
  onAddBlock?: (block: Omit<NotebookBlock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<NotebookBlock>) => void;
}

export const NotebookSection: React.FC<NotebookSectionProps> = ({
  section,
  onDelete,
  onUpdate,
  onAddBlock,
  onDeleteBlock,
  onUpdateBlock,
}) => {
  const [newBlockContent, setNewBlockContent] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(section.title);

  const handleAddBlock = () => {
    if (!newBlockContent.trim()) return;
    onAddBlock?.({
      type: 'text',
      content: newBlockContent,
      metadata: {},
    });
    setNewBlockContent('');
  };

  const handleTitleUpdate = () => {
    if (editedTitle.trim() && editedTitle !== section.title) {
      onUpdate?.({ title: editedTitle });
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleUpdate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleUpdate();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <h3
            className="text-lg font-semibold cursor-pointer hover:text-primary"
            onClick={() => setIsEditing(true)}
          >
            {section.title}
          </h3>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit Title
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            Delete Section
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {section.blocks.map((block) => (
          <NotebookBlockComponent
            key={block.id}
            block={block}
            onDelete={() => onDeleteBlock?.(block.id)}
            onUpdate={(updates) => onUpdateBlock?.(block.id, updates)}
          />
        ))}

        <div className="flex gap-4">
          <Input
            placeholder="Add a new block..."
            value={newBlockContent}
            onChange={(e) => setNewBlockContent(e.target.value)}
          />
          <Button onClick={handleAddBlock}>
            Add Block
          </Button>
        </div>
      </div>
    </div>
  );
}; 