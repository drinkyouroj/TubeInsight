// File: frontend/components/layout/Navbar.tsx
'use client'; 

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type UserRole = 'user' | 'analyst' | 'content_moderator' | 'super_admin';

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // Fetch user role if session exists
      if (currentSession?.user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user role:', error);
          } else if (profileData?.role) {
            setUserRole(profileData.role as UserRole);
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        }
      }
      
      setIsLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        
        // Update user role when auth state changes
        if (newSession?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', newSession.user.id)
              .single();
              
            if (!error && profileData?.role) {
              setUserRole(profileData.role as UserRole);
            }
          } catch (error) {
            console.error('Failed to fetch user role:', error);
          }
        } else {
          setUserRole('user');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false); 
    await supabase.auth.signOut();
    router.push('/login'); 
    router.refresh(); 
  };

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
