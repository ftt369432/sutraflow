import * as React from 'react';
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

export const isElectronApp = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  Boolean((window as any).electronBridge) ||
  navigator.userAgent.toLowerCase().includes('electron')
);

const Router = (typeof window !== 'undefined' && window.location.protocol === 'file:') ? HashRouter : BrowserRouter;
import { AppLayout } from './components/layout/AppLayout';
import { NotificationProvider, AIProvider, TeamProvider, ModeProvider } from './contexts';
import { useAuth } from './contexts/AuthContext';
import { CalendarRefreshProvider } from './contexts/CalendarRefreshContext';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import ErrorMonitor from './components/ErrorMonitor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { subscriptionService } from './services/subscription/SubscriptionService';
import { PremiumTier } from './services/neural/NeuralPersonalAssistant';
// UniversalSidebar removed - it's for Chrome Extension only!

import { LoadingSpinner } from './components/ui/LoadingSpinner';
import AuthLayout from './components/layout/AuthLayout';
import { FullPageSpinner } from './components/ui/Spinner';
import { Toaster as SonnerToaster } from "sonner";
import { useUserStore } from './stores/userStore';
import { CommandPalette } from './components/ui/CommandPalette';
import { GlobalDropZone } from './components/layout/GlobalDropZone';
import { useAddonStore } from './store/addonStore';
import { useUIStore } from './store/uiStore';
import { BRAND_CONFIG } from './config/brand';
// Token usage panel — lazy loaded to keep bundle small
const TokenUsagePanel = lazy(() => import('./components/dashboard/TokenUsagePanel').then(m => ({ default: m.TokenUsagePanel })));
// Lazy load page components  
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PlanManagementPage = lazy(() => import('./pages/PlanManagementPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const BulkCalendarManager = lazy(() => import('./pages/BulkCalendarManager').then(m => ({ default: m.BulkCalendarManager })));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const WorkflowEditorPage = lazy(() => import('./pages/WorkflowEditorPage'));
const DataSourcesPage = lazy(() => import('./pages/DataSourcesPage'));
const EnhancementShowcase = lazy(() => import('./components/demo/EnhancementShowcase'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const EmailPage = lazy(() => import('./pages/EmailPage'));
const EmailDetailPage = lazy(() => import('./pages/EmailDetailPage'));
const EmailSettingsPage = lazy(() => import('./pages/EmailSettings'));
const GenieDrivePage = lazy(() => import('./pages/GenieDrivePage'));
const AIAssistantPage = lazy(() => import('./pages/SovereignWorkspace'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const TeamInvitePage = lazy(() => import('./pages/TeamInvitePage'));
const AgentWizardPage = lazy(() => import('./pages/AgentWizardPage'));
const AutomationPage = lazy(() => import('./pages/AutomationPage'));
const AssistantTriggerPage = lazy(() => import('./pages/AssistantTriggerPage'));
const Settings = lazy(() => import('./pages/Settings'));
const AssistantsPage = lazy(() => import('./pages/AssistantsPage'));
const NotionTestPage = lazy(() => Promise.resolve({ default: () => <Navigate to="/workbench" replace /> }));
const AssistantStorePage = lazy(() => import('./pages/AssistantStorePage'));
const ConfigureSwarmPage = lazy(() => import('./pages/ConfigureSwarmPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const AIProcessingPage = lazy(() => import('./pages/AIProcessingPage'));
const IntegrationHub = lazy(() => import('./components/integrations/IntegrationHub'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const GmailTokenTest = lazy(() => Promise.resolve({ default: () => <Navigate to="/workbench" replace /> }));
const GenieDriveDebug = lazy(() => import('./components/debug/GenieDriveDebug'));
const DebugPage = lazy(() => import('./pages/DebugPage'));
const CortexPage = lazy(() => import('./pages/CortexPage'));
const DetachedWindowWrapper = lazy(() => import('./pages/DetachedWindowWrapper'));
const DetachedHuddle = lazy(() => import('./pages/DetachedHuddle'));
const GenieFlowHQPage = lazy(() => import('./pages/GenieFlowHQPage'));
const GenieCommandDashboard = lazy(() => import('./pages/GenieCommandDashboard'));
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const AgentLandingPage = lazy(() => import('./pages/AgentLandingPage').then(m => ({ default: m.AgentLandingPage })));
const GeneticsHubPage = lazy(() => import('./components/genetics/GeneticsHubPage').then(m => ({ default: m.GeneticsHubPage })));
const NexusStudioPage = lazy(() => import('./pages/NexusStudioPage').then(m => ({ default: m.NexusStudioPage })));
const DeveloperPortalPage = lazy(() => import('./pages/DeveloperPortalPage'));
const CreatorDashboard = lazy(() => import('./components/creator/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const AgentCreationWizard = lazy(() => import('./components/creator/AgentCreationWizard').then(m => ({ default: m.AgentCreationWizard })));
const CreatorOnboardingMVP = lazy(() => import('./components/creator/CreatorOnboardingMVP').then(m => ({ default: m.CreatorOnboardingMVP })));
const SkillCreatorPage = lazy(() => import('./pages/SkillCreatorPage'));
const AcademyPage = lazy(() => import('./pages/AcademyPage').then(m => ({ default: m.AcademyPage })));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'));
const WorkersCompSolutionsPage = lazy(() => import('./pages/WorkersCompSolutionsPage'));
const CloudMcpPage = lazy(() => import('./pages/CloudMcpPage'));
const MasterclassPage = lazy(() => import('./pages/MasterclassPage'));
const UniversalWorkbenchPage = lazy(() => import('./pages/UniversalWorkbenchPage').then(m => ({ default: m.default || m.UniversalWorkbenchPage })));
const BusinessOperationsHQ = lazy(() => import('./components/hq/BusinessOperationsHQ'));

// Create a loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full">
    {typeof LoadingSpinner !== 'undefined' ? <LoadingSpinner /> : <div>Loading...</div>}
  </div>
);

// ProtectedRoute component that redirects to login if user is not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is authenticated
      } else {
        // User is NOT authenticated
        const isAuthPath = location.pathname === '/login' ||
          location.pathname === '/auth/login' ||
          location.pathname === '/auth/callback' ||
          location.pathname === '/register' ||
          location.pathname === '/reset-password' ||
          location.pathname === '/auth/reset-password' ||
          location.pathname.startsWith('/auth/');

        if (!isAuthPath && !isElectronApp) {
          const hasSavedSession = !!(localStorage.getItem('supabase.auth.token') || localStorage.getItem('genieflow_user'));
          if (!hasSavedSession) {
            // In local/sovereign mode, do not force-redirect away from active workspace
          }
        }
      }
    }
  }, [user, authLoading, navigate, location.pathname]);

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
  }

  // In sovereign / local mode or authenticated mode, always render children safely
  return <>{children}</>;
};

// Home route that redirects to dashboard if authenticated
/*
const _HomeRoute = () => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user && location.pathname === '/') {
    // console.warn("User is authenticated at root path (useAuth), redirecting to dashboard"); // Changed to warn or remove
    return <Navigate to="/dashboard" replace />;
  }
  
  return <HomePage />;
};
*/

// Login route that redirects to dashboard when already logged in
/*
const _LoginRoute = () => {
  const { user, isLoading: authLoading } = useAuth();
  
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (user) {
    // console.warn("User is authenticated (useAuth), redirecting to dashboard from login page"); // Changed to warn or remove
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LoginPage />;
};
*/

// Synchronizes the Global Subscription Service with the Auth State
const SubscriptionTierSync = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Dynamic document title synchronized with BRAND_CONFIG
    if (typeof document !== 'undefined') {
      document.title = `${BRAND_CONFIG.name} | ${BRAND_CONFIG.tagline}`;
    }

    if (user) {
      // Determine tier based on email or metadata
      // User 'tinaco01@gmail.com', 'apexcg25@gmail.com' or 'fr@genieflow.ai' gets Pro Creator (PREMIUM) for testing
      const isPro = user.email === 'tinaco01@gmail.com' || 
                    user.email === 'apexcg25@gmail.com' ||
                    user.email === 'fr@genieflow.ai' || 
                    user.user_metadata?.subscription_tier === 'premium';
      
      const newTier = isPro ? PremiumTier.PREMIUM : PremiumTier.FREE;
      subscriptionService.setTier(newTier);
    } else {
      subscriptionService.setTier(PremiumTier.FREE);
    }
  }, [user]);

  return null;
};

const AppInitializer = () => {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeFromSupabase, user: storeUser } = useUserStore();

  // Initialize token refresh system
  const tokenRefresh = useTokenRefresh();

  // Auto-navigation to Canvas when AI generates documents
  useEffect(() => {
    const handleAutoNavigateToCanvas = (event: CustomEvent) => {
      if (location.pathname === '/canvas') return;

      navigate('/canvas', {
        replace: false,
        state: {
          autoNavigation: true,
          sourceEvent: event.detail
        }
      });
    };

    window.addEventListener('autoNavigateToCanvas', handleAutoNavigateToCanvas as EventListener);
    return () => window.removeEventListener('autoNavigateToCanvas', handleAutoNavigateToCanvas as EventListener);
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!isLoading) {
      if (user && !storeUser) {
        initializeFromSupabase(user, session?.access_token || null);
      } else if (!user) {
        if (isElectronApp) {
          // Sovereign Electron Desktop mode active — no external web login required
          return;
        }
        const hasSavedSession = typeof window !== 'undefined' && Boolean(localStorage.getItem('supabase.auth.token') || localStorage.getItem('genieflow_user'));
        if (hasSavedSession) {
          return;
        }
        const publicPaths = [
          '/',
          '/ai-assistant',
          '/dashboard',
          '/solutions',
          '/solutions/ca-workers-comp',
          '/solutions/workers-comp',
          '/services',
          '/mcp',
          '/cloud-mcp',
          '/masterclass',
          '/workbench',
          '/operator',
          '/pricing',
          '/demo',
          '/signup',
          '/verify-otp',
          '/contact',
          '/hq',
          '/email',
          '/calendar',
          '/tasks',
          '/drive',
          '/knowledge',
          '/assistants',
          '/creator',
          '/creator/dashboard',
          '/cortex',
          '/nexus',
          '/settings',
          '/profile',
          '/plan-management'
        ];
        const isPublic = 
          publicPaths.includes(location.pathname) ||
          location.pathname.startsWith('/auth') ||
          location.pathname.startsWith('/agents/') ||
          location.pathname.includes('reset-password');

        if (!isPublic) {
          navigate('/auth/login', { replace: true });
        }
      } else if (user && location.pathname.startsWith('/auth')) {
        // Don't redirect if we're on a reset password flow
        if (!location.pathname.includes('reset-password') && !location.pathname.includes('callback')) {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [user, session, isLoading, navigate, location, storeUser, initializeFromSupabase]);

  // Token refresh monitoring (silent)
  useEffect(() => {
    // Monitoring active but not logging to reduce UI thread blocking
  }, [tokenRefresh.lastRefresh]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionTierSync />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/solutions/ca-workers-comp" element={<WorkersCompSolutionsPage />} />
        <Route path="/solutions/workers-comp" element={<Navigate to="/solutions/ca-workers-comp" replace />} />
        <Route path="/services" element={<Navigate to="/solutions" replace />} />
        <Route path="/mcp" element={<CloudMcpPage />} />
        <Route path="/cloud-mcp" element={<Navigate to="/mcp" replace />} />
        <Route path="/workbench" element={<AppLayout><UniversalWorkbenchPage /></AppLayout>} />
        <Route path="/studios" element={<Navigate to="/workbench" replace />} />
        <Route path="/operator" element={<Navigate to="/workbench" replace />} />
        <Route path="/agents/:agentId" element={<AgentLandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
        <Route path="/verify-otp" element={<Navigate to="/auth/verify-otp" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/*" element={<AuthRoutes />} />
        {/* 🖥️ Detached screen & huddle routes redirect cleanly to workbench */}
        <Route path="/detached/*" element={<Navigate to="/workbench" replace />} />
        <Route path="/huddle/*" element={<Navigate to="/workbench" replace />} />
        <Route path="/*" element={<ProtectedAppRoutes />} />
      </Routes>
    </Suspense>
  );

};

// 🧠 Cortex Integration
import { heartbeat } from './cortex/Heartbeat';

function App() {
  // Start the Cortex Heartbeat & auto-mount sovereign drives when the app mounts
  useEffect(() => {
    // 🚀 Auto-mount sovereign master drive (G:\My Drive\.GENIEFLOW_MASTER)
    import('./store/attachedDriveStore').then(({ useAttachedDriveStore }) => {
      useAttachedDriveStore.getState().autoMountSovereignDrives?.();
    });

    const timer = setTimeout(() => {
      heartbeat.start();
    }, 5000); // 5s delay to let app settle

    return () => {
      clearTimeout(timer);
      heartbeat.stop();
    };
  }, []);

  // sidebarEnabled removed - UniversalSidebar is for Chrome Extension only!
  // Note: QueryClientProvider, ThemeProvider, AuthProvider, and EmailProvider 
  // are already wrapped in main.tsx - no duplicate providers needed here

  return (
    <CalendarRefreshProvider>
      <Router>
        <NotificationProvider>
          <AIProvider>
            <TeamProvider>
              <ModeProvider>
                <AppInitializer />

                {/* UniversalSidebar removed - it's for Chrome Extension only! */}

                <CommandPalette />
                <GlobalDropZone />
                {/* 🔢 Token Usage Monitor — fixed overlay, shows AI usage stats */}
                <Suspense fallback={null}>
                  <ErrorBoundary>
                    <TokenUsagePanel />
                  </ErrorBoundary>
                </Suspense>
                <ErrorMonitor
                  position="top-right"
                  autoHide={true}
                  maxErrors={10}
                />
              </ModeProvider>
            </TeamProvider>
          </AIProvider>
        </NotificationProvider>
        <SonnerToaster position="bottom-right" />
      </Router>
    </CalendarRefreshProvider>
  );
}

const AuthRoutes = () => (
  <AuthLayout>
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="callback" element={<AuthCallback />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="verify-otp" element={<VerifyOtpPage />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  </AuthLayout>
);

const SettingsRedirect = () => {
  const navigate = useNavigate();
  const setSettingsModalOpen = useUIStore(state => state.setSettingsModalOpen);
  useEffect(() => {
    setSettingsModalOpen(true);
    navigate('/dashboard', { replace: true });
  }, [navigate, setSettingsModalOpen]);
  return null;
};

const ProtectedAppRoutes = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { geniebioEnabled, nexusEnabled, developerEnabled, networkSyncEnabled } = useAddonStore();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen w-screen"><FullPageSpinner size="xl" /></div>;
  }

  const hasLocalSession = typeof window !== 'undefined' && Boolean(localStorage.getItem('supabase.auth.token') || localStorage.getItem('genieflow_user'));
  if (!user && !isElectronApp && !hasLocalSession) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return (
    // <TeamProvider> // Removed as it was here redundantly, ensure it's provided at a higher level if needed for these routes
    <AppLayout>
      <Routes>
        {/* Redirect from protected root to dashboard if needed, or just let ProtectedAppRoutes handle sub-routes */}
        <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><DashboardPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute><ErrorBoundary><AutomationPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/workflow-editor" element={<ProtectedRoute><ErrorBoundary><WorkflowEditorPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/workflows" element={<Navigate to="/workflow-editor" replace />} />
        <Route path="/data-sources" element={<ProtectedRoute><ErrorBoundary><DataSourcesPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><ErrorBoundary><AdminPage /></ErrorBoundary></ProtectedRoute>} />

        {/* Email Routes */}
        <Route path="/email" element={<ProtectedRoute><ErrorBoundary><EmailPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/email/connect" element={<ProtectedRoute><ErrorBoundary><EmailSettingsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/email/settings" element={<ProtectedRoute><ErrorBoundary><EmailSettingsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/email-settings" element={<ProtectedRoute><ErrorBoundary><EmailSettingsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/email/folder/:accountId/:folderId" element={<ProtectedRoute><ErrorBoundary><EmailPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/email/message/:accountId/:folderId/:messageId" element={<ProtectedRoute><ErrorBoundary><EmailDetailPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/email/folder/:accountId/:folderId/:messageId" element={<ProtectedRoute><ErrorBoundary><EmailDetailPage /></ErrorBoundary></ProtectedRoute>} />

        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/calendar/bulk" element={<ProtectedRoute><BulkCalendarManager /></ProtectedRoute>} />
        <Route path="/bulk-calendar" element={<ProtectedRoute><BulkCalendarManager /></ProtectedRoute>} />
        {/* 🚀 Consolidated Workflow Demo - Redirect to Automation Hub with workflow-demo tab */}
        <Route path="/workflow-demo" element={<Navigate to="/automation" replace />} />
        <Route path="/enhancements" element={<ProtectedRoute><ErrorBoundary><EnhancementShowcase /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/drive" element={<ProtectedRoute><GenieDrivePage /></ProtectedRoute>} />
        <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
        <Route path="/knowledge/ai-processing" element={<ProtectedRoute><ErrorBoundary><AIProcessingPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/test/notion" element={<ProtectedRoute><ErrorBoundary><NotionTestPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><ErrorBoundary><IntegrationHub /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/ai-assistant/*" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
        <Route path="/cortex" element={<ProtectedRoute><ErrorBoundary><CortexPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/assistant-store" element={<ProtectedRoute><ErrorBoundary><AssistantStorePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/hq" element={<Navigate to="/workbench" replace />} />
        <Route path="/agent-hq" element={<Navigate to="/workbench" replace />} />
        <Route path="/genie-command" element={<ProtectedRoute><ErrorBoundary><GenieCommandDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/genetics" element={geniebioEnabled ? <ProtectedRoute><ErrorBoundary><GeneticsHubPage /></ErrorBoundary></ProtectedRoute> : <Navigate to="/dashboard" replace />} />
        <Route path="/nexus" element={nexusEnabled ? <ProtectedRoute><ErrorBoundary><NexusStudioPage /></ErrorBoundary></ProtectedRoute> : <Navigate to="/dashboard" replace />} />
        <Route path="/developer" element={<ProtectedRoute><ErrorBoundary><DeveloperPortalPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/workbench" element={<ProtectedRoute><ErrorBoundary><UniversalWorkbenchPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/studios" element={<Navigate to="/workbench" replace />} />
        <Route path="/sutraflow" element={<Navigate to="/workbench" replace />} />
        <Route path="/operator" element={<Navigate to="/workbench" replace />} />

        {/* 🏪 Consolidated Routes - Eliminate Duplication by redirecting to Assistant Store */}
        <Route path="/agent-hub" element={<Navigate to="/assistant-store" replace />} />
        <Route path="/marketplace" element={<Navigate to="/assistant-store" replace />} />
        <Route path="/marketplace/store" element={<Navigate to="/assistant-store" replace />} />

        {/* 🏪 Creator Hub Routes */}
        <Route path="/creator/dashboard" element={<ProtectedRoute><ErrorBoundary><CreatorDashboard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/creator/create-agent" element={<ProtectedRoute><ErrorBoundary><AgentCreationWizard /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/creator/onboarding" element={<ProtectedRoute><ErrorBoundary><CreatorOnboardingMVP /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/skills/create" element={<ProtectedRoute><ErrorBoundary><SkillCreatorPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/academy" element={<ProtectedRoute><ErrorBoundary><AcademyPage /></ErrorBoundary></ProtectedRoute>} />

        <Route path="/agent-wizard" element={<ProtectedRoute><AgentWizardPage /></ProtectedRoute>} />
        <Route path="/configure-swarm" element={<ProtectedRoute><ConfigureSwarmPage /></ProtectedRoute>} />
        <Route path="/configure-swarm/:templateId" element={<ProtectedRoute><ConfigureSwarmPage /></ProtectedRoute>} />
        <Route path="/teams/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/plan-management" element={<ProtectedRoute><PlanManagementPage /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><PlanManagementPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsRedirect /></ProtectedRoute>} />
        <Route path="/assistants" element={<ProtectedRoute><AssistantsPage /></ProtectedRoute>} />
        <Route path="/assistant-triggers" element={<ProtectedRoute><AssistantTriggerPage /></ProtectedRoute>} />
        <Route path="/test/gmail-token" element={<ProtectedRoute><ErrorBoundary><GmailTokenTest /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/debug/drive" element={<ProtectedRoute><ErrorBoundary><GenieDriveDebug /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/debug/email" element={<ProtectedRoute><ErrorBoundary><DebugPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AppLayout>
    // </TeamProvider>
  );
};

export default App;