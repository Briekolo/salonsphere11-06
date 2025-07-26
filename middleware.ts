import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

const authCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60000

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Publieke / whitelisted routes overslaan
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-zA-Z0-9]+$/.test(pathname) || // eindigt op bestandsextensie
    // Client module routes are public
    /^\/[^\/]+\/book/.test(pathname) || // Booking flow
    /^\/[^\/]+\/services/.test(pathname) || // Services page
    /^\/[^\/]+\/staff/.test(pathname) || // Staff page
    /^\/[^\/]+\/contact/.test(pathname) || // Contact page
    /^\/[^\/]+$/.test(pathname) && pathname !== '/' // Domain landing page
  ) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/sign-in'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
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
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Sessieset‐cookie meegeven
  return res
}

export const config = {
  matcher: ['/((?!api|_next|favicon|.*\\..*).*)']
} 