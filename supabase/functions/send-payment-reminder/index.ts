import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { formatBelgiumDate } from '../_shared/timezone.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentReminderRequest {
  invoiceId: string
  recipientEmail: string
  tenantName: string
  invoiceNumber: string
  totalAmount: number
  outstandingAmount: number
  dueDate: string
  daysOverdue: number
  clientName?: string
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
      tenantName,
      invoiceNumber,
      totalAmount,
      outstandingAmount,
      dueDate,
      daysOverdue,
      clientName
    }: PaymentReminderRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get email service configuration
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    // Determine reminder type based on days overdue
    const isOverdue = daysOverdue > 0
    const reminderType = isOverdue ? 'overdue' : 'reminder'
    const urgencyClass = daysOverdue > 14 ? 'urgent' : daysOverdue > 0 ? 'overdue' : 'reminder'

    // Format due date for Belgium
    const dueDateObj = new Date(dueDate)
    const dueDateFormatted = formatBelgiumDate(dueDateObj)

    // Subject line based on urgency
    let subject = ''
    if (daysOverdue > 14) {
      subject = `URGENT: Betaalherinnering factuur ${invoiceNumber} - ${tenantName}`
    } else if (daysOverdue > 0) {
      subject = `Betalingsherinnering factuur ${invoiceNumber} - ${tenantName}`
    } else {
      subject = `Vriendelijke herinnering factuur ${invoiceNumber} - ${tenantName}`
    }

    // Email styling based on urgency
    const headerColor = urgencyClass === 'urgent' ? '#dc3545' : urgencyClass === 'overdue' ? '#fd7e14' : '#02011F'
    const accentColor = urgencyClass === 'urgent' ? '#f8d7da' : urgencyClass === 'overdue' ? '#fff3cd' : '#e9ecef'

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${headerColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .payment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${headerColor}; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .outstanding { font-size: 18px; font-weight: bold; color: ${headerColor}; }
            .urgency-notice { background-color: ${accentColor}; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${headerColor}; }
            .payment-instructions { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${tenantName}</h1>
              <p>${isOverdue ? 'Betalingsherinnering' : 'Vriendelijke herinnering'}</p>
            </div>
            <div class="content">
              ${urgencyClass === 'urgent' ? '<h2 style="color: #dc3545;">URGENTE BETALINGSHERINNERING</h2>' : 
                isOverdue ? '<h2 style="color: #fd7e14;">Betalingsherinnering</h2>' : 
                '<h2>Vriendelijke herinnering</h2>'}
              
              <p>Beste ${clientName || 'klant'},</p>
              
              ${isOverdue ? 
                `<p>Ondanks onze eerdere herinneringen hebben wij nog geen betaling ontvangen voor factuur ${invoiceNumber}. Deze factuur is inmiddels ${daysOverdue} dag${daysOverdue === 1 ? '' : 'en'} over de vervaldatum.</p>` :
                `<p>Hierbij herinneren wij u vriendelijk aan de betaling van factuur ${invoiceNumber}.</p>`
              }
              
              <div class="payment-details">
                <h3>Factuurgegevens</h3>
                <div class="detail-row">
                  <span class="detail-label">Factuurnummer:</span>
                  <span class="detail-value">${invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Totaalbedrag:</span>
                  <span class="detail-value">€ ${totalAmount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Openstaand bedrag:</span>
                  <span class="detail-value outstanding">€ ${outstandingAmount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Vervaldatum:</span>
                  <span class="detail-value">${dueDateFormatted}</span>
                </div>
                ${isOverdue ? `
                <div class="detail-row">
                  <span class="detail-label">Dagen over vervaldatum:</span>
                  <span class="detail-value" style="color: ${headerColor}; font-weight: bold;">${daysOverdue} dag${daysOverdue === 1 ? '' : 'en'}</span>
                </div>
                ` : ''}
              </div>
              
              ${urgencyClass === 'urgent' ? `
              <div class="urgency-notice">
                <h4>Laatste waarschuwing</h4>
                <p>Indien wij binnen 7 dagen geen betaling ontvangen, zijn wij genoodzaakt verdere maatregelen te nemen. Dit kan leiden tot aanvullende kosten.</p>
              </div>
              ` : isOverdue ? `
              <div class="urgency-notice">
                <h4>Spoedige betaling gewenst</h4>
                <p>Wij verzoeken u vriendelijk maar dringend om het openstaande bedrag zo spoedig mogelijk te voldoen.</p>
              </div>
              ` : ''}
              
              <div class="payment-instructions">
                <h3>Betaling</h3>
                <p>U kunt het openstaande bedrag overmaken naar onze bankrekening met vermelding van het factuurnummer ${invoiceNumber}.</p>
                <p>Voor vragen over deze factuur of om een andere betalingsregeling te treffen, kunt u contact met ons opnemen.</p>
              </div>
              
              <p>Mocht u deze factuur reeds hebben betaald, dan kunt u deze herinnering als niet verzonden beschouwen.</p>
              
              <p>Met vriendelijke groet,<br>${tenantName}</p>
            </div>
            <div class="footer">
              <p>Deze e-mail is automatisch gegenereerd. Voor vragen kunt u contact met ons opnemen.</p>
              <p style="margin-top: 10px; font-style: italic;">Alle datums zijn weergegeven in Belgische tijd (Europe/Brussels)</p>
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
        subject: subject,
        html: emailHtml
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    // Log reminder sent (for tracking/audit purposes)
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'invoice',
        resource_id: invoiceId,
        action: `payment_reminder_sent_${urgencyClass}`,
        details: {
          recipient: recipientEmail,
          days_overdue: daysOverdue,
          outstanding_amount: outstandingAmount
        }
      })

    if (logError) {
      console.error('Failed to log payment reminder:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment reminder sent successfully',
        reminder_type: reminderType,
        urgency: urgencyClass
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending payment reminder:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})