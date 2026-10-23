import React from 'react';
import { PanelLeftClose } from 'lucide-react';
import { useSidebarStore } from '../../store/sidebarStore';
import { Switch } from '../ui/Switch';
import { cn } from '../../lib/utils';

interface AutoCollapseToggleProps {
  className?: string;
  compact?: boolean;
}

export function AutoCollapseToggle({ className, compact = false }: AutoCollapseToggleProps) {
  const { autoCollapse, toggleAutoCollapse } = useSidebarStore();

  if (compact) {
    return (
      <button
        onClick={toggleAutoCollapse}
        className="w-full flex justify-center items-center"
        title={autoCollapse ? "Disable auto-collapse" : "Enable auto-collapse"}
      >
        <PanelLeftClose size={20} className={cn(
          "text-muted-foreground transition-colors",
          autoCollapse && "text-primary"
        )} />
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2", className)}>
      <PanelLeftClose size={16} className="text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Auto-collapse</span>
      <Switch 
        checked={autoCollapse} 
        onCheckedChange={toggleAutoCollapse}
        className="ml-auto"
      />
    </div>
  );
} 