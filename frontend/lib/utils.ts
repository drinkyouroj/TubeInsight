// File: frontend/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to conditionally join class names.
 * It uses `clsx` to handle various types of class inputs (strings, arrays, objects)
 * and `tailwind-merge` to intelligently merge Tailwind CSS classes, resolving conflicts.
 *
 * @param inputs - The class values to merge.
 * @returns A string of merged class names.
 *
 * @example
 * cn("p-4", "font-bold", { "bg-red-500": hasError })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// You can add other utility functions to this file as your project grows.
// For example:
// export function formatDate(dateString: string): string {
//   return new Date(dateString).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });
// }
