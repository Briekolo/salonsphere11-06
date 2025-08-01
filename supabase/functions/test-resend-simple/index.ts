import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not found in environment')
    }

    console.log('Testing Resend API with key:', RESEND_API_KEY.substring(0, 10) + '...')

    // Simple test email
    const emailData = {
      from: 'onboarding@resend.dev',
      to: 'test@example.com',
      subject: 'Test Email from SalonSphere',
      html: '<h1>Test Email</h1><p>This is a test email from SalonSphere marketing system.</p>'
    }

    console.log('Sending email:', emailData)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response text:', responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { text: responseText }
    }

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        result: result,
        test_email: emailData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})