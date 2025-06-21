// File: frontend/middleware.ts
// Middleware to refresh Supabase session if expired and protect routes
import { createServerClient as createMiddlewareClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for: ${pathname}`);

  // If the request is for any /api/ path, log it and pass it through directly.
  // This is a diagnostic step to see if middleware's Supabase logic interferes with API routes.
  if (pathname.startsWith('/api/')) {
    console.log(`[Middleware] API route ${pathname} detected. Bypassing Supabase logic in middleware and passing through.`);
    return NextResponse.next(); 
  }

  // Create an mutable response object by cloning the request headers
  // This allows us to set cookies on the response later.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request and response cookies.
          request.cookies.set({ name, value, ...options });
          // Modify the existing response object directly
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies.
          request.cookies.set({ name, value: '', ...options });
          // Modify the existing response object directly
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session for Server Components.
  // Important! Before calling `getUser()` or `getUser()`.
  // This also refreshes the session cookie if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected routes.
  // These are routes that require authentication.
  // We assume the root '/' is part of the protected dashboard experience.
  const protectedRoutes = [
    '/',
    '/analyze',
    '/history',
    // Add more specific protected routes if needed, e.g., /analysis/*
  ];

  // Define authentication routes (pages user should NOT see if logged in)
  const authRoutes = ['/login']; // Add '/signup' if you create that page

  // Check if the current path is one of the explicitly defined protected routes
  // or if it's a dynamic route under /analysis/
  const isProtectedRoute =
    protectedRoutes.includes(pathname) || pathname.startsWith('/analysis/');

  const isAuthRoute = authRoutes.includes(pathname);

  if (!user && isProtectedRoute) {
    // No session and trying to access a protected route.
    // Redirect to login page.
    // Preserve the intended destination via 'next' query parameter for redirect after login.
    const redirectUrl = new URL('/login', request.url);
    if (pathname !== '/') { // Avoid adding 'next=/' for the root path
      redirectUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    // User has a session but is trying to access an authentication route (e.g., /login).
    // Redirect them to the main dashboard page (root).
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Add this check to ensure session and session.user exist
    if (!user) {
      // If no session or user, redirect to login, preserving the intended admin path
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
    }
    try {
      // Get user role from profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Role hierarchy
      const roleHierarchy: Record<string, number> = {
        'user': 0,
        'analyst': 1,
        'content_moderator': 2,
        'super_admin': 3
      };

      // Check role requirements based on URL pattern
      let requiredRole = 'analyst'; // Default minimum role for admin area

      // Special path-based requirements
      if (request.nextUrl.pathname.startsWith('/admin/users')) {
        requiredRole = 'super_admin';
      } else if (request.nextUrl.pathname.startsWith('/admin/moderation')) {
        requiredRole = 'content_moderator';
      }

      // Check if user has sufficient permissions
      if (!profile || 
          !profile.role || 
          roleHierarchy[profile.role] < roleHierarchy[requiredRole]) {
        // User doesn't have sufficient permissions, redirect to homepage
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // If there's an error, we redirect to homepage for safety
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If none of the above conditions are met, proceed with the request.
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
    '/admin/:path*',
    '/api/admin/:path*'
  ],
};
