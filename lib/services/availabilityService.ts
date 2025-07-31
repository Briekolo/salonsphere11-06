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
  id?: string;
  tenant_id?: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
        .in('staff_id', staffMembers.map(s => s.id));

      console.log('Existing bookings for', date, ':', existingBookings);

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
            
            // Check for any overlap between booking and proposed slot
            const hasOverlap = (
              // Slot starts during existing booking
              (slotDateTime >= bookingTime && slotDateTime < bookingEndTime) ||
              // Slot ends during existing booking  
              (slotEndDateTime > bookingTime && slotEndDateTime <= bookingEndTime) ||
              // Slot completely encompasses existing booking
              (slotDateTime <= bookingTime && slotEndDateTime >= bookingEndTime) ||
              // Existing booking completely encompasses slot
              (bookingTime <= slotDateTime && bookingEndTime >= slotEndDateTime)
            );
            
            if (hasOverlap) {
              console.log(`Conflict detected for ${staff.first_name} at ${slotTime}:`, {
                slotStart: slotDateTime,
                slotEnd: slotEndDateTime,
                bookingStart: bookingTime,
                bookingEnd: bookingEndTime
              });
            }
            
            return hasOverlap;
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
          notes: clientData.notes,
          is_paid: false
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

  // Refresh availability cache after booking changes
  static async refreshAvailabilityCache(
    tenantId: string,
    date: string,
    serviceId: string,
    staffId?: string
  ): Promise<void> {
    try {
      // This function can be used to trigger re-fetching of availability
      // For now, we rely on the existing booking conflict detection
      // In the future, this could invalidate cached results
      console.log('Refreshing availability cache for:', { tenantId, date, serviceId, staffId });
    } catch (error) {
      console.error('Error refreshing availability cache:', error);
    }
  }

  // ===========================================
  // STAFF SCHEDULE MANAGEMENT METHODS
  // ===========================================

  /**
   * Get staff schedule from staff_schedules table
   */
  static async getStaffSchedule(staffId: string, tenantId: string): Promise<StaffSchedule[]> {
    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*')
      .eq('staff_id', staffId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching staff schedule:', error);
      throw new Error('Fout bij ophalen van werkschema');
    }

    return data || [];
  }

  /**
   * Get legacy working hours from users table
   */
  static async getLegacyWorkingHours(staffId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('working_hours')
      .eq('id', staffId)
      .single();

    if (error) {
      console.error('Error fetching legacy working hours:', error);
      return null;
    }

    return data?.working_hours || null;
  }

  /**
   * Convert StaffSchedule array to WeekSchedule format for easier UI handling
   */
  static convertToWeekSchedule(schedules: StaffSchedule[]): any {
    const weekSchedule = {
      monday: { enabled: false, start: '09:00', end: '17:00' },
      tuesday: { enabled: false, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '09:00', end: '17:00' },
      thursday: { enabled: false, start: '09:00', end: '17:00' },
      friday: { enabled: false, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    };

    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    schedules.forEach(schedule => {
      const dayName = dayMap[schedule.day_of_week] as keyof typeof weekSchedule;
      if (dayName) {
        weekSchedule[dayName] = {
          enabled: schedule.is_active,
          start: this.formatTime(schedule.start_time),
          end: this.formatTime(schedule.end_time)
        };
      }
    });

    return weekSchedule;
  }

  /**
   * Update staff schedule in staff_schedules table
   */
  static async updateStaffSchedule(
    staffId: string, 
    tenantId: string, 
    weekSchedule: any
  ): Promise<void> {
    try {
      // Delete all existing schedules for this staff member
      await supabase
        .from('staff_schedules')
        .delete()
        .eq('staff_id', staffId)
        .eq('tenant_id', tenantId);

      // Prepare new schedule data
      const scheduleInserts: any[] = [];
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      Object.entries(weekSchedule).forEach(([dayName, daySchedule]: [string, any]) => {
        const dayOfWeek = dayMap.indexOf(dayName);
        if (dayOfWeek !== -1 && daySchedule.enabled) {
          if (!this.isValidTimeRange(daySchedule.start, daySchedule.end)) {
            throw new Error(`Ongeldige tijden voor ${dayName}: eindtijd moet na starttijd zijn`);
          }

          scheduleInserts.push({
            tenant_id: tenantId,
            staff_id: staffId,
            day_of_week: dayOfWeek,
            start_time: this.parseTime(daySchedule.start),
            end_time: this.parseTime(daySchedule.end),
            is_active: true
          });
        }
      });

      // Insert new schedules
      if (scheduleInserts.length > 0) {
        const { error } = await supabase
          .from('staff_schedules')
          .insert(scheduleInserts);

        if (error) {
          throw error;
        }
      }

    } catch (error) {
      console.error('Error updating staff schedule:', error);
      throw new Error('Fout bij bijwerken van werkschema');
    }
  }

  /**
   * Get schedule exceptions for a staff member
   */
  static async getScheduleExceptions(
    staffId: string, 
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    let query = supabase
      .from('schedule_exceptions')
      .select('*')
      .eq('staff_id', staffId)
      .eq('tenant_id', tenantId)
      .order('date');

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schedule exceptions:', error);
      throw new Error('Fout bij ophalen van uitzonderingen');
    }

    return data || [];
  }

  /**
   * Create a schedule exception
   */
  static async createScheduleException(exception: any): Promise<any> {
    // Validate time range if it's a working day exception
    if (exception.is_available && exception.start_time && exception.end_time) {
      if (!this.isValidTimeRange(this.formatTime(exception.start_time), this.formatTime(exception.end_time))) {
        throw new Error('Eindtijd moet na starttijd zijn');
      }
    }

    const { data, error } = await supabase
      .from('schedule_exceptions')
      .insert([exception])
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule exception:', error);
      throw new Error('Fout bij aanmaken van uitzondering');
    }

    return data;
  }

  /**
   * Update a schedule exception
   */
  static async updateScheduleException(id: string, updates: any): Promise<any> {
    // Validate time range if updating times
    if (updates.start_time && updates.end_time) {
      if (!this.isValidTimeRange(this.formatTime(updates.start_time), this.formatTime(updates.end_time))) {
        throw new Error('Eindtijd moet na starttijd zijn');
      }
    }

    const { data, error } = await supabase
      .from('schedule_exceptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule exception:', error);
      throw new Error('Fout bij bijwerken van uitzondering');
    }

    return data;
  }

  /**
   * Delete a schedule exception
   */
  static async deleteScheduleException(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_exceptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting schedule exception:', error);
      throw new Error('Fout bij verwijderen van uitzondering');
    }
  }

  // ===========================================
  // UTILITY METHODS FOR STAFF SCHEDULES
  // ===========================================

  static formatTime(time: string): string {
    // Convert HH:mm:ss to HH:mm
    return time.substring(0, 5);
  }

  static parseTime(time: string): string {
    // Ensure HH:mm:ss format from HH:mm
    return time.includes(':') && time.length === 5 ? `${time}:00` : time;
  }

  static isValidTimeRange(start: string, end: string): boolean {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    return endMinutes > startMinutes;
  }

  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}