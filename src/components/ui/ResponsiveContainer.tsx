import React from 'react';
import { cn } from '../../lib/utils';
import { useBreakpoint, Breakpoint } from '../../utils/responsive';

export interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width of the container
   * @default 'max-w-7xl'
   */
  maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full' | string;
  
  /**
   * Padding on small screens
   * @default 'px-4'
   */
  paddingSm?: string;
  
  /**
   * Padding on medium screens
   * @default 'px-6'
   */
  paddingMd?: string;
  
  /**
   * Padding on large screens
   * @default 'px-8'
   */
  paddingLg?: string;
  
  /**
   * Padding on x-large screens
   * @default 'px-8'
   */
  paddingXl?: string;
  
  /**
   * Center the container horizontally with mx-auto
   * @default true
   */
  centered?: boolean;
  
  /**
   * Make the container full-width on mobile
   * @default false
   */
  fullWidthOnMobile?: boolean;
  
  /**
   * Make the container full-height
   * @default false
   */
  fullHeight?: boolean;
  
  /**
   * The breakpoint below which the container becomes full-width
   * @default 'md'
   */
  fullWidthBreakpoint?: Breakpoint;
  
  /**
   * The content to render inside the container
   */
  children?: React.ReactNode;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'max-w-7xl',
  paddingSm = 'px-4',
  paddingMd = 'px-6',
  paddingLg = 'px-8',
  paddingXl = 'px-8',
  centered = true,
  fullWidthOnMobile = false,
  fullHeight = false,
  fullWidthBreakpoint = 'md',
  ...props
}: ResponsiveContainerProps) {
  const isAtLeastMd = useBreakpoint(fullWidthBreakpoint);
  
  return (
    <div
      className={cn(
        // Base styles
        'w-full',
        fullHeight && 'h-full',
        
        // Responsive padding
        paddingSm,
        `md:${paddingMd}`,
        `lg:${paddingLg}`,
        `xl:${paddingXl}`,
        
        // Max width constraints
        (!fullWidthOnMobile || isAtLeastMd) && maxWidth,
        
        // Centering
        centered && 'mx-auto',
        
        // Additional classes
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A page container with predefined responsive styling
 */
export function PageContainer({
  children,
  className,
  ...props
}: Omit<ResponsiveContainerProps, 'maxWidth' | 'paddingSm' | 'paddingMd' | 'paddingLg' | 'paddingXl'>) {
  return (
    <ResponsiveContainer
      maxWidth="max-w-7xl"
      paddingSm="px-4 py-6"
      paddingMd="px-6 py-8"
      paddingLg="px-8 py-10"
      paddingXl="px-8 py-12"
      className={cn('min-h-[calc(100vh-4rem)]', className)} // 4rem is typical header height
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}

/**
 * A section container with predefined responsive styling
 */
export function SectionContainer({
  children,
  className,
  ...props
}: Omit<ResponsiveContainerProps, 'maxWidth' | 'paddingSm' | 'paddingMd' | 'paddingLg' | 'paddingXl'>) {
  return (
    <ResponsiveContainer
      maxWidth="max-w-6xl"
      paddingSm="px-4 py-8"
      paddingMd="px-6 py-12"
      paddingLg="px-8 py-16"
      paddingXl="px-8 py-20"
      className={className}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
}

/**
 * A card container with predefined responsive styling
 */
export function CardContainer({
  children,
  className,
  ...props
}: Omit<ResponsiveContainerProps, 'maxWidth' | 'paddingSm' | 'paddingMd' | 'paddingLg' | 'paddingXl'>) {
  return (
    <ResponsiveContainer
      maxWidth="max-w-3xl"
      paddingSm="p-4"
      paddingMd="p-6"
      paddingLg="p-8"
      paddingXl="p-8"
      className={cn('bg-white rounded-lg shadow-sm border', className)}
      {...props}
    >
      {children}
    </ResponsiveContainer>
  );
} 