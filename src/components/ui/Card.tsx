import * as React from "react";
import { cn } from "../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "rounded-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm",
        filled: "bg-gray-50 dark:bg-gray-800 shadow-sm",
        outlined: "border border-gray-200 dark:border-gray-700 bg-transparent",
        elevated: "bg-white dark:bg-gray-800 shadow-md hover:shadow-lg",
        glass: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm",
        gradient: "bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm",
        flat: "bg-white dark:bg-gray-800",
      },
      radius: {
        default: "rounded-lg",
        sm: "rounded-md",
        lg: "rounded-xl",
        none: "rounded-none",
        full: "rounded-3xl",
      },
      padding: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  hoverEffect?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, radius, padding, hoverEffect, ...props }, ref) => {
    return (
      <div
        className={cn(
          cardVariants({ variant, radius, padding }),
          hoverEffect && "hover:-translate-y-1 hover:shadow-md",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean, noBorder?: boolean }
>(({ className, noPadding = false, noBorder = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5", 
      !noPadding && "p-6", 
      !noBorder && "border-b border-gray-200 dark:border-gray-700",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && "p-6 pt-0",
      className
    )} 
    {...props} 
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean, noBorder?: boolean }
>(({ className, noPadding = false, noBorder = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center", 
      !noPadding && "p-6 pt-0", 
      !noBorder && "border-t border-gray-200 dark:border-gray-700 mt-auto",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };