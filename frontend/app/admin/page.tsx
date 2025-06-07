'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldAlert,
  Users,
  FileBarChart,
  AlertCircle,
  Database,
  ServerCrash,
  Activity
} from 'lucide-react';
import Link from 'next/link';

type UserRole = 'user' | 'analyst' | 'content_moderator' | 'super_admin';

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

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/admin');
          return;
        }
        
        // Get user role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError || !profile) {
          console.error('Error fetching user profile:', profileError);
          setError('You do not have permission to access this page');
          router.push('/');
          return;
        }
        
        // Check if user has admin role
        const role = profile.role as UserRole;
        if (!role || role === 'user') {
          setError('You do not have permission to access this page');
          router.push('/');
          return;
        }
        
        setUserRole(role);
        
        // Fetch system health data
        if (role === 'super_admin') {
          fetchSystemHealth();
        }
        
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication error');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [supabase, router]);
  
  const fetchSystemHealth = async () => {
    try {
      // Get JWT token for authenticated API call
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authentication session');
      }
      
      const response = await fetch('/api/admin/system/health', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch system health data');
      }
      
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError('Could not load system health data');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p>Loading admin dashboard...</p>
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
      minRole: 'analyst'
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: <Users className="mr-2 h-5 w-5" />,
      description: 'Manage users, roles and permissions',
      minRole: 'super_admin'
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: <FileBarChart className="mr-2 h-5 w-5" />,
      description: 'System analytics, usage metrics and growth trends',
      minRole: 'analyst'
    },
    {
      href: '/admin/moderation',
      label: 'Content Moderation',
      icon: <AlertCircle className="mr-2 h-5 w-5" />,
      description: 'Review and moderate user-generated content',
      minRole: 'content_moderator'
    },
  ];
  
  // Filter links based on user role
  const roleHierarchy: Record<UserRole, number> = {
    'user': 0,
    'analyst': 1,
    'content_moderator': 2,
    'super_admin': 3
  };
  
  const filteredLinks = adminLinks.filter(link => {
    const linkMinRole = link.minRole as UserRole;
    return userRole && roleHierarchy[userRole] >= roleHierarchy[linkMinRole];
  });

  return (
    <div className="container mx-auto py-8">
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
      
      {userRole === 'super_admin' && health && (
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold">System Health</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* User Stats Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.users.total}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-500">{health.users.active} active</span>
                  {health.users.suspended > 0 && (
                    <span className="ml-2 text-amber-500">{health.users.suspended} suspended</span>
                  )}
                  {health.users.banned > 0 && (
                    <span className="ml-2 text-red-500">{health.users.banned} banned</span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Database Stats Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(health.database.tables).map(([table, count]) => (
                    <div key={table}>
                      <div className="text-xs text-muted-foreground">{table}</div>
                      <div className="text-sm font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* API Usage 24h Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Usage (24h)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(health.api_usage.last_24h).map(([api, count]) => (
                    <div key={api}>
                      <div className="text-xs text-muted-foreground">{api}</div>
                      <div className="text-sm font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* API Usage 7d Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Usage (7d)</CardTitle>
                <ServerCrash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(health.api_usage.last_7d).map(([api, count]) => (
                    <div key={api}>
                      <div className="text-xs text-muted-foreground">{api}</div>
                      <div className="text-sm font-medium">{count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
