import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Create a Supabase client for server component
    const supabase = createSupabaseServerClient();

    // Verify user exists
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' }, 
        { status: 401 }
      );
    }

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
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
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
      { error: 'Failed to fetch system health data' }, 
      { status: 500 }
    );
  }
}
