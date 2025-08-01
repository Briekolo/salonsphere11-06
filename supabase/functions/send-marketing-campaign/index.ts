import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendCampaignRequest {
  campaign_id: string
  batch_size?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { campaign_id, batch_size = 100 }: SendCampaignRequest = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Resend API key
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select(`
        *,
        email_templates (
          body_html,
          body_text,
          variables
        )
      `)
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new Error('Campaign not found')
    }

    // Check campaign status
    if (!['sending', 'scheduled'].includes(campaign.status)) {
      throw new Error(`Campaign is not ready to send. Status: ${campaign.status}`)
    }

    // Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, email, address, phone')
      .eq('id', campaign.tenant_id)
      .single()

    // Get queued emails for this campaign
    const { data: queueItems, error: queueError } = await supabase
      .from('email_queue')
      .select(`
        *,
        campaign_recipients!inner (
          id,
          client_id,
          email,
          variant,
          clients!inner (
            first_name,
            last_name,
            email,
            phone,
            total_spent
          )
        )
      `)
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(batch_size)

    if (queueError || !queueItems || queueItems.length === 0) {
      console.log('No emails to send in queue')
      return new Response(
        JSON.stringify({ success: true, message: 'No emails to send', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Processing ${queueItems.length} emails from queue`)

    // Update queue items to processing
    const queueIds = queueItems.map(item => item.id)
    await supabase
      .from('email_queue')
      .update({ status: 'processing' })
      .in('id', queueIds)

    // Prepare emails for batch sending
    const emails = queueItems.map(item => {
      const recipient = item.campaign_recipients
      const client = recipient.clients

      // Use template content or campaign content
      let htmlContent = campaign.email_templates?.body_html || campaign.content
      let textContent = campaign.email_templates?.body_text || null

      // Replace variables
      const variables = {
        client_name: `${client.first_name} ${client.last_name}`,
        first_name: client.first_name,
        last_name: client.last_name,
        salon_name: tenant?.name || '',
        salon_address: tenant?.address || '',
        salon_phone: tenant?.phone || '',
        unsubscribe_link: `${supabaseUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(client.email)}&tenant=${campaign.tenant_id}`,
        view_online_link: `${supabaseUrl}/marketing/view/${campaign_id}?recipient=${recipient.id}`
      }

      // Replace variables in content
      for (const [key, value] of Object.entries(variables)) {
        const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        htmlContent = htmlContent.replace(pattern, value)
        if (textContent) {
          textContent = textContent.replace(pattern, value)
        }
      }

      // Use variant B subject if applicable
      const subject = recipient.variant === 'b' && campaign.subject_line_b
        ? campaign.subject_line_b
        : campaign.subject_line

      // Use Resend test email if domain not verified
      const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
      const fromName = tenant?.name || 'SalonSphere'
      
      // For testing with Resend, use the account owner's email
      const isTestMode = RESEND_FROM_EMAIL === 'onboarding@resend.dev'
      const toEmail = isTestMode ? 'tobias@dessaro.be' : client.email
      
      return {
        from: `${fromName} <${RESEND_FROM_EMAIL}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Entity-Ref-ID': recipient.id,
          'List-Unsubscribe': `<${variables.unsubscribe_link}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        },
        tags: [
          { name: 'campaign_id', value: campaign_id.replace(/-/g, '_') },
          { name: 'tenant_id', value: campaign.tenant_id.replace(/-/g, '_') },
          { name: 'recipient_id', value: recipient.id.replace(/-/g, '_') },
          { name: 'original_recipient', value: client.email.replace(/@/g, '_at_').replace(/\./g, '_') }
        ]
      }
    })

    // Send emails individually instead of batch
    const sendResults = []
    
    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      
      // Add delay after first email to respect rate limit (2 requests per second = 500ms between requests)
      if (i > 0) {
        await delay(600) // Add 600ms delay to be safe
      }
      
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(email),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Resend API error for', email.to, ':', errorText)
          sendResults.push({ error: errorText })
        } else {
          const result = await response.json()
          console.log('Email sent to', email.to, ':', result)
          sendResults.push(result)
        }
      } catch (error) {
        console.error('Error sending to', email.to, ':', error)
        sendResults.push({ error: error.message })
      }
    }

    const batchResult = { data: sendResults }
    console.log('Send results:', batchResult)

    // Update queue items and recipients
    const successfulIds = []
    const failedIds = []

    // Process results
    if (batchResult.data) {
      for (let i = 0; i < queueItems.length; i++) {
        const queueItem = queueItems[i]
        const result = batchResult.data[i]

        if (result && result.id) {
          successfulIds.push(queueItem.id)

          // Update recipient with message ID
          await supabase
            .from('campaign_recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              message_id: result.id
            })
            .eq('id', queueItem.recipient_id)

          // Update queue item
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString()
            })
            .eq('id', queueItem.id)

          // Track sent metric
          await supabase
            .from('email_metrics')
            .insert({
              campaign_id: campaign_id,
              recipient_id: queueItem.recipient_id,
              event_type: 'delivered',
              event_timestamp: new Date().toISOString()
            })
        } else {
          failedIds.push(queueItem.id)

          // Update queue item as failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              attempts: queueItem.attempts + 1,
              error_message: 'Failed to send'
            })
            .eq('id', queueItem.id)
        }
      }
    }

    // Update campaign sent count
    try {
      await supabase.rpc('increment', {
        table_name: 'marketing_campaigns',
        column_name: 'total_sent',
        row_id: campaign_id,
        increment_value: successfulIds.length
      })
    } catch (error) {
      console.error('Error incrementing sent count:', error)
      // Fallback to direct update
      await supabase
        .from('marketing_campaigns')
        .update({ total_sent: campaign.total_sent + successfulIds.length })
        .eq('id', campaign_id)
    }

    // Check if there are more emails to send
    const { count: remainingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending')

    // If no more emails, mark campaign as sent
    if (remainingCount === 0) {
      await supabase
        .from('marketing_campaigns')
        .update({
          status: 'sent',
          completed_at: new Date().toISOString()
        })
        .eq('id', campaign_id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully sent ${successfulIds.length} emails`,
        sent: successfulIds.length,
        failed: failedIds.length,
        remaining: remainingCount || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending marketing campaign:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Helper function to increment a numeric column
// Note: This assumes you have an RPC function created in your database
// You can create it with:
// CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id uuid, increment_value int)
// RETURNS void AS $$
// BEGIN
//   EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
//   USING increment_value, row_id;
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;