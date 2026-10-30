import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../store/sidebarStore';
import { useHQStore } from '../../store/hqStore';
import { useAddonStore } from '../../store/addonStore';
import { AutoCollapseToggle } from './AutoCollapseToggle';
import { BRAND_CONFIG } from '../../config/brand';
import {
  Home,
  Users,
  MessageSquare,
  Cog,
  UserCircle,
  Zap,
  CalendarDays,
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  ListTodo,
  Mail,
  FolderOpen,
  Store,
  Command,
  Dna,
  Cpu,
  Terminal,
  Globe,
  Crown,
  GraduationCap,
  Sparkles,
  Waves,
  Briefcase
} from 'lucide-react';

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
  notification?: number;
  color?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Sovereign Agent Hub',
    items: [
      {
        title: 'Universal Workbench',
        icon: Waves,
        href: '/workbench',
        color: 'text-indigo-600 dark:text-indigo-400 font-bold',
      },
      {
        title: 'Dashboard',
        icon: Home,
        href: '/dashboard',
        color: 'text-slate-600 dark:text-slate-300 font-medium',
      },
      {
        title: 'Calendar',
        icon: CalendarDays,
        href: '/calendar',
        color: 'text-emerald-500 font-medium',
      },
      {
        title: 'Tasks',
        icon: ListTodo,
        href: '/tasks',
        color: 'text-amber-500 font-medium',
      },
      {
        title: 'Email',
        icon: Mail,
        href: '/email',
        color: 'text-blue-500 font-medium',
      },
    ],
  },
  {
    title: 'Evidence & Precedents',
    items: [
      {
        title: 'Knowledge',
        icon: Database,
        href: '/knowledge',
        color: 'text-cyan-500 font-medium',
      },
      {
        title: 'Drive',
        icon: FolderOpen,
        href: '/drive',
        color: 'text-teal-500 font-medium',
      },
      {
        title: 'Solutions',
        icon: Crown,
        href: '/solutions/ca-workers-comp',
        color: 'text-amber-400 font-medium',
      },
    ],
  },
  {
    title: 'Nebius & Sovereign Engine',
    items: [
      {
        title: 'MCP',
        icon: Cpu,
        href: '/mcp',
        color: 'text-indigo-400 font-bold',
      },
      {
        title: 'Settings',
        icon: Cog,
        href: '/settings',
        color: 'text-slate-400 font-medium',
      },
    ],
  },
];

interface SidebarLinkProps {
  item: SidebarItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarLink({ item, isActive: _isActive, isCollapsed }: SidebarLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActiveLink = location.pathname === item.href || location.pathname.startsWith(item.href + '/');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Special handling for conscious assistant
    if (item.href === '#conscious-assistant') {
      // Trigger assistant controls via custom event
      const event = new CustomEvent('openConsciousAssistant');
      window.dispatchEvent(event);
      return;
    }

    navigate(item.href);
  };

  if (isCollapsed) {
    return (
      <div className="relative group">
        <Link
          to={item.href}
          className={cn(
            "flex justify-center items-center h-10 w-10 rounded-md mx-auto",
            isActiveLink ? "bg-shimmer-300/70" : "hover:bg-shimmer-200/50"
          )}
          aria-label={item.title}
          onClick={handleClick}
        >
          <item.icon className={cn("h-5 w-5", item.color)} />
          {item.notification && (
            <span className="absolute top-0 right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
              {item.notification}
            </span>
          )}
        </Link>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap pointer-events-none">
          {item.title}
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-shimmer-200/60 shimmer-button-energy",
        isActiveLink ? "bg-muted font-medium active" : "text-muted-foreground"
      )}
      onClick={handleClick}
      aria-current={isActiveLink ? "page" : undefined}
    >
      <item.icon className={cn("h-5 w-5", item.color)} />
      <span className="sidebar-item-text">{item.title}</span>
      {item.notification && (
        <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {item.notification}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed: propIsCollapsed, onToggle }: SidebarProps) {
  const { autoCollapse } = useSidebarStore();
  const { missions } = useHQStore();
  const { 
    geniebioEnabled, nexusEnabled, developerEnabled, networkSyncEnabled, creatorEnabled, hqEnabled,
    dashboardEnabled, emailEnabled, tasksEnabled, calendarEnabled, studiosEnabled, driveEnabled, knowledgeEnabled,
    aiAssistantEnabled, storeEnabled, academyEnabled, teamsEnabled
  } = useAddonStore();
  const [isCollapsed, setIsCollapsed] = useState(propIsCollapsed ?? false);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  // Use prop isCollapsed if provided, otherwise use internal state
  const collapsed = propIsCollapsed !== undefined ? propIsCollapsed : isCollapsed;

  // Sync with props when they change
  useEffect(() => {
    if (propIsCollapsed !== undefined) {
      setIsCollapsed(propIsCollapsed);
    }
  }, [propIsCollapsed]);

  // Auto-collapse functionality
  useEffect(() => {
    if (!autoCollapse) return;

    // Function to handle mouse enter/leave
    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      if (collapsed && onToggle) {
        onToggle(); // Use the parent's toggle function to ensure state stays in sync
      } else if (collapsed) {
        setIsCollapsed(false);
      }
    };

    const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      hoverTimeoutRef.current = setTimeout(() => {
        if (!collapsed && onToggle) {
          onToggle(); // Use the parent's toggle function to ensure state stays in sync
        } else if (!collapsed) {
          setIsCollapsed(true);
        }
        hoverTimeoutRef.current = null;
      }, 500); // Small delay to prevent accidental collapses
    };

    // Add event listeners
    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      sidebarElement.addEventListener('mouseenter', handleMouseEnter);
      sidebarElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      // Clean up event listeners and timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (sidebarElement) {
        sidebarElement.removeEventListener('mouseenter', handleMouseEnter);
        sidebarElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [autoCollapse, collapsed, onToggle]);

