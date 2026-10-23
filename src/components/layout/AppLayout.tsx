import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CleanAssistantSidebar } from '../conscious/CleanAssistantSidebar';
import { RightToolbar } from './RightToolbar';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SettingsModal } from '../settings/SettingsModal';
import { useUIStore } from '../../store/uiStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { settingsModalOpen, setSettingsModalOpen } = useUIStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);

      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle autonomous navigation events from AI capabilities
  useEffect(() => {
    const handleAutonomousNavigation = (event: CustomEvent) => {
      const { detail } = event;
      console.log('🚀 [AppLayout] Autonomous navigation triggered:', detail);

      if (detail.route) {
        try {
          navigate(detail.route);
          console.log(`✅ [AppLayout] Navigated to: ${detail.route}`);

          // Optional: Show a toast notification about the navigation
          if (typeof window !== 'undefined' && detail.reason) {
            // We could dispatch a notification event here if needed
            console.log(`📡 [AppLayout] Navigation reason: ${detail.reason}`);
          }
        } catch (error) {
          console.error('❌ [AppLayout] Navigation failed:', error);
        }
      }
    };

    // Add event listener for autonomous navigation
    if (typeof window !== 'undefined') {
      window.addEventListener('autonomousNavigation', handleAutonomousNavigation as EventListener);
      // console.log('🎯 [AppLayout] Autonomous navigation listener registered'); // Reduced logging
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('autonomousNavigation', handleAutonomousNavigation as EventListener);
        // console.log('🎯 [AppLayout] Autonomous navigation listener removed'); // Reduced logging
      }
    };
  }, [navigate]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-full min-h-full w-full flex overflow-hidden app-skin-canvas">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
      />
      <div className="flex flex-col flex-1 w-full max-w-full min-h-0 h-full overflow-hidden transition-all duration-300 ease-in-out">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className={cn(
          "flex-1 w-full h-full app-main-viewport overflow-hidden",
          (location.pathname.startsWith('/hq') || location.pathname.startsWith('/ai-assistant') || location.pathname.startsWith('/workbench') || location.pathname.startsWith('/knowledge') || location.pathname.startsWith('/drive')) ? "p-0 flex flex-col min-h-0 h-full" : "p-4 md:p-6 overflow-auto"
        )}>
          {children}
        </main>
      </div>

      {/* Global Right Toolbar - Quick Tools and AI Assistant integration */}
      <RightToolbar className="border-l border-gray-200/50 dark:border-gray-700/50" />

      {/* Global Conscious Assistant Controls - includes floating button */}
      <CleanAssistantSidebar />

      {/* Unified Settings Modal */}
      <SettingsModal 
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
} 