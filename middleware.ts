import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Enhanced middleware with API security and route protection
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is an API request
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(request);
  }
  
  // Define public routes that don't need authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/register', 
    '/auth/verify',
    '/auth/forgot-password',
    '/invite',
    '/'
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔓 Middleware: ${pathname} | Public route`);
    }
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Middleware: ${pathname} | No token, redirecting to login`);
    }
    // Redirect to login page
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Validate token (basic validation)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 Middleware: ${pathname} | Token expired, redirecting to login`);
      }
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Middleware: ${pathname} | Invalid token, redirecting to login`);
    }
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Middleware: ${pathname} | Authenticated access`);
  }
  
  return NextResponse.next();
}

// Handle API requests with security
async function handleApiRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public API endpoints that don't need authentication
  const publicEndpoints = [
    '/api/health',
    '/api/webhooks',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    // Add other public endpoints here
  ];
  
  // Check if endpoint is public
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    pathname.startsWith(endpoint)
  );
  
  if (isPublicEndpoint) {
    return NextResponse.next();
  }
  
  // For protected API endpoints, we'll handle auth in the route handlers
  // This allows for more granular control per endpoint
  
  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin = request.headers.get('origin');
    
    if (allowedOrigins.length > 0 && origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return new NextResponse(null, { status: 200, headers: response.headers });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔒 API Middleware: ${pathname} | Security headers added`);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};