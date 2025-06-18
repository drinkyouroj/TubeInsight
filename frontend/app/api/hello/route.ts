// frontend/app/api/hello/route.ts
import { NextResponse } from 'next/server';

// This is a static route that works with output: 'export'
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ message: 'Hello from API' });
}