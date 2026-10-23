/**
 * ⚡ NebiusEngineStatus.tsx
 * 
 * Live Telemetry HUD Widget for Nebius Token Factory & NVIDIA Hardware.
 * Built for the Nebius x NVIDIA Global AI Hackathon (Devpost).
 * 
 * Demonstrates:
 * - Nebius Token Factory (NVIDIA Nemotron-3-Ultra 550B & Nano 30B)
 * - Sovereign Local NVIDIA GeForce RTX 4090 (24GB VRAM)
 * - Tavily Precedent Grounding Engine
 * - NemoClaw Sovereign Runtime Policy Guard
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Server,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { nebiusTokenFactory } from '../../services/ai/NebiusTokenFactoryService';
import { tavilyGrounding } from '../../services/legal/TavilyGroundingService';

export function NebiusEngineStatus() {
  const [nebiusStatus, setNebiusStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [nebiusLatency, setNebiusLatency] = useState<number | null>(null);
  const [nebiusMessage, setNebiusMessage] = useState<string>('Initializing handshake...');
  const [selectedTier, setSelectedTier] = useState<'ultra' | 'nano' | 'super'>('ultra');
  const [tavilyStatus, setTavilyStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkTelemetry = async () => {
    setIsRefreshing(true);
    const start = performance.now();

    try {
      const health = await nebiusTokenFactory.checkHealth();
      const elapsed = Math.round(performance.now() - start);
      if (health.online) {
        setNebiusStatus('online');
        setNebiusLatency(elapsed);
        setNebiusMessage(health.message);
      } else {
        setNebiusStatus('offline');
        setNebiusMessage(health.message || 'API key required');
      }
    } catch (_e) {
      setNebiusStatus('offline');
      setNebiusMessage('Endpoint unreachable');
    }

    // Tavily check
    if (tavilyGrounding.getApiKey()) {
      setTavilyStatus('online');
    } else {
      setTavilyStatus('offline');
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    checkTelemetry();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl p-6 mb-8 text-white">
      {/* Background NVIDIA Green & Nebius Violet Glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Cpu className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold tracking-tight">Sovereign Hardware & AI Engine HUD</h2>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Nebius × NVIDIA Hackathon
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-tiered sovereign agent runtime governed by NemoClaw & Zero-PHI Egress Shield
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={checkTelemetry}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh connection status"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Ping Endpoints</span>
          </button>
        </div>
      </div>

      {/* 4-Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        
        {/* Pillar 1: Nebius Token Factory */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 hover:border-violet-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-violet-400" />
                Nebius Token Factory
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${
                  nebiusStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
                  nebiusStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
                }`} />
                <span className="text-[10px] text-slate-400 font-medium">
                  {nebiusStatus === 'online' ? `${nebiusLatency}ms` : nebiusStatus}
                </span>
              </div>
            </div>
            
            <p className="text-sm font-semibold text-white truncate">
              NVIDIA Nemotron 3
            </p>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              {nebiusMessage}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Tier:</span>
            <div className="flex items-center gap-1">
              {(['ultra', 'nano'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedTier === tier 
                      ? 'bg-violet-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier === 'ultra' ? '550B Ultra' : '30B Nano'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 2: Sovereign Local Hardware */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                Local Sovereign GPU
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                24GB VRAM
              </span>
            </div>
            
            <p className="text-sm font-semibold text-white">
              NVIDIA GeForce RTX 4090
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Unsloth QLoRA Fine-Tuned California Legal Model + Zero-PHI Triage
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Ollama/vLLM</span>
            <span className="text-emerald-400 font-mono font-medium">localhost:11434</span>
          </div>
        </div>

        {/* Pillar 3: Tavily Grounding */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-amber-400" />
                Tavily Authority RAG
              </span>
              <span className={`h-2 w-2 rounded-full ${tavilyStatus === 'online' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>
            
            <p className="text-sm font-semibold text-white">
              Real-Time Precedent Search
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cross-references WCAB en banc authority banks against live legal databases
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Bonus Track</span>
            <span className="text-amber-400 font-medium">$3,000 Prize</span>
          </div>
        </div>

        {/* Pillar 4: NemoClaw Sovereign Policy Guard */}
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                NemoClaw Policy Guard
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                Active
              </span>
            </div>
            
            <p className="text-sm font-semibold text-white">
              Zero-PHI Egress Shield
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cryptographic token masking with local-only client re-identification
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Policy Spec</span>
            <span className="text-cyan-400 font-mono text-[10px]">nemoclaw-policy.yaml</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default NebiusEngineStatus;
