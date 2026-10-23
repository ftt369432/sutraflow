import React from 'react';
import {
  Brain,
  ChevronDown,
  Cpu,
  RefreshCw,
  Settings,
  HardDrive,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Columns,
  Sparkles,
  Scale,
  Stethoscope,
  Calculator,
  Dna,
  Briefcase,
  History,
  Compass,
  Home
} from 'lucide-react';
import { DomainType, DomainProfile } from '../../services/ai/UniversalDomainOperator';
import { LayoutMode } from './types';
import { useAttachedDriveStore } from '../../store/attachedDriveStore';

interface WorkbenchHeaderProps {
  activeProfile: DomainProfile;
  activeDomainType: DomainType;
  profiles: Record<DomainType, DomainProfile>;
  showDomainDropdown: boolean;
  setShowDomainDropdown: (show: boolean) => void;
  onSelectDomain: (key: DomainType) => void;
  onOpenCustomModal: () => void;
  // Drive and Layout toggles
  showDrivePanel: boolean;
  setShowDrivePanel: (show: boolean | ((prev: boolean) => boolean)) => void;
  showHistoryDrawer?: boolean;
  setShowHistoryDrawer?: (show: boolean | ((prev: boolean) => boolean)) => void;
  sessionCount?: number;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  // Engine
  activeEngine: string;
  showEngineDropdown: boolean;
  setShowEngineDropdown: (show: boolean) => void;
  onSelectEngine: (engine: string) => void;
  deepLoop: boolean;
  setDeepLoop: (deep: boolean) => void;
}

