// File: frontend/components/ui/Input.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils'; // Utility for merging Tailwind classes

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base input styles
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          // File input specific styles (if type="file")
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Placeholder styles
          'placeholder:text-muted-foreground',
          // Focus visible styles (accessibility)
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Disabled state styles
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Allow overriding or adding classes
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
