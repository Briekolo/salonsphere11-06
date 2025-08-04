import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendarService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      );
    }

    // Get Google Calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('integration_type', 'google_calendar')
      .single();

    if (integrationError || !integration || !integration.is_connected) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    // Get calendar list from Google
    const calendars = await googleCalendarService.getCalendarList(integration);
    
    return NextResponse.json({ calendars });
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar list' },
      { status: 500 }
    );
  }
}