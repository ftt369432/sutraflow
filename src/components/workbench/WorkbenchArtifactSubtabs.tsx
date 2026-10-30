import React from 'react';
import { FileText, X, Plus } from 'lucide-react';

export interface ArtifactItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  diskPath?: string;
}

interface WorkbenchArtifactSubtabsProps {
  artifacts: ArtifactItem[];
  activeArtifactId: string;
  onSelectArtifact: (id: string) => void;
  onCloseArtifact: (e: React.MouseEvent, id: string) => void;
  onAddNewArtifact: () => void;
  onCloseOtherArtifacts: () => void;
  onResetArtifacts: () => void;
}

export const WorkbenchArtifactSubtabs: React.FC<WorkbenchArtifactSubtabsProps> = ({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onCloseArtifact,
  onAddNewArtifact,
  onCloseOtherArtifacts,
  onResetArtifacts
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {artifacts.map((art) => (
          <div
            key={art.id}
            onClick={() => onSelectArtifact(art.id)}
            className={`group/tab px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 transition cursor-pointer select-none ${
              activeArtifactId === art.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            title={art.diskPath ? `${art.title} (Saved: ${art.diskPath})` : art.title}
          >
            <FileText className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate max-w-[130px]">{art.title}</span>
            {art.id === activeArtifactId && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active Viewport" />
            )}
            {artifacts.length > 1 && (
              <button
                type="button"
                onClick={(e) => onCloseArtifact(e, art.id)}
                className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-60 group-hover/tab:opacity-100 transition cursor-pointer ml-0.5"
                title="Close tab"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={onAddNewArtifact}
          className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
          title="Add another deliverable tab"
        >
          <Plus className="w-3 h-3" />
          <span>New Artifact</span>
        </button>
        {artifacts.length > 1 && (
          <>
            <button
              onClick={onCloseOtherArtifacts}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close all draft tabs except the active one"
            >
              Close Others
            </button>
            <button
              onClick={onResetArtifacts}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Clear deliverable viewport and reset to empty state"
            >
              Reset Viewport
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          Artifacts ({artifacts.length})
        </span>
      </div>
    </div>
  );
};
