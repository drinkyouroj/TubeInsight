// File: frontend/app/auth/callback/route.ts
// This is a Next.js Route Handler for Supabase OAuth and email auth callbacks.

import { createServerClient as createRouteHandlerClient, type CookieOptions } from '@supabase/ssr';
// It's good practice to alias imports if the same function name is used in different contexts
// e.g., createServerClient from '@supabase/ssr' might be used differently here than in middleware.
// However, for this specific package, the usage is generally consistent for Route Handlers.

import { cookies as nextCookies } from 'next/headers'; // For accessing cookies in Route Handlers
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // 'next' is a query parameter that can be used to redirect the user
  // to a specific page after successful authentication.
  // It's often set by the middleware when redirecting an unauthenticated user.
  const next = searchParams.get('next') ?? '/'; // Default to redirecting to the dashboard/root

  if (code) {
    // If a 'code' is present in the URL, it means Supabase has redirected
    // back to the app after an OAuth flow or email link click.
    // We need to exchange this code for a session.
    const cookieStore = nextCookies(); // Get cookie store specific to Route Handlers
    const supabase = createRouteHandlerClient( // Use the correct Supabase client for Route Handlers
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) { 
            const store = await cookieStore; 
            return store.get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) { 
            const store = await cookieStore; 
            store.set({ name, value, ...options });
          },
          async remove(name: string, options: CookieOptions) { 
            const store = await cookieStore; 
            store.set({ name, value: '', ...options }); 
          },
        },
      }
    );

    // Exchange the code for a session with Supabase
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If the code exchange is successful and no error occurs,
      // redirect the user to their intended destination ('next') or the dashboard.
      // Using absolute URL for redirection is safer.
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // If there's an error during code exchange
      console.error('Error exchanging code for session:', error.message);
      // Redirect to an error page or the login page with an error message.
      const redirectUrl = new URL('/login', origin);
      redirectUrl.searchParams.set('error', 'auth_callback_failed');
      redirectUrl.searchParams.set('error_description', error.message || 'Could not log you in. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If no 'code' is present in the URL, it's an unexpected state.
  // Redirect to an error page or the login page.
  console.error('OAuth callback called without a code.');
  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'missing_auth_code');
  redirectUrl.searchParams.set('error_description', 'Authentication callback was missing the required code.');
  return NextResponse.redirect(redirectUrl);
}
