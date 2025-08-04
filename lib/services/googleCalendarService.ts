import { google } from 'googleapis';
import { supabase } from '@/lib/supabase/client';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  colorId?: string;
}

export interface GoogleCalendarIntegration {
  id: string;
  tenant_id: string;
  is_connected: boolean;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  settings: {
    calendar_id?: string;
    sync_direction: 'to_google' | 'from_google' | 'both';
    auto_accept_appointments: boolean;
    appointment_color: string;
    include_client_details: boolean;
    reminder_minutes: number[];
    sync_cancelled_appointments: boolean;
  };
}

class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
  }

  // Generate OAuth URL for connecting Google Calendar
  getAuthUrl(tenantId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: tenantId, // Pass tenant ID in state for callback
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  // Set credentials and get authenticated calendar client
  private async getCalendarClient(integration: GoogleCalendarIntegration) {
    this.oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token
    });

    // Check if token needs refresh
    if (new Date() >= new Date(integration.token_expires_at)) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Update tokens in database
        await supabase
          .from('integrations')
          .update({
            access_token: credentials.access_token,
            token_expires_at: new Date(credentials.expiry_date!).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', integration.id);

        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh Google Calendar token');
      }
    }

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Get user's calendar list
  async getCalendarList(integration: GoogleCalendarIntegration) {
    try {
      const calendar = await this.getCalendarClient(integration);
      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw new Error('Failed to fetch calendar list');
    }
  }

  // Create calendar event
  async createEvent(integration: GoogleCalendarIntegration, event: GoogleCalendarEvent) {
    try {
      const calendar = await this.getCalendarClient(integration);
      const calendarId = integration.settings.calendar_id || 'primary';

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Update calendar event
  async updateEvent(integration: GoogleCalendarIntegration, eventId: string, event: GoogleCalendarEvent) {
    try {
      const calendar = await this.getCalendarClient(integration);
      const calendarId = integration.settings.calendar_id || 'primary';

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  // Delete calendar event
  async deleteEvent(integration: GoogleCalendarIntegration, eventId: string) {
    try {
      const calendar = await this.getCalendarClient(integration);
      const calendarId = integration.settings.calendar_id || 'primary';

      await calendar.events.delete({
        calendarId,
        eventId
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  // Convert appointment to Google Calendar event
  appointmentToCalendarEvent(appointment: any, settings: GoogleCalendarIntegration['settings']): GoogleCalendarEvent {
    const startTime = new Date(`${appointment.date}T${appointment.start_time}`);
    const endTime = new Date(`${appointment.date}T${appointment.end_time}`);

    let summary = `${appointment.service_name}`;
    if (settings.include_client_details && appointment.client_name) {
      summary += ` - ${appointment.client_name}`;
    }

    let description = `Service: ${appointment.service_name}`;
    if (appointment.service_duration) {
      description += `\nDuration: ${appointment.service_duration} minutes`;
    }
    if (settings.include_client_details) {
      if (appointment.client_name) {
        description += `\nClient: ${appointment.client_name}`;
      }
      if (appointment.client_phone) {
        description += `\nPhone: ${appointment.client_phone}`;
      }
      if (appointment.client_email) {
        description += `\nEmail: ${appointment.client_email}`;
      }
    }
    if (appointment.notes) {
      description += `\nNotes: ${appointment.notes}`;
    }
    description += `\n\nCreated via SalonSphere`;

    const event: GoogleCalendarEvent = {
      summary,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Amsterdam'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Amsterdam'
      },
      colorId: settings.appointment_color,
      reminders: {
        useDefault: false,
        overrides: settings.reminder_minutes.map(minutes => ({
          method: 'popup' as const,
          minutes
        }))
      }
    };

    // Add client as attendee if email is available and client details are included
    if (settings.include_client_details && appointment.client_email) {
      event.attendees = [{
        email: appointment.client_email,
        displayName: appointment.client_name
      }];
    }

    return event;
  }

  // Test connection
  async testConnection(integration: GoogleCalendarIntegration): Promise<boolean> {
    try {
      await this.getCalendarList(integration);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();