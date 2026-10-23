import { PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';

export function ResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-2 transition-colors hover:bg-blue-500/20 active:bg-blue-500/30">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-0.5 h-8 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500/50 group-active:bg-blue-500/70 transition-colors" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-blue-500" />
      </div>
    </PanelResizeHandle>
  );
} 