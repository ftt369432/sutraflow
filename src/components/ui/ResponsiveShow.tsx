import React from 'react';
import { Breakpoint, useShouldRenderAtBreakpoint } from '../../utils/responsive';

interface ResponsiveShowProps {
  /**
   * The content to conditionally render
   */
  children: React.ReactNode;
  
  /**
   * The breakpoint to check against
   */
  breakpoint: Breakpoint;
  
  /**
   * Show content when viewport is above the breakpoint
   */
  above?: boolean;
  
  /**
   * Show content when viewport is below the breakpoint
   */
  below?: boolean;
}

/**
 * A component that conditionally renders its children based on the current viewport size
 * relative to the specified breakpoint.
 * 
 * @example
 * // Show content only on mobile (below md breakpoint)
 * <ResponsiveShow breakpoint="md" below>
 *   Mobile only content
 * </ResponsiveShow>
 * 
 * @example
 * // Show content only on desktop (above lg breakpoint)
 * <ResponsiveShow breakpoint="lg" above>
 *   Desktop only content
 * </ResponsiveShow>
 */
export function ResponsiveShow({
  children,
  breakpoint,
  above = false,
  below = false,
}: ResponsiveShowProps) {
  const shouldRender = useShouldRenderAtBreakpoint(breakpoint, above, below);
  return shouldRender ? <>{children}</> : null;
} 