import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  Bot,
  Library,
  Settings,
  Brain,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Email', href: '/email', icon: Mail },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: Library },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'AI Assistant', href: '/ai-assistant', icon: MessageSquare },
];

export function Navigation() {
  return (
    <nav className="flex items-center space-x-4">
      <NavLink
        to="/ai-assistant"
        className={({ isActive }) => cn(
          'flex items-center px-4 py-2 rounded-lg transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary text-primary-foreground'
        )}
      >
        <MessageSquare className="w-5 h-5 mr-2" />
        Assistant
      </NavLink>
      <NavLink
        to="/agents"
        className={({ isActive }) => cn(
          'flex items-center px-4 py-2 rounded-lg transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary text-primary-foreground'
        )}
      >
        <Brain className="w-5 h-5 mr-2" />
        Agents
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) => cn(
          'flex items-center px-4 py-2 rounded-lg transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary text-primary-foreground'
        )}
      >
        <Settings className="w-5 h-5 mr-2" />
        Settings
      </NavLink>
    </nav>
  );
} 