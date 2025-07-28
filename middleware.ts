import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'

const authCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60000

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Processing: ${pathname}`)
  }

  // Skip static assets and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-zA-Z0-9]+$/.test(pathname) || // eindigt op bestandsextensie
    // Client module routes are public
    /^\/[^\/]+\/book/.test(pathname) || // Booking flow
    /^\/[^\/]+\/services/.test(pathname) || // Services page
    /^\/[^\/]+\/staff/.test(pathname) || // Staff page
    /^\/[^\/]+\/contact/.test(pathname) || // Contact page
    /^\/[^\/]+\/auth/.test(pathname) || // Client auth pages
    /^\/[^\/]+\/account/.test(pathname) || // Client account pages
    /^\/[^\/]+$/.test(pathname) && pathname !== '/' // Domain landing page
  ) {
    return NextResponse.next()
  }

  // Create response that will carry cookies
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create supabase client that can set cookies on the response
  const supabase = createMiddlewareSupabaseClient(req, response)
  
  // IMPORTANT: Use getUser() to refresh the session and set cookies
  // This is critical for server-side auth to work
  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
  
  // Then get the session
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (process.env.NODE_ENV === 'development' && error) {
    console.log(`[Middleware] Session error: ${error.message}`)
  }

  // Handle auth pages - redirect authenticated users to dashboard
  if (pathname.startsWith('/auth')) {
    if (session) {
      // User is already logged in, redirect to dashboard
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
    // Allow access to auth pages for non-authenticated users
    return response
  }

  // Handle onboarding - only accessible for authenticated users without tenant_id
  if (pathname.startsWith('/onboarding')) {
    if (!session) {
      // Not authenticated, redirect to sign-in
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/sign-in'
      return NextResponse.redirect(redirectUrl)
    }
    // Allow access to onboarding for authenticated users
    return response
  }

  // Public client module routes
  if (
    /^\/[^\/]+\/book/.test(pathname) || // Booking flow
    /^\/[^\/]+\/services/.test(pathname) || // Services page
    /^\/[^\/]+\/staff/.test(pathname) || // Staff page
    /^\/[^\/]+\/contact/.test(pathname) || // Contact page
    /^\/[^\/]+$/.test(pathname) && pathname !== '/' // Domain landing page
  ) {
    return response
  }

  // All other routes require authentication
  if (!session) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] No session found for ${pathname}, redirecting to sign-in`)
    }
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/sign-in'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Session found for ${pathname}, user: ${session.user.email}`)
  }

  // Onboarding: als tenant_id ontbreekt, forceer redirect
  const { user } = session
  // @ts-ignore
  const tenantId = user?.user_metadata?.tenant_id
  if (!tenantId) {
    const onboardingUrl = req.nextUrl.clone()
    onboardingUrl.pathname = '/onboarding'
    return NextResponse.redirect(onboardingUrl)
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const cacheKey = `admin_${user.id}_${tenantId}`
    const cached = authCache.get(cacheKey)
    
    let isAdmin = false
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      isAdmin = cached.data.isAdmin
    } else {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()
      
      isAdmin = userData?.role === 'admin'
      authCache.set(cacheKey, { data: { isAdmin }, timestamp: Date.now() })
    }

    if (!isAdmin) {
      const dashboardUrl = req.nextUrl.clone()
      dashboardUrl.pathname = '/'
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Return response with updated cookies
  return response
}

export const config = {
  matcher: ['/((?!api|_next|favicon|.*\\..*).*)']
} 