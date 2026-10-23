import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mail, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  MessageSquare,
  Menu,
  Sun,
  Moon,
  Bell,
  User
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../hooks/useSidebar';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/Button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Email', href: '/email', icon: Mail },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
];

export function ModernLayout() {
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark transition-colors duration-200">
      {/* Top Bar */}
      <nav className="fixed top-0 z-50 w-full h-[60px] bg-white dark:bg-dark-paper border-b border-gray-200 dark:border-gray-700/50 transition-colors duration-200">
        <div className="h-full px-4 py-3">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar} 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-light text-gray-600 dark:text-gray-300 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <span className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">SutraFlow</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={toggleTheme} 
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-[60px]">
        {/* Sidebar */}
        <aside 
          className={`fixed lg:sticky top-[60px] left-0 h-[calc(100vh-60px)]
            bg-white dark:bg-dark-paper border-r border-gray-200 dark:border-gray-700/50
            transition-all duration-200 ease-in-out w-64
            ${!isSidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}
        >
          <div className="h-full overflow-y-auto">
            <Sidebar 
              isCollapsed={!isSidebarOpen} 
              onToggle={toggleSidebar} 
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-60px)] p-6 lg:ml-64 bg-gray-50 dark:bg-dark transition-colors duration-200">
          <Outlet />
        </main>

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-200"
            onClick={toggleSidebar}
          />
        )}
      </div>
    </div>
  );
} 