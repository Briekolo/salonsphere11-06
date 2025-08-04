import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/googleCalendarService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

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

    // Get appointment details with client and service information
    const { data: appointment, error: appointmentError } = await supabase
      .from('bookings')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          email,
          phone
        ),
        services (
          name,
          duration
        )
      `)
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Convert appointment data to format expected by service
    const appointmentData = {
      ...appointment,
      client_name: appointment.clients ? `${appointment.clients.first_name} ${appointment.clients.last_name}` : null,
      client_email: appointment.clients?.email,
      client_phone: appointment.clients?.phone,
      service_name: appointment.services?.name,
      service_duration: appointment.services?.duration
    };

    // Create Google Calendar event
    const calendarEvent = googleCalendarService.appointmentToCalendarEvent(
      appointmentData, 
      integration.settings
    );

    let result;
    if (appointment.google_calendar_event_id) {
      // Update existing event
      result = await googleCalendarService.updateEvent(
        integration,
        appointment.google_calendar_event_id,
        calendarEvent
      );
    } else {
      // Create new event
      result = await googleCalendarService.createEvent(integration, calendarEvent);
      
      // Store the Google Calendar event ID in the appointment
      await supabase
        .from('bookings')
        .update({ 
          google_calendar_event_id: result.id,
          google_calendar_synced_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
    }

    // Update integration last sync time
    await supabase
      .from('integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id);

    return NextResponse.json({ 
      success: true,
      event: result,
      message: 'Appointment synced to Google Calendar successfully'
    });

  } catch (error) {
    console.error('Error syncing appointment to Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync appointment to Google Calendar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

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

    // Get appointment to find Google Calendar event ID
    const { data: appointment, error: appointmentError } = await supabase
      .from('bookings')
      .select('google_calendar_event_id')
      .eq('id', appointmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.google_calendar_event_id) {
      // Delete from Google Calendar
      await googleCalendarService.deleteEvent(
        integration,
        appointment.google_calendar_event_id
      );

      // Clear Google Calendar event ID from appointment
      await supabase
        .from('bookings')
        .update({ 
          google_calendar_event_id: null,
          google_calendar_synced_at: null
        })
        .eq('id', appointmentId);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appointment removed from Google Calendar successfully'
    });

  } catch (error) {
    console.error('Error removing appointment from Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to remove appointment from Google Calendar' },
      { status: 500 }
    );
  }
}