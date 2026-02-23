import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { signupLimiter, acceptLimiter, applyRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting for sensitive auth endpoints (runs before session work) ---
  if (request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';

    let limiter = null;
    if (pathname === '/api/auth/signup') limiter = signupLimiter;
    else if (pathname === '/api/auth/invite/accept') limiter = acceptLimiter;

    if (limiter) {
      const result = await applyRateLimit(limiter, ip);

      if (result && !result.success) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.reset),
            },
          },
        );
      }

      // Not rate limited — pass through with informational headers
      const rateLimitResponse = NextResponse.next({ request: { headers: request.headers } });
      if (result) {
        rateLimitResponse.headers.set('X-RateLimit-Limit', String(result.limit));
        rateLimitResponse.headers.set('X-RateLimit-Remaining', String(result.remaining));
        rateLimitResponse.headers.set('X-RateLimit-Reset', String(result.reset));
      }
      return rateLimitResponse;
    }
  }

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
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/team') ||
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
