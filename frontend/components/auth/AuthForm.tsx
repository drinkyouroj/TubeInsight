// File: frontend/components/auth/AuthForm.tsx
'use client'; // This component interacts with browser APIs (router, window) and Supabase client.

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Predefined theme for the Auth UI
import { createClient } from '@/lib/supabase/client'; // Your client-side Supabase client
import { useRouter }_modules/esbuild/lib/main.js:1059:25
    at runOnEndCallbacks (/app/node_modules/esbuild/lib/main.js:1486:45)
    at buildResponseToResult (/app/node_modules/esbuild/lib/main.js:1057:7)
    at /app/node_modules/esbuild/lib/main.js:1086:16
    at responseCallbacks.<computed> (/app/node_modules/esbuild/lib/main.js:704:9)
    at handleIncomingPacket (/app/node_modules/esbuild/lib/main.js:764:9)
    at Socket.readFromStdout (/app/node_modules/esbuild/lib/main.js:680:7)
    at Socket.emit (node:events:518:28)
    at addChunk (node:internal/streams/readable:561:12) {
  errors: [Getter/Setter],
  warnings: [Getter/Setter]
}
```

### `frontend/app/globals.css`
This file should contain your Tailwind CSS directives and any global styles.

```css
/*
  File: frontend/app/globals.css
  This file should contain your Tailwind CSS directives and any global styles.
*/

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%; /* Light mode background */
  --foreground: 222.2 84% 4.9%; /* Light mode text */
  
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  
  --radius: 0.5rem; /* Default border radius */
}

[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 215 20.2% 65.1%;
}

/* Apply a default font and antialiasing for better text rendering */
body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-family: var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol");
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Ensure full height for layouts that need it */
html, body, #__next {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

### `frontend/tailwind.config.js`
This file configures Tailwind CSS.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'], 
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: { 
      center: true,
      padding: {
        DEFAULT: '1rem', 
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
      },
      screens: { 
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: { 
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), 
  ],
};
```

### `frontend/next.config.js`
Standard Next.js configuration.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, 
};

module.exports = nextConfig;
```

### `frontend/app/layout.tsx`
Root layout for the application.

```typescript
// File: frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; 
import SupabaseListener from '@/components/auth/SupabaseListener'; 
import SupabaseProvider from '@/contexts/SupabaseProvider'; 

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', 
  variable: '--font-inter', 
});

export const metadata: Metadata = {
  title: {
    default: 'TubeInsight', 
    template: '%s | TubeInsight', 
  },
  description: 'Analyze YouTube comment sentiment effectively and shield yourself from toxicity.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-background font-sans text-foreground antialiased">
        <SupabaseProvider>
          <SupabaseListener />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
```

### `frontend/contexts/SupabaseProvider.tsx`
Provides the Supabase client via React Context.

```typescript
// File: frontend/contexts/SupabaseProvider.tsx
'use client'; 

import React, { createContext, useContext, useMemo } from 'react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; 

type SupabaseContextType = {
  supabase: SupabaseClient;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = (): SupabaseClient => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context.supabase;
};
```

### `frontend/lib/supabase/client.ts`
Initializes the Supabase client for client-side usage.

```typescript
// File: frontend/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.'
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
```

### `frontend/lib/supabase/server.ts`
Initializes the Supabase client for server-side usage.

```typescript
// File: frontend/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers'; 

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.'
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Intentionally empty
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Intentionally empty
        }
      },
    },
  });
}
```

### `frontend/components/auth/SupabaseListener.tsx`
Client component to listen for Supabase auth state changes.

```typescript
// File: frontend/components/auth/SupabaseListener.tsx
'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; 

export default function SupabaseListener() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      router.refresh();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]); 

  return null;
}
```

### `frontend/components/auth/AuthForm.tsx`
This component provides the UI for login/signup using `@supabase/auth-ui-react`.

```typescript
// File: frontend/components/auth/AuthForm.tsx
'use client'; 

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; 
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogIn, ExternalLink } from 'lucide-react'; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // We will define this soon
import Link from 'next/link';

export default function AuthForm() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check for 'next' query parameter for redirection after login
        const url = new URL(window.location.href);
        const nextPath = url.searchParams.get('next');
        router.push(nextPath || '/'); // Redirect to intended page or dashboard
        router.refresh(); 
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Ensure window.location.origin is only accessed on client
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

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
              extend: true, // Allow extending the theme
            }}
            providers={['google', 'github']} 
            redirectTo={redirectTo} // Use client-safe redirect URL
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
            // To show only email/password and social providers:
            view="sign_in" // Can be 'sign_in', 'sign_up', 'forgotten_password', 'update_password', 'magic_link'
            // onlyThirdPartyProviders={false} // Set to true to only show social providers
            // To customize which view is shown by default (e.g. if you want to link directly to sign up)
            // you can control this via URL parameters or manage state outside this component.
          />
        </CardContent>
         <CardFooter className="flex flex-col items-center text-center px-6 pt-4 pb-6 border-t dark:border-slate-800">
            <p className="text-xs text-muted-foreground mb-2">
                By signing in, you agree to our (non-existent) Terms of Service and Privacy Policy.
            </p>
            <Link href="https://github.com/your-repo/tubeinsight" target="_blank" legacyBehavior>
                 <a className="text-xs text-primary hover:underline inline-flex items-center">
                    View Project on GitHub <ExternalLink className="ml-1 h-3 w-3" />
                </a>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

