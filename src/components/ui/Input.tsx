import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from "class-variance-authority";

// Define input variants
const inputVariants = cva(
  "w-full px-3 py-2 rounded-md border transition-all duration-200 focus:outline-none focus:ring-2",
  {
    variants: {
      variant: {
        default: "border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] placeholder:text-[var(--text-muted)] focus:ring-primary-500 focus:border-primary-500",
        filled: "bg-gray-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-primary-500 focus:border-primary-500",
        outline: "border-gray-300 dark:border-gray-600 bg-transparent focus:ring-primary-500 focus:border-primary-500",
        underlined: "border-0 border-b-2 border-gray-300 dark:border-gray-700 bg-transparent rounded-none px-1 focus:ring-0 focus:border-primary-500",
        pill: "rounded-full border-gray-300 dark:border-gray-600",
        ghost: "border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-0 focus:bg-gray-50 dark:focus:bg-gray-800"
      },
      size: {
        sm: "h-8 text-xs px-2.5",
        default: "h-10 text-sm",
        lg: "h-12 text-base px-4",
      },
      state: {
        error: "border-error focus:border-error focus:ring-error",
        success: "border-success focus:border-success focus:ring-success",
        warning: "border-warning focus:border-warning focus:ring-warning",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    success,
    icon,
    iconPosition = 'left',
    helpText,
    variant, 
    size,
    type = 'text', 
    ...props 
  }, ref) => {
    // Determine state based on error or success
    const state = error ? 'error' : success ? 'success' : undefined;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, size, state, className }),
              icon && iconPosition === 'left' && "pl-10",
              icon && iconPosition === 'right' && "pr-10"
            )}
            ref={ref}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
        {!error && success && (
          <p className="mt-1 text-sm text-success">{success}</p>
        )}
        {!error && !success && helpText && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';