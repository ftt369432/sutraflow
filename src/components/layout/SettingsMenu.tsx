import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';
import { useEmail } from '../../contexts/EmailContext';
import { IMAPConfigForm } from '../email/IMAPConfigForm';
import { EmailService } from '../../services/email';
import googleAuthService from '../../services/auth/googleAuth';
import { CalendarSettings } from '../settings/CalendarSettings';
import { AIServiceFactory } from '../../services/ai/aiServiceFactory';
import { heartbeat } from '../../cortex/Heartbeat';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { theme, setTheme } = useTheme();
  const { accounts, addAccount, removeAccount, loading, error } = useEmail();
  const [activeTab, setActiveTab] = useState('appearance');
  const [showIMAPForm, setShowIMAPForm] = useState(false);
  const [imapDefaultProvider, setImapDefaultProvider] = useState<'outlook' | 'yahoo' | 'aol' | 'custom'>('custom');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🧠 AI Engine settings state (reads from localStorage)
  const [aiProvider, setAiProvider] = useState<string>(
    () => localStorage.getItem('genieflow_ai_provider') || 'groq'
  );
  const [pulseMs, setPulseMs] = useState<number>(
    () => parseInt(localStorage.getItem('genieflow_heartbeat_pulse_ms') || '60000')
  );
  const [soulThrottleMs, setSoulThrottleMs] = useState<number>(
    () => parseInt(localStorage.getItem('genieflow_soul_throttle_ms') || '900000')
  );
  const [learningEveryN, setLearningEveryN] = useState<number>(
    () => parseInt(localStorage.getItem('genieflow_learning_every_n') || '5')
  );

  // 🧠 Autonomy mode — the master switch
  const [isAutonomous, setIsAutonomous] = useState<boolean>(
    () => localStorage.getItem('genieflow_autonomy_enabled') !== 'false'
  );
  const [savedConfirm, setSavedConfirm] = useState(false);

  // Toggle autonomy immediately — no save button needed
  const handleAutonomyToggle = (enabled: boolean) => {
    setIsAutonomous(enabled);
    heartbeat.setAutonomy(enabled);
    // Also update related timings based on mode
    if (!enabled) {
      // Reactive mode: slow the heartbeat down, it only needs to watch for messages
      localStorage.setItem('genieflow_heartbeat_pulse_ms', '60000');  // 60s tick is fine
      localStorage.setItem('genieflow_soul_throttle_ms', '999999999'); // effectively disabled
      setPulseMs(60000);
      setSoulThrottleMs(999999999);
    } else {
      // Autonomous mode: restore responsive timings
      localStorage.setItem('genieflow_heartbeat_pulse_ms', '60000');
      localStorage.setItem('genieflow_soul_throttle_ms', '900000'); // 15 min
      setPulseMs(60000);
      setSoulThrottleMs(900000);
    }
    console.log(`🧠 Autonomy ${enabled ? 'ENABLED' : 'DISABLED (Reactive mode)'} via Settings`);
  };

  const applyAISettings = () => {
    AIServiceFactory.switchProvider(aiProvider as any);
    localStorage.setItem('genieflow_heartbeat_pulse_ms', String(pulseMs));
    localStorage.setItem('genieflow_soul_throttle_ms', String(soulThrottleMs));
    localStorage.setItem('genieflow_learning_every_n', String(learningEveryN));
    setSavedConfirm(true);
    setTimeout(() => setSavedConfirm(false), 2500);
  };

  useEffect(() => {
    const checkAuth = async () => {
      await googleAuthService.initialize();
      setIsAuthenticated(googleAuthService.isSignedIn());
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await googleAuthService.signOut();
      setIsAuthenticated(false);
      // Remove Google account after logout
      const googleAccount = accounts.find(acc => acc.type === 'google');
      if (googleAccount) {
        await removeAccount(googleAccount.id);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleIMAPSubmit = async (config: any) => {
    try {
      const account = await EmailService.addIMAPAccount(config);
      addAccount(account);
      setShowIMAPForm(false);
    } catch (error) {
      console.error('Failed to add IMAP account:', error);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await removeAccount(accountId);
      const account = accounts.find(acc => acc.id === accountId);
      if (account?.type === 'google') {
        await handleLogout();
      }
    } catch (error) {
      console.error('Failed to remove account:', error);
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                  Settings
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 border-r border-gray-200 dark:border-gray-700">
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab('appearance')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'appearance'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Appearance
                    </button>
                    <button
                      onClick={() => setActiveTab('email')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'email'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Email Accounts
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'calendar'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Calendar
                    </button>
                    <button
                      onClick={() => setActiveTab('preferences')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'preferences'
                          ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Preferences
                    </button>
                    <button
                      onClick={() => setActiveTab('ai-engine')}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        activeTab === 'ai-engine'
                          ? 'bg-violet-50 dark:bg-violet-900 text-violet-600 dark:text-violet-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      ⚡ AI Engine
                    </button>
                  </nav>
                </div>

                {/* Content */}
                <div className="flex-1 pl-6">
                  {activeTab === 'appearance' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Theme
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setTheme('light')}
                          className={`w-full text-left px-3 py-2 rounded-md ${
                            theme === 'light'
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`w-full text-left px-3 py-2 rounded-md ${
                            theme === 'dark'
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'email' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Email Accounts
                      </h3>

                      {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md">
                          {error}
                        </div>
                      )}
                      
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading accounts...</p>
                        </div>
                      ) : (
                        <>
                          {/* Connected accounts */}
                          {accounts.length > 0 && (
                            <div className="space-y-3">
                              {accounts.map(account => (
                                <div
                                  key={account.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {account.email}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {account.type === 'google' ? 'Google Account' : 'IMAP'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveAccount(account.id)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add account buttons */}
                          <div className="space-y-2">
                            {isAuthenticated ? (
                              <button
                                onClick={handleLogout}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                              >
                                Sign Out of Google
                              </button>
                            ) : (
                              <button
                                onClick={handleLogin}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                              >
                                Sign In with Google
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setImapDefaultProvider('outlook');
                                setShowIMAPForm(true);
                              }}
                              className="w-full px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md flex items-center justify-center gap-2"
                            >
                              <span>Sign In with Microsoft</span>
                            </button>
                            <button
                              onClick={() => {
                                setImapDefaultProvider('custom');
                                setShowIMAPForm(true);
                              }}
                              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                            >
                              Add Other Email Account
                            </button>
                          </div>

                          {/* IMAP Configuration Form */}
                          {showIMAPForm && (
                            <IMAPConfigForm
                              onSubmit={handleIMAPSubmit}
                              onCancel={() => setShowIMAPForm(false)}
                              defaultProvider={imapDefaultProvider}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'calendar' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Calendar Settings
                      </h3>
                      <CalendarSettings />
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Preferences
                      </h3>
                      {/* Add preferences settings here */}
                    </div>
                  )}

                  {activeTab === 'ai-engine' && (
                    <div className="space-y-5">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <span>&#9889;</span> AI Engine
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">Token &amp; performance controls</span>
                      </h3>

                      {/* AUTONOMY MODE - THE MASTER SWITCH */}
                      <div className={`rounded-xl border-2 p-4 transition-all duration-300 ${
                        isAutonomous
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                          : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {isAutonomous ? 'Autonomous Mode' : 'Reactive Mode'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {isAutonomous
                                ? 'GenieFlow thinks and acts in the background'
                                : 'GenieFlow only responds when you talk to it'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAutonomyToggle(!isAutonomous)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                              isAutonomous ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            role="switch"
                            aria-checked={isAutonomous}
                            id="autonomy-toggle"
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                              isAutonomous ? 'translate-x-8' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className={`rounded-lg p-2.5 text-xs transition-all ${
                            !isAutonomous
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}>
                            <p className="font-semibold mb-1">Reactive</p>
                            <p>Only uses AI when you send a message. Near-zero background tokens.</p>
                            {!isAutonomous && <p className="mt-1 font-medium text-emerald-700 dark:text-emerald-400">Active now</p>}
                          </div>
                          <div className={`rounded-lg p-2.5 text-xs transition-all ${
                            isAutonomous
                              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 ring-1 ring-violet-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}>
                            <p className="font-semibold mb-1">Autonomous</p>
                            <p>Background agent checks for tasks &amp; proactively suggests actions.</p>
                            {isAutonomous && <p className="mt-1 font-medium text-violet-700 dark:text-violet-400">Active now</p>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                          Takes effect immediately — no restart needed
                        </p>
                      </div>

                      {/* Provider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Active AI Provider
                        </label>
                        <select
                          value={aiProvider}
                          onChange={e => setAiProvider(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="groq">🖥️ Groq LPU — Fast &amp; cheap (recommended)</option>
                          <option value="gemini">🧠 Gemini — Smart reasoning</option>
                          <option value="hybrid">🔀 Hybrid — Auto-route by complexity</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Groq is ~6× cheaper per token than Gemini Pro.</p>
                      </div>

                      {/* Heartbeat interval */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Heartbeat Pulse: <strong>{pulseMs / 1000}s</strong>
                        </label>
                        <input
                          type="range" min={10000} max={300000} step={10000}
                          value={pulseMs}
                          onChange={e => setPulseMs(Number(e.target.value))}
                          className="w-full accent-violet-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>10s (fast)</span><span>5min (balanced)</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">How often the system checks for new tasks. Lower = more responsive but more ticks.</p>
                      </div>

                      {/* Soul throttle */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Soul AI Throttle (idle): <strong>{Math.round(soulThrottleMs / 60000)}min</strong>
                        </label>
                        <input
                          type="range" min={60000} max={3600000} step={60000}
                          value={soulThrottleMs}
                          onChange={e => setSoulThrottleMs(Number(e.target.value))}
                          className="w-full accent-violet-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>1min</span><span>60min</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Min time between Soul background AI calls when you’re not actively chatting. <strong>15min</strong> is a good balance.</p>
                      </div>

                      {/* Learning rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Learning Rate: every <strong>{learningEveryN}</strong> message{learningEveryN !== 1 ? 's' : ''}
                        </label>
                        <input
                          type="range" min={1} max={20} step={1}
                          value={learningEveryN}
                          onChange={e => setLearningEveryN(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Every msg</span><span>Every 20 msgs</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">How often the Learning Service fires an AI call to analyze conversation patterns. Higher = fewer tokens.</p>
                      </div>

                      <button
                        onClick={applyAISettings}
                        className="w-full px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
                      >
                        ✅ Save AI Engine Settings
                      </button>

                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-xs text-gray-500">
                        💡 Tip: Open browser console and run <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">getTokenStats()</code> to see a live breakdown of token usage by source.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}