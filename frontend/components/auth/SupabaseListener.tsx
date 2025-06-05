// File: frontend/components/auth/SupabaseListener.tsx
'use client'; // This is a client component

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Your client-side Supabase client

export default function SupabaseListener() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Listen for changes to authentication state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // This event fires on:
      // - INITIAL_SESSION (when the listener is first set up)
      // - SIGNED_IN
      // - SIGNED_OUT
      // - TOKEN_REFRESHED
      // - USER_UPDATED
      // - PASSWORD_RECOVERY

      // You can add specific logic here based on the event if needed.
      // For instance, redirecting on SIGNED_OUT if not handled by middleware,
      // or updating user profile data in a global state.

      // A common action is to refresh the router to ensure Server Components
      // re-evaluate based on the new authentication state.
      // This is especially important if your middleware or page content
      // depends on the session.
      router.refresh();
    });

    // Cleanup: Unsubscribe from the listener when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]); // Dependencies for the useEffect hook

  // This component does not render any visible UI, so it returns null.
  return null;
}
