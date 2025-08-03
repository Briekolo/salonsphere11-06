import { supabase } from '@/lib/supabase';

export class EmailService {
  // Send booking confirmation
  static async sendBookingConfirmation(booking: any, tenant: any, providedSeriesInfo?: any): Promise<void> {
    try {
      // Use provided series information or try to fetch it if this is a series booking
      let seriesInfo = providedSeriesInfo || {};
      
      // Only fetch series data if not provided and booking is part of a series
      if (!providedSeriesInfo && booking.series_id) {
        try {
          const { data: seriesData, error: seriesError } = await supabase
            .from('treatment_series')
            .select('total_sessions')
            .eq('id', booking.series_id)
            .single();

          if (!seriesError && seriesData) {
            seriesInfo = {
              seriesId: booking.series_id,
              seriesSessionNumber: booking.series_session_number,
              totalSessions: seriesData.total_sessions
            };
          } else {
            console.warn('Could not fetch series data for booking confirmation, proceeding without series context:', seriesError);
          }
        } catch (error) {
          console.warn('Error fetching series data for booking confirmation, proceeding without series context:', error);
        }
      }

      const { data, error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          bookingId: booking.id,
          recipientEmail: booking.clients?.email || booking.client?.email,
          clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 
                     booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Klant',
          serviceName: booking.services?.name || booking.service?.name,
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes || booking.services?.duration_minutes || booking.service?.duration_minutes,
          staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 
                    booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : undefined,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantAddress: tenant.address,
          tenantPhone: tenant.phone,
          notes: booking.notes,
          ...seriesInfo
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      throw error;
    }
  }

  // Send welcome email to new customer
  static async sendWelcomeEmail(client: any, tenantId: string): Promise<void> {
    try {
      const clientName = `${client.first_name} ${client.last_name}`.trim()
      
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          clientId: client.id,
          recipientEmail: client.email,
          clientName: clientName,
          tenantId: tenantId
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Send booking reminder
  static async sendBookingReminder(booking: any, tenant: any): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-booking-reminder', {
        body: {
          bookingId: booking.id,
          recipientEmail: booking.clients?.email || booking.client?.email,
          clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 
                     booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Klant',
          serviceName: booking.services?.name || booking.service?.name,
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes || booking.services?.duration_minutes || booking.service?.duration_minutes,
          staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : undefined,
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantAddress: tenant.address,
          tenantPhone: tenant.phone,
          notes: booking.notes
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending booking reminder:', error);
      throw error;
    }
  }

  // Check if email automation is enabled for tenant
  static async checkEmailAutomationEnabled(tenantId: string, emailType: 'welcome' | 'booking_confirmation' | 'booking_reminder'): Promise<boolean> {
    try {
      // Map email types to correct database column names
      const columnMap = {
        'welcome': 'welcome_email_enabled',
        'booking_confirmation': 'booking_confirmation_enabled',
        'booking_reminder': 'booking_reminder_enabled'
      };
      
      const columnName = columnMap[emailType];
      
      const { data, error } = await supabase
        .from('email_automation_settings')
        .select(columnName)
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        console.error('Error checking email automation settings:', error)
        return false
      }

      return data?.[columnName] === true
    } catch (error) {
      console.error('Error checking email automation enabled:', error);
      return false
    }
  }

  // Get email automation settings for tenant
  static async getEmailAutomationSettings(tenantId: string) {
    try {
      const { data, error } = await supabase
        .from('email_automation_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting email automation settings:', error);
      throw error
    }
  }
}