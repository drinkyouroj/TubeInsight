// frontend/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";

// This route is compatible with static export
export const dynamic = 'force-static';

export async function GET() {
  // In a static export, we can't make authenticated requests to the backend
  // Return a 501 Not Implemented response for static exports
  return NextResponse.json(
    { 
      error: "This endpoint requires server-side functionality",
      message: "The /api/admin/users endpoint is not available in static export mode. Please use a server environment with dynamic rendering enabled."
    },
    { status: 501 }
  );
}

// This is the original implementation for reference
// It's not used in static export mode
/*
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// This route should not be statically exported
// It's meant to be handled by the server at runtime
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[API Route /api/admin/users] Handler invoked.');
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward query params for pagination, filtering, etc.
  const url = new URL(req.url);
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:5000/v1";
  const apiUrl = `${backendUrl}/admin/users${url.search ? url.search : ""}`;
  console.log(`[API Route /api/admin/users] Fetching from backend: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.error || 'Failed to fetch users' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
*/