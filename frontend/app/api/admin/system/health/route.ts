import { NextResponse } from 'next/server';

// This route is compatible with static export
export const dynamic = 'force-static';

export async function GET() {
  // In a static export, we can't make authenticated requests to the backend
  // Return a 501 Not Implemented response for static exports
  return NextResponse.json(
    { 
      error: "This endpoint requires server-side functionality",
      message: "The /api/admin/system/health endpoint is not available in static export mode. Please use a server environment with dynamic rendering enabled."
    },
    { status: 501 }
  );
}

// This is the original implementation for reference
// It's not used in static export mode
/*
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Create a Supabase client for server component
    const supabase = createClient();

    // Verify session exists
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' }, 
        { status: 401 }
      );
    }

    // Get user role from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' }, 
        { status: 403 }
      );
    }

    // Forward the request to the backend API
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendApiUrl}/admin/system/health`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in system health API route:', error);
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    );
  }
}
*/
