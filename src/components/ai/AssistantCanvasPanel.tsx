import React from 'react';
import UnifiedCanvasSystem from '../canvas/UnifiedCanvasSystem';

interface AssistantCanvasPanelProps {
  canvasProps: any;
  handleDetachPanel: (id: string) => void;
}

export const AssistantCanvasPanel: React.FC<AssistantCanvasPanelProps> = ({
  canvasProps,
  handleDetachPanel
}) => {
  return (
    <div
      className="flex-1 bg-white border-l flex flex-col min-w-0 h-full overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('ring-4', 'ring-blue-400', 'ring-inset');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('ring-4', 'ring-blue-400', 'ring-inset');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-4', 'ring-blue-400', 'ring-inset');
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
          console.log('📂 Dropped item into Canvas:', data);
        }
      }}
    >
      <UnifiedCanvasSystem
        {...canvasProps}
        onDetach={() => handleDetachPanel('canvas')}
      />
    </div>
  );
};
