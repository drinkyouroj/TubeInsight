// File: frontend/app/auth/callback/route.ts
// This is a Next.js Route Handler for Supabase OAuth and email auth callbacks.
// This route is compatible with static export and handles authentication callbacks on the client side

export const dynamic = 'force-static';

import { NextResponse } from 'next/server';

// For static export, we need to use a simple redirect without URL manipulation
// The client-side handler will extract the parameters from the URL
export function GET() {
  // For static export, we must use an absolute URL
  // Using the base URL of the deployment (this will be replaced during build)
  return NextResponse.redirect(new URL('/auth/callback-handler', 'http://localhost:3000'));
}
