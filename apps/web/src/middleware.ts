import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect routes
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return response;
  }

  // Auth routes
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/campaigns') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/escalations') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/tasks');

  if (session) {
    // Authenticated users
    if (isAuthRoute) {
      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Check user role for member redirect
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role === 'member' && (pathname === '/dashboard' || pathname.startsWith('/campaigns'))) {
      return NextResponse.redirect(new URL('/tasks', request.url));
    }
  } else {
    // Unauthenticated users
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/login') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};