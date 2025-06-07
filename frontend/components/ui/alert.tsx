// frontend/components/ui/alert.tsx
import * as React from "react";
import { cn } from "@/lib/utils"; // If you don't have a cn() utility, you can just use className directly.

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "default" && "border-gray-300 bg-white text-gray-900",
        variant === "destructive" && "border-red-500 bg-red-50 text-red-900",
        variant === "success" && "border-green-500 bg-green-50 text-green-900",
        variant === "warning" && "border-yellow-500 bg-yellow-50 text-yellow-900",
        className
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={cn("text-sm opacity-90", className)} {...props} />
  );
}