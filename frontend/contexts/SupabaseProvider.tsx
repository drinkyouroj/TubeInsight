// File: frontend/contexts/SupabaseProvider.tsx
'use client'; // This is a client component because it uses React Context and creates a client instance.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { type SupabaseClient, type Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Define user role type
type UserRole = 'user' | 'analyst' | 'content_moderator' | 'super_admin';

// Define the shape of the context value
type SupabaseContextType = {
  supabase: SupabaseClient | null;
  session: Session | null;
  userRole: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

// Create the context with an undefined initial value
const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

// Define the provider component
export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);

      if (initialSession?.user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', initialSession.user.id)
            .single();

          if (error) throw error;
          if (profile?.role) {
            setUserRole(profile.role as UserRole);
          }
        } catch (error) {
          console.error('Error fetching initial user role:', error);
          setUserRole('user');
        }
      }
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user?.id) {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', newSession.user.id)
              .single();
            if (error) throw error;
            if (profile?.role) {
              setUserRole(profile.role as UserRole);
            } else {
              setUserRole('user');
            }
          } catch (error) {
            console.error('Error fetching user role on auth change:', error);
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
        // Refresh server components on auth change
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const value = {
    supabase,
    session,
    userRole,
    isLoading,
    signOut,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to easily access the Supabase auth context
export const useSupabaseAuth = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseProvider');
  }
  return context;
};