  const handleToggleSidebar = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Get responsive classes
  const sidebarClasses = cn(
    "glassy-sidebar shimmer-chi-flow flex flex-col h-full min-h-0 border-r border-shimmer-300 transition-all duration-300",
    collapsed ? "w-[70px]" : "w-64"
  );

  const filteredSections = sidebarSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.href === '/workbench') return true;
      if (item.href === '/mcp') return true;
      if (item.href === '/solutions/ca-workers-comp') return true;
      if (item.href === '/settings') return true;
      if (item.href === '/dashboard') return dashboardEnabled !== false;
      if (item.href === '/email') return emailEnabled !== false;
      if (item.href === '/tasks') return tasksEnabled !== false;
      if (item.href === '/calendar') return calendarEnabled !== false;
      if (item.href === '/drive') return driveEnabled !== false;
      if (item.href === '/knowledge') return knowledgeEnabled !== false;
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <div
      ref={sidebarRef}
      className={sidebarClasses}
      role="navigation"
    >
      <div className="h-16 flex items-center px-4 border-b border-shimmer-300/50 shadow-sm">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-blue-500/30 border border-amber-400/50 bg-slate-950 shrink-0">
                <img 
                  src={BRAND_CONFIG.logoUrl || './logos/sutra-logo.svg'} 
                  alt={BRAND_CONFIG.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('sutra-logo.svg')) {
                      target.src = './logos/sutra-logo.svg';
                    }
                  }}
                />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-wider uppercase text-slate-900 dark:text-white font-mono">
                    {BRAND_CONFIG.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  {BRAND_CONFIG.kernelName}
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shadow-md shadow-blue-500/30 border border-amber-400/50 bg-slate-950 shrink-0" title={`${BRAND_CONFIG.name} | Powered by ${BRAND_CONFIG.kernelName}`}>
              <img 
                src={BRAND_CONFIG.logoUrl || './logos/sutra-logo.svg'} 
                alt={BRAND_CONFIG.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('sutra-logo.svg')) {
                    target.src = './logos/sutra-logo.svg';
                  }
                }}
              />
            </div>
          )}
          <button
            onClick={handleToggleSidebar}
            className={cn(
              "p-2 rounded-md hover:bg-shimmer-200/60 transition-colors shimmer-button-energy",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Sidebar Sections Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredSections.map((section) => (
          <div key={section.title} className="py-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-medium text-muted-foreground mb-1">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const totalHQNotifications = item.href === '/hq'
                  ? missions.reduce((acc, m) => acc + (m.unreadNotifications || 0), 0)
                  : 0;

                return (
                  <SidebarLink
                    key={item.href}
                    item={{
                      ...item,
                      notification: item.notification || (totalHQNotifications > 0 ? totalHQNotifications : undefined)
                    }}
                    isActive={location.pathname === item.href || location.pathname.startsWith(item.href + '/')}
                    isCollapsed={collapsed}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Auto-collapse toggle at the bottom */}
      <div className="mt-auto pt-2 border-t border-border/60">
        <div className={collapsed ? "px-2 py-3" : ""}>
          <AutoCollapseToggle compact={collapsed} />
        </div>
      </div>
    </div>
  );
}