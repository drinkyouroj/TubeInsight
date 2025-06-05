// File: frontend/lib/supabase/client.ts
// Purpose: Initializes and exports the Supabase client for client-side usage.

import { createBrowserClient } from '@supabase/ssr';
// Note: '@supabase/ssr' is the recommended package for Next.js App Router
// as it handles client, server, and middleware scenarios.
// For a purely client-side client, createBrowserClient is used.

// Define a function to create the client.
// This approach is good if you need to pass dynamic config, but for typical usage,
// initializing it directly is also common.
export function createClient() {
  // These environment variables are expected to be set in your .env.local file
  // and prefixed with NEXT_PUBLIC_ to be accessible on the client side.
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

  // Create and return the Supabase client instance for browser environments
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Optionally, you can create and export a singleton instance if preferred,
// though the function approach is flexible and commonly used with the provider pattern.
// const supabase = createClient();
// export default supabase;
