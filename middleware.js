import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

// Paths that don't require auth
const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/_next/',
  '/cdn-cgi/',
  '/favicon.ico',
];

function isPublic(pathname) {
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p));
}

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const session = req.cookies.get('flax_session')?.value;
  const user = await verifySession(session);

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    if (pathname !== '/') url.searchParams.set('next', pathname + (search || ''));
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Run middleware on every path except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|cdn-cgi|favicon.ico).*)'],
};
