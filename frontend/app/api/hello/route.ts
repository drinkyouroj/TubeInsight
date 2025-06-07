// frontend/app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('[API Route /api/hello] Handler invoked.');
  return NextResponse.json({ message: 'Hello from API' });
}