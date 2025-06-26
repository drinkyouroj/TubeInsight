import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  console.log('[API Route /api/admin/users] Handler invoked.');
  
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('Unauthorized: No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('User authenticated:', user.email);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Unauthorized: No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for pagination
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const per_page = url.searchParams.get('per_page') || '20';

    // Forward the request to the backend API
    // Fix: Use NEXT_PUBLIC_BACKEND_API_URL instead of BACKEND_API_URL to match .env.local
    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
    
    // Debug log to see what URL we're using
    console.log('Using backend API URL:', backendApiUrl);
    
    // Fix: Ensure we're using the correct path to the backend users endpoint
    // The Flask blueprint is registered at /v1/admin, so the users endpoint is at /v1/admin/users
    const baseUrl = backendApiUrl.endsWith('/api') 
      ? backendApiUrl.replace(/\/api$/, '')
      : backendApiUrl;
      
    const formattedBackendUrl = `${baseUrl}/v1/admin/users`;
    const fullUrl = `${formattedBackendUrl}?page=${page}&per_page=${per_page}`;
    
    console.log('Full backend URL:', fullUrl);
    
    // Add more verbose debug logging
    console.log('Session token available:', !!session.access_token);
    console.log('Token length:', session.access_token?.length);
    console.log('Forwarding request to backend with auth token');
    
    // Try a direct fetch to the backend with full debugging
    try {
      const response = await fetch(fullUrl, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Backend response status:', response.status);
      console.log('Backend response status text:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error details:', errorText);
        return NextResponse.json({ 
          error: "Backend API error", 
          status: response.status,
          details: errorText 
        }, { status: response.status });
      }

      const data = await response.json();
      console.log('Successfully received data from backend');
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError.message);
      return NextResponse.json({ 
        error: "Failed to communicate with backend", 
        details: fetchError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
