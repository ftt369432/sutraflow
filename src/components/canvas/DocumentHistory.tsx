import React from 'react';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export interface DocumentHistoryEntry {
  id: string;
  content: string;
  timestamp: Date;
  changeDescription?: string;
}

interface DocumentHistoryProps {
  history: DocumentHistoryEntry[];
  currentIndex: number;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  className?: string;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  history,
  currentIndex,
  onUndo,
  onRedo,
  onReset,
  className
}) => {
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last change"
        className="text-xs h-8 px-2"
      >
        <Undo2 className="h-3 w-3 mr-1" />
        Undo
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo last undone change"
        className="text-xs h-8 px-2"
      >
        <Redo2 className="h-3 w-3 mr-1" />
        Redo
      </Button>
      
      {history.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          title="Reset to original version"
          className="text-xs h-8 px-2 text-orange-600 hover:text-orange-700"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      )}
      
      {history.length > 1 && (
        <span className="text-xs text-muted-foreground px-2">
          {currentIndex + 1} / {history.length}
        </span>
      )}
    </div>
  );
};

export default DocumentHistory;
