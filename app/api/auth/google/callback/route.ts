import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendarService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // tenant_id
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/admin/integrations?error=missing_code_or_state', request.url)
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.redirect(
        new URL('/admin/integrations?error=unauthorized', request.url)
      );
    }

    // Verify tenant_id matches current user
    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId || tenantId !== state) {
      return NextResponse.redirect(
        new URL('/admin/integrations?error=invalid_tenant', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/admin/integrations?error=missing_tokens', request.url)
      );
    }

    // Store integration in database
    const integrationData = {
      tenant_id: tenantId,
      integration_type: 'google_calendar',
      name: 'Google Calendar',
      is_connected: true,
      connected_at: new Date().toISOString(),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(tokens.expiry_date!).toISOString(),
      settings: {
        sync_direction: 'both',
        auto_accept_appointments: true,
        appointment_color: '#4285f4',
        include_client_details: true,
        reminder_minutes: [15, 60],
        sync_cancelled_appointments: false
      }
    };

    const { error: dbError } = await supabase
      .from('integrations')
      .upsert(integrationData, { 
        onConflict: 'tenant_id,integration_type',
        ignoreDuplicates: false 
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(
        new URL('/admin/integrations?error=database_error', request.url)
      );
    }

    // Success - redirect to integrations page
    return NextResponse.redirect(
      new URL('/admin/integrations?success=google_calendar_connected', request.url)
    );

  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/admin/integrations?error=oauth_error', request.url)
    );
  }
}