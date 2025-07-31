import { supabase } from '@/lib/supabase';
import { AvailabilityService } from '@/lib/services/availabilityService';
import { EmailService } from '@/lib/services/emailService';

export interface CreateBookingData {
  tenantId: string;
  clientId: string;
  serviceId: string;
  staffId?: string;
  scheduledAt: string;
  durationMinutes: number;
  notes?: string;
  internalNotes?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  sendConfirmationEmail?: boolean;
}

export interface ClientData {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  marketingConsent?: boolean;
}

export class BookingService {
  // Create or find client
  static async createOrFindClient(data: ClientData) {
    // First check if client exists
    const { data: existingClient, error: findError } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', data.tenantId)
      .eq('email', data.email)
      .single();

    if (existingClient) {
      // Update client info if needed
      const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          notes: data.notes,
          marketing_consent: data.marketingConsent,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingClient.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedClient;
    }

    // Create new client
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        tenant_id: data.tenantId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        marketing_consent: data.marketingConsent
      })
      .select()
      .single();

    if (createError) throw createError;
    return newClient;
  }

  // Create booking
  static async createBooking(data: CreateBookingData) {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: data.tenantId,
        client_id: data.clientId,
        service_id: data.serviceId,
        staff_id: data.staffId || null,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        is_paid: data.isPaid || false,
        payment_method: data.paymentMethod,
        payment_confirmed_at: data.isPaid ? new Date().toISOString() : null,
        notes: data.notes,
        internal_notes: data.internalNotes
      })
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
          price,
          duration_minutes
        ),
        staff:users!staff_id (
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) throw error;

    // Send booking confirmation email if requested
    if (data.sendConfirmationEmail) {
      try {
        // Fetch tenant information for email
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', data.tenantId)
          .single();

        if (!tenantError && tenant) {
          await EmailService.sendBookingConfirmation(booking, tenant);
        }
      } catch (emailError) {
        console.error('Error sending booking confirmation email:', emailError);
        // Don't throw - booking is still created successfully
      }
    }

    // Refresh availability cache to remove booked time slot from future availability
    try {
      const bookingDate = new Date(data.scheduledAt);
      const dateStr = bookingDate.toISOString().split('T')[0];
      await AvailabilityService.refreshAvailabilityCache(
        data.tenantId,
        dateStr,
        data.serviceId,
        data.staffId
      );
    } catch (cacheError) {
      console.error('Error refreshing availability cache:', cacheError);
      // Don't throw - booking is still created successfully
    }
    
    return booking;
  }

  // Cancel booking
  static async cancelBooking(bookingId: string, reason?: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        internal_notes: reason ? `Cancelled: ${reason}` : 'Cancelled by client',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Reschedule booking
  static async rescheduleBooking(
    bookingId: string, 
    newScheduledAt: string,
    newStaffId?: string
  ) {
    const updateData: any = {
      scheduled_at: newScheduledAt,
      updated_at: new Date().toISOString()
    };

    if (newStaffId) {
      updateData.staff_id = newStaffId;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get booking by ID
  static async getBooking(bookingId: string) {
    const { data, error } = await supabase
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
          price,
          duration_minutes,
          category
        ),
        staff:users!staff_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get client bookings
  static async getClientBookings(clientId: string, isPaid?: boolean) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        services (
          name,
          price,
          duration_minutes,
          category
        ),
        staff:users!staff_id (
          first_name,
          last_name
        )
      `)
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (isPaid !== undefined) {
      query = query.eq('is_paid', isPaid);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Check if client can cancel booking (based on cancellation policy)
  static canCancelBooking(
    scheduledAt: string, 
    cancellationHours: number = 24
  ): boolean {
    const scheduled = new Date(scheduledAt);
    const now = new Date();
    const hoursUntilAppointment = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilAppointment >= cancellationHours;
  }

  // Generate calendar event (.ics file content)
  static generateCalendarEvent(booking: any, tenant: any): string {
    const startDate = new Date(booking.scheduled_at);
    const endDate = new Date(startDate.getTime() + booking.duration_minutes * 60000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace('.000', '');
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SalonSphere//Booking//EN
BEGIN:VEVENT
UID:${booking.id}@salonsphere.nl
DTSTAMP:${formatDate(new Date())}Z
DTSTART:${formatDate(startDate)}Z
DTEND:${formatDate(endDate)}Z
SUMMARY:${booking.services.name} - ${tenant.name}
DESCRIPTION:Afspraak voor ${booking.services.name}${booking.staff ? ` bij ${booking.staff.first_name} ${booking.staff.last_name}` : ''}\\n\\nLocatie: ${tenant.address || tenant.name}\\n\\nAnnuleren of wijzigen: Neem contact op met ${tenant.name}
LOCATION:${tenant.address || tenant.name}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  }
}