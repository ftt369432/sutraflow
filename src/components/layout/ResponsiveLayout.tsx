import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useBreakpoint } from '../../utils/responsive';
import { X, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ResponsiveLayoutProps {
  /**
   * Content to display in the sidebar
   */
  sidebar: React.ReactNode;
  
  /**
   * Main content of the page
   */
  children: React.ReactNode;
  
  /**
   * Width of the sidebar
   * @default '280px'
   */
  sidebarWidth?: string;
  
  /**
   * Width of the collapsed sidebar (mobile view)
   * @default '0'
   */
  collapsedSidebarWidth?: string;
  
  /**
   * Default state of the sidebar (expanded or collapsed)
   * @default false
   */
  defaultCollapsed?: boolean;
  
  /**
   * Force collapse on mobile screens (smaller than md breakpoint)
   * @default true
   */
  collapseOnMobile?: boolean;
  
  /**
   * Show a toggle button to expand/collapse the sidebar on mobile
   * @default true
   */
  showToggleButton?: boolean;
  
  /**
   * Additional CSS class names for the container
   */
  className?: string;
  
  /**
   * Additional CSS class names for the sidebar
   */
  sidebarClassName?: string;
  
  /**
   * Additional CSS class names for the main content
   */
  mainClassName?: string;
  
  /**
   * Fixed position sidebar (doesn't scroll with content)
   * @default false
   */
  fixedSidebar?: boolean;
  
  /**
   * Overlay sidebar on mobile instead of pushing content
   * @default true
   */
  overlaySidebarOnMobile?: boolean;
  
  /**
   * Callback fired when sidebar collapse state changes
   */
  onCollapseChange?: (collapsed: boolean) => void;
}

export function ResponsiveLayout({
  sidebar,
  children,
  sidebarWidth = '280px',
  collapsedSidebarWidth = '0',
  defaultCollapsed = false,
  collapseOnMobile = true,
  showToggleButton = true,
  className,
  sidebarClassName,
  mainClassName,
  fixedSidebar = false,
  overlaySidebarOnMobile = true,
  onCollapseChange,
}: ResponsiveLayoutProps) {
  const isDesktop = useBreakpoint('md');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || (collapseOnMobile && !isDesktop));
  
  // Handle responsive behavior
  useEffect(() => {
    if (collapseOnMobile) {
      setIsCollapsed(!isDesktop);
    }
  }, [isDesktop, collapseOnMobile]);
  
  // Notify parent when collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Calculate sidebar styles
  const sidebarStyles = isDesktop 
    ? { width: isCollapsed ? collapsedSidebarWidth : sidebarWidth }
    : { 
        width: sidebarWidth,
        left: isCollapsed ? `-${sidebarWidth}` : '0',
        boxShadow: !isCollapsed ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
      };
    
  return (
    <div className={cn('flex h-full w-full overflow-hidden', className)}>
      {/* Mobile overlay background */}
      {!isDesktop && !isCollapsed && overlaySidebarOnMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'h-full bg-white transition-all duration-300 ease-in-out',
          isDesktop ? 'relative' : 'fixed top-0 bottom-0 z-30',
          fixedSidebar && 'fixed top-0 left-0 bottom-0 z-10',
          sidebarClassName
        )}
        style={sidebarStyles}
      >
        {!isDesktop && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 md:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </Button>
        )}
        <div className="h-full overflow-y-auto">
          {sidebar}
        </div>
      </aside>
      
      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-auto transition-all duration-300 ease-in-out',
          overlaySidebarOnMobile && !isDesktop ? 'ml-0' : isCollapsed ? `ml-[${collapsedSidebarWidth}]` : `ml-[${sidebarWidth}]`,
          mainClassName
        )}
        style={fixedSidebar ? { marginLeft: isDesktop ? (isCollapsed ? collapsedSidebarWidth : sidebarWidth) : 0 } : {}}
      >
        {/* Mobile toggle button */}
        {!isDesktop && showToggleButton && isCollapsed && (
          <Button
            variant="ghost"
            size="icon" 
            className="fixed top-4 left-4 z-10 md:hidden bg-white shadow-md rounded-md"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </Button>
        )}
        {children}
      </main>
    </div>
  );
} 