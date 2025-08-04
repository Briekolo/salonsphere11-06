import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { salonName, tier } = body as { salonName: string; tier: 'starter' | 'growth' | 'pro' }

  const supabase = createRouteHandlerClient<Database>({ cookies })

  const {
    data: { session }
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Haal de tenant_id op uit de users-tabel i.p.v. vertrouwen op metadata
  const supabaseAdmin = getSupabaseAdmin()
  const { data: userRecord, error: userErr } = await supabaseAdmin
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (userErr) {
    console.error('onboarding/complete – user lookup failed', userErr)
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 500 })
  }

  const tenantId: string | undefined = userRecord?.tenant_id ?? undefined

  if (tenantId) {
    // Controleer of de tenant_id uit de request body (indien meegekomen) overeenkomt
    // Hier updaten we alléén de tenant die gekoppeld is aan de ingelogde gebruiker
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
  const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: { tenant_id: tenant.id, role: 'admin' }
  })
  if (metaErr) {
    console.error('onboarding/complete – updateUserById failed', metaErr)
    return NextResponse.json({ error: metaErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
} 