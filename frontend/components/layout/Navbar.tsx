// File: frontend/components/layout/Navbar.tsx
'use client'; 

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import {
  LogOut,
  User,
  BarChart2, 
  PlusCircle,
  History,
  Youtube,   
  Menu,      
  X,
  ShieldAlert,
  Users,
  FileBarChart,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseProvider';

type UserRole = 'user' | 'analyst' | 'content_moderator' | 'super_admin';

// Loading fallback component
function NavbarLoadingFallback() {
  return (
    <nav className="border-b border-border bg-background shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Youtube className="mr-2 h-7 w-7 text-red-500" />
            <span className="text-xl font-bold text-foreground">TubeInsight</span>
          </div>
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div> 
        </div>
      </div>
    </nav>
  );
}

// Wrap Navbar in Suspense boundary
export default function Navbar() {
  return (
    <Suspense fallback={<NavbarLoadingFallback />}>
      <NavbarContent />
    </Suspense>
  );
}

// Main Navbar content with proper client handling
function NavbarContent() {
  const { session, userRole, isLoading, signOut } = useSupabaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark as per user request
  const router = useRouter();

  // Effect to read initial theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (systemPrefersDark) {
      setTheme('dark');
      document.documentElement.classList.toggle('dark', true);
    } else {
      setTheme('light');
      document.documentElement.classList.toggle('dark', false);
    }
  }, [theme]);

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
    router.push('/login');
    router.refresh();
  };

  // Navigation links shown when a user is logged in
  const navLinks = [
    { href: '/', label: 'Dashboard', icon: <BarChart2 className="mr-2 h-4 w-4" /> },
    { href: '/analyze', label: 'Analyze Video', icon: <PlusCircle className="mr-2 h-4 w-4" /> },
    { href: '/history', label: 'History', icon: <History className="mr-2 h-4 w-4" /> },
  ];

  // Admin links shown only to users with appropriate roles
  const adminLinks = [
    { 
      href: '/admin', 
      label: 'Admin Panel', 
      icon: <ShieldAlert className="mr-2 h-4 w-4" />,
      minRole: 'analyst' 
    },
    { 
      href: '/admin/users', 
      label: 'User Management', 
      icon: <Users className="mr-2 h-4 w-4" />,
      minRole: 'super_admin'
    },
    { 
      href: '/admin/analytics', 
      label: 'Analytics', 
      icon: <FileBarChart className="mr-2 h-4 w-4" />,
      minRole: 'analyst'
    },
    { 
      href: '/admin/moderation', 
      label: 'Content Moderation', 
      icon: <AlertCircle className="mr-2 h-4 w-4" />,
      minRole: 'content_moderator'
    }
  ];

  // Helper function to check if user has required role
  const hasRequiredRole = (minRole: UserRole): boolean => {
    const roleHierarchy: Record<UserRole, number> = {
      'user': 0,
      'analyst': 1,
      'content_moderator': 2,
      'super_admin': 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[minRole as UserRole];
  };

  // Filter admin links based on user role
  const filteredAdminLinks = adminLinks.filter(link => 
    hasRequiredRole(link.minRole as UserRole)
  );

  if (isLoading) {
    return (
      <nav className="border-b border-border bg-background shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Youtube className="mr-2 h-7 w-7 text-red-500" />
              <span className="text-xl font-bold text-foreground">TubeInsight</span>
            </div>
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div> 
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground transition-colors hover:text-primary/80">
            <Youtube className="h-7 w-7 text-red-500" />
            <span>TubeInsight</span>
          </Link>

          <div className="hidden items-center space-x-1 md:flex">
            {session && navLinks.map((link) => (
              <Link key={link.label} href={link.href} passHref>
                <Button variant="ghost" size="sm" asChild={false} className="flex items-center">
                   {link.icon}{link.label}
                </Button>
              </Link>
            ))}
            
            {session && filteredAdminLinks.length > 0 && (
              <>
                <div className="mx-2 h-6 w-px bg-border"></div> {/* Divider */}
                {filteredAdminLinks.map((link) => (
                  <Link key={link.label} href={link.href} passHref>
                    <Button variant="ghost" size="sm" asChild={false} className="flex items-center text-primary">
                       {link.icon}{link.label}
                    </Button>
                  </Link>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </Button>
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
              <Link href="/login" passHref>
                <Button variant="default" size="sm">Login</Button>
              </Link>
            )}
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

      {isMobileMenuOpen && session && (
        <div className="border-t border-border bg-background py-2 md:hidden">
          <div className="container mx-auto space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={`mobile-${link.label}`}
                href={link.href}
                className="flex items-center rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(false)} 
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            {/* Admin links in mobile view */}
            {filteredAdminLinks.length > 0 && (
              <>
                <div className="my-2 border-t border-border"></div>
                <div className="px-3 py-1 text-sm font-semibold text-muted-foreground">
                  Admin
                </div>
                
                {filteredAdminLinks.map((link) => (
                  <Link
                    key={`mobile-${link.label}`}
                    href={link.href}
                    className="flex items-center rounded-md px-3 py-2 text-base font-medium text-primary hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setIsMobileMenuOpen(false)} 
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            
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
