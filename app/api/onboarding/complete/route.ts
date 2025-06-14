import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { salonName, tier } = body as { salonName: string; tier: 'starter' | 'growth' | 'pro' }

  const supabase = createRouteHandlerClient<Database>({ cookies })

  const {
    data: { session }
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Bepaal tenant_id indien aanwezig in metadata
  // @ts-ignore
  const tenantId: string | undefined = user.user_metadata?.tenant_id

  if (tenantId) {
    // Tenant bestaat al (aangemaakt door DB-trigger).  Alleen details bijwerken.
    const { error: tUpdateErr } = await supabaseAdmin
      .from('tenants')
      .update({ name: salonName, subscription_tier: tier })
      .eq('id', tenantId)
    if (tUpdateErr) return NextResponse.json({ error: tUpdateErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  }

  // Geen tenant_id? Dan fallback op oude flow (zou normaal niet meer gebeuren).

  // Create tenant (legacy flow)
  const { data: tenant, error: tErr } = await supabaseAdmin
    .from('tenants')
    .insert({ name: salonName, email: user.email!, subscription_tier: tier })
    .select()
    .single()
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // Insert into users table
  const { error: uErr } = await supabaseAdmin
    .from('users')
    .upsert({ id: user.id, tenant_id: tenant.id, email: user.email!, role: 'admin', first_name: '', last_name: '' })
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  // Need admin endpoint to update metadata
  await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: { tenant_id: tenant.id, role: 'admin' } })

  return NextResponse.json({ ok: true })
} 