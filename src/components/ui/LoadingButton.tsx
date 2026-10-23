import { forwardRef } from 'react';
import { Button, ButtonProps } from './Button';
import { cn } from '../../lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Text to display when loading (defaults to the children prop)
   */
  loadingText?: string;
  
  /**
   * Position of the loader ('left' or 'right')
   */
  loaderPosition?: 'left' | 'right' | 'center';
  
  /**
   * Size of the loader
   */
  loaderSize?: number;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    className, 
    isLoading = false, 
    loadingText, 
    loaderPosition = 'left', 
    loaderSize = 16,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const content = loadingText && isLoading ? loadingText : children;
    
    // Convert disabled to a proper boolean value
    const isDisabled = Boolean(disabled) || isLoading;
    
    return (
      <Button
        className={cn(
          isLoading && "relative",
          className
        )}
        disabled={isDisabled}
        ref={ref}
        isLoading={loaderPosition === 'center' ? isLoading : undefined}
        {...props}
      >
        {isLoading && loaderPosition === 'left' && (
          <svg 
            className="animate-spin mr-2" 
            width={loaderSize} 
            height={loaderSize} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        
        {!(isLoading && loaderPosition === 'center') && content}
        
        {isLoading && loaderPosition === 'right' && (
          <svg 
            className="animate-spin ml-2" 
            width={loaderSize} 
            height={loaderSize} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };