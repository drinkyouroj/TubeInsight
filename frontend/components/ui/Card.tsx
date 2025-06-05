// File: frontend/components/ui/Card.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils'; // We'll create this utility file for merging Tailwind classes

// Main Card component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm', // Base card styles
      className // Allow overriding or adding classes
    )}
    {...props}
  />
));
Card.displayName = 'Card';

// CardHeader component
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)} // Padding and spacing for header
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// CardTitle component
const CardTitle = React.forwardRef<
  HTMLParagraphElement, // Changed to HTMLParagraphElement as h3 is more semantic
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight', // Title styling
      // Consider text-2xl if you prefer larger titles, or adjust as needed
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// CardDescription component
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)} // Styling for descriptive text
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// CardContent component
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0', className)} // Padding, pt-0 because header usually has bottom padding
    {...props}
  />
));
CardContent.displayName = 'CardContent';

// CardFooter component
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)} // Footer padding
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
