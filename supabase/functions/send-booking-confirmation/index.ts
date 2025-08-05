import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { formatAppointmentTimeRange, logTimezoneConversion } from '../_shared/timezone.ts'
import { getEmailTemplate, renderTemplate, defaultTemplates, processConditionals } from '../_shared/emailTemplates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingConfirmationRequest {
  bookingId: string
  recipientEmail: string
  clientName: string
  serviceName: string
  scheduledAt: string
  durationMinutes: number
  staffName?: string
  tenantId: string
  tenantName: string
  tenantAddress?: string
  tenantPhone?: string
  notes?: string
  seriesId?: string
  seriesSessionNumber?: number
  totalSessions?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      bookingId,
      recipientEmail,
      clientName,
      serviceName,
      scheduledAt,
      durationMinutes,
      staffName,
      tenantId,
      tenantName,
      tenantAddress,
      tenantPhone,
      notes,
      seriesId,
      seriesSessionNumber,
      totalSessions
    }: BookingConfirmationRequest = await req.json()

    console.log('Booking confirmation request:', { bookingId, recipientEmail, clientName, tenantId })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if booking confirmation is enabled for this tenant
    const { data: settings, error: settingsError } = await supabase
      .from('email_automation_settings')
      .select('booking_confirmation_enabled')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError)
      throw new Error('Could not fetch email automation settings')
    }

    if (!settings?.booking_confirmation_enabled) {
      console.log('Booking confirmation is disabled for tenant:', tenantId)
      return new Response(
        JSON.stringify({ success: true, message: 'Booking confirmation is disabled' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get email service configuration
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    // Format date and time using Belgium timezone
    const appointmentDate = new Date(scheduledAt)
    
    // Use the shared timezone utility for Belgium
    const timeInfo = formatAppointmentTimeRange(appointmentDate, durationMinutes)
    const { timeFormatted, endTimeFormatted, dateFormatted, timezoneAbbr, timezoneNotice } = timeInfo
    
    // Log for debugging
    logTimezoneConversion(appointmentDate, 'Booking Confirmation')

    // Prepare template variables
    const templateVars = {
      salon_name: tenantName,
      salon_address: tenantAddress || '',
      salon_phone: tenantPhone || '',
      client_name: clientName,
      first_name: clientName.split(' ')[0],
      service_name: serviceName,
      appointment_date: dateFormatted,
      appointment_time: `${timeFormatted} - ${endTimeFormatted} ${timezoneAbbr}`,
      duration_minutes: durationMinutes.toString(),
      staff_name: staffName || '',
      notes: notes || '',
      series_session_number: seriesSessionNumber?.toString() || '',
      total_sessions: totalSessions?.toString() || '',
      timezone_notice: timezoneNotice
    }

    // Try to get template from database
    // Check both 'appointment_confirmation' and 'booking_confirmation' types for compatibility
    console.log('Fetching email template for tenant:', tenantId, 'type: appointment_confirmation or booking_confirmation')
    const template = await getEmailTemplate(supabase, tenantId, 'appointment_confirmation') ||
                    await getEmailTemplate(supabase, tenantId, 'booking_confirmation')
    
    let emailSubject: string
    let emailHtml: string
    
    if (template) {
      // Use database template
      const rendered = renderTemplate(template, templateVars)
      emailSubject = rendered.subject
      emailHtml = processConditionals(rendered.html, templateVars)
    } else {
      // Fallback to default template
      console.log('Using default booking confirmation template')
      emailSubject = defaultTemplates.booking_confirmation.subject
        .replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => templateVars[key] || match)
      
      // For backward compatibility with existing hard-coded template
      emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #02011F; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .appointment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #02011F; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .important-info { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${tenantName}</h1>
              <p>Afspraakbevestiging</p>
            </div>
            <div class="content">
              <h2>Uw afspraak is bevestigd!</h2>
              <p>Beste ${clientName},</p>
              ${seriesId ? `
              <p>Bedankt voor uw boeking. Hierbij bevestigen wij afspraak ${seriesSessionNumber} van ${totalSessions} uit uw behandelreeks bij ${tenantName}.</p>
              ` : `
              <p>Bedankt voor uw boeking. Hierbij bevestigen wij uw afspraak bij ${tenantName}.</p>
              `}
              
              <div class="appointment-details">
                <h3>Afspraakgegevens</h3>
                <div class="detail-row">
                  <span class="detail-label">Behandeling:</span>
                  <span class="detail-value">${serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Datum:</span>
                  <span class="detail-value">${dateFormatted}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Tijd:</span>
                  <span class="detail-value">${timeFormatted} - ${endTimeFormatted} ${timezoneAbbr}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duur:</span>
                  <span class="detail-value">${durationMinutes} minuten</span>
                </div>
                ${staffName ? `
                <div class="detail-row">
                  <span class="detail-label">Behandelaar:</span>
                  <span class="detail-value">${staffName}</span>
                </div>
                ` : ''}
                ${tenantAddress ? `
                <div class="detail-row">
                  <span class="detail-label">Locatie:</span>
                  <span class="detail-value">${tenantAddress}</span>
                </div>
                ` : ''}
                ${tenantPhone ? `
                <div class="detail-row">
                  <span class="detail-label">Telefoon:</span>
                  <span class="detail-value">${tenantPhone}</span>
                </div>
                ` : ''}
                ${seriesId ? `
                <div class="detail-row">
                  <span class="detail-label">Behandelreeks:</span>
                  <span class="detail-value">Afspraak ${seriesSessionNumber} van ${totalSessions}</span>
                </div>
                ` : ''}
              </div>
              
              ${notes ? `
              <div class="important-info">
                <h4>Aanvullende informatie:</h4>
                <p>${notes}</p>
              </div>
              ` : ''}
              
              <div class="important-info">
                <h4>Annulerings- en wijzigingsbeleid:</h4>
                <p>Afspraken kunnen tot 24 uur van tevoren kosteloos worden geannuleerd of gewijzigd. Neem hiervoor contact met ons op.</p>
              </div>
              
              <p>We kijken ernaar uit u te mogen verwelkomen!</p>
              
              <p>Met vriendelijke groet,<br>${tenantName}</p>
              
              ${tenantPhone ? `<p>Voor vragen: ${tenantPhone}</p>` : ''}
            </div>
            <div class="footer">
              <p>Deze e-mail is automatisch gegenereerd. Voor wijzigingen kunt u contact met ons opnemen.</p>
              <p style="margin-top: 10px; font-style: italic;">${timezoneNotice}</p>
            </div>
          </div>
        </body>
      </html>
    `
    }

    // Use Resend test email if domain not verified
    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    
    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${tenantName} <${RESEND_FROM_EMAIL}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Failed to send booking confirmation:', emailResult)
      
      // Log failed email
      await supabase
        .from('email_automation_logs')
        .insert({
          tenant_id: tenantId,
          email_type: 'booking_confirmation',
          recipient_email: recipientEmail,
          booking_id: bookingId,
          status: 'failed',
          error_message: emailResult.message || 'Unknown error',
          created_at: new Date().toISOString()
        })

      throw new Error(`Failed to send booking confirmation: ${emailResult.message}`)
    }

    // Log successful email
    await supabase
      .from('email_automation_logs')
      .insert({
        tenant_id: tenantId,
        email_type: 'booking_confirmation',
        recipient_email: recipientEmail,
        booking_id: bookingId,
        status: 'sent',
        resend_email_id: emailResult.id,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    console.log(`Booking confirmation sent successfully to ${recipientEmail}: ${emailResult.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Booking confirmation sent successfully',
        email_id: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending booking confirmation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})