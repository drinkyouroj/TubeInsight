'use client';

// File: frontend/app/auth/callback-handler/page.tsx
// This is a client-side component that handles the authentication callback
// It processes the OAuth response and exchanges the code for a session

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';

// Component that uses useSearchParams must be wrapped in Suspense
function AuthCallbackHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL or hash fragment
        // In static export mode, the auth callback route redirects here without parameters
        // We need to check both the URL search params and the hash fragment
        let code: string | null = null;
        let next: string = '/';
        let error: string | null = null;
        
        // Check URL search params first (normal flow)
        code = searchParams?.get('code');
        next = searchParams?.get('next') || '/';
        error = searchParams?.get('error');
        
        // If not found, check hash fragment (static export flow)
        if (!code && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          code = hashParams.get('code');
          next = hashParams.get('next') || '/';
          error = hashParams.get('error');
        }

        // Handle error from OAuth provider
        if (error) {
          setStatus('error');
          setErrorMessage(error);
          return;
        }

        // If no code is present, redirect to login
        if (!code) {
          router.push('/login?error=missing_code');
          return;
        }

        // Exchange code for session using Supabase client
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          setStatus('error');
          setErrorMessage(exchangeError.message);
          return;
        }

        // Success! Redirect to the intended destination
        setStatus('success');
        router.push(next);
      } catch (err) {
        console.error('Error handling auth callback:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  // Show loading state while processing
  if (status === 'loading') {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Processing login...</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    );
  }

  // Show error state if something went wrong
  if (status === 'error') {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <h1 className="text-xl font-semibold text-destructive">Authentication Error</h1>
          <p className="mt-2 text-sm">{errorMessage || 'An error occurred during authentication.'}</p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => router.push('/login')}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Success state (should redirect, but just in case)
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="rounded-lg border border-green-500 bg-green-50 p-8 text-center">
        <h1 className="text-xl font-semibold text-green-700">Login Successful!</h1>
        <p className="mt-2 text-sm">Redirecting you to the dashboard...</p>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
export default function AuthCallbackHandler() {
  return (
    <Suspense fallback={
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Loading...</h1>
      </div>
    }>
      <AuthCallbackHandlerContent />
    </Suspense>
  );
}
