import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createServerSupabaseClient()
  
  // Get session from Supabase - getUser is more reliable than getSession
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Check cookies
  const authCookies = cookieStore.getAll().filter(cookie => 
    cookie.name.includes('supabase') || cookie.name.includes('sb-')
  )
  
  return NextResponse.json({
    hasSession: !!session,
    hasUser: !!user,
    sessionError: error?.message || null,
    userError: userError?.message || null,
    user: user ? {
      id: user.id,
      email: user.email,
      tenantId: user.user_metadata?.tenant_id
    } : null,
    session: session ? {
      userId: session.user.id,
      expiresAt: session.expires_at,
      accessToken: session.access_token ? 'present' : 'missing'
    } : null,
    cookies: authCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })),
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}