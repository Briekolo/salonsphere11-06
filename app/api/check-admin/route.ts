import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const { user } = session
  // @ts-ignore
  const tenantId = user?.user_metadata?.tenant_id
  
  // Check user role
  const { data: userData, error } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()
  
  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    tenant_id: tenantId,
    user_data: userData,
    error: error?.message,
    is_admin: userData?.role === 'admin'
  })
}