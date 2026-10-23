import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CollapsibleContext = createContext<CollapsibleContextValue>({
  open: false,
  setOpen: () => {},
});

interface CollapsibleProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const setOpen = (value: boolean | ((prevState: boolean) => boolean)) => {
    const nextOpen = typeof value === 'function' ? value(open) : value;
    
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
  };
  
  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div className={cn('overflow-hidden', className)}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function CollapsibleTrigger({
  children,
  className,
  asChild = false,
}: CollapsibleTriggerProps) {
  const { open, setOpen } = useContext(CollapsibleContext);
  
  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      'aria-expanded': open,
      className: cn(children.props.className, className),
    } as any);
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      className={className}
    >
      {children}
    </button>
  );
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

export function CollapsibleContent({
  children,
  className,
  forceMount = false,
}: CollapsibleContentProps) {
  const { open } = useContext(CollapsibleContext);
  
  if (!open && !forceMount) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300',
        open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
} 