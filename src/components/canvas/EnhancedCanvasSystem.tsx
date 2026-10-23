import React from 'react';
import { UnifiedCanvasSystem } from './UnifiedCanvasSystem';
import { CanvasQuickActions } from './CanvasQuickActions';
import { useCanvasAIDrive, CanvasDocument } from '../../hooks/canvas/useCanvasAIDrive';

interface CanvasSystemWithQuickActionsProps {
  initialCanvases?: any[];
  onCanvasChange?: (canvases: any[]) => void;
  selectedAssistant?: any;
  assistants?: any[];
  neuralSettings?: any;
  enableAIDriveSync?: boolean;
  showQuickActions?: boolean;
}

export function CanvasSystemWithQuickActions({
  showQuickActions = true,
  ...canvasProps
}: CanvasSystemWithQuickActionsProps) {
  const [showDocumentBrowser, setShowDocumentBrowser] = React.useState(false);
  const unifiedCanvasRef = React.useRef<any>(null);

  // Handle quick action events
  const handleCreateNew = () => {
    // Trigger create new document via the UnifiedCanvasSystem
    if (unifiedCanvasRef.current?.createNewCanvas) {
      unifiedCanvasRef.current.createNewCanvas();
    }
  };

  const handleBrowseDocuments = () => {
    setShowDocumentBrowser(true);
  };

  const handleDocumentSelect = (document: CanvasDocument) => {
    // Load document via the UnifiedCanvasSystem
    if (unifiedCanvasRef.current?.loadCanvasDocument) {
      unifiedCanvasRef.current.loadCanvasDocument(document);
    }
  };

  return (
    <div className="relative h-full">
      <UnifiedCanvasSystem
        ref={unifiedCanvasRef}
        {...canvasProps}
      />
      
      {showQuickActions && (
        <CanvasQuickActions
          onCreateNew={handleCreateNew}
          onBrowseDocuments={handleBrowseDocuments}
          onDocumentSelect={handleDocumentSelect}
          className="canvas-quick-actions"
        />
      )}
    </div>
  );
}