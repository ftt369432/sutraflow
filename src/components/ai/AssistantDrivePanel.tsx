import React from 'react';
import { Folder, Sidebar } from 'lucide-react';
import { Button } from '../ui/Button';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';

interface AssistantDrivePanelProps {
  handleDetachPanel: (id: string) => void;
  handleFiles: (files: FileList) => void;
}

export const AssistantDrivePanel: React.FC<AssistantDrivePanelProps> = ({
  handleDetachPanel,
  handleFiles
}) => {
  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col border-l bg-muted/10 relative"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-blue-500/5');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('bg-blue-500/5');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-500/5');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          console.log('📁 OS Files dropped into AI Drive:', e.dataTransfer.files.length);
          handleFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent">
        <h3 className="font-bold flex items-center gap-2 text-blue-700">
          <Folder className="h-4 w-4" />
          GenieDrive Repository
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600" onClick={() => handleDetachPanel('ai-drive')}>
          <Sidebar className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <GenieDriveTree onSelect={(file) => console.log('📂 Drive selection from panel:', file.name)} />
      </div>
    </div>
  );
};
