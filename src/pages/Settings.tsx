import React, { useEffect, useState } from 'react';
import { useUserStore, SubscriptionTier, UserProfile } from '../stores/userStore';
import { Spinner } from '../components/ui/Spinner';
import { supabase } from '../lib/supabase';
import { TokenRefreshStatus } from '../components/auth/TokenRefreshStatus';
import { heartbeat } from '../cortex/Heartbeat';
import { AIServiceFactory } from '../services/ai/aiServiceFactory';
import { User, Cpu, Shield, Layout, Database, Zap, ChevronRight } from 'lucide-react';
import { sentinel } from '../cortex/security';

const NAV_ITEMS = [
  { id: 'account',   label: 'Account Profile',  icon: User },
  { id: 'ai-core',   label: 'AI Core',           icon: Cpu },
  { id: 'interface', label: 'Interface',          icon: Layout },
  { id: 'security',  label: 'Security',           icon: Shield },
  { id: 'memory',    label: 'Knowledge Cache',    icon: Database },
];

export function Settings() {
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai-core');

  // AI Engine State
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        if (user) { setIsLoading(false); return; }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'User',
            subscription: { plan: 'free' as SubscriptionTier, status: 'active', type: 'individual', currentPeriodEnd: new Date().toISOString() }
          };
          setUser(userProfile);
        }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    }
    loadUserData();
  }, [user, setUser]);

  const saveAISettings = () => {
    AIServiceFactory.switchProvider(aiProvider as any);
    localStorage.setItem('genieflow_ai_provider', aiProvider);
    localStorage.setItem('genieflow_heartbeat_pulse_ms', String(pulseMs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
    
    // Register the agent identity to issue the passport
    const { agentPassportService } = await import('../cortex/security');
    agentPassportService.registerAgent({
        agentId: 'core-autonomous-agent',
        agentName: 'Core Autonomous Agent',
        agentType: 'core',
        tier: level as any,
        registeredAt: Date.now()
    });

    let permissions: any[] = [];
    if (level === 'read-only') permissions = ['read:files', 'read:data'];
    if (level === 'standard') permissions = ['read:files', 'read:data', 'write:files', 'execute:tools'];
    if (level === 'sovereign') permissions = ['read:files', 'read:data', 'write:files', 'execute:tools', 'execute:commands', 'manage:agents'];

    // Issue new passport
    await sentinel.issuePassport('core-autonomous-agent', permissions, { ttlSeconds: 86400 * 30 }); // 30 day TTL for settings
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your account, AI behavior, and integrations.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                    activeTab === id
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon size={16} className={activeTab === id ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'} />
                  <span className="flex-1 text-left">{label}</span>
                  {activeTab === id && <ChevronRight size={14} className="text-blue-400" />}
                </button>
              ))}
            </div>
          </nav>

          {/* Content Panel */}
          <main className="flex-1 min-w-0">

            {/* ═══ AI CORE TAB ═══ */}
            {activeTab === 'ai-core' && (
              <div className="space-y-6">
                {/* Autonomy Card */}
                <div className={`rounded-2xl border-2 p-6 transition-all duration-300 ${
                  isAutonomous
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Zap size={16} className={isAutonomous ? 'text-purple-500' : 'text-gray-400'} />
                        Autonomous Mind
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isAutonomous
                          ? 'Agent is active — thinking in the background, managing missions.'
                          : 'Reactive mode — GenieFlow only responds when you send a message.'}
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={isAutonomous}
                      onChange={toggleAutonomy}
                      activeColor="bg-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ModeCard
                      active={!isAutonomous}
                      title="Reactive"
                      desc="Responds only to your messages. Zero background token cost."
                      activeClass="bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
                    />
                    <ModeCard
                      active={isAutonomous}
                      title="Autonomous"
                      desc="Background agent proactively monitors and acts on your missions."
                      activeClass="bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400"
                    />
                  </div>
                </div>

                {/* Engine Tuning */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Engine Tuning</h3>

                  <div className="grid grid-cols-2 gap-5">
                    <SettingField label="Active AI Provider">
                      <select
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="groq">Groq LPU — Ultra Fast</option>
                        <option value="gemini">Gemini — Complex Reasoning</option>
                        <option value="openai">OpenAI — Standard</option>
                      </select>
                    </SettingField>

                    <SettingField label="Background Pulse Rate">
                      <select
                        value={pulseMs}
                        onChange={(e) => setPulseMs(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={30000}>Aggressive (30s)</option>
                        <option value={60000}>Balanced (60s)</option>
                        <option value={300000}>Economical (5 min)</option>
                        <option value={900000}>Low Power (15 min)</option>
                      </select>
                    </SettingField>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Token Usage Panel</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show real-time usage overlay in the corner</p>
                    </div>
                    <ToggleSwitch enabled={showTokenTracker} onChange={toggleTokenTracker} activeColor="bg-green-500" />
                  </div>

                  <button
                    onClick={saveAISettings}
                    className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
                  >
                    {saved ? '✅ Saved!' : 'Save AI Core Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ ACCOUNT TAB ═══ */}
            {activeTab === 'account' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                    {user?.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{user?.fullName || 'User'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold border border-green-200 dark:border-green-800">
                      {user?.subscription?.plan || 'Free'} Plan · Active
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Session Status</h3>
                  <TokenRefreshStatus showDetails={true} className="max-w-none" />
                </div>
              </div>
            )}

            {/* ═══ SECURITY TAB ═══ */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">Agent & API Verification</h3>
                  <div className="space-y-4">
                    <SecurityRow label="Gemini API Key" status="configured" />
                    <SecurityRow label="Groq LPU API Key" status="configured" />
                    <SecurityRow label="Supabase Auth" status="active" />
                    <SecurityRow label="Google OAuth" status="active" />
                    <SecurityRow label="Sandbox Isolation" status="warning" note="iframe sandbox flags detected in console" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Agent Trust Level</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Controls what the autonomous agent can do without your approval.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'read-only', label: 'Read Only' },
                      { id: 'standard', label: 'Standard' },
                      { id: 'sovereign', label: 'Full Autonomy' }
                    ].map((level) => (
                      <button 
                        key={level.id} 
                        onClick={() => updateTrustLevel(level.id)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                          agentTrustLevel === level.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ INTERFACE TAB ═══ */}
            {activeTab === 'interface' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Display Preferences</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Compact Message View</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reduce padding between chat messages</p>
                  </div>
                  <ToggleSwitch enabled={false} onChange={() => {}} activeColor="bg-blue-500" />
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Show Cortex Status Bar</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Display heartbeat and mission status at bottom</p>
                  </div>
                  <ToggleSwitch enabled={true} onChange={() => {}} activeColor="bg-blue-500" />
                </div>
              </div>
            )}

            {/* ═══ MEMORY TAB ═══ */}
            {activeTab === 'memory' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Knowledge Cache</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage the embedded knowledge vectors and Soul memory state.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 px-4 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 hover:text-red-600 transition-colors text-left">
                    <p className="font-semibold">Clear Embedding Cache</p>
                    <p className="text-xs text-gray-400 mt-0.5">Forces re-index on next search</p>
                  </button>
                  <button className="py-3 px-4 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 hover:text-amber-600 transition-colors text-left">
                    <p className="font-semibold">Reset Soul State</p>
                    <p className="text-xs text-gray-400 mt-0.5">Clears learned behavioral patterns</p>
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onChange, activeColor }: { enabled: boolean; onChange: (v: boolean) => void; activeColor: string }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? activeColor : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ModeCard({ active, title, desc, activeClass }: { active: boolean; title: string; desc: string; activeClass: string }) {
  return (
    <div className={`p-3 rounded-xl border text-xs transition-all ${active ? activeClass : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
      <p className="font-bold mb-1">{title}</p>
      <p className="leading-relaxed">{desc}</p>
    </div>
  );
}

function SecurityRow({ label, status, note }: { label: string; status: 'active' | 'configured' | 'warning' | 'missing'; note?: string }) {
  const colors = {
    active:     'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400',
    configured: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400',
    warning:    'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
    missing:    'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {note && <p className="text-xs text-amber-500 mt-0.5">{note}</p>}
      </div>
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status}
      </span>
    </div>
  );
}

export default Settings;