import * as React from "react";
import { cn } from "../../lib/utils";

const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-spin", className)}
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
    <span className="sr-only">Loading</span>
  </div>
));
Spinner.displayName = "Spinner";

export { Spinner };

/**
 * A spinner overlay that covers its parent container
 */
export function SpinnerOverlay({
  size = 40,
  color = 'text-primary',
  text,
  className,
  speed = 1,
  blur = false,
}: SpinnerProps & { blur?: boolean }) {
  return (
    <div className={cn(
      'absolute inset-0 flex flex-col items-center justify-center',
      blur ? 'backdrop-blur-sm' : 'bg-background/70',
      className
    )}>
      <Spinner
        size={size}
        color={color}
        text={text}
        speed={speed}
      />
    </div>
  );
}

/**
 * A full-page spinner overlay for loading pages
 */
export function FullPageSpinner({
  size = 48,
  color = 'text-primary',
  text = 'Loading...',
  className,
}: SpinnerProps) {
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
      className
    )}>
      <Spinner
        size={size}
        color={color}
        text={text}
      />
    </div>
  );
} 