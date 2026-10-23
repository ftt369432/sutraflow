import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // APEX Brand - Primary Steel Shimmery (Default)
        default: "bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-slate-500/30 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        
        // APEX Brand - Navy Steel Shimmery  
        primary: "bg-gradient-to-r from-slate-800 via-slate-900 to-blue-900 text-white hover:from-slate-900 hover:via-blue-900 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-blue-800/40 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        
        // APEX Brand - Light Steel Shimmery
        secondary: "bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 text-white hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-slate-400/30 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        
        destructive: "bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white hover:from-red-700 hover:via-red-800 hover:to-red-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-red-500/30",
        
        outline: "border-2 border-slate-600 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 backdrop-blur-sm",
        
        ghost: "hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-800 dark:hover:to-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-300",
        
        // Chi-inspired Shimmery variants
        shimmer: "bg-gradient-to-r from-shimmer-200 via-shimmer-300 to-shimmer-400 text-slate-700 hover:from-shimmer-300 hover:via-shimmer-400 hover:to-shimmer-500 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm border border-shimmer-400/30 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
        
        'shimmer-glass': "bg-shimmer-300/75 backdrop-blur-md text-slate-700 border border-shimmer-400/30 hover:bg-shimmer-400/80 hover:shadow-lg transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        
        'chi-flow': "bg-gradient-to-br from-shimmer-200 via-shimmer-300 to-slate-300 text-slate-700 hover:from-shimmer-300 hover:via-slate-300 hover:to-slate-400 shadow-md hover:shadow-lg transition-all duration-500 transform hover:scale-[1.01] border border-shimmer-400/40 backdrop-blur-sm relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        
        link: "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline-offset-4 hover:underline transition-colors duration-300",
        
        // Legacy variants for compatibility
        assistant: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700",
        'assistant-primary': "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-sm border border-blue-200 dark:border-blue-800",
        'assistant-secondary': "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700",
        'gradient': "bg-gradient-to-r from-slate-600 to-slate-800 text-white hover:from-slate-700 hover:to-slate-900 shadow-md",
        'success': "bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900 shadow-lg transition-all duration-300",
        'warning': "bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white hover:from-amber-700 hover:via-amber-800 hover:to-amber-900 shadow-lg transition-all duration-300",
        'info': "bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 text-white hover:from-sky-700 hover:via-sky-800 hover:to-sky-900 shadow-lg transition-all duration-300",
        'subtle': "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800/80",
        'glass': "bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        'icon-sm': "h-8 w-8",
        'icon-lg': "h-12 w-12",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </span>
        ) : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };