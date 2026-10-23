import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { User, LogOut, Settings, ChevronDown, Zap, Heart, Layers, Crown, Terminal, Palette, Sun, Moon, BookOpen, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useUserStore } from '../../stores/userStore';
import { useNavigate } from 'react-router-dom';
import { getSafeAvatarUrl } from '../../lib/utils';
import { useAddonStore } from '../../store/addonStore';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import { getEnv } from '../../config/env';
import { useSupabase } from '../../providers/SupabaseProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { autoSeedDemoData } from '../../services/demo/autoSeedDemoData';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { signOut } = useAuth();
  const { showSuccess } = useNotifications();
  const user = useUserStore(state => state.user);
  const setUser = useUserStore(state => state.setUser);
  const navigate = useNavigate();
  const setSettingsModalOpen = useUIStore(state => state.setSettingsModalOpen);
  const { useMock } = getEnv();
  const { user: supabaseUser } = useSupabase();
  const { 
    geniebioEnabled, 
    nexusEnabled, 
    developerEnabled, 
    networkSyncEnabled, 
    creatorEnabled,
    hqEnabled,
    dashboardEnabled,
    emailEnabled,
    tasksEnabled,
    calendarEnabled,
    studiosEnabled,
    driveEnabled,
    knowledgeEnabled,
    aiAssistantEnabled,
    storeEnabled,
    academyEnabled,
    teamsEnabled,
    toggleGeniebio, 
    toggleNexus, 
    toggleDeveloper, 
    toggleNetworkSync,
    toggleCreator,
    toggleHq,
    toggleDashboard,
    toggleEmail,
    toggleTasks,
    toggleCalendar,
    toggleStudios,
    toggleDrive,
    toggleKnowledge,
    toggleAiAssistant,
    toggleStore,
    toggleAcademy,
    toggleTeams
  } = useAddonStore();

  // Token Tracker visibility state
  const [showTokenTracker, setShowTokenTracker] = useState<boolean>(
    () => localStorage.getItem('genieflow_show_token_tracker') !== 'false'
  );

  // Sync token tracker visibility across tab sessions or actions
  useEffect(() => {
    const handleStorage = () => {
      setShowTokenTracker(localStorage.getItem('genieflow_show_token_tracker') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTokenTracker = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !showTokenTracker;
    setShowTokenTracker(newValue);
    localStorage.setItem('genieflow_show_token_tracker', String(newValue));
    window.dispatchEvent(new Event('storage'));
    showSuccess(newValue ? 'Token usage panel enabled' : 'Token usage panel hidden');
    setIsOpen(false);
  }, [showTokenTracker, showSuccess]);

  const { currentSkin, setSkin, skins, isDark, toggleTheme } = useTheme();

  // Header Tour & Demo visibility
  const [showHeaderTour, setShowHeaderTour] = useState<boolean>(
    () => localStorage.getItem('genieflow_show_header_tour') === 'true'
  );
  const [showHeaderDemo, setShowHeaderDemo] = useState<boolean>(
    () => localStorage.getItem('genieflow_show_header_demo') === 'true'
  );

  useEffect(() => {
    const handleOptionsSync = () => {
      setShowHeaderTour(localStorage.getItem('genieflow_show_header_tour') === 'true');
      setShowHeaderDemo(localStorage.getItem('genieflow_show_header_demo') === 'true');
    };
    window.addEventListener('header-options-changed', handleOptionsSync);
    window.addEventListener('storage', handleOptionsSync);
    return () => {
      window.removeEventListener('header-options-changed', handleOptionsSync);
      window.removeEventListener('storage', handleOptionsSync);
    };
  }, []);

  const toggleHeaderTour = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextVal = !showHeaderTour;
    setShowHeaderTour(nextVal);
    localStorage.setItem('genieflow_show_header_tour', String(nextVal));
    window.dispatchEvent(new Event('header-options-changed'));
    window.dispatchEvent(new Event('storage'));
    showSuccess(nextVal ? 'Guided Tour enabled in header' : 'Guided Tour hidden from header');
  }, [showHeaderTour, showSuccess]);

  const toggleHeaderDemo = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextVal = !showHeaderDemo;
    setShowHeaderDemo(nextVal);
    localStorage.setItem('genieflow_show_header_demo', String(nextVal));
    window.dispatchEvent(new Event('header-options-changed'));
    window.dispatchEvent(new Event('storage'));
    showSuccess(nextVal ? 'Instant Demo enabled in header' : 'Instant Demo hidden from header');
  }, [showHeaderDemo, showSuccess]);

  const handleLaunchTourDirect = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-guided-tour'));
  }, []);

  const handleLaunchDemoDirect = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setUser({
      id: 'demo-user-id',
      email: 'demo-judge@xprize.org',
      name: 'XPRIZE Demo Administrator',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    autoSeedDemoData();
    localStorage.setItem('genieflow_demo_mode_active', 'true');
    localStorage.setItem('genieflow_authenticated', 'true');
    showSuccess('XPRIZE Instant Demo mode initialized!');
    navigate('/dashboard');
  }, [setUser, showSuccess, navigate]);

  // Handle missing user info gracefully - memoize this to prevent re-renders
  const safeUser = useMemo(() => {
    const candidateAvatar =
      (user?.avatar && !user.avatar.includes('default-avatar') ? user.avatar : null) ||
      supabaseUser?.user_metadata?.picture ||
      supabaseUser?.user_metadata?.avatar_url ||
      supabaseUser?.user_metadata?.avatar ||
      (supabaseUser as any)?.identities?.[0]?.identity_data?.picture ||
      (supabaseUser as any)?.identities?.[0]?.identity_data?.avatar_url ||
      localStorage.getItem('genieflow_user_avatar') ||
      localStorage.getItem('custom_user_avatar') ||
      user?.avatar;

    return {
      fullName: user?.fullName || supabaseUser?.user_metadata?.full_name || supabaseUser?.user_metadata?.name || supabaseUser?.user_metadata?.fullName || 'User',
      email: user?.email || supabaseUser?.email || 'user@example.com',
      avatar: candidateAvatar
    };
  }, [user, supabaseUser]);

  // Only log on initial render and when important values change
  useEffect(() => {
    // Removed debug logs for production stability
  }, [user, useMock, supabaseUser]);

  // Log menu state changes separately
  useEffect(() => {
    // Removed debug logs for production stability
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only run if menu is open
      if (!isOpen) return;
      
      // Check if click is outside both the menu and button
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    // Use capture phase to ensure our handler runs first
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]); // Add isOpen as dependency to re-add listener when menu opens/closes

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Memoize event handlers to prevent recreation on each render
  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsOpen(false); // Close menu first
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      showSuccess('Logged out successfully');
      navigate('/login');
    }
  }, [signOut, showSuccess, navigate]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Force a state update with function form
    setIsOpen(currentState => !currentState);
  }, [isOpen]);

  const navigateTo = useCallback((path: string) => {
    return () => {
      navigate(path);
      setIsOpen(false);
    };
  }, [navigate]);

  // Memoize the safe avatar URL to prevent recalculation on every render
  const safeAvatarUrl = useMemo(() => {
    if (!safeUser.avatar || safeUser.avatar.includes('default-avatar')) {
      return null;
    }
    return getSafeAvatarUrl(safeUser.avatar, safeUser.fullName);
  }, [safeUser.avatar, safeUser.fullName]);

  // Always render the dropdown even if user data is not fully available yet
  return (
    <div className="relative z-[100]" ref={menuRef} style={{ pointerEvents: 'auto' }}>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full focus:outline-none",
          "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
          "border border-slate-200 dark:border-slate-700",
          "focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
          "transition-all duration-200 overflow-hidden"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-menu-button"
      >
        {safeAvatarUrl ? (
          <img 
            src={safeAvatarUrl} 
            alt={safeUser.fullName} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={cn(
          "w-full h-full flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300",
          safeAvatarUrl && "hidden"
        )}>
          {safeUser.fullName && safeUser.fullName !== 'User' ? (
            safeUser.fullName.charAt(0).toUpperCase()
          ) : (
            <User className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
          )}
        </div>
      </button>

      {isOpen && (
        <div 
          className={cn(
            "fixed inset-0 z-[90]",
            "bg-transparent" // Invisible overlay to catch clicks
          )}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={cn(
              "absolute right-0 top-[40px] mt-2 w-72 sm:w-80 max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl bg-white dark:bg-slate-900",
              "border border-slate-200 dark:border-slate-800 ring-1 ring-black/5 focus:outline-none",
              "transform transition-all duration-200 ease-in-out",
              "z-[101]" // Ensure dropdown is above overlay
            )}
            onClick={(e) => e.stopPropagation()} // Prevent clicks from closing menu
          >
            {/* User Profile Header */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{safeUser.fullName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{safeUser.email}</p>
            </div>

            {/* Theme & Skin Suite Section */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Palette className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                  <span>Theme & Skin Suite</span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  title="Toggle Light / Dark mode"
                >
                  {isDark ? <Moon className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                  <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
              </div>

              <div className="space-y-1">
                {skins.map((s) => {
                  const isSelected = currentSkin.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSkin(s.id);
                        showSuccess(`Activated skin: ${s.name}`);
                      }}
                      className={cn(
                        "w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-all",
                        isSelected
                          ? "bg-indigo-50/90 dark:bg-slate-800 text-indigo-900 dark:text-white font-bold border border-indigo-200 dark:border-cyan-500/40 shadow-xs"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                          style={{ backgroundColor: s.accentColor }}
                        />
                        <div className="min-w-0 flex flex-col">
                          <span className="truncate">{s.name}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate font-normal">
                            {isDark ? s.darkBadge : s.lightBadge}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tour & Instant Demo Section */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Tour & Instant Demo Options
              </div>

              {/* Quick Launch Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLaunchTourDirect}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-slate-700 transition-all cursor-pointer"
                  title="Start step-by-step guided tour"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Start Tour</span>
                </button>

                <button
                  onClick={handleLaunchDemoDirect}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 transition-all cursor-pointer"
                  title="Seed demo dataset and activate instant demo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  <span>Run Demo</span>
                </button>
              </div>

              {/* Header Visibility On/Off Toggles */}
              <div className="pt-1 space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Show Tour in Header</span>
                  <button
                    onClick={toggleHeaderTour}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      showHeaderTour ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                    title={showHeaderTour ? "Click to hide from header" : "Click to show in header"}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      showHeaderTour ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Show Demo in Header</span>
                  <button
                    onClick={toggleHeaderDemo}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      showHeaderDemo ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                    title={showHeaderDemo ? "Click to hide from header" : "Click to show in header"}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      showHeaderDemo ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>
            </div>

            <div className="py-1" role="menu" aria-orientation="vertical">
              {useMock && (
                <div className="px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Mock Mode Active
                </div>
              )}
              <button
                onClick={navigateTo('/profile')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <User className="mr-2 h-4 w-4" />
                Profile & Accounts
              </button>

              <button
                onClick={navigateTo('/automation')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Zap className="mr-2 h-4 w-4" />
                Automation & Workflows
              </button>
              <button
                onClick={navigateTo('/integrations')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Layers className="mr-2 h-4 w-4" />
                Integration Hub
              </button>
              <button
                onClick={toggleTokenTracker}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Zap className="mr-2 h-4 w-4 text-amber-500" />
                {showTokenTracker ? 'Hide Token Panel' : 'Show Token Panel'}
              </button>
              <button
                onClick={navigateTo('/developer')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Terminal className="mr-2 h-4 w-4 text-indigo-500" />
                OS Diagnostics & SDK
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsModalOpen(true);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700 underline-offset-4 decoration-blue-500"
                )}
                role="menuitem"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
              
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <div className="px-4 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>Sidebar Navigation Items</span>
                <span className="text-[9px] font-normal text-slate-400">Toggle on/off</span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                {/* Dashboard */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Dashboard</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDashboard();
                      showSuccess(!dashboardEnabled ? 'Dashboard enabled in sidebar' : 'Dashboard hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      dashboardEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      dashboardEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* SutraFlow Studios */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">SutraFlow Studios</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleStudios();
                      showSuccess(!studiosEnabled ? 'Studios enabled in sidebar' : 'Studios hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      studiosEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      studiosEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* SutraDrive */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>SutraDrive (Vault)</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDrive();
                      showSuccess(!driveEnabled ? 'SutraDrive enabled in sidebar' : 'SutraDrive hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      driveEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      driveEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* SutraKnowledge */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>SutraKnowledge</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleKnowledge();
                      showSuccess(!knowledgeEnabled ? 'SutraKnowledge enabled in sidebar' : 'SutraKnowledge hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      knowledgeEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      knowledgeEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* AI Assistant */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>AI Assistant</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleAiAssistant();
                      showSuccess(!aiAssistantEnabled ? 'AI Assistant enabled in sidebar' : 'AI Assistant hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      aiAssistantEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      aiAssistantEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Email */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Email</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleEmail();
                      showSuccess(!emailEnabled ? 'Email enabled in sidebar' : 'Email hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      emailEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      emailEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Tasks */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Tasks</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTasks();
                      showSuccess(!tasksEnabled ? 'Tasks enabled in sidebar' : 'Tasks hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      tasksEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      tasksEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Calendar */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Calendar</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCalendar();
                      showSuccess(!calendarEnabled ? 'Calendar enabled in sidebar' : 'Calendar hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      calendarEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      calendarEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Store */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Store</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleStore();
                      showSuccess(!storeEnabled ? 'Store enabled in sidebar' : 'Store hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      storeEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      storeEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Academy */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Academy</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleAcademy();
                      showSuccess(!academyEnabled ? 'Academy enabled in sidebar' : 'Academy hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      academyEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      academyEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Teams */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Teams</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleTeams();
                      showSuccess(!teamsEnabled ? 'Teams enabled in sidebar' : 'Teams hidden from sidebar');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      teamsEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      teamsEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Creator Dashboard */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <Crown className="h-3 w-3 text-sky-500" />
                    Creator Dashboard
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCreator();
                      showSuccess(!creatorEnabled ? 'Creator Dashboard enabled' : 'Creator Dashboard disabled');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      creatorEnabled ? "bg-sky-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      creatorEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Sutra HQ */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Command HQ</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleHq();
                      showSuccess(!hqEnabled ? 'Sutra HQ enabled' : 'Sutra HQ disabled');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      hqEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      hqEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Developer Portal */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Developer Portal</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDeveloper();
                      showSuccess(!developerEnabled ? 'Developer Portal enabled' : 'Developer Portal disabled');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      developerEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      developerEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* GenieBio */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>GenieBio Genetics</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleGeniebio();
                      showSuccess(!geniebioEnabled ? 'GenieBio Genetics Hub enabled' : 'GenieBio Genetics Hub disabled');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      geniebioEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      geniebioEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Nexus Studio */}
                <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
                  <span>Nexus Studio</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleNexus();
                      showSuccess(!nexusEnabled ? 'Nexus Studio enabled' : 'Nexus Studio disabled');
                    }}
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      nexusEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      nexusEnabled ? "translate-x-3" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <div className="px-4 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Identity & Control
              </div>

              <button
                onClick={navigateTo('/cortex')}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <Heart className="mr-2 h-4 w-4 text-red-500" />
                Cortex
              </button>

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                role="menuitem"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 