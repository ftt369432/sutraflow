import React from 'react';
import { cn } from '../../lib/utils';
import { Breakpoint } from '../../utils/responsive';

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns for small screens
   * @default 1
   */
  sm?: GridColumns;
  
  /**
   * Number of columns for medium screens
   * @default 2
   */
  md?: GridColumns;
  
  /**
   * Number of columns for large screens
   * @default 3
   */
  lg?: GridColumns;
  
  /**
   * Number of columns for extra large screens
   * @default 4
   */
  xl?: GridColumns;
  
  /**
   * Number of columns for 2xl screens
   * @default same as xl
   */
  '2xl'?: GridColumns;
  
  /**
   * Gap between grid items
   * @default 'gap-6'
   */
  gap?: string;
  
  /**
   * Row gap between grid items (if different from column gap)
   */
  rowGap?: string;
  
  /**
   * Column gap between grid items (if different from row gap)
   */
  colGap?: string;
  
  /**
   * Additional items to inject at the start of the grid
   */
  startContent?: React.ReactNode;
  
  /**
   * Additional items to inject at the end of the grid
   */
  endContent?: React.ReactNode;
  
  /**
   * Children elements to render in the grid
   */
  children: React.ReactNode;
}

const getGridCols = (cols: GridColumns): string => {
  const gridMap: Record<GridColumns, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12'
  };
  return gridMap[cols];
};

export function ResponsiveGrid({
  children,
  className,
  sm = 1,
  md = 2,
  lg = 3,
  xl = 4,
  '2xl': xxl = xl,
  gap = 'gap-6',
  rowGap,
  colGap,
  startContent,
  endContent,
  ...props
}: ResponsiveGridProps) {
  // Build the responsive grid classes
  const gridClassNames = [
    'grid',
    // Set the responsive column count
    getGridCols(sm),
    `md:${getGridCols(md)}`,
    `lg:${getGridCols(lg)}`,
    `xl:${getGridCols(xl)}`,
    `2xl:${getGridCols(xxl)}`,
    // Set the grid gap
    gap,
    rowGap && `row-${rowGap}`,
    colGap && `col-${colGap}`
  ];
  
  return (
    <div
      className={cn(gridClassNames, className)}
      {...props}
    >
      {startContent}
      {children}
      {endContent}
    </div>
  );
}

export interface ResponsiveGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns this item should span
   * @default 1
   */
  span?: GridColumns;
  
  /**
   * Number of columns this item should span on small screens
   */
  smSpan?: GridColumns;
  
  /**
   * Number of columns this item should span on medium screens
   */
  mdSpan?: GridColumns;
  
  /**
   * Number of columns this item should span on large screens
   */
  lgSpan?: GridColumns;
  
  /**
   * Number of columns this item should span on extra large screens
   */
  xlSpan?: GridColumns;
  
  /**
   * Number of columns this item should span on 2xl screens
   */
  '2xlSpan'?: GridColumns;
  
  /**
   * Starting column position
   */
  colStart?: number;
  
  /**
   * Children elements to render in the grid item
   */
  children: React.ReactNode;
}

const getGridColSpan = (span: GridColumns): string => {
  const spanMap: Record<GridColumns, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12'
  };
  return spanMap[span];
};

export function ResponsiveGridItem({
  children,
  className,
  span = 1,
  smSpan,
  mdSpan,
  lgSpan,
  xlSpan,
  '2xlSpan': xxlSpan,
  colStart,
  ...props
}: ResponsiveGridItemProps) {
  const gridItemClassNames = [
    // Set the default span
    getGridColSpan(span),
    // Set the responsive spans if provided
    smSpan && `sm:${getGridColSpan(smSpan)}`,
    mdSpan && `md:${getGridColSpan(mdSpan)}`,
    lgSpan && `lg:${getGridColSpan(lgSpan)}`,
    xlSpan && `xl:${getGridColSpan(xlSpan)}`,
    xxlSpan && `2xl:${getGridColSpan(xxlSpan)}`,
    // Set column start if provided
    colStart && `col-start-${colStart}`
  ];
  
  return (
    <div
      className={cn(gridItemClassNames, className)}
      {...props}
    >
      {children}
    </div>
  );
} 