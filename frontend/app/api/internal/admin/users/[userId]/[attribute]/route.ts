import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type RouteContext = {
  params: {
    userId: string;
    attribute: string;
  };
};

export async function PUT(
  req: NextRequest,
  context: any
) {
  const { params } = context;
  console.log(`[API Route /api/admin/users/${params.userId}/${params.attribute}] PUT handler invoked.`);

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, attribute } = params;
  const body = await req.json();

  // Forward the request to the backend API
  const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api';
  const backendUrl = `${backendApiUrl}/admin/users/${userId}/${attribute}`;

  console.log(`Forwarding PUT request to backend: ${backendUrl}`);

  const response = await fetch(backendUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseData = await response.text();
  // Try to parse as JSON, but fall back to text if it fails
  try {
    const jsonResponse = JSON.parse(responseData);
    console.log('Backend response data:', JSON.stringify(jsonResponse, null, 2));
    return NextResponse.json(jsonResponse, { status: response.status });
  } catch (error) {
    console.log('Backend response is not JSON:', responseData);
    return new NextResponse(responseData, { status: response.status });
  }
}
