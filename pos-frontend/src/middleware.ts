import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // TEMPORARY: allow access to dashboard during testing without auth.
  // TODO: Re-enable auth protection for /dashboard after testing.
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // protect dashboard and other routes under /dashboard
  const protectedPaths = ['/dashboard', '/dashboard/'];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // Check for refreshToken cookie — backend sets httpOnly cookie named 'refreshToken'
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply to these routes
export const config = {
  matcher: ['/dashboard/:path*'],
};