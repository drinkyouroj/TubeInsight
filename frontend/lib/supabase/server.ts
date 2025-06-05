// File: frontend/lib/supabase/server.ts
// Purpose: Initializes and exports the Supabase client for server-side usage
// (Server Components, Route Handlers, Next.js API routes if any).

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers'; // Import cookies from next/headers for App Router

export function createSupabaseServerClient() {
  // Get the cookie store from next/headers
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

  // Create and return the Supabase client instance for server environments
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // The get, set, and remove methods are used to manage cookies for session handling.
      // These functions are expected to be synchronous by the Supabase client.
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
