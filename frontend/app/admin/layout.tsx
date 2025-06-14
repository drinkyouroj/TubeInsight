// File: frontend/app/admin/layout.tsx
// This layout wraps all pages within the admin route group.

import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: {
    template: '%s | TubeInsight Admin', // Example: "Users | TubeInsight Admin"
    default: 'Admin | TubeInsight',     // Default if a page doesn't set a title
  },
  description: 'TubeInsight admin panel for user and content management.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar will be displayed at the top of all admin pages */}
      <Navbar />

      {/* Main content area for the specific admin page */}
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
