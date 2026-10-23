import { useState, useEffect } from 'react';

// Breakpoint definitions (matching Tailwind's default breakpoints)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect if the current viewport is at least the specified breakpoint
 * @param breakpoint The minimum breakpoint to check for
 * @returns boolean indicating if the viewport is at least the specified breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [isAtLeastBreakpoint, setIsAtLeastBreakpoint] = useState<boolean>(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsAtLeastBreakpoint(window.innerWidth >= breakpoints[breakpoint]);
    };

    // Check immediately
    checkBreakpoint();

    // Set up listener for window resize
    window.addEventListener('resize', checkBreakpoint);

    // Clean up
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isAtLeastBreakpoint;
}

/**
 * Hook to get the current active breakpoint
 * @returns The current active breakpoint
 */
export function useActiveBreakpoint(): Breakpoint | null {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint | null>(null);

  useEffect(() => {
    const updateActiveBreakpoint = () => {
      const width = window.innerWidth;
      
      // Find the largest breakpoint that's smaller than the current width
      if (width >= breakpoints['2xl']) {
        setActiveBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setActiveBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setActiveBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setActiveBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setActiveBreakpoint('sm');
      } else {
        setActiveBreakpoint(null); // Smaller than sm breakpoint
      }
    };

    // Check immediately
    updateActiveBreakpoint();

    // Set up listener for window resize
    window.addEventListener('resize', updateActiveBreakpoint);

    // Clean up
    return () => window.removeEventListener('resize', updateActiveBreakpoint);
  }, []);

  return activeBreakpoint;
}

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param mobileBreakpoint The maximum breakpoint considered "mobile" (default: md)
 * @returns boolean indicating if the viewport is mobile-sized
 */
export function useMobileView(mobileBreakpoint: Breakpoint = 'md'): boolean {
  return !useBreakpoint(mobileBreakpoint);
}

/**
 * Hook to detect if the device itself is a touch device
 * @returns boolean indicating if the device has touch capability
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check if device has touch capability
    setIsTouch(navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Hook to conditionally render elements based on breakpoint
 * @param breakpoint The breakpoint to check against
 * @param above Show when viewport is above the breakpoint
 * @param below Show when viewport is below the breakpoint
 * @returns boolean indicating if content should be rendered
 */
export function useShouldRenderAtBreakpoint(
  breakpoint: Breakpoint,
  above: boolean = false,
  below: boolean = false
): boolean {
  const isAtLeastBreakpoint = useBreakpoint(breakpoint);
  
  // Show when above the breakpoint
  if (above && isAtLeastBreakpoint) {
    return true;
  }
  
  // Show when below the breakpoint
  if (below && !isAtLeastBreakpoint) {
    return true;
  }
  
  // Don't show
  return false;
}

/**
 * Hook to create a CSS value that changes at different breakpoints
 * @param values The value to use at each breakpoint
 * @returns A CSS value or styles object
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint | 'default', T>>): T {
  const activeBreakpoint = useActiveBreakpoint();
  
  // Check for current breakpoint
  if (activeBreakpoint && values[activeBreakpoint] !== undefined) {
    return values[activeBreakpoint] as T;
  }
  
  // Try to find the closest smaller breakpoint
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
  const currentIndex = activeBreakpoint ? breakpointOrder.indexOf(activeBreakpoint) : -1;
  
  if (currentIndex >= 0) {
    for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
      const smallerBreakpoint = breakpointOrder[i];
      if (values[smallerBreakpoint] !== undefined) {
        return values[smallerBreakpoint] as T;
      }
    }
  }
  
  // Fallback to default
  return (values.default || Object.values(values)[0]) as T;
} 