import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bakasur_admin_session');

  const isAuthenticated = sessionCookie?.value === 'authenticated_admin';

  return NextResponse.json({
    success: true,
    authenticated: isAuthenticated
  });
}
