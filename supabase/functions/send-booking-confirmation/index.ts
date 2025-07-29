import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  tenantName: string
  tenantAddress?: string
  tenantPhone?: string
  notes?: string
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
      tenantName,
      tenantAddress,
      tenantPhone,
      notes
    }: BookingConfirmationRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get email service configuration
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    // Format date and time
    const appointmentDate = new Date(scheduledAt)
    const dateFormatted = appointmentDate.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const timeFormatted = appointmentDate.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Calculate end time
    const endTime = new Date(appointmentDate.getTime() + durationMinutes * 60000)
    const endTimeFormatted = endTime.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Prepare email content
    const emailHtml = `
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
              <p>Bedankt voor uw boeking. Hierbij bevestigen wij uw afspraak bij ${tenantName}.</p>
              
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
                  <span class="detail-value">${timeFormatted} - ${endTimeFormatted}</span>
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
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${tenantName} <noreply@salonsphere.nl>`,
        to: recipientEmail,
        subject: `Afspraakbevestiging - ${serviceName} op ${dateFormatted}`,
        html: emailHtml
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    // Log email sent (optional - could be used for tracking)
    console.log(`Booking confirmation sent for booking ${bookingId} to ${recipientEmail}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Booking confirmation sent successfully' }),
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