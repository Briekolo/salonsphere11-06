import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    console.log('[Onboarding/Complete] Starting request processing')
    
    let body: any
    try {
      body = await req.json()
    } catch (jsonError) {
      console.error('[Onboarding/Complete] Failed to parse JSON body:', jsonError)
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: 'Expected JSON with salonName field'
      }, { status: 400 })
    }
    
    const { salonName } = body as { salonName: string }
    
    if (!salonName) {
      console.error('[Onboarding/Complete] Missing salonName in request')
      return NextResponse.json({ 
        error: 'Missing required field',
        details: 'salonName is required'
      }, { status: 400 })
    }
    
    console.log('[Onboarding/Complete] Salon name:', salonName)

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Onboarding/Complete] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }
    
    if (!user) {
      console.error('[Onboarding/Complete] No user found in session')
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    
    console.log('[Onboarding/Complete] Authenticated user:', user.id, user.email)

    // Haal de tenant_id op uit de users-tabel i.p.v. vertrouwen op metadata
    console.log('[Onboarding/Complete] Looking up user record in database')
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userRecord, error: userErr } = await supabaseAdmin
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userErr) {
      console.error('[Onboarding/Complete] User lookup error:', userErr)
      console.error('[Onboarding/Complete] Error details:', {
        code: userErr.code,
        message: userErr.message,
        details: userErr.details,
        hint: userErr.hint
      })
      return NextResponse.json({ 
        error: 'Database error during user lookup',
        details: userErr.message,
        code: userErr.code 
      }, { status: 500 })
    }

    console.log('[Onboarding/Complete] User record found:', userRecord)
    const tenantId: string | undefined = userRecord?.tenant_id ?? undefined
    console.log('[Onboarding/Complete] Tenant ID:', tenantId || 'not found')

    if (tenantId) {
      // Controleer of de tenant_id uit de request body (indien meegekomen) overeenkomt
      // Hier updaten we alléén de tenant die gekoppeld is aan de ingelogde gebruiker
      // Tenant bestaat al (aangemaakt door DB-trigger).  Alleen details bijwerken.
      console.log('[Onboarding/Complete] Updating existing tenant:', tenantId)
      const { error: tUpdateErr } = await supabaseAdmin
        .from('tenants')
        .update({ name: salonName, subscription_tier: 'essential' })
        .eq('id', tenantId)
      
      if (tUpdateErr) {
        console.error('[Onboarding/Complete] Tenant update error:', tUpdateErr)
        console.error('[Onboarding/Complete] Error details:', {
          code: tUpdateErr.code,
          message: tUpdateErr.message,
          details: tUpdateErr.details,
          hint: tUpdateErr.hint
        })
        return NextResponse.json({ 
          error: 'Failed to update tenant',
          details: tUpdateErr.message,
          code: tUpdateErr.code 
        }, { status: 500 })
      }

      console.log('[Onboarding/Complete] Tenant updated successfully')
      return NextResponse.json({ ok: true })
    }

    // Geen tenant_id? Dan fallback op oude flow (zou normaal niet meer gebeuren).
    console.log('[Onboarding/Complete] No tenant found, creating new tenant (legacy flow)')

    // Create tenant (legacy flow)
    console.log('[Onboarding/Complete] Creating new tenant with name:', salonName, 'email:', user.email)
    
    // Default business hours: Mon-Fri 9:00-18:00, Sat 10:00-16:00, Sun closed
    const defaultBusinessHours = {
      "0": { "closed": true }, // Sunday
      "1": { "open": "09:00", "close": "18:00", "closed": false }, // Monday
      "2": { "open": "09:00", "close": "18:00", "closed": false }, // Tuesday
      "3": { "open": "09:00", "close": "18:00", "closed": false }, // Wednesday
      "4": { "open": "09:00", "close": "18:00", "closed": false }, // Thursday
      "5": { "open": "09:00", "close": "18:00", "closed": false }, // Friday
      "6": { "open": "10:00", "close": "16:00", "closed": false }  // Saturday
    }
    
    // Default notification preferences
    const defaultNotificationPreferences = {
      "email": {
        "reminders": true,
        "new_bookings": true,
        "cancellations": true,
        "daily_summary": false,
        "low_inventory": true,
        "payment_received": true
      },
      "sms": {
        "enabled": false,
        "reminders": false,
        "new_bookings": false,
        "cancellations": false
      },
      "staff": {
        "no_shows": true,
        "new_bookings": true,
        "cancellations": true,
        "schedule_changes": true
      },
      "client_reminders": {
        "send_thank_you_email": false,
        "send_confirmation_email": true,
        "appointment_reminder_hours": 24
      }
    }
    
    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .insert({ 
        name: salonName, 
        email: user.email!, 
        subscription_tier: 'essential',
        business_hours: defaultBusinessHours,
        notification_preferences: defaultNotificationPreferences
      })
      .select()
      .single()
    
    if (tErr) {
      console.error('[Onboarding/Complete] Tenant creation error:', tErr)
      console.error('[Onboarding/Complete] Error details:', {
        code: tErr.code,
        message: tErr.message,
        details: tErr.details,
        hint: tErr.hint
      })
      return NextResponse.json({ 
        error: 'Failed to create tenant',
        details: tErr.message,
        code: tErr.code 
      }, { status: 500 })
    }
    
    console.log('[Onboarding/Complete] Tenant created:', tenant.id)

    // Insert into users table
    console.log('[Onboarding/Complete] Upserting user record')
    const { error: uErr } = await supabaseAdmin
      .from('users')
      .upsert({ id: user.id, tenant_id: tenant.id, email: user.email!, role: 'admin', first_name: '', last_name: '' })
    
    if (uErr) {
      console.error('[Onboarding/Complete] User upsert error:', uErr)
      console.error('[Onboarding/Complete] Error details:', {
        code: uErr.code,
        message: uErr.message,
        details: uErr.details,
        hint: uErr.hint
      })
      return NextResponse.json({ 
        error: 'Failed to create user record',
        details: uErr.message,
        code: uErr.code 
      }, { status: 500 })
    }

    // Need admin endpoint to update metadata
    console.log('[Onboarding/Complete] Updating user metadata')
    const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { tenant_id: tenant.id, role: 'admin' }
    })
    
    if (metaErr) {
      console.error('[Onboarding/Complete] User metadata update error:', metaErr)
      console.error('[Onboarding/Complete] Error details:', {
        code: metaErr.code,
        message: metaErr.message,
        details: metaErr.details,
        hint: metaErr.hint
      })
      return NextResponse.json({ 
        error: 'Failed to update user metadata',
        details: metaErr.message,
        code: metaErr.code 
      }, { status: 500 })
    }

    console.log('[Onboarding/Complete] Onboarding completed successfully')
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('[Onboarding/Complete] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 