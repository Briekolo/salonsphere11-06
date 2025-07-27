import { supabase } from '@/lib/supabase';
import { 
  addMinutes, 
  format, 
  parse, 
  isAfter, 
  isBefore, 
  startOfDay,
  endOfDay,
  addDays,
  getDay
} from 'date-fns';
import { nl } from 'date-fns/locale';

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  staffId: string;
  staffName?: string;
}

export interface BookingHold {
  id: string;
  tenant_id: string;
  client_id?: string;
  session_id: string;
  staff_id: string;
  service_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  expires_at: string;
}

export interface StaffSchedule {
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export class AvailabilityService {
  // Get available slots for a specific date and service
  static async getAvailableSlots(
    tenantId: string,
    date: string,
    serviceId: string,
    staffId?: string
  ): Promise<TimeSlot[]> {
    try {
      // Get service details
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes, min_advance_hours, max_advance_days, buffer_time_before, buffer_time_after')
        .eq('id', serviceId)
        .eq('tenant_id', tenantId)
        .single();

      if (!service) {
        throw new Error('Service not found');
      }

      // Check if date is within booking window
      const now = new Date();
      const selectedDate = new Date(date);
      const minBookingDate = addMinutes(now, service.min_advance_hours * 60);
      const maxBookingDate = addDays(now, service.max_advance_days);

      if (isBefore(selectedDate, startOfDay(minBookingDate)) || 
          isAfter(selectedDate, endOfDay(maxBookingDate))) {
        return [];
      }

      // Get staff members who can perform this service
      let staffMembers: any[] = [];
      if (staffId) {
        // Check if specific staff can perform this service
        const { data: staffService } = await supabase
          .from('staff_services')
          .select('staff_id, custom_duration_minutes')
          .eq('staff_id', staffId)
          .eq('service_id', serviceId)
          .eq('tenant_id', tenantId)
          .eq('active', true)
          .single();

        if (staffService) {
          const { data } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .eq('id', staffId)
            .eq('tenant_id', tenantId)
            .single();
          if (data) {
            staffMembers = [{ ...data, custom_duration_minutes: staffService.custom_duration_minutes }];
          }
        }
      } else {
        // Get all staff who can perform this service
        const { data: staffServices } = await supabase
          .from('staff_services')
          .select('staff_id, custom_duration_minutes, users!staff_services_staff_id_fkey(id, first_name, last_name)')
          .eq('service_id', serviceId)
          .eq('tenant_id', tenantId)
          .eq('active', true);

        if (staffServices) {
          staffMembers = staffServices
            .filter(ss => ss.users)
            .map(ss => ({
              id: ss.users.id,
              first_name: ss.users.first_name,
              last_name: ss.users.last_name,
              custom_duration_minutes: ss.custom_duration_minutes
            }));
        }
      }

      // Get day of week for the selected date
      const dayOfWeek = getDay(selectedDate);

      // Get schedules for all staff
      const { data: schedules } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .in('staff_id', staffMembers.map(s => s.id));

      if (!schedules || schedules.length === 0) {
        return [];
      }

      // Get existing bookings for the date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('staff_id, scheduled_at, duration_minutes')
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', `${date}T00:00:00`)
        .lt('scheduled_at', `${date}T23:59:59`)
        .in('status', ['scheduled', 'confirmed'])
        .in('staff_id', staffMembers.map(s => s.id));

      // Get active holds
      const { data: activeHolds } = await supabase
        .from('booking_holds')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('slot_date', date)
        .gt('expires_at', new Date().toISOString())
        .in('staff_id', staffMembers.map(s => s.id));

      // Generate time slots for each staff member
      const allSlots: TimeSlot[] = [];
      const slotDuration = 30; // 30-minute slots

      for (const staff of staffMembers) {
        const schedule = schedules.find(s => s.staff_id === staff.id);
        if (!schedule) continue;

        const startTime = parse(schedule.start_time, 'HH:mm:ss', new Date());
        const endTime = parse(schedule.end_time, 'HH:mm:ss', new Date());
        let currentTime = startTime;

        // Use custom duration if available for this staff member, otherwise use service default
        const effectiveDuration = staff.custom_duration_minutes || service.duration_minutes;

        while (isBefore(addMinutes(currentTime, effectiveDuration), endTime)) {
          const slotTime = format(currentTime, 'HH:mm');
          const slotEndTime = addMinutes(currentTime, effectiveDuration + service.buffer_time_after);

          // Check if slot is available
          let isAvailable = true;

          // Check against existing bookings
          const hasConflict = existingBookings?.some(booking => {
            if (booking.staff_id !== staff.id) return false;
            const bookingTime = new Date(booking.scheduled_at);
            const bookingEndTime = addMinutes(bookingTime, booking.duration_minutes);
            const slotDateTime = parse(`${date} ${slotTime}`, 'yyyy-MM-dd HH:mm', new Date());
            const slotEndDateTime = addMinutes(slotDateTime, effectiveDuration);
            
            return (
              (isAfter(slotDateTime, bookingTime) && isBefore(slotDateTime, bookingEndTime)) ||
              (isAfter(slotEndDateTime, bookingTime) && isBefore(slotEndDateTime, bookingEndTime)) ||
              (isBefore(slotDateTime, bookingTime) && isAfter(slotEndDateTime, bookingEndTime))
            );
          });

          // Check against active holds
          const hasHold = activeHolds?.some(hold => 
            hold.staff_id === staff.id && 
            hold.slot_time === slotTime + ':00'
          );

          // Check if slot is in the past for today
          if (date === format(now, 'yyyy-MM-dd')) {
            const slotDateTime = parse(`${date} ${slotTime}`, 'yyyy-MM-dd HH:mm', new Date());
            if (isBefore(slotDateTime, now)) {
              isAvailable = false;
            }
          }

          if (hasConflict || hasHold) {
            isAvailable = false;
          }

          allSlots.push({
            date,
            time: slotTime,
            available: isAvailable,
            staffId: staff.id,
            staffName: `${staff.first_name} ${staff.last_name || ''}`.trim()
          });

          currentTime = addMinutes(currentTime, slotDuration);
        }
      }

      return allSlots.sort((a, b) => a.time.localeCompare(b.time));
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  // Hold a time slot temporarily
  static async holdSlot(
    tenantId: string,
    sessionId: string,
    staffId: string,
    serviceId: string,
    date: string,
    time: string,
    durationMinutes: number,
    clientId?: string
  ): Promise<BookingHold> {
    try {
      // Clean up any existing holds for this session
      await supabase
        .from('booking_holds')
        .delete()
        .eq('session_id', sessionId);

      // Create new hold
      const expiresAt = addMinutes(new Date(), 5); // 5 minute hold

      const { data, error } = await supabase
        .from('booking_holds')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          session_id: sessionId,
          staff_id: staffId,
          service_id: serviceId,
          slot_date: date,
          slot_time: time + ':00',
          duration_minutes: durationMinutes,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error holding slot:', error);
      throw error;
    }
  }

  // Release a held slot
  static async releaseSlot(holdId: string): Promise<void> {
    try {
      await supabase
        .from('booking_holds')
        .delete()
        .eq('id', holdId);
    } catch (error) {
      console.error('Error releasing slot:', error);
      throw error;
    }
  }

  // Convert hold to confirmed booking
  static async confirmBooking(
    holdId: string,
    clientData: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      notes?: string;
    }
  ): Promise<string> {
    try {
      // Get hold details
      const { data: hold, error: holdError } = await supabase
        .from('booking_holds')
        .select('*')
        .eq('id', holdId)
        .single();

      if (holdError || !hold) {
        throw new Error('Hold not found or expired');
      }

      // Check if hold is still valid
      if (new Date(hold.expires_at) < new Date()) {
        throw new Error('Hold has expired');
      }

      // Create or update client
      let clientId = hold.client_id;
      if (!clientId) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('tenant_id', hold.tenant_id)
          .eq('email', clientData.email)
          .single();

        if (existingClient) {
          clientId = existingClient.id;
          // Update client info
          await supabase
            .from('clients')
            .update({
              first_name: clientData.first_name,
              last_name: clientData.last_name,
              phone: clientData.phone
            })
            .eq('id', clientId);
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              tenant_id: hold.tenant_id,
              first_name: clientData.first_name,
              last_name: clientData.last_name,
              email: clientData.email,
              phone: clientData.phone
            })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Create booking
      const scheduledAt = new Date(`${hold.slot_date}T${hold.slot_time}`);
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          tenant_id: hold.tenant_id,
          client_id: clientId,
          service_id: hold.service_id,
          staff_id: hold.staff_id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: hold.duration_minutes,
          status: 'confirmed',
          notes: clientData.notes
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Delete the hold
      await this.releaseSlot(holdId);

      return booking.id;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  // Clean up expired holds (to be called periodically)
  static async cleanupExpiredHolds(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_holds');
    } catch (error) {
      console.error('Error cleaning up expired holds:', error);
    }
  }

  // Get staff availability for a date range
  static async getStaffAvailability(
    tenantId: string,
    startDate: string,
    endDate: string,
    staffId?: string
  ): Promise<Record<string, boolean>> {
    try {
      // Get all dates in range
      const dates: Record<string, boolean> = {};
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeek = getDay(currentDate);

        // Check if any staff works on this day
        const query = supabase
          .from('staff_schedules')
          .select('staff_id')
          .eq('tenant_id', tenantId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_active', true);

        if (staffId) {
          query.eq('staff_id', staffId);
        }

        const { data: schedules } = await query;
        dates[dateStr] = (schedules && schedules.length > 0);

        currentDate = addDays(currentDate, 1);
      }

      return dates;
    } catch (error) {
      console.error('Error fetching staff availability:', error);
      throw error;
    }
  }
}