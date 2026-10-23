import React from 'react';
import { Sidebar } from 'lucide-react';
import { Button } from '../ui/Button';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';

interface AssistantKnowledgePanelProps {
  showRightPanel: boolean;
  setShowRightPanel: (val: boolean) => void;
  setPanelOrder: (fn: (prev: string[]) => string[]) => void;
  relevantDocuments: any[];
  setPinnedDriveFiles: React.Dispatch<React.SetStateAction<any[]>>;
}

export const AssistantKnowledgePanel: React.FC<AssistantKnowledgePanelProps> = ({
  showRightPanel,
  setShowRightPanel,
  setPanelOrder,
  relevantDocuments,
  setPinnedDriveFiles
}) => {
  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col border-l bg-muted/10">
      <div className="p-2 border-b bg-muted/20 flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider px-2">Knowledge Base</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
          setShowRightPanel(false);
          setPanelOrder(prev => prev.filter(p => p !== 'knowledge'));
        }}>
          <Sidebar className="h-3 w-3" />
        </Button>
      </div>
      <KnowledgeBasePanel
        relevantDocuments={relevantDocuments || []}
        onPin={(doc) => {
          setPinnedDriveFiles((prev: any[]) => {
            if (prev.find(f => f.id === doc.id)) return prev;
            return [...prev, { id: doc.id, name: doc.metadata?.title || doc.title || 'Untitled Document' }];
          });
        }}
      />
    </div>
  );
};
