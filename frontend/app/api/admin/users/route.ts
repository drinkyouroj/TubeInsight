// frontend/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  console.log('[API Route /api/admin/users] Handler invoked.');
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward the request to the backend API
  const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
  const response = await fetch(`${backendApiUrl}/admin/users`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  const data = await response.json();
  console.log('Backend response data:', JSON.stringify(data, null, 2));
  console.log('Response status:', response.status);
  
  return NextResponse.json(data, { status: response.status });
}