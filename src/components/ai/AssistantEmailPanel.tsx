import React from 'react';
import { Mail, Sidebar, Bot } from 'lucide-react';
import { Button } from '../ui/Button';

interface AssistantEmailPanelProps {
  handleDetachPanel: (id: string) => void;
  selectedAssistantName: string;
}

export const AssistantEmailPanel: React.FC<AssistantEmailPanelProps> = ({
  handleDetachPanel,
  selectedAssistantName
}) => {
  return (
    <div className="flex-1 border-l bg-background h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Assistant
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDetachPanel('email')}>
          <Sidebar className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="h-20 w-20 bg-blue-50 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-100">
          <Mail className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">Mission Control: Email</h3>
        <p className="text-xs text-slate-500 mt-4 max-w-xs leading-relaxed font-bold italic">
          "Connected to the Neural Communication Array. Orchestrating {selectedAssistantName}'s inbox synchronization..."
        </p>
        <div className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200">
          System Online
        </div>
      </div>
    </div>
  );
};
