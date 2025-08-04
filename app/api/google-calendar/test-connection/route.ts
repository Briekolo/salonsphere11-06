import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendarService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    // Test connection
    const isConnected = await googleCalendarService.testConnection(integration);
    
    if (isConnected) {
      // Update last sync time
      await supabase
        .from('integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);
    }

    return NextResponse.json({ 
      connected: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    console.error('Error testing Google Calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}