import { supabase } from '@/lib/supabase';

export class EmailService {
  // Send booking confirmation
  static async sendBookingConfirmation(booking: any, tenant: any): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          bookingId: booking.id,
          recipientEmail: booking.clients?.email || booking.client?.email,
          clientName: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 
                     booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Klant',
          serviceName: booking.services?.name || booking.service?.name,
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes || booking.services?.duration_minutes || booking.service?.duration_minutes,
          staffName: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : undefined,
          tenantName: tenant.name,
          tenantAddress: tenant.address,
          tenantPhone: tenant.phone,
          notes: booking.notes
        }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      throw error;
    }
  }
}