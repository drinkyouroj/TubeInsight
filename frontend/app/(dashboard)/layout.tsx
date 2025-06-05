// File: frontend/app/(dashboard)/layout.tsx
// This layout wraps all pages within the (dashboard) route group.

import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar'; // We'll create this next
import Footer from '@/components/layout/Footer'; // We'll create this as well
// The Inter font should be applied globally from the root layout (app/layout.tsx)
// No need to re-import or re-apply inter.variable here if already done in the root layout.

export const metadata: Metadata = {
  // You can set a default title for all dashboard pages,
  // or let individual pages override it.
  title: {
    template: '%s | TubeInsight Dashboard', // Example: "History | TubeInsight Dashboard"
    default: 'Dashboard | TubeInsight',     // Default if a page doesn't set a title
  },
  description: 'Your YouTube comment sentiment analysis hub.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The html and body tags are already defined in the root app/layout.tsx.
  // This layout component just structures the content within the body
  // for the dashboard section.
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar will be displayed at the top of all dashboard pages */}
      <Navbar />

      {/* Main content area for the specific page */}
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/*
          The `container` class centers content and applies padding.
          `mx-auto` centers it, `px-4` etc. adds horizontal padding.
          `py-8` adds vertical padding.
          `flex-grow` ensures this main section takes up available vertical space.
        */}
        {children}
      </main>

      {/* Footer will be displayed at the bottom */}
      <Footer />
    </div>
  );
}
