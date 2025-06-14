import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Publieke / whitelisted routes overslaan
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // eindigt op bestandsextensie
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

  // Sessieset‐cookie meegeven
  return res
}

export const config = {
  matcher: ['/((?!api|_next|favicon).*)']
} 