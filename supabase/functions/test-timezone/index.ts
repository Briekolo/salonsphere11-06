import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Test with a sample UTC time (e.g., 09:00 UTC which should be 11:00 Amsterdam in summer)
    const testDate = new Date('2025-08-06T09:00:00Z')
    
    // Test 1: Native toLocaleString with timezone
    const nativeAmsterdam = testDate.toLocaleString('nl-NL', {
      timeZone: 'Europe/Amsterdam',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    // Test 2: Manual timezone conversion
    const getAmsterdamTime = (date: Date) => {
      const utcTime = date.getTime()
      const month = date.getUTCMonth()
      const isDST = month >= 3 && month <= 9
      const offset = isDST ? 2 : 1
      return new Date(utcTime + (offset * 60 * 60 * 1000))
    }
    
    const manualAmsterdam = getAmsterdamTime(testDate)
    const manualTime = `${manualAmsterdam.getUTCHours().toString().padStart(2, '0')}:${manualAmsterdam.getUTCMinutes().toString().padStart(2, '0')}`
    
    // Test 3: Using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('nl-NL', {
      timeZone: 'Europe/Amsterdam',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const intlTime = formatter.format(testDate)
    
    // Test 4: Check Deno timezone
    const denoTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    const result = {
      testDate: testDate.toISOString(),
      testDateUTCHours: testDate.getUTCHours(),
      nativeToLocaleString: nativeAmsterdam,
      manualConversion: manualTime,
      intlDateTimeFormat: intlTime,
      denoTimezone: denoTimezone,
      denoDate: new Date().toString(),
      denoUTC: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(result, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})