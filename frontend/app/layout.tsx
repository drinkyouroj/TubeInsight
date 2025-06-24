// File: frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css'; // Import global styles, including Tailwind directives
import SupabaseListener from '@/components/auth/SupabaseListener'; // For client-side auth updates
import SupabaseProvider from '@/contexts/SupabaseProvider'; // To provide Supabase client via context
import DebugEnv from '@/components/DebugEnv';
import Navbar from '@/components/layout/Navbar'; // Global Navbar component

// Initialize the Inter font with the 'latin' subset and assign it to a CSS variable
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Ensures text remains visible during font loading
  variable: '--font-inter', // This CSS variable can be used in your Tailwind config or global CSS
});

export const metadata: Metadata = {
  title: {
    default: 'TubeInsight', // Default title for all pages
    template: '%s | TubeInsight', // Template for page-specific titles (e.g., "Dashboard | TubeInsight")
  },
  description: 'Analyze YouTube comment sentiment effectively and shield yourself from toxicity.',
  // Add more metadata here like icons, open graph tags, etc.
  // icons: {
  //   icon: '/favicon.ico', // Example
  //   apple: '/apple-touch-icon.png', // Example
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning data-theme="dark">
      {/*
        suppressHydrationWarning is often used when you have dynamic content
        that might differ between server and client render, especially with themes
        or auth states before full hydration.
      */}
      <body className="h-full bg-background font-sans text-foreground antialiased">
        <Script id="disable-mce-autosize" strategy="beforeInteractive">
          {`const originalDefine = customElements.define;
            customElements.define = (name, constructor, options) => {
              if (name === 'mce-autosize-textarea' && customElements.get(name)) return;
              originalDefine.call(customElements, name, constructor, options);
            };`}
        </Script>
        {/*
          SupabaseProvider makes the Supabase client available via context,
          which can be useful for components deep in the tree or for custom hooks.
        */}
        <SupabaseProvider>
          {/*
            SupabaseListener handles client-side auth state changes,
            like when a user logs in/out in another tab or the session expires.
            It can trigger router.refresh() to update UI based on new auth state.
          */}
          <SupabaseListener />
          <Navbar />
          {/*
            The children prop will be your page content.
            For authenticated routes, this will be further wrapped by (dashboard)/layout.tsx
          */}
          {children}
        </SupabaseProvider>
        {process.env.NODE_ENV === 'development' && <DebugEnv />}
      </body>
    </html>
  );
}
