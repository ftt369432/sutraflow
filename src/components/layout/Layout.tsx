import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../store/sidebarStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const { isOpen, autoCollapse } = useSidebarStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Sync sidebar collapse state with store if auto-collapse is enabled
  useEffect(() => {
    if (autoCollapse) {
      // Let the sidebar component handle the auto-collapse
      // This is just to track the state
    }
  }, [autoCollapse]);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="flex h-screen">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={handleSidebarToggle} 
        />
        
        <div className="flex flex-col flex-1">
          <Header 
            onToggleSidebar={handleSidebarToggle} 
            isSidebarCollapsed={isSidebarCollapsed}
          />
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 