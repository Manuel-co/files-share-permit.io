// ./middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  if (!token && pathname.startsWith('/dashboard') || pathname.startsWith('/files')) {
    console.log("redirected back to login");
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && (pathname === '/login' || pathname === '/register')) {
    console.log("redirected to dashboard");
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/files/:path*', '/login', '/register'],
};

