// File: frontend/components/layout/Navbar.tsx
'use client'; // This is a client component due to useEffect, useState, and event handlers.

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; // Your client-side Supabase client
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button'; // Your Button component
import {
  LogOut,
  User,
  BarChart2, // Generic icon for dashboard/insights
  PlusCircle,
  History,
  Youtube,   // Icon for the brand/logo
  Menu,      // For mobile menu
  X          // For closing mobile menu
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        // No need to setIsLoading here as it's mainly for initial load
      }
    );

    // Clean up the listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false); // Close mobile menu on sign out
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login page
    router.refresh(); // Ensure UI updates reflecting logged-out state
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: <BarChart2 className="mr-2 h-4 w-4" /> },
    { href: '/analyze', label: 'Analyze Video', icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    { href: '/history', label: 'History', icon: <History className="mr-2 h-4 w-4" /> },
  ];

  if (isLoading) {
    // Optional: Render a minimal loading state for the navbar or just a placeholder
    return (
      <nav className="border-b border-border bg-background shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Youtube className="mr-2 h-7 w-7 text-red-500" />
              <span className="text-xl font-bold text-foreground">TubeInsight</span>
            </div>
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div> {/* Placeholder for auth buttons */}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand Name */}
          <Link href="/" legacyBehavior>
            <a className="flex items-center gap-2 text-xl font-bold text-foreground transition-colors hover:text-primary/80">
              <Youtube className="h-7 w-7 text-red-500" />
              <span>TubeInsight</span>
            </a>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center space-x-2 md:flex">
            {session && navLinks.map((link) => (
              <Link key={link.label} href={link.href} legacyBehavior passHref>
                <Button variant="ghost" size="sm" asChild>
                  <a>{link.icon}{link.label}</a>
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Buttons and User Info / Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="text-sm text-muted-foreground">
                    {session.user?.email?.split('@')[0]}
                  </span>
                  <User className="h-5 w-5 text-muted-foreground" />
                  <Button onClick={handleSignOut} variant="ghost" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login" legacyBehavior passHref>
                <Button variant="default" size="sm">Login</Button>
              </Link>
            )}
            {/* Mobile Menu Button */}
            {session && (
                <div className="md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Dropdown */}
      {isMobileMenuOpen && session && (
        <div className="border-t border-border bg-background py-2 md:hidden">
          <div className="container mx-auto space-y-1 px-4">
            {navLinks.map((link) => (
              <Link key={`mobile-${link.label}`} href={link.href} legacyBehavior passHref>
                <a
                  className="flex items-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                >
                  {link.icon}
                  {link.label}
                </a>
              </Link>
            ))}
            <div className="border-t border-border pt-2"></div>
            <div className="flex items-center px-3 py-2">
                <User className="mr-3 h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                    {session.user?.email}
                </span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start px-3 py-2 text-base font-medium"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
