// File: frontend/components/auth/AuthForm.tsx
'use client'; 

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; 
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Added useState import
import { LogIn, ExternalLink } from 'lucide-react'; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
// Button component is not used directly in this version of AuthForm, but can be kept for future custom actions
// import { Button } from '@/components/ui/Button'; 
import Link from 'next/link';

export default function AuthForm() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const url = new URL(window.location.href);
        const nextPath = url.searchParams.get('next');
        router.push(nextPath || '/'); 
        router.refresh(); 
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Ensure window.location.origin is only accessed on client to prevent SSR errors for redirectTo
  const [redirectToUrl, setRedirectToUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectToUrl(`${window.location.origin}/auth/callback`);
    }
  }, []);

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
            redirectTo={redirectToUrl} // Use state variable for redirectTo
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
            // view="sign_in" // This was correctly removed/commented out previously
          />
        </CardContent>
         <CardFooter className="flex flex-col items-center text-center px-6 pt-4 pb-6 border-t dark:border-slate-800">
            <p className="text-xs text-muted-foreground mb-2">
                By signing in, you agree to our (non-existent) Terms of Service and Privacy Policy.
            </p>
            {/* Corrected Link component usage: removed legacyBehavior and nested <a> */}
            <Link
              href="https://github.com/your-repo/tubeinsight" // Replace with your actual repo URL
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
