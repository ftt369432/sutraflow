import React from 'react';
import { FileText, Cpu, Shield, Command } from 'lucide-react';
import { useActiveContext } from '../../hooks/useActiveContext';
import { useQuickActions } from '../../hooks/useQuickActions';
import { cn } from '../../lib/utils';

interface ActiveContextHUDProps {
  className?: string;
  compact?: boolean;
}

export const ActiveContextHUD: React.FC<ActiveContextHUDProps> = ({ className, compact = false }) => {
  const { activeDocument, activePersona, activeModelId, setActivePersona } = useActiveContext();
  const { setPaletteOpen } = useQuickActions();

  const togglePersona = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePersona(activePersona === 'applicant_attorney' ? 'lien_claimant' : 'applicant_attorney');
  };

  return (
    <div 
      onClick={() => setPaletteOpen(true)}
      title="Active Operational Telemetry — Click or press Ctrl+K for Command Hub"
      className={cn(
        "group flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200 select-none",
        "bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/40 shadow-sm backdrop-blur-md text-xs",
        className
      )}
    >
      {/* 📄 Active Document */}
      <div className="flex items-center gap-1.5 text-slate-300 max-w-[180px] sm:max-w-[240px] truncate">
        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="truncate font-medium">
          {activeDocument ? activeDocument.name : 'No Active Document'}
        </span>
      </div>

      <div className="h-3 w-[1px] bg-slate-700/80" />

      {/* ⚖️ Legal Persona Pill */}
      <button
        onClick={togglePersona}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all duration-200",
          activePersona === 'applicant_attorney'
            ? "bg-slate-800/90 text-teal-300 border border-teal-500/40 hover:border-teal-400/70 shadow-xs"
            : "bg-slate-800/90 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/70 shadow-xs"
        )}
        title={`Click to switch persona (Current: ${activePersona === 'applicant_attorney' ? 'Applicant Attorney' : 'Lien Claimant'})`}
      >
        <Shield className="w-2.5 h-2.5 shrink-0" />
        <span>{activePersona === 'applicant_attorney' ? 'Applicant' : 'Lien'}</span>
      </button>

      {!compact && (
        <>
          <div className="h-3 w-[1px] bg-slate-700/80 hidden md:block" />

          {/* ⚡ Inference Engine */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <Cpu className="w-3 h-3 text-cyan-400/80 shrink-0" />
            <span className="font-mono text-[10px] text-slate-300">
              {activeModelId.includes('local') || activeModelId.includes('gpu') ? 'RTX 4090' : activeModelId}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-700/80 hidden sm:block" />

          {/* ⌨️ Command Shortcut Hint */}
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10px] text-slate-400 font-mono group-hover:border-cyan-500/30 group-hover:text-cyan-300">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </>
      )}
    </div>
  );
};
