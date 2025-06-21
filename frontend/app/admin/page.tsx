'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';

// UI components - use correct casing based on actual file names
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Icons
import {
  ShieldAlert,
  Users,
  FileBarChart,
  AlertCircle,
  Database,
  ServerCrash,
  Activity
} from 'lucide-react';

// Import permissions system
import { UserRole, Permission, hasPermission } from '@/utils/permissions';

type SystemHealth = {
  database: {
    tables: Record<string, number>;
  };
  api_usage: {
    last_24h: Record<string, number>;
    last_7d: Record<string, number>;
  };
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
  };
  timestamp: string;
};

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-gray-600">Loading admin dashboard...</p>
    </div>
  );
}

// Error boundary component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// Wrap the dashboard in Suspense boundaries as per project standards
export default function AdminDashboard() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

// Main dashboard content wrapped in client-side component
function AdminDashboardContent() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create the Supabase client with proper typing
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  
  // Initialize Supabase client
  useEffect(() => {
    try {
      const client = createClient();
      setSupabase(client);
    } catch (err: any) {
      console.error('Failed to initialize Supabase client:', err?.message || err);
      setError('Authentication service unavailable');
    }
  }, []);
  
  // Add the supabase dependency to the auth check effect
  useEffect(() => {
    // Skip auth check if supabase client isn't ready yet
    if (!supabase) return;
    
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch session from Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login?redirect=/admin');
          return;
        }
        
        // Get user role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError.message, profileError.details);
          setError('Unable to verify your permissions');
          return;
        }
        
        if (!profile) {
          console.error('Profile not found for user:', user.id);
          setError('User profile not found');
          router.push('/');
          return;
        }
        
        // Check if user has admin role
        const role = profile.role as UserRole;
        if (!role || role === 'user') {
          console.log('User does not have admin permissions:', role);
          setError('You do not have permission to access this page');
          router.push('/');
          return;
        }
        
        console.log('User authenticated with role:', role);
        setUserRole(role);
        
      } catch (err: any) {
        console.error('Auth check error:', err?.message || err);
        setError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchData();
  }, [supabase, router]);  // Include dependencies

  useEffect(() => {
    // Skip auth check if supabase client isn't ready yet
    if (!supabase) return;
    
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Double-check that Supabase client is still available
        if (!supabase) {
          console.error('Supabase client not initialized');
          setError('Authentication service unavailable');
          return;
        }
        
        // Check if user is logged in
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/login?redirect=/admin');
          return;
        }
        
        // Get user role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError.message, profileError.details);
          setError('Unable to verify your permissions');
          return;
        }
        
        if (!profile) {
          console.error('Profile not found for user:', user.id);
          setError('User profile not found');
          router.push('/');
          return;
        }
        
        // Check if user has admin role
        const role = profile.role as UserRole;
        if (!role || role === 'user') {
          console.log('User does not have admin permissions:', role);
          setError('You do not have permission to access this page');
          router.push('/');
          return;
        }
        
        console.log('User authenticated with role:', role);
        setUserRole(role);
        
      } catch (err: any) {
        console.error('Auth check error:', err?.message || err);
        setError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchData();
  }, [supabase, router]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="flex justify-center">
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const adminLinks = [
    {
      href: '/admin',
      label: 'Admin Dashboard',
      icon: <ShieldAlert className="mr-2 h-5 w-5" />,
      description: 'Overview of system metrics and admin tools',
      permission: Permission.VIEW_ANALYTICS
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: <Users className="mr-2 h-5 w-5" />,
      description: 'Manage users, roles and permissions',
      permission: Permission.VIEW_USERS
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: <FileBarChart className="mr-2 h-5 w-5" />,
      description: 'System analytics, usage metrics and growth trends',
      permission: Permission.VIEW_ANALYTICS
    },
    {
      href: '/admin/moderation',
      label: 'Content Moderation',
      icon: <AlertCircle className="mr-2 h-5 w-5" />,
      description: 'Review and moderate user-generated content',
      permission: Permission.MODERATE_CONTENT
    },
  ];
  
  // Filter links based on user permissions
  const filteredLinks = adminLinks.filter(link => {
    return userRole && hasPermission(userRole, link.permission);
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your TubeInsight application</p>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filteredLinks.map((link) => (
          <Card key={link.href} className="hover:border-primary">
            <Link href={link.href}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{link.label}</CardTitle>
                {link.icon}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
