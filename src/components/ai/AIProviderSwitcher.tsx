import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Zap, Brain, Sparkles, Key, Check, AlertCircle, Settings2, Server } from 'lucide-react';
import { switchAIProvider, getCurrentAIProvider, type AIProvider } from '../../services/ai/aiServiceFactory';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const AIProviderSwitcher: React.FC = () => {
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('private');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [localGpuOnline, setLocalGpuOnline] = useState(false);
  const [customGpuUrl, setCustomGpuUrl] = useState(() => localStorage.getItem('genieflow_local_gpu_url') || '');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('genieflow_local_model') || '');
  const { toast } = useToast();

  useEffect(() => {
    const active = getCurrentAIProvider();
    setCurrentProvider(active);
    checkKeyStatus(active);
    if (active === 'local' || active === 'private') {
      checkLocalGpu();
    }
  }, []);

  const checkLocalGpu = async () => {
    try {
      const res = await fetch('http://127.0.0.1:11434/api/tags', { method: 'GET', signal: AbortSignal.timeout(1500) });
      setLocalGpuOnline(res.ok);
    } catch {
      setLocalGpuOnline(false);
    }
  };

  const checkKeyStatus = (provider: AIProvider) => {
    if (provider === 'gemini') {
      const key = localStorage.getItem('gemini_api_key') || localStorage.getItem('VITE_GEMINI_API_KEY') || '';
      setHasKey(!!key);
      setApiKeyInput(key);
    } else if (provider === 'groq') {
      const key = localStorage.getItem('groq_api_key') || localStorage.getItem('VITE_GROQ_API_KEY') || '';
      setHasKey(!!key);
      setApiKeyInput(key);
    } else if (provider === 'claude') {
      const key = localStorage.getItem('anthropic_api_key') || '';
      setHasKey(!!key);
      setApiKeyInput(key);
    } else if (provider === 'private') {
      const key = localStorage.getItem('genieflow_api_key') || '';
      setHasKey(!!key);
      setApiKeyInput(key);
      setCustomGpuUrl(localStorage.getItem('genieflow_local_gpu_url') || '');
      setCustomModel(localStorage.getItem('genieflow_local_model') || '');
    } else {
      setHasKey(true);
    }
  };

  const handleSwitchProvider = (provider: AIProvider) => {
    try {
      switchAIProvider(provider);
      setCurrentProvider(provider);
      checkKeyStatus(provider);
      toast.success(`Switched to ${provider.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to switch to ${provider.toUpperCase()}`);
    }
  };

  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim();
    if (currentProvider === 'gemini') {
      localStorage.setItem('gemini_api_key', trimmed);
      localStorage.setItem('VITE_GEMINI_API_KEY', trimmed);
    } else if (currentProvider === 'groq') {
      localStorage.setItem('groq_api_key', trimmed);
      localStorage.setItem('VITE_GROQ_API_KEY', trimmed);
    } else if (currentProvider === 'claude') {
      localStorage.setItem('anthropic_api_key', trimmed);
    } else if (currentProvider === 'private') {
      if (trimmed) localStorage.setItem('genieflow_api_key', trimmed);
      else localStorage.removeItem('genieflow_api_key');

      if (customGpuUrl.trim()) {
        localStorage.setItem('genieflow_local_gpu_url', customGpuUrl.trim());
      } else {
        localStorage.removeItem('genieflow_local_gpu_url');
      }

      if (customModel.trim()) {
        localStorage.setItem('genieflow_local_model', customModel.trim());
      }
    }
    setHasKey(!!trimmed || currentProvider === 'private');
    setShowKeyInput(false);
    toast.success(`Configuration saved! ${currentProvider.toUpperCase()} active.`);
  };

  const applyPreset = (name: 'nebius' | 'amd' | 'ollama') => {
    if (name === 'nebius') {
      setCustomGpuUrl('https://api.studio.nebius.ai/v1');
      setCustomModel('nvidia/Nemotron-3-Ultra-550b-a55b');
      toast.info('Applied Nebius Token Factory (NVIDIA Nemotron 3 Ultra) preset.');
    } else if (name === 'amd') {
      setCustomGpuUrl('http://127.0.0.1:8000/v1');
      setCustomModel('Qwen/Qwen2.5-32B-Instruct');
      toast.info('Applied AMD ROCm / vLLM local preset (port 8000).');
    } else if (name === 'ollama') {
      setCustomGpuUrl('http://127.0.0.1:11434/v1');
      setCustomModel('deepseek-r1:32b');
      toast.info('Applied Local RTX 4090 / Ollama preset (port 11434).');
    }
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'groq': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'gemini': return <Brain className="w-4 h-4 text-green-500" />;
      case 'private': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'hybrid': return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'claude': return <Sparkles className="w-4 h-4 text-orange-500" />;
      case 'nebius': return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  const getProviderLabel = (provider: AIProvider) => {
    switch (provider) {
      case 'nebius': return 'Nebius Token Factory (Nemotron 3 Ultra)';
      case 'groq': return 'Groq (Cloud Fast)';
      case 'gemini': return 'Gemini (Cloud)';
      case 'private': return 'Private / Local RTX 4090';
      case 'hybrid': return 'Hybrid (Smart Routing)';
      case 'claude': return 'Claude (Anthropic)';
      default: return provider.toUpperCase();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">AI Model</span>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {currentProvider.toUpperCase()}
          </Badge>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            title={currentProvider === 'private' ? "Configure Nebius, AMD, or Local GPU endpoint" : "Configure API Key"}
          >
            {currentProvider === 'private' ? <Settings2 className="w-3.5 h-3.5 text-purple-400" /> : <Key className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      <Select value={currentProvider} onValueChange={handleSwitchProvider}>
        <SelectTrigger className="w-full h-9 text-sm justify-start">
          <div className="flex items-center gap-2">
            {getProviderIcon(currentProvider)}
            <span>{getProviderLabel(currentProvider)}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nebius">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Nebius Token Factory (NVIDIA Nemotron 3 Ultra)</span>
            </div>
          </SelectItem>
          <SelectItem value="private">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Private / Local RTX 4090 GPU</span>
            </div>
          </SelectItem>
          <SelectItem value="gemini">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-green-500" />
              <span>Gemini (Google Cloud)</span>
            </div>
          </SelectItem>
          <SelectItem value="groq">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>Groq (Llama 3.3 Fast)</span>
            </div>
          </SelectItem>
          <SelectItem value="claude">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Claude (Anthropic)</span>
            </div>
          </SelectItem>
          <SelectItem value="hybrid">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Hybrid (Smart Routing)</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {showKeyInput && (
        <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-border/80 space-y-2 mt-1 text-xs shadow-sm">
          {currentProvider === 'private' ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3 text-purple-400" /> Custom GPU / Nebius / AMD
                </span>
                {customGpuUrl && <span className="text-emerald-500 text-[10px] flex items-center gap-1"><Check className="w-3 h-3" /> Configured</span>}
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <button
                  type="button"
                  onClick={() => applyPreset('nebius')}
                  className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 cursor-pointer font-medium"
                >
                  Nebius Studio
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('amd')}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 cursor-pointer font-medium"
                >
                  AMD ROCm/vLLM
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('ollama')}
                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 cursor-pointer font-medium"
                >
                  Local RTX 4090
                </button>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Endpoint URL (OpenAI Compatible):</label>
                <Input
                  type="text"
                  placeholder="https://api.studio.nebius.ai/v1 or http://127.0.0.1:11434/v1"
                  value={customGpuUrl}
                  onChange={(e) => setCustomGpuUrl(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">API Key (Nebius Bearer Token or leave blank):</label>
                <Input
                  type="password"
                  placeholder="Paste Nebius API key..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Model Name:</label>
                <Input
                  type="text"
                  placeholder="deepseek-ai/DeepSeek-R1 or Qwen/Qwen2.5-32B-Instruct"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="h-7 text-xs bg-white dark:bg-slate-800"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>{currentProvider.toUpperCase()} API Key</span>
                {hasKey && <span className="text-emerald-500 text-[10px] flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
              </div>
              <Input
                type="password"
                placeholder={`Paste ${currentProvider} API key...`}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="h-7 text-xs bg-white dark:bg-slate-800"
              />
            </>
          )}

          <div className="flex justify-end gap-1.5 pt-1">
            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2 cursor-pointer" onClick={() => setShowKeyInput(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-6 text-[11px] px-3 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" onClick={handleSaveKey}>
              Save Config
            </Button>
          </div>
        </div>
      )}

      {currentProvider === 'private' && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 px-1">
          <span>{customGpuUrl && customGpuUrl.includes('nebius') ? '☁️ Nebius AI Cloud' : customGpuUrl && customGpuUrl.includes('8000') ? '⚡ AMD ROCm / vLLM' : '🔒 Local Private GPU'}</span>
          <span className={`text-[10px] font-bold flex items-center gap-1 ${localGpuOnline || (customGpuUrl && customGpuUrl.length > 5) ? 'text-emerald-500' : 'text-amber-500'}`}>
            {localGpuOnline || (customGpuUrl && customGpuUrl.length > 5) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {customGpuUrl && customGpuUrl.includes('nebius') ? 'Nebius Active' : localGpuOnline ? 'RTX 4090 Online' : 'Ready'}
          </span>
        </div>
      )}
      {currentProvider === 'gemini' && !hasKey && (
        <button
          onClick={() => setShowKeyInput(true)}
          className="w-full text-left text-[11px] text-amber-500 hover:underline px-1 flex items-center gap-1 mt-1 cursor-pointer"
        >
          <AlertCircle className="w-3 h-3" /> Set Gemini API Key to enable live chat
        </button>
      )}
      {currentProvider === 'groq' && !hasKey && (
        <button
          onClick={() => setShowKeyInput(true)}
          className="w-full text-left text-[11px] text-amber-500 hover:underline px-1 flex items-center gap-1 mt-1 cursor-pointer"
        >
          <AlertCircle className="w-3 h-3" /> Set Groq API Key to enable live chat
        </button>
      )}
    </div>
  );
};

export default AIProviderSwitcher;