import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('[Auth Callback] Processing callback request')
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Log any errors from Supabase
  if (error) {
    console.error('[Auth Callback] Error from Supabase:', {
      error,
      error_description,
      timestamp: new Date().toISOString()
    })
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      
      console.log('[Auth Callback] Exchanging code for session')
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', {
          error: exchangeError,
          message: exchangeError.message,
          timestamp: new Date().toISOString()
        })
        return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(exchangeError.message)}`)
      }
      
      // Get the user to check if they have tenant_id in metadata
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('[Auth Callback] Error getting user:', userError)
        return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(userError.message)}`)
      }
      
      console.log('[Auth Callback] User authenticated:', {
        userId: user?.id,
        email: user?.email,
        hasTenantId: !!user?.user_metadata?.tenant_id,
        metadata: user?.user_metadata,
        timestamp: new Date().toISOString()
      })
      
      if (user?.user_metadata?.tenant_id) {
        // User has completed onboarding, redirect to dashboard
        console.log('[Auth Callback] User has tenant_id, redirecting to dashboard')
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        // User needs to complete onboarding
        console.log('[Auth Callback] User needs onboarding, redirecting to /onboarding')
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    } catch (err: any) {
      console.error('[Auth Callback] Unexpected error:', {
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      })
      return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent('An unexpected error occurred')}`)
    }
  }

  // If no code, redirect to sign in
  console.log('[Auth Callback] No code provided, redirecting to sign-in')
  return NextResponse.redirect(`${origin}/auth/sign-in`)
}