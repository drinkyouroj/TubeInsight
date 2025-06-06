// File: frontend/app/(auth)/login/page.tsx
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  return <AuthForm />;
}

// File: frontend/components/auth/SupabaseListener.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SupabaseListener() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // This listener can be used to react to auth events on the client-side.
      // For example, refreshing the page or parts of it if necessary.
      // Middleware typically handles redirects for protected routes.
      // A router.refresh() ensures Server Components re-evaluate based on new auth state.
      router.refresh(); 
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  return null; // This component does not render anything visible
}
