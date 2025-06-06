// frontend/components/auth/AuthForm.tsx
'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; 
import { createClient } from '@/lib/supabase/client'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogIn, ExternalLink } from 'lucide-react'; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';

export default function AuthForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();
  const router = useRouter();
  const [redirectToUrl, setRedirectToUrl] = useState('');

  useEffect(() => {
    setIsMounted(true);
    // Get the full URL for redirect after login
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('Setting redirectTo URL:', redirectTo);
    setRedirectToUrl(redirectTo);
    setIsLoading(false);

    // Check for any error messages in the URL
    const error = searchParams.get('error');
    if (error) {
      setError(`Authentication error: ${error}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isMounted) return;

    console.log('AuthForm: Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthForm: onAuthStateChange event:', event, 'session:', session);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          console.log('AuthForm: SIGNED_IN event detected with session.');
          
          // Get the next path from URL or default to '/'
          const nextPath = new URLSearchParams(window.location.search).get('next') || '/';
          console.log('AuthForm: Next path:', nextPath);
          
          // Ensure we have a valid session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            throw new Error('No session found after sign in');
          }
          
          console.log('AuthForm: Current session verified, redirecting to:', nextPath);
          router.push(nextPath);
          router.refresh();
        } catch (err) {
          console.error('AuthForm: Error during sign in:', err);
          setError(`Error during sign in: ${err.message}`);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthForm: SIGNED_OUT event detected.');
        router.push('/login');
        router.refresh();
      } else if (event === 'INITIAL_SESSION') {
        console.log('AuthForm: INITIAL_SESSION event detected');
        if (session) {
          console.log('AuthForm: User is already signed in, redirecting...');
          const nextPath = new URLSearchParams(window.location.search).get('next') || '/';
          router.push(nextPath);
        }
      }
    });

    return () => {
      console.log('AuthForm: Unsubscribing from onAuthStateChange listener');
      subscription?.unsubscribe();
    };
  }, [supabase, router, isMounted]);

  // Show loading state while initializing
  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-md dark:bg-slate-800">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-center text-slate-600 dark:text-slate-300">
            Loading authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show error message if any
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md p-6 space-y-4 bg-red-50 border border-red-200 rounded-lg shadow-md dark:bg-red-900/20 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">Authentication Error</h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md mx-auto shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="inline-block p-3 mb-3 bg-primary/10 dark:bg-primary/20 rounded-full">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to TubeInsight</CardTitle>
          <CardDescription>
            Sign in or create an account to analyze YouTube comments.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary) / 0.9)',
                    inputBackground: 'hsl(var(--background))',
                    inputText: 'hsl(var(--foreground))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                  },
                  radii: {
                    borderRadiusButton: 'var(--radius)',
                    buttonBorderRadius: 'var(--radius)',
                    inputBorderRadius: 'var(--radius)',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fonts: {
                    bodyFontFamily: `var(--font-inter), sans-serif`,
                    buttonFontFamily: `var(--font-inter), sans-serif`,
                    labelFontFamily: `var(--font-inter), sans-serif`,
                  },
                },
              },
              extend: true,
            }}
            providers={['google', 'github']}
            redirectTo={redirectToUrl}
            socialLayout="horizontal"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign In',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Don't have an account? Sign Up",
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Create a password',
                  button_label: 'Sign Up',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Already have an account? Sign In',
                },
                forgotten_password: {
                  email_label: 'Email address',
                  button_label: 'Send reset instructions',
                  link_text: 'Forgot your password?',
                },
                update_password: {
                  password_label: 'New password',
                  button_label: 'Update password',
                }
              },
            }}
          />
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center px-6 pt-4 pb-6 border-t dark:border-slate-800">
          <p className="text-xs text-muted-foreground mb-2">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
          <Link
            href="https://github.com/your-repo/tubeinsight"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center"
          >
            View Project on GitHub <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}