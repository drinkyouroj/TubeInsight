import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  console.log('[API Route /api/admin/users] Handler invoked.');
  
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for pagination
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const per_page = url.searchParams.get('per_page') || '20';

    // Forward the request to the backend API
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
    const backendUrl = `${backendApiUrl}/admin/users?page=${page}&per_page=${per_page}`;
    
    console.log('Forwarding request to backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Backend error details:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
