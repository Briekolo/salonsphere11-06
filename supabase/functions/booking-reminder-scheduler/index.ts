import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting booking reminder scheduler...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate the time window for reminders (24 hours from now, with a 15-minute buffer)
    const now = new Date()
    const reminderTimeStart = new Date(now.getTime() + (24 * 60 * 60 * 1000) - (15 * 60 * 1000)) // 23h 45m from now
    const reminderTimeEnd = new Date(now.getTime() + (24 * 60 * 60 * 1000) + (15 * 60 * 1000)) // 24h 15m from now

    console.log('Checking for bookings between:', {
      start: reminderTimeStart.toISOString(),
      end: reminderTimeEnd.toISOString()
    })

    // Get all bookings scheduled within the reminder window
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id(id, email, first_name, last_name, phone),
        services:service_id(id, name, duration_minutes),
        staff:staff_id(id, first_name, last_name),
        tenant:tenant_id(id, name, address, phone)
      `)
      .gte('scheduled_at', reminderTimeStart.toISOString())
      .lte('scheduled_at', reminderTimeEnd.toISOString())
      .in('status', ['scheduled', 'confirmed'])

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw new Error('Failed to fetch bookings')
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found in the reminder window')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No bookings require reminders',
          checked_at: now.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Found ${bookings.length} bookings in reminder window`)

    // Check which bookings have already had reminders sent
    const bookingIds = bookings.map(b => b.id)
    const { data: sentReminders, error: sentRemindersError } = await supabase
      .from('email_automation_logs')
      .select('booking_id')
      .in('booking_id', bookingIds)
      .eq('email_type', 'booking_reminder')
      .eq('status', 'sent')

    if (sentRemindersError) {
      console.error('Error checking sent reminders:', sentRemindersError)
      throw new Error('Failed to check sent reminders')
    }

    const sentBookingIds = new Set(sentReminders?.map(r => r.booking_id) || [])
    const bookingsToRemind = bookings.filter(b => !sentBookingIds.has(b.id))

    console.log(`${bookingsToRemind.length} bookings need reminders`)

    // Send reminders for each booking
    const results = []
    for (const booking of bookingsToRemind) {
      try {
        // Check if the tenant has reminders enabled
        const { data: settings, error: settingsError } = await supabase
          .from('email_automation_settings')
          .select('booking_reminder_enabled')
          .eq('tenant_id', booking.tenant_id)
          .single()

        if (settingsError || !settings?.booking_reminder_enabled) {
          console.log(`Reminders disabled for tenant ${booking.tenant_id}`)
          results.push({
            booking_id: booking.id,
            status: 'skipped',
            reason: 'reminders_disabled'
          })
          continue
        }

        // Prepare the reminder data
        const reminderData = {
          bookingId: booking.id,
          recipientEmail: booking.clients?.email,
          clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : '',
          serviceName: booking.services?.name || '',
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes || booking.services?.duration_minutes || 60,
          staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : undefined,
          tenantId: booking.tenant_id,
          tenantName: booking.tenant?.name || '',
          tenantAddress: booking.tenant?.address,
          tenantPhone: booking.tenant?.phone,
          notes: booking.notes
        }

        // Invoke the send-booking-reminder function
        const { data: reminderResult, error: reminderError } = await supabase.functions.invoke(
          'send-booking-reminder',
          { body: reminderData }
        )

        if (reminderError) {
          console.error(`Failed to send reminder for booking ${booking.id}:`, reminderError)
          results.push({
            booking_id: booking.id,
            status: 'failed',
            error: reminderError.message
          })
        } else {
          console.log(`Reminder sent successfully for booking ${booking.id}`)
          results.push({
            booking_id: booking.id,
            status: 'sent',
            email_id: reminderResult?.email_id
          })
        }

      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error)
        results.push({
          booking_id: booking.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    // Log the scheduler run
    await supabase
      .from('email_automation_logs')
      .insert({
        tenant_id: null, // System-level log
        email_type: 'scheduler_run',
        status: 'completed',
        metadata: {
          bookings_checked: bookings.length,
          reminders_sent: results.filter(r => r.status === 'sent').length,
          reminders_failed: results.filter(r => r.status === 'failed').length,
          reminders_skipped: results.filter(r => r.status === 'skipped').length,
          time_window: {
            start: reminderTimeStart.toISOString(),
            end: reminderTimeEnd.toISOString()
          },
          results
        },
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Booking reminder scheduler completed',
        summary: {
          bookings_checked: bookings.length,
          reminders_sent: results.filter(r => r.status === 'sent').length,
          reminders_failed: results.filter(r => r.status === 'failed').length,
          reminders_skipped: results.filter(r => r.status === 'skipped').length
        },
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Scheduler error:', error)
    
    // Log the error
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    await supabase
      .from('email_automation_logs')
      .insert({
        tenant_id: null,
        email_type: 'scheduler_run',
        status: 'failed',
        error_message: error.message,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})