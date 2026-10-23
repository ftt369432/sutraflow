import React from 'react';
import { HardDrive, X, Upload, FolderOpen, FileText } from 'lucide-react';
import { GenieDriveTree } from '../geniedrive/GenieDriveTree';

interface WorkbenchDriveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDriveFile: (file: any) => void;
  onPinDriveFile?: (file: any) => void;
  onTriggerFileUpload: () => void;
}

export const WorkbenchDriveDrawer: React.FC<WorkbenchDriveDrawerProps> = ({
  isOpen,
  onClose,
  onSelectDriveFile,
  onPinDriveFile,
  onTriggerFileUpload
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 shrink-0 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">SutraDrive</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            SOVEREIGN
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onTriggerFileUpload}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            title="Upload Local File"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drive Tree Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-1.5">
        <GenieDriveTree
          onSelect={onSelectDriveFile}
          onFileSelect={onSelectDriveFile}
          onPin={onPinDriveFile}
          className="h-full bg-transparent border-0 shadow-none text-xs"
        />
      </div>

      {/* Footer Info */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-400 bg-slate-50/50 dark:bg-slate-950/60 flex items-center justify-between">
        <span className="font-medium text-slate-500 dark:text-slate-400">Sovereign Storage Fabric</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold text-[10px]">ATTACHED</span>
        </div>
      </div>
    </div>
  );
};
