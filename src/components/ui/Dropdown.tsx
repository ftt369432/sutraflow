import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';

interface DropdownItem {
  label: string;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function Dropdown({ trigger, items, side = 'bottom', align = 'end' }: DropdownProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          side={side}
          align={align}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200",
            "bg-white p-1 text-gray-900 shadow-md animate-in fade-in-80",
            "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
          )}
        >
          {items.map((item, index) => (
            <DropdownMenuPrimitive.Item
              key={index}
              onClick={item.onClick}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                "focus:bg-gray-100 focus:text-gray-900",
                "dark:focus:bg-gray-800 dark:focus:text-gray-100",
                item.className
              )}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

// Define basic components to prevent errors when the real Radix UI components are not available
const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return <div className="dropdown-menu">{children}</div>;
};

const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => {
  return <button className="dropdown-trigger">{children}</button>;
};

const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="dropdown-content">{children}</div>;
};

const DropdownMenuItem = ({ children }: { children: React.ReactNode }) => {
  return <div className="dropdown-item">{children}</div>;
};

const DropdownMenuSeparator = () => {
  return <hr className="dropdown-separator" />;
};

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => {
  return <div className="dropdown-group">{children}</div>;
};

const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => {
  return <div className="dropdown-label">{children}</div>;
};

// Export the components
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
}; 