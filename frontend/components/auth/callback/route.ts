// File: frontend/app/auth/callback/route.ts
// Route handler for Supabase OAuth callback
import { createServerClient as createRouteHandlerClient, type CookieOptions } from '@supabase/ssr' // alias import
import { cookies as nextCookies } from 'next/headers' // alias import
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/' // Default redirect to home/dashboard

  if (code) {
    const cookieStore = nextCookies()
    const supabase = createRouteHandlerClient( // Use aliased import
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
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  console.error('OAuth callback error or no code provided');
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`) // Redirect to login with error
}
