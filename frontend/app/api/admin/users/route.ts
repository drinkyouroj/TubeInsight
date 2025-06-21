// frontend/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  console.log('[API Route /api/admin/users] Handler invoked.');
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward query params for pagination, filtering, etc.
  const url = new URL(req.url);
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000";
  const apiUrl = `${backendUrl}/v1/admin/users${url.search ? url.search : ""}`;
  console.log(`[API Route /api/admin/users] Fetching from backend: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  const data = await response.json();
  console.log('Backend response data:', JSON.stringify(data, null, 2));
  console.log('Response status:', response.status);
  
  return NextResponse.json(data, { status: response.status });
}