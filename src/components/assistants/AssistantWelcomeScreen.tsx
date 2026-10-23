import React, { useState } from 'react';
import { 
  Cpu, 
  Plus, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  FileText, 
  Activity, 
  ArrowRight,
  Layers,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { type AIAssistant } from '../../types/ai';

interface AssistantWelcomeScreenProps {
  assistants: AIAssistant[];
  isCreatingAssistant: boolean;
  onOpenCreator: () => void;
  onSelectFirstAssistant: () => void;
}

export const AssistantWelcomeScreen: React.FC<AssistantWelcomeScreenProps> = ({
  assistants,
  isCreatingAssistant,
  onOpenCreator,
  onSelectFirstAssistant
}) => {
  const navigate = useNavigate();
  const [activeArchetype, setActiveArchetype] = useState<number | null>(null);

  const archetypes = [
    {
      title: 'Applicant Litigator',
      badge: 'Gutierrez Caption',
      icon: Scale,
      color: 'from-blue-600 to-cyan-500',
      description: '28-line legal briefs, LC § 5814 / § 4622 penalty petitions, AOE/COE dispute memoranda.',
      tag: 'California WCAB'
    },
    {
      title: 'QME & Medical Chronology',
      badge: 'AMA Guides Ch. 15/16',
      icon: Activity,
      color: 'from-cyan-500 to-teal-500',
      description: 'Multi-page PDF chronology extraction, WPI rating adjustment, and forensic apportionment audit.',
      tag: 'Medical-Legal'
    },
    {
      title: 'Lien Claimant Recovery',
      badge: 'LC § 4622 Enforcement',
      icon: FileText,
      color: 'from-sky-500 to-blue-600',
      description: 'Medland & Spectrum billing enforcement, SBR/IBR disputes, 10% penalty + 7% interest petitions.',
      tag: 'Lien Litigation'
    },
    {
      title: 'Sovereign Swarm Conductor',
      badge: 'RTX 4090 Enclave',
      icon: Layers,
      color: 'from-indigo-600 to-blue-600',
      description: 'Multi-agent parallel synthesis, local Unsloth QLoRA execution, zero-PHI cloud egress guarantee.',
      tag: 'Autonomous Swarm'
    }
  ];

  const intelligenceBriefs = [
    {
      title: 'Zero-PHI Sovereign Guardrail',
      desc: 'All client direct identifiers (SSNs, DOBs, claim numbers) are sanitized on-device before external dispatch.'
    },
    {
      title: 'RTX 4090 QLoRA Fine-Tuning Pipeline',
      desc: 'Local workstation automatically digests verified 28-line pleadings into universal dataset for sub-1,500ms latency.'
    },
    {
      title: 'Deterministic Statutory Grounding',
      desc: 'Enforces exact word-for-word citations from California Labor Code, 8 CCR regulations, and en banc precedents.'
    },
    {
      title: 'Creator Economy & Gpack Distribution',
      desc: 'Package specialized workflows into monetizable Gpacks with custom per-claim fees or subscriptions.'
    }
  ];

  const currentBriefIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % intelligenceBriefs.length;
  const currentBrief = intelligenceBriefs[currentBriefIndex];

  return (
    <div className="relative flex flex-col items-center justify-start min-h-full py-10 px-6 sm:px-12 text-slate-700 dark:text-slate-300 overflow-y-auto">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl dark:from-blue-600/20 dark:via-cyan-400/10" />
        <div className="absolute -bottom-24 left-1/4 w-[450px] h-[450px] bg-blue-700/10 dark:bg-blue-900/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.06]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full text-center">
        
        {/* ── ARTISTIC SUTRA NEURAL CORE CENTERPIECE ── */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Ambient Outer Halo */}
          <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-blue-600/30 to-cyan-400/30 blur-2xl animate-pulse" />
          
          {/* Orbital Ring 1 - Counter Clockwise */}
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-cyan-500/30 dark:border-cyan-400/30 animate-[spin_20s_linear_infinite_reverse]" />
          
          {/* Orbital Ring 2 - Clockwise */}
          <div className="absolute w-36 h-36 rounded-full border border-blue-500/40 dark:border-blue-400/40 animate-[spin_12s_linear_infinite]" />
          
          {/* Orbit Satellites */}
          <div className="absolute w-44 h-44 animate-[spin_14s_linear_infinite]">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
          <div className="absolute w-36 h-36 animate-[spin_9s_linear_infinite_reverse]">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] ml-auto" />
          </div>

          {/* Central Crystalline Neural Core */}
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/40 shadow-[0_0_35px_rgba(37,99,235,0.35)] flex items-center justify-center backdrop-blur-xl group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent" />
            <Cpu className="w-11 h-11 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
            {/* Corner Tech Accents */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-blue-500" />
          </div>
        </div>

        {/* Live Sovereign Engine Status HUD Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-950/60 border border-blue-500/25 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>SUTRA CORTEX v2.6</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-cyan-600 dark:text-cyan-400">RTX 4090 SOVEREIGN ENCLAVE</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> ZERO-PHI
          </span>
        </div>

        {/* Headline & Description */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Sutra Sovereign{' '}
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Assistant Hub
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed mb-8">
          Deterministic California Workers' Comp research, 28-line legal pleadings, and autonomous multi-agent swarms grounded in verified statutes and local AI inference.
        </p>

        {/* ── SPECIALIZED ARCHETYPE CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full mb-8 text-left">
          {archetypes.map((arch, idx) => {
            const Icon = arch.icon;
            const isHovered = activeArchetype === idx;
            return (
              <div
                key={arch.title}
                onMouseEnter={() => setActiveArchetype(idx)}
                onMouseLeave={() => setActiveArchetype(null)}
                className={`relative rounded-xl p-4 transition-all duration-200 cursor-pointer border ${
                  isHovered
                    ? 'border-blue-500/60 bg-blue-50/70 dark:bg-blue-950/40 shadow-lg shadow-blue-500/10 -translate-y-0.5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm'
                }`}
                onClick={onOpenCreator}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${arch.color} text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {arch.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {arch.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {arch.description}
                </p>
                <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-cyan-400">
                  <span>{arch.badge}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── INTELLIGENCE BRIEFING STRIP ── */}
        <div className="w-full rounded-xl p-4 mb-8 text-left border border-blue-200 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 via-slate-50 to-cyan-50/50 dark:from-blue-950/30 dark:via-slate-900/60 dark:to-cyan-950/20 backdrop-blur-md shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  Sovereign Intelligence Brief
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {currentBrief.title}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentBrief.desc}
              </p>
            </div>
          </div>
        </div>

        {/* ── PRIMARY CALL TO ACTION BUTTONS ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Button
            onClick={onOpenCreator}
            size="lg"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] border-0"
            disabled={isCreatingAssistant}
          >
            <Plus className="w-4 h-4" />
            Create Custom Assistant
          </Button>

          {assistants.length > 0 && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onSelectFirstAssistant}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm transition-all"
            >
              <Users className="w-4 h-4 text-blue-500" />
              View Active ({assistants.length})
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/creator/dashboard')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-cyan-400 font-semibold text-sm transition-all"
          >
            <Crown className="w-4 h-4" />
            Creator Space
          </Button>
        </div>

      </div>
    </div>
  );
};
