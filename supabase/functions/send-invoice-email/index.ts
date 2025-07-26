import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  invoiceId: string
  recipientEmail: string
  pdfBase64: string
  tenantName: string
  invoiceNumber: string
  totalAmount: number
  dueDate: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      invoiceId, 
      recipientEmail, 
      pdfBase64, 
      tenantName, 
      invoiceNumber,
      totalAmount,
      dueDate 
    }: EmailRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get email service configuration (using Resend as example)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

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
            .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #02011F; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${tenantName}</h1>
            </div>
            <div class="content">
              <h2>Uw factuur is klaar</h2>
              <p>Beste klant,</p>
              <p>Hierbij ontvangt u factuur ${invoiceNumber} voor uw recente afspraak bij ${tenantName}.</p>
              
              <div class="invoice-details">
                <h3>Factuurgegevens</h3>
                <p><strong>Factuurnummer:</strong> ${invoiceNumber}</p>
                <p><strong>Totaalbedrag:</strong> € ${totalAmount.toFixed(2)}</p>
                <p><strong>Vervaldatum:</strong> ${new Date(dueDate).toLocaleDateString('nl-NL')}</p>
              </div>
              
              <p>U vindt de factuur als bijlage bij deze e-mail.</p>
              
              <p>Heeft u vragen over deze factuur? Neem dan gerust contact met ons op.</p>
              
              <p>Met vriendelijke groet,<br>${tenantName}</p>
            </div>
            <div class="footer">
              <p>Deze e-mail is automatisch gegenereerd. Antwoord niet rechtstreeks op dit bericht.</p>
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
        subject: `Factuur ${invoiceNumber} - ${tenantName}`,
        html: emailHtml,
        attachments: [
          {
            filename: `factuur-${invoiceNumber}.pdf`,
            content: pdfBase64,
          }
        ]
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    // Update invoice status to 'sent'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Failed to update invoice status:', updateError)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Invoice email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})