import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  clientId: string
  recipientEmail: string
  clientName: string
  tenantId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      clientId,
      recipientEmail,
      clientName,
      tenantId
    }: WelcomeEmailRequest = await req.json()

    console.log('Welcome email request:', { clientId, recipientEmail, clientName, tenantId })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if welcome email is enabled for this tenant
    const { data: settings, error: settingsError } = await supabase
      .from('email_automation_settings')
      .select('welcome_email_enabled')
      .eq('tenant_id', tenantId)
      .single()

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError)
      throw new Error('Could not fetch email automation settings')
    }

    if (!settings?.welcome_email_enabled) {
      console.log('Welcome email is disabled for tenant:', tenantId)
      return new Response(
        JSON.stringify({ success: true, message: 'Welcome email is disabled' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, email, address, phone')
      .eq('id', tenantId)
      .single()
      
    if (tenantError) {
      console.error('Error fetching tenant:', tenantError)
      throw new Error('Could not fetch tenant information')
    }

    // Get email service configuration
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    const tenantName = tenant?.name || 'SalonSphere'
    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'

    // Prepare welcome email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #02011F; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .welcome-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #02011F; }
            .benefits { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .benefit-item { display: flex; align-items: center; margin: 10px 0; }
            .benefit-icon { width: 20px; height: 20px; background-color: #02011F; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .cta-button { background-color: #02011F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 Welkom bij ${tenantName}!</h1>
              <p>We zijn blij dat u voor ons hebt gekozen</p>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2>Beste ${clientName},</h2>
                <p>Hartelijk welkom bij ${tenantName}! We zijn verheugd dat u deel uitmaakt van onze salon familie.</p>
                <p>Als nieuwe klant willen we ervoor zorgen dat u de beste ervaring krijgt bij elke behandeling.</p>
              </div>
              
              <div class="benefits">
                <h3>Wat u kunt verwachten:</h3>
                <div class="benefit-item">
                  <div class="benefit-icon">✓</div>
                  <span>Professionele behandelingen door ervaren specialisten</span>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">✓</div>
                  <span>Automatische bevestiging van uw afspraken</span>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">✓</div>
                  <span>Handige herinneringen 24 uur voor uw afspraak</span>
                </div>
                <div class="benefit-item">
                  <div class="benefit-icon">✓</div>
                  <span>Persoonlijke service afgestemd op uw wensen</span>
                </div>
              </div>

              <div style="text-align: center;">
                <p>Heeft u vragen of speciale wensen? We staan altijd voor u klaar!</p>
                ${tenant?.phone ? `<p><strong>Telefoon:</strong> ${tenant.phone}</p>` : ''}
                ${tenant?.address ? `<p><strong>Adres:</strong> ${tenant.address}</p>` : ''}
              </div>
              
              <p>Nogmaals welkom en we kijken ernaar uit u binnenkort te ontmoeten!</p>
              
              <p>Met vriendelijke groet,<br>Het team van ${tenantName}</p>
            </div>
            <div class="footer">
              <p>Deze e-mail is automatisch verzonden omdat u een nieuwe klant bent bij ${tenantName}.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send welcome email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${tenantName} <${RESEND_FROM_EMAIL}>`,
        to: recipientEmail,
        subject: `🌟 Welkom bij ${tenantName}!`,
        html: emailHtml
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Failed to send welcome email:', emailResult)
      
      // Log failed email
      await supabase
        .from('email_automation_logs')
        .insert({
          tenant_id: tenantId,
          email_type: 'welcome',
          recipient_email: recipientEmail,
          client_id: clientId,
          status: 'failed',
          error_message: emailResult.message || 'Unknown error',
          created_at: new Date().toISOString()
        })

      throw new Error(`Failed to send welcome email: ${emailResult.message}`)
    }

    // Log successful email
    await supabase
      .from('email_automation_logs')
      .insert({
        tenant_id: tenantId,
        email_type: 'welcome',
        recipient_email: recipientEmail,
        client_id: clientId,
        status: 'sent',
        resend_email_id: emailResult.id,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    console.log(`Welcome email sent successfully to ${recipientEmail}: ${emailResult.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        email_id: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})