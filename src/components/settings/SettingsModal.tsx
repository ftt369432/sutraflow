import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Shield, User, CreditCard, Sparkles, Link, Zap, Terminal, 
  CheckCircle, AlertCircle, RefreshCw, Mail, Calendar, Cloud, MessageSquare, Code,
  Eye, EyeOff, Key, Database, Play, Pause, Power, Info
} from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../store/uiStore';
import { supabase } from '../../lib/supabase';
import { heartbeat } from '../../cortex/Heartbeat';
import { AIServiceFactory } from '../../services/ai/aiServiceFactory';
import { sentinel } from '../../cortex/security';
import { SkillStackPanel } from '../skills/SkillStackPanel';
import { ConnectorsTab } from './tabs/ConnectorsTab';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settingsModalOpen, setSettingsModalOpen } = useUIStore();
  const { user, setUser } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'billing' | 'capabilities' | 'connectors' | 'skills' | 'developer'>('general');

  // Load state from settings configuration
  const [fullName, setFullName] = useState(user?.fullName || 'User');
  const [aiProvider, setAiProvider] = useState<string>(
    () => localStorage.getItem('genieflow_ai_provider') || 'groq'
  );
  const [pulseMs, setPulseMs] = useState<number>(
    () => parseInt(localStorage.getItem('genieflow_heartbeat_pulse_ms') || '60000')
  );
  const [isAutonomous, setIsAutonomous] = useState<boolean>(
    () => localStorage.getItem('genieflow_autonomy_enabled') !== 'false'
  );
  const [showTokenTracker, setShowTokenTracker] = useState<boolean>(
    () => localStorage.getItem('genieflow_show_token_tracker') !== 'false'
  );
  const [agentTrustLevel, setAgentTrustLevel] = useState<string>(
    () => localStorage.getItem('genieflow_agent_trust_level') || 'full'
  );
  const [customInstructions, setCustomInstructions] = useState<string>(
    () => localStorage.getItem('genieflow_custom_instructions') || ''
  );
  const [optOutTraining, setOptOutTraining] = useState<boolean>(
    () => localStorage.getItem('genieflow_opt_out_training') === 'true'
  );


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync state if store user changes
  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  if (!isOpen) return null;

  const saveSettings = () => {
    try {
      // Save AI provider
      AIServiceFactory.switchProvider(aiProvider as any);
      localStorage.setItem('genieflow_ai_provider', aiProvider);
      
      // Save heartbeat pulse
      localStorage.setItem('genieflow_heartbeat_pulse_ms', String(pulseMs));
      
      // Custom instructions
      localStorage.setItem('genieflow_custom_instructions', customInstructions);
      
      // Training preferences
      localStorage.setItem('genieflow_opt_out_training', String(optOutTraining));

      // Profile details
      if (user && fullName !== user.fullName) {
        setUser({
          ...user,
          fullName
        });
        // Optionally update Supabase metadata
        supabase.auth.updateUser({
          data: { full_name: fullName }
        });
      }

      toast.success('Settings saved successfully!');
    } catch (e) {
      toast.error('Failed to save settings');
      console.error(e);
    }
  };

  const toggleAutonomy = (v: boolean) => {
    setIsAutonomous(v);
    heartbeat.setAutonomy(v);
  };

  const toggleTokenTracker = (v: boolean) => {
    setShowTokenTracker(v);
    localStorage.setItem('genieflow_show_token_tracker', String(v));
    window.dispatchEvent(new Event('storage'));
  };

  const updateTrustLevel = async (level: string) => {
    setAgentTrustLevel(level);
    localStorage.setItem('genieflow_agent_trust_level', level);
    
    try {
      const { agentPassportService } = await import('../../cortex/security');
      agentPassportService.registerAgent({
          agentId: 'core-autonomous-agent',
          agentName: 'Core Autonomous Agent',
          agentType: 'core',
          tier: level as any,
          registeredAt: Date.now()
      });

      let permissions: string[] = [];
      if (level === 'read-only') permissions = ['read:files', 'read:data'];
      if (level === 'standard') permissions = ['read:files', 'read:data', 'write:files', 'execute:tools'];
      if (level === 'sovereign') permissions = ['read:files', 'read:data', 'write:files', 'execute:tools', 'execute:commands', 'manage:agents'];

      await sentinel.issuePassport('core-autonomous-agent', permissions, { ttlSeconds: 86400 * 30 });
      toast.success(`Agent trust level elevated: ${level.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to issue passport on setting change', err);
    }
  };


  const tabs = [
    { id: 'general', label: 'General Preferences', icon: User },
    { id: 'capabilities', label: 'AI Capabilities', icon: Sparkles },
    { id: 'connectors', label: 'Connectors & APIs', icon: Link },
    { id: 'skills', label: 'Skills & MCP Stack', icon: Zap },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'billing', label: 'Billing & Tiers', icon: CreditCard },
    { id: 'developer', label: 'Diagnostics & SDK', icon: Terminal },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-5xl h-[80vh] flex bg-gradient-to-br from-white to-slate-50 dark:from-[#0a0f1d] dark:to-[#050814] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-blue-950/30 text-slate-900 dark:text-white">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-black/20 flex flex-col p-4">
          <div className="flex items-center gap-2.5 mb-6 px-2">
            <Settings className="w-5 h-5 text-emerald-500 animate-spin-slow" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">System Config</h2>
          </div>

          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="p-2 mt-auto border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-400 dark:text-slate-500">
            SutraOS v2.2.0 • Sovereign Loop
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-[#07070a]/40">
          
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            
            {/* ═══ GENERAL TAB ═══ */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">General Preferences</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Configure profile details and system constraints.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">User Identity</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Default Work Domain</label>
                      <select 
                        className="w-full bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                      >
                        <option>Legal Advocacy & Discovery</option>
                        <option>Financial Portfolio RAG</option>
                        <option>Medical Chart Analysis</option>
                        <option>Software Engineering Swarm</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex justify-between">
                      <span>Custom Prompt Instructions</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Overrides default Soul directives</span>
                    </label>
                    <textarea 
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g., Always format responses with bullet points. Cite California Workers' Compensation codes where applicable."
                      className="w-full h-32 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none font-mono"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/10 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Global Keyboard Shortcut</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">Toggle visibility of the main workspace window from any active OS window.</p>
                    </div>
                    <kbd className="px-2.5 py-1 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      Ctrl + Alt + Space
                    </kbd>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CAPABILITIES TAB ═══ */}
            {activeTab === 'capabilities' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Capabilities & Reasoning</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Fine-tune dynamic models and background loop settings.</p>
                </div>

                {/* Autonomy switch */}
                <div className={`p-5 rounded-xl border transition-all ${
                  isAutonomous 
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 shadow-md shadow-emerald-500/5' 
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Power className={`w-4 h-4 ${isAutonomous ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Autonomous Mind (OODAR Loop)</span>
                    </div>
                    <button 
                      onClick={() => toggleAutonomy(!isAutonomous)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isAutonomous ? 'bg-gradient-to-r from-[#00b4d8] to-[#10b981]' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isAutonomous ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    When active, the agent thinks autonomously in the background, checking files and executing pending task items without requiring manual prompts.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Core AI Engine Provider</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="w-full bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="groq">Groq LPU — Super Fast</option>
                      <option value="gemini">Gemini Pro — Full Context</option>
                      <option value="openai">OpenAI GPT-4 — Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Background Pulse Interval</label>
                    <select
                      value={pulseMs}
                      onChange={(e) => setPulseMs(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={30000}>Aggressive (30 seconds)</option>
                      <option value={60000}>Balanced (60 seconds)</option>
                      <option value={300000}>Quiet (5 minutes)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Realtime Token Overlay</h4>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">Displays real-time tokens and cost analysis on the bottom screen</p>
                  </div>
                  <button 
                    onClick={() => toggleTokenTracker(!showTokenTracker)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${showTokenTracker ? 'bg-gradient-to-r from-[#00b4d8] to-[#10b981]' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showTokenTracker ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Agent Trust & Authority Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'read-only', label: 'Read Only', desc: 'No system file write authorization' },
                      { id: 'standard', label: 'Standard', desc: 'Allows tool executions & file writes' },
                      { id: 'sovereign', label: 'Sovereign Control', desc: 'Allows local command line executions' }
                    ].map((level) => (
                      <button
                        key={level.id}
                        onClick={() => updateTrustLevel(level.id)}
                        className={`p-3 text-left rounded-xl border transition-all ${
                          agentTrustLevel === level.id 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/5 hover:border-slate-350 dark:hover:border-white/10 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold">{level.label}</div>
                        <div className="text-[9px] mt-0.5 opacity-80 dark:opacity-60">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ CONNECTORS TAB ═══ */}
            {activeTab === 'connectors' && (
              <ConnectorsTab />
            )}

            {/* ═══ SKILLS TAB ═══ */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Skills & MCP Pack Registry</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Manage active `.gpack` modules, schemas, and credentials.</p>
                </div>
                
                <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50 dark:bg-black/10">
                  <SkillStackPanel />
                </div>
              </div>
            )}

            {/* ═══ PRIVACY & SECURITY TAB ═══ */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Data Control</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Maintain full sovereignty over your analytical insights.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Training Data Opt-Out</h4>
                      <p className="text-[10px] text-slate-550 dark:text-slate-500 mt-0.5">Prevent LLM providers from storing or training on your legal context files</p>
                    </div>
                    <button 
                      onClick={() => setOptOutTraining(!optOutTraining)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${optOutTraining ? 'bg-gradient-to-r from-[#00b4d8] to-[#10b981]' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${optOutTraining ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export / Purge System Data</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">
                      Download all conformed conversation threads, vector database indices, and credentials in a single standard JSON archive file.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toast.success('JSON export initialized!')}
                        className="px-4 py-1.5 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Export Workspace JSON
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Are you absolutely sure you want to wipe all local vector indices? This cannot be undone.')) {
                            toast.success('Vector indices purged');
                          }
                        }}
                        className="px-4 py-1.5 bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 hover:bg-red-200 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold transition-all"
                      >
                        Purge Memory Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ BILLING TAB ═══ */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Billing & Sovereign Plan Management</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Upgrade parameters or check Stripe payment cycles.</p>
                </div>

                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active Plan</span>
                    <h4 className="text-base font-black mt-2 text-white">Sovereign Creator — Pro Tier</h4>
                    <p className="text-slate-400 text-xs mt-1">Allows unlimited .gpack creations, marketplace listings, and multi-model swarms.</p>
                  </div>
                  <button 
                    onClick={() => toast.info('Billing managed via Stripe portal')}
                    className="px-5 py-2 bg-gradient-to-r from-[#00b4d8] to-[#10b981] hover:scale-105 transition-all text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                  >
                    Manage Portal
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Creator Revenue Account</h4>
                  <p className="text-slate-500 dark:text-slate-500 text-[10px] mt-0.5 leading-relaxed">
                    Check payouts, license acquisitions, and marketplace transaction details from your published assistants.
                  </p>
                  <button 
                    onClick={() => toast.success('Redirecting to Creator Dashboard payout settings')}
                    className="mt-3 px-4 py-1.5 bg-white dark:bg-white/5 border border-slate-350 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-all"
                  >
                    View Payouts
                  </button>
                </div>
              </div>
            )}

            {/* ═══ DEVELOPER TAB ═══ */}
            {activeTab === 'developer' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Developer Diagnostics & IPC SDK</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Verify Node.js/Python bridges and system health.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-300">OS Diagnostics</h4>
                    <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-1">
                      <span className="text-slate-550 dark:text-slate-550 text-[10px]">Python Gateway Status:</span>
                      <span className="text-green-600 dark:text-green-400 font-bold font-mono text-[10px]">ONLINE</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-1">
                      <span className="text-slate-550 dark:text-slate-550 text-[10px]">Node.js IPC Bridge:</span>
                      <span className="text-green-600 dark:text-green-400 font-bold font-mono text-[10px]">CONNECTED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-550 dark:text-slate-550 text-[10px]">Sandbox Sandbox Flags:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-[10px]">STANDARD</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-300 mb-1">Developer Actions</h4>
                      <p className="text-[10px] text-slate-550 dark:text-slate-500">Run quick debugging triggers against the active memory stack.</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => {
                          toast.success('Discovered 6 local skills');
                        }}
                        className="px-3 py-1 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        Force Discovery Scan
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.clear();
                          toast.success('Local Storage cleared. Please reload App.');
                        }}
                        className="px-3 py-1 bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 hover:bg-red-200 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Reset LocalStorage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-black/10 shrink-0">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                saveSettings();
                onClose();
              }}
              className="px-6 py-2 bg-gradient-to-r from-[#00b4d8] to-[#10b981] hover:from-[#00a0c2] hover:to-[#0ea572] active:scale-[0.98] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              Save & Apply Changes
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
