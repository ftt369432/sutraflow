import React from "react";
import { cn } from "../../lib/utils";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2" | "caption" | "overline";
  component?: React.ElementType;
  children: React.ReactNode;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "body1", component, children, ...props }, ref) => {
    const Component = component || getComponentFromVariant(variant);
    
    return (
      <Component
        ref={ref}
        className={cn(getClassNameFromVariant(variant), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

function getComponentFromVariant(variant: TypographyProps["variant"]): React.ElementType {
  switch (variant) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return variant;
    case "body1":
    case "body2":
    case "caption":
    case "overline":
    default:
      return "p";
  }
}

function getClassNameFromVariant(variant: TypographyProps["variant"]): string {
  switch (variant) {
    case "h1":
      return "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl";
    case "h2":
      return "scroll-m-20 text-3xl font-semibold tracking-tight";
    case "h3":
      return "scroll-m-20 text-2xl font-semibold tracking-tight";
    case "h4":
      return "scroll-m-20 text-xl font-semibold tracking-tight";
    case "h5":
      return "scroll-m-20 text-lg font-semibold tracking-tight";
    case "h6":
      return "scroll-m-20 text-base font-semibold tracking-tight";
    case "body1":
      return "leading-7";
    case "body2":
      return "text-sm leading-6";
    case "caption":
      return "text-sm text-muted-foreground";
    case "overline":
      return "text-xs uppercase tracking-widest";
    default:
      return "leading-7";
  }
}

Typography.displayName = "Typography"; 