const getDomainIcon = (iconName: string) => {
  switch (iconName) {
    case 'Scale':
      return <Scale className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'Stethoscope':
      return <Stethoscope className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'Calculator':
      return <Calculator className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'Dna':
      return <Dna className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'Compass':
      return <Compass className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    case 'Home':
      return <Home className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
    default:
      return <Briefcase className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
  }
};

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  activeProfile,
  activeDomainType,
  profiles,
  showDomainDropdown,
  setShowDomainDropdown,
  onSelectDomain,
  onOpenCustomModal,
  showDrivePanel,
  setShowDrivePanel,
  showHistoryDrawer,
  setShowHistoryDrawer,
  sessionCount = 0,
  layoutMode,
  setLayoutMode,
  activeEngine,
  showEngineDropdown,
  setShowEngineDropdown,
  onSelectEngine,
  deepLoop,
  setDeepLoop
}) => {
  const drives = useAttachedDriveStore((s) => s.drives);
  const attachedRoots = drives.filter(d => d.type !== 'generated');
  const hasGdrive = drives.some(d => d.name.toLowerCase().includes('google') || d.name.includes('G:'));
  const hasTravel = drives.some(d => d.name.toLowerCase().includes('travel') || d.name.includes('E:'));

  return (
    <div className="shrink-0 flex items-center justify-between px-3.5 py-1.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20">
      {/* Left: Persona Switcher & Drive Toggle */}
      <div className="flex items-center gap-2">
        {/* SutraDrive Drawer Toggle */}
        <button
          onClick={() => setShowDrivePanel((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs ${
            showDrivePanel
              ? 'sutra-steel-active shadow-sm'
              : 'sutra-silver-create shimmer-button-energy hover:brightness-105'
          }`}
          title={showDrivePanel ? 'Hide SutraDrive Explorer' : 'Open SutraDrive Explorer'}
        >
          <div className="relative flex items-center justify-center">
            <HardDrive className={`w-3.5 h-3.5 ${showDrivePanel ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`} />
            {attachedRoots.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900 animate-pulse" />
            )}
          </div>
          <span className="font-bold">Drive</span>
        </button>

        {/* Agent Project Sessions / History Drawer Toggle */}
        {setShowHistoryDrawer && (
          <button
            onClick={() => setShowHistoryDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs ${
              showHistoryDrawer
                ? 'sutra-steel-active shadow-sm'
                : 'sutra-silver-create shimmer-button-energy hover:brightness-105'
            }`}
            title="Open Agent Project History (Prior cases, transcripts & parallel sessions)"
          >
            <History className={`w-3.5 h-3.5 ${showHistoryDrawer ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            <span className="font-bold">Sessions</span>
            {sessionCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {sessionCount}
              </span>
            )}
          </button>
        )}

        {/* Persona Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDomainDropdown(!showDomainDropdown)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold sutra-silver-create shimmer-button-energy transition cursor-pointer shadow-xs"
          >
            {getDomainIcon(activeProfile.icon)}
            <span className="font-bold">{activeProfile.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showDomainDropdown && (
            <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operating Brains & Personas
              </div>
              {(Object.keys(profiles) as DomainType[]).map((key) => {
                const p = profiles[key];
                const isSelected = activeDomainType === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectDomain(key)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'sutra-steel-active font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getDomainIcon(p.icon)}
                      <div className="truncate">
                        <div className="truncate">{p.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.organization}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={onOpenCustomModal}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure Custom Practice Brain...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Pane Layout Toggle (ChevronLeft, Split, ChevronRight) - Matches photo's Segmented List/Grid View */}
      <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
        <button
          onClick={() => setLayoutMode(layoutMode === 'deliverableOnly' ? 'split' : 'deliverableOnly')}
          className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
            layoutMode === 'deliverableOnly'
              ? 'sutra-steel-active font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
          title="Collapse Chat / View Deliverable Only"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setLayoutMode('split')}
          className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
            layoutMode === 'split'
              ? 'sutra-steel-active font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
          title="Split View (Chat & Deliverable)"
        >
          <Columns className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setLayoutMode(layoutMode === 'chatOnly' ? 'split' : 'chatOnly')}
          className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
            layoutMode === 'chatOnly'
              ? 'sutra-steel-active font-semibold'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
          title="Collapse Deliverable / View Chat Only"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Engine & Reasoning Mode */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowEngineDropdown(!showEngineDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold sutra-silver-create shimmer-button-energy transition cursor-pointer shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span className="hidden md:inline">
              {activeEngine === 'nebius'
                ? 'Nebius Nemotron Ultra (550B)'
                : activeEngine === 'tavily'
                ? 'Tavily Precedent Engine'
                : activeEngine === 'sovereign' || activeEngine === 'gemini'
                ? 'Gemini 2.0 Flash'
                : activeEngine === 'cloud'
                ? 'GenieFlow Cloud'
                : 'Sovereign Neural Core'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showEngineDropdown && (
            <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Inference & Grounding Fabric
              </div>
              
              {/* Sovereign Neural Core (Air-Gapped / Zero-Cloud) */}
              <button
                onClick={() => onSelectEngine('local')}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer mb-1 ${
                  activeEngine === 'local' || activeEngine === 'private'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 border border-blue-200 dark:border-blue-800 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                    <span>Sovereign Neural Core</span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 uppercase">Air-Gapped</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Dedicated on-prem hardware • Zero-Cloud • Sub-ms latency</div>
                </div>
              </button>

              {/* Nebius Token Factory */}
              <button
                onClick={() => onSelectEngine('nebius')}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer mb-1 ${
                  activeEngine === 'nebius'
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <span>Nebius Token Factory</span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 uppercase">550B Ultra</span>
                  </div>
                  <div className="text-[10px] text-slate-400">NVIDIA Nemotron 3 Ultra • Massive legal throughput</div>
                </div>
              </button>

              {/* Tavily Precedent Engine */}
              <button
                onClick={() => onSelectEngine('tavily')}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer mb-1 ${
                  activeEngine === 'tavily'
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <span>Tavily Precedent Engine</span>
                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 uppercase">Live Law</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Real-time California Court of Appeal & WCAB Authority grounding</div>
                </div>
              </button>

              {/* Gemini 2.0 Flash Enterprise */}
              <button
                onClick={() => onSelectEngine('gemini')}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                  activeEngine === 'sovereign' || activeEngine === 'gemini'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Gemini 2.0 Flash Enterprise</div>
                  <div className="text-[10px] text-slate-400">Multimodal verification & complex cross-examination analysis</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
