import React from 'react';
import { Search, Terminal } from 'lucide-react';
import { Tool } from '../../services/agents/ToolRegistry';

interface WorkbenchToolHandsTabProps {
  registeredTools: Tool[];
  toolSearchTerm: string;
  setToolSearchTerm: (term: string) => void;
  onExecuteTool: (tool: Tool) => void;
}

export const WorkbenchToolHandsTab: React.FC<WorkbenchToolHandsTabProps> = ({
  registeredTools,
  toolSearchTerm,
  setToolSearchTerm,
  onExecuteTool
}) => {
  const filteredTools = registeredTools.filter((t) =>
    toolSearchTerm
      ? t.name.toLowerCase().includes(toolSearchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(toolSearchTerm.toLowerCase())
      : true
  );

  return (
    <div className="min-h-full flex flex-col space-y-3">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={toolSearchTerm}
          onChange={(e) => setToolSearchTerm(e.target.value)}
          placeholder="Search registered agentic tools..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredTools.map((tool) => (
          <div
            key={tool.name}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{tool.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Agentic Tool</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
              {tool.description}
            </p>
            <button
              onClick={() => onExecuteTool(tool)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              Trigger Tool Action
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
