import React, { useState, useEffect } from 'react';
import { ChevronUp, Cpu, Zap, Brain, Sparkles, Key, Check, HardDrive, Music, Download, Plus, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { switchAIProvider, getCurrentAIProvider, type AIProvider } from '../../services/ai/aiServiceFactory';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface LocalModel {
  name: string;
  size?: number;
}

// Module-level cache and single in-flight promise to eliminate duplicate connection refused logs
let cachedProbe: { isOnline: boolean; models: { name: string; size?: number }[]; timestamp: number } | null = null;
let probeInFlight: Promise<{ isOnline: boolean; models: { name: string; size?: number }[] }> | null = null;

async function probeLocalGpuOnce(): Promise<{ isOnline: boolean; models: { name: string; size?: number }[] }> {
  if (cachedProbe && Date.now() - cachedProbe.timestamp < 30000) {
    return cachedProbe;
  }
  if (probeInFlight) return probeInFlight;

  probeInFlight = (async () => {
    try {
      const res = await fetch('http://127.0.0.1:11434/api/tags', { 
        signal: AbortSignal.timeout(1500) 
      });
      if (res.ok) {
        const data = await res.json();
        const models = Array.isArray(data.models) ? data.models.map((m: any) => ({ name: m.name, size: m.size })) : [];
        cachedProbe = { isOnline: true, models, timestamp: Date.now() };
        return cachedProbe;
      }
    } catch {
      // Local GPU daemon offline - silent fail
    }
    cachedProbe = { isOnline: false, models: [], timestamp: Date.now() };
    return cachedProbe;
  })().finally(() => {
    probeInFlight = null;
  });

  return probeInFlight;
}

export const ChatModelSelector: React.FC = () => {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(() => {
    return getCurrentAIProvider();
  });
  const [activeLocalModel, setActiveLocalModel] = useState<string>(() => {
    try {
      return localStorage.getItem('genieflow_local_model') || 'qwen2.5:7b';
    } catch (_e) {
      return 'qwen2.5:7b';
    }
  });
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [isLocalGpuOnline, setIsLocalGpuOnline] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [editingKeyFor, setEditingKeyFor] = useState<AIProvider | null>(null);
  const [keyInput, setKeyInput] = useState('');
  
  // Model pulling state
  const [showPullInput, setShowPullInput] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  // Proactive check of local GPU & active models
  useEffect(() => {
    const handleSync = () => {
      const p = getCurrentAIProvider();
      setCurrentProvider(p);
      const lm = localStorage.getItem('genieflow_local_model') || 'qwen2.5:7b';
      setActiveLocalModel(lm);
    };

    handleSync();
    window.addEventListener('genieflow_model_changed', handleSync);

    const initialProvider = getCurrentAIProvider();
    if (initialProvider === 'local' || initialProvider === 'private') {
      checkLocalGpu();
    }

    return () => {
      window.removeEventListener('genieflow_model_changed', handleSync);
    };
  }, []);

  // Only check local GPU when dropdown is opened or when local/private provider is active
  useEffect(() => {
    if (open || currentProvider === 'local' || currentProvider === 'private') {
      checkLocalGpu();
      const interval = setInterval(checkLocalGpu, 30000);
      return () => clearInterval(interval);
    }
  }, [open, currentProvider]);

  const checkLocalGpu = async () => {
    const p = getCurrentAIProvider();
    if (!open && p !== 'local' && p !== 'private') return;
    const probe = await probeLocalGpuOnce();
    setIsLocalGpuOnline(probe.isOnline);
    if (probe.isOnline && probe.models.length > 0) {
      setLocalModels(probe.models);
    }
  };

  const handleSelectProvider = (provider: AIProvider, localModelName?: string) => {
    try {
      switchAIProvider(provider);
      setCurrentProvider(provider);
      localStorage.setItem('genieflow_ai_provider', provider);
      if (localModelName) {
        setActiveLocalModel(localModelName);
        localStorage.setItem('genieflow_local_model', localModelName);
      }
      window.dispatchEvent(new CustomEvent('genieflow_model_changed', { detail: { provider, localModelName } }));
      toast.success(`Switched model to ${localModelName || provider.toUpperCase()}`);
      setOpen(false);
    } catch (e: any) {
      toast.error('Could not switch AI model');
    }
  };

  const handleSaveKey = (provider: AIProvider) => {
    const trimmed = keyInput.trim();
    if (provider === 'gemini') {
      localStorage.setItem('gemini_api_key', trimmed);
      localStorage.setItem('VITE_GEMINI_API_KEY', trimmed);
    } else if (provider === 'groq') {
      localStorage.setItem('groq_api_key', trimmed);
      localStorage.setItem('VITE_GROQ_API_KEY', trimmed);
    } else if (provider === 'claude') {
      localStorage.setItem('anthropic_api_key', trimmed);
    }
    setEditingKeyFor(null);
    setKeyInput('');
    toast.success(`API key saved for ${provider.toUpperCase()}`);
    handleSelectProvider(provider);
  };

  const handlePullModel = async (modelToPull: string) => {
    const target = modelToPull.trim();
    if (!target) return;
    setIsPulling(true);
    toast.info(`Connecting to Ollama to pull ${target}...`);
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    const endpoints = [
      `http://${host}:11434/api/pull`,
      'http://127.0.0.1:11434/api/pull',
      '/api/ollama/api/pull'
    ];
    let success = false;
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: target, stream: true })
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let lastToastTime = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.total && parsed.completed) {
                  const pct = Math.round((parsed.completed / parsed.total) * 100);
                  const now = Date.now();
                  if (now - lastToastTime > 3500) {
                    toast.info(`📥 Downloading ${target}: ${pct}% (${(parsed.completed / 1e9).toFixed(1)}GB / ${(parsed.total / 1e9).toFixed(1)}GB)`);
                    lastToastTime = now;
                  }
                } else if (parsed.status && !parsed.total) {
                  const now = Date.now();
                  if (now - lastToastTime > 4000) {
                    toast.info(`⚙️ ${target}: ${parsed.status}`);
                    lastToastTime = now;
                  }
                }
              } catch {}
            }
          }
          toast.success(`Model ${target} successfully downloaded and registered on RTX 4090!`);
          setPullModelName('');
          setShowPullInput(false);
          await checkLocalGpu();
          handleSelectProvider('private', target);
          success = true;
          break;
        }
      } catch (err) {
        // try next endpoint
      }
    }
    if (!success) {
      toast.error(`Could not pull ${target} via browser. Run "ollama pull ${target}" in PowerShell.`);
    }
    setIsPulling(false);
  };

  // Label display on the pill
  const getPillLabel = () => {
    if (currentProvider === 'private') {
      const modelLabels: Record<string, string> = {
        'qwen3.8:27b': 'Qwen 3.8 27B',
        'qwen2.5:7b': 'Qwen 2.5 7B',
        'deepseek-r1:14b': 'DeepSeek R1 14B',
        'deepseek-r1:32b': 'DeepSeek R1 32B',
        'qwen:latest': 'Qwen Latest',
        'llama3.2:3b': 'Llama 3.2 3B',
      };
      const label = modelLabels[activeLocalModel] || activeLocalModel;
      return isLocalGpuOnline ? `Sovereign Core: ${label}` : `Sovereign Core (Standby)`;
    }
    if (currentProvider === 'gemini') return 'Gemini 2.0 Flash';
    if (currentProvider === 'groq') return 'Groq Llama 3.3';
    if (currentProvider === 'claude') return 'Claude 3.5 Sonnet';
    if (currentProvider === 'hybrid') return 'Symphony Swarm';
    return currentProvider.toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/30 transition-colors shadow-none"
          title="Switch active LLM or view GPU status"
        >
          {currentProvider === 'private' ? (
            <Cpu className={cn("w-3.5 h-3.5", isLocalGpuOnline ? "text-emerald-500" : "text-amber-500")} />
          ) : currentProvider === 'gemini' ? (
            <Brain className="w-3.5 h-3.5 text-blue-500" />
          ) : currentProvider === 'groq' ? (
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          ) : currentProvider === 'claude' ? (
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          ) : (
            <Music className="w-3.5 h-3.5 text-purple-500" />
          )}

          <span className="truncate max-w-[140px]">{getPillLabel()}</span>
          <span className={cn("w-1.5 h-1.5 rounded-full", isLocalGpuOnline && currentProvider === 'private' ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50")} />
          <ChevronUp className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="w-96 p-3 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl z-[150] max-h-[85vh] overflow-y-auto">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" /> Active Model & Inference
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono font-medium", isLocalGpuOnline ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
              {isLocalGpuOnline ? "● RTX 4090 Online" : "○ Offline / Standby"}
            </span>
          </div>

          {/* 🎵 SECTION 1: SYMPHONY ORCHESTRATOR (AUTO MULTI-MODEL) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Multi-Model Symphony</span>
            <button
              onClick={() => handleSelectProvider('hybrid')}
              className={cn(
                "w-full text-left p-2.5 rounded-xl text-xs transition-all border",
                currentProvider === 'hybrid'
                  ? "bg-purple-500/10 border-purple-500/40 text-foreground shadow-xs ring-1 ring-purple-500/30"
                  : "hover:bg-muted/60 border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Music className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-foreground">Symphony (Auto-Pilot Swarm)</span>
                </div>
                {currentProvider === 'hybrid' && <Check className="w-4 h-4 text-purple-500 shrink-0" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                Auto-orchestrates across your stack: Sovereign Deep Reasoning Core for zero-latency drafting, heavy 27B/32B for pleadings, Nebius 550B Ultra for throughput, and Tavily for live California case law.
              </p>
            </button>
          </div>

          {/* 🦙 SECTION 2: DEDICATED SOVEREIGN DEEP REASONING CORE */}
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Sovereign Deep Reasoning Core</span>
                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-blue-500/10 text-blue-500 uppercase">Air-Gapped</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPullInput(!showPullInput)}
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Download another model to local hardware"
              >
                <Plus className="w-3 h-3" /> Add / Pull Model
              </button>
            </div>

            {/* Qwen 3.8 27B (Samsung SSD NVMe Partition) */}
            <button
              onClick={() => handleSelectProvider('private', 'qwen3.8:27b')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                currentProvider === 'private' && activeLocalModel === 'qwen3.8:27b'
                  ? "bg-primary/10 text-primary font-medium border-primary/30"
                  : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="text-left min-w-0 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span>Qwen 3.8 27B</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-mono">52 GB Samsung SSD</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">🏛️ Heavy Pleadings & Briefs • Ubuntu NVMe Partition</div>
                </div>
              </div>
              {currentProvider === 'private' && activeLocalModel === 'qwen3.8:27b' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            {/* Qwen 2.5 7B (Default Fast Local GPU) */}
            <button
              onClick={() => handleSelectProvider('private', 'qwen2.5:7b')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                currentProvider === 'private' && activeLocalModel === 'qwen2.5:7b'
                  ? "bg-primary/10 text-primary font-medium border-primary/30"
                  : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="text-left min-w-0 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span>Qwen 2.5 7B</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-mono">⚡ 140 tok/s</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">⚡ Ultra-Fast Local • Instant Legal QA</div>
                </div>
              </div>
              {currentProvider === 'private' && activeLocalModel === 'qwen2.5:7b' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            {/* DeepSeek R1 14B Fast Reasoning (9 GB) */}
            <button
              onClick={() => handleSelectProvider('private', 'deepseek-r1:14b')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                currentProvider === 'private' && activeLocalModel === 'deepseek-r1:14b'
                  ? "bg-primary/10 text-primary font-medium border-primary/30"
                  : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <div className="text-left min-w-0 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span>DeepSeek R1 14B</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-500 font-mono">⚡ 60 tok/s</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">⚡ Fast CoT Reasoning • 9 GB VRAM</div>
                </div>
              </div>
              {currentProvider === 'private' && activeLocalModel === 'deepseek-r1:14b' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            {/* DeepSeek R1 32B on RTX 4090 NVMe (Installed) */}
            <button
              onClick={() => handleSelectProvider('private', 'deepseek-r1:32b')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                currentProvider === 'private' && activeLocalModel === 'deepseek-r1:32b'
                  ? "bg-primary/10 text-primary font-medium border-primary/30"
                  : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <div className="text-left min-w-0 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span>DeepSeek R1 32B</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-mono">19 GB RTX 4090</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">🧠 Deep Reasoning Engine • Local GPU</div>
                </div>
              </div>
              {currentProvider === 'private' && activeLocalModel === 'deepseek-r1:32b' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            {/* Qwen Latest (Installed) */}
            <button
              onClick={() => handleSelectProvider('private', 'qwen:latest')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                currentProvider === 'private' && activeLocalModel === 'qwen:latest'
                  ? "bg-primary/10 text-primary font-medium border-primary/30"
                  : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <div className="text-left min-w-0 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span>Qwen Latest</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-500 font-mono">2.3 GB VRAM</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">🚀 Compact Local Model • Fast Execution</div>
                </div>
              </div>
              {currentProvider === 'private' && activeLocalModel === 'qwen:latest' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            {/* Llama 3.2 3B */}
            <button
              onClick={() => handleSelectProvider('private', 'llama3.2:3b')}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                currentProvider === 'private' && (activeLocalModel === 'llama3.2:3b' || activeLocalModel === 'llama3.2:latest')
                  ? "bg-primary/10 text-primary font-medium border-primary/30"
                  : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <div className="text-left min-w-0 truncate">
                  <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    <span>Llama 3.2 3B</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-teal-500/10 text-teal-500 font-mono">2.0 GB Edge</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">🪶 Lightweight Edge • Zero-Latency Assistant</div>
                </div>
              </div>
              {currentProvider === 'private' && (activeLocalModel === 'llama3.2:3b' || activeLocalModel === 'llama3.2:latest') && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            {/* Additional Local Models in Ollama (Deduplicated) */}
            {localModels.filter(m => !['qwen3.8:27b', 'qwen2.5:7b', 'deepseek-r1:32b', 'qwen:latest', 'llama3.2:3b', 'llama3.2:latest'].includes(m.name)).map((m) => (
              <button
                key={m.name}
                onClick={() => handleSelectProvider('private', m.name)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors border",
                  currentProvider === 'private' && activeLocalModel === m.name
                    ? "bg-primary/10 text-primary font-medium border-primary/30"
                    : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{m.name}</span>
                </div>
                {currentProvider === 'private' && activeLocalModel === m.name && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}

            {/* Pull Model Form */}
            {showPullInput && (
              <div className="mt-2 p-2.5 bg-muted/30 border border-border/40 rounded-lg space-y-2">
                <span className="text-[10px] text-muted-foreground font-medium block">Download Model to Local RTX 4090:</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. qwen2.5:32b, deepseek-r1:32b"
                    value={pullModelName}
                    onChange={(e) => setPullModelName(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background"
                    disabled={isPulling}
                  />
                  <button
                    onClick={() => handlePullModel(pullModelName)}
                    disabled={isPulling || !pullModelName.trim()}
                    className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    {isPulling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Pull
                  </button>
                </div>
                {/* Popular Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    { id: 'qwen2.5:32b', label: '+ Qwen 2.5 32B (Pleadings)' },
                    { id: 'deepseek-r1:32b', label: '+ DeepSeek R1 32B (Reasoning)' },
                    { id: 'llama3.3:70b', label: '+ Llama 3.3 70B' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePullModel(p.id)}
                      disabled={isPulling}
                      className="text-[9px] px-2 py-1 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground font-mono cursor-pointer transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ☁️ SECTION 3: CLOUD INFERENCE MODELS */}
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Cloud Models</span>

            {/* Gemini */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSelectProvider('gemini')}
                className={cn(
                  "flex-1 flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors border",
                  currentProvider === 'gemini'
                    ? "bg-primary/10 text-primary font-medium border-primary/30"
                    : "hover:bg-muted/60 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Brain className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div className="text-left min-w-0 truncate">
                    <div className="font-semibold text-foreground truncate">Gemini 2.0 Flash</div>
                    <div className="text-[10px] text-muted-foreground">🌐 Google Multimodal & Live Case Law Citations</div>
                  </div>
                </div>
                {currentProvider === 'gemini' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
              <button
                onClick={() => setEditingKeyFor(editingKeyFor === 'gemini' ? null : 'gemini')}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
                title="Configure Gemini API Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </div>
            {editingKeyFor === 'gemini' && (
              <div className="flex gap-1.5 px-1 py-1">
                <input
                  type="password"
                  placeholder="Paste Gemini API Key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background"
                />
                <button
                  onClick={() => handleSaveKey('gemini')}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            )}

            {/* Groq */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSelectProvider('groq')}
                className={cn(
                  "flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                  currentProvider === 'groq'
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Groq Llama 3.3 (Fast)</span>
                </div>
                {currentProvider === 'groq' && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              <button
                onClick={() => setEditingKeyFor(editingKeyFor === 'groq' ? null : 'groq')}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                title="Configure Groq API Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </div>
            {editingKeyFor === 'groq' && (
              <div className="flex gap-1.5 px-1 py-1">
                <input
                  type="password"
                  placeholder="Paste Groq API Key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs rounded border border-border bg-background"
                />
                <button
                  onClick={() => handleSaveKey('groq')}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
