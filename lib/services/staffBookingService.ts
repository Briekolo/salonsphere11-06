import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export interface StaffBookingWithRelations extends Booking {
  clients?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  }
  services?: {
    name: string | null
    duration_minutes: number | null
    price: number | null
  }
  users?: {
    first_name: string | null
    last_name: string | null
  }
}

export interface StaffPermissions {
  can_view_all_appointments: boolean
  can_edit_all_appointments: boolean
  can_view_clients: boolean
  can_edit_clients: boolean
  can_view_financial: boolean
  can_manage_own_schedule: boolean
  can_add_appointment_notes: boolean
}

export class StaffBookingService {
  /**
   * Get staff user ID from current session
   */
  private static async getCurrentStaffId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return user.id
  }

  /**
   * Get staff permissions for current user
   */
  private static async getStaffPermissions(staffId: string, tenantId: string): Promise<StaffPermissions> {
    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('user_id', staffId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !data) {
      // Return default permissions if no record exists
      return {
        can_view_all_appointments: false,
        can_edit_all_appointments: false,
        can_view_clients: true,
        can_edit_clients: false,
        can_view_financial: false,
        can_manage_own_schedule: true,
        can_add_appointment_notes: true
      }
    }

    return data
  }

  /**
   * Get bookings for staff member with permission-based filtering
   */
  static async getStaffBookings(
    staffId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<StaffBookingWithRelations[]> {
    const currentStaffId = staffId || await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)

    // Build query without joins first to test basic functionality
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('tenant_id', tenantId)

    // Apply staff filtering based on permissions
    if (!permissions.can_view_all_appointments) {
      query = query.eq('staff_id', currentStaffId)
    }

    // Apply date filtering if provided
    if (startDate && endDate) {
      query = query
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
    }

    query = query.order('scheduled_at', { ascending: true })

    const { data, error } = await query

    if (error) throw error
    
    // For now, return basic booking data without joins
    // TODO: Add joins back once basic query works
    return (data || []).map(booking => ({
      ...booking,
      clients: null,
      services: null,
      users: null
    }))
  }

  /**
   * Get today's bookings for staff member
   */
  static async getTodaysBookings(staffId?: string): Promise<StaffBookingWithRelations[]> {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    return this.getStaffBookings(staffId, startOfDay, endOfDay)
  }

  /**
   * Get bookings for a specific date range
   */
  static async getBookingsByDateRange(
    startDate: string,
    endDate: string,
    staffId?: string
  ): Promise<StaffBookingWithRelations[]> {
    return this.getStaffBookings(staffId, startDate, endDate)
  }

  /**
   * Get single booking by ID (with permission check)
   */
  static async getBookingById(bookingId: string): Promise<StaffBookingWithRelations | null> {
    const currentStaffId = await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)

    // Apply staff filtering if no view all permission
    if (!permissions.can_view_all_appointments) {
      query = query.eq('staff_id', currentStaffId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      ...data,
      clients: null,
      services: null,
      users: null
    }
  }

  /**
   * Create new booking (staff can only create for themselves unless they have permission)
   */
  static async createBooking(booking: Omit<BookingInsert, 'tenant_id'>): Promise<StaffBookingWithRelations> {
    const currentStaffId = await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)

    // Check if staff can create appointments for others
    if (booking.staff_id !== currentStaffId && !permissions.can_edit_all_appointments) {
      throw new Error('You can only create appointments for yourself')
    }

    // If no staff_id provided, default to current staff
    const bookingData: BookingInsert = {
      ...booking,
      tenant_id: tenantId,
      staff_id: booking.staff_id || currentStaffId
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update existing booking (with permission checks)
   */
  static async updateBooking(
    bookingId: string,
    updates: BookingUpdate
  ): Promise<StaffBookingWithRelations> {
    const currentStaffId = await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)

    // First, get the current booking to check ownership
    const currentBooking = await this.getBookingById(bookingId)
    if (!currentBooking) {
      throw new Error('Booking not found or access denied')
    }

    // Check edit permissions
    const canEdit = 
      currentBooking.staff_id === currentStaffId || // Own booking
      permissions.can_edit_all_appointments // Has permission for all

    if (!canEdit) {
      throw new Error('You do not have permission to edit this booking')
    }

    // Prevent changing staff assignment unless user has permission
    if (updates.staff_id && updates.staff_id !== currentBooking.staff_id) {
      if (!permissions.can_edit_all_appointments) {
        throw new Error('You cannot reassign appointments to other staff members')
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete booking (with permission checks)
   */
  static async deleteBooking(bookingId: string): Promise<void> {
    const currentStaffId = await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)

    // First, get the current booking to check ownership
    const currentBooking = await this.getBookingById(bookingId)
    if (!currentBooking) {
      throw new Error('Booking not found or access denied')
    }

    // Check delete permissions
    const canDelete = 
      currentBooking.staff_id === currentStaffId || // Own booking
      permissions.can_edit_all_appointments // Has permission for all

    if (!canDelete) {
      throw new Error('You do not have permission to delete this booking')
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  /**
   * Add notes to booking (if staff has permission)
   */
  static async addNotes(
    bookingId: string,
    notes: string,
    isInternal: boolean = false
  ): Promise<StaffBookingWithRelations> {
    const currentStaffId = await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)

    if (!permissions.can_add_appointment_notes) {
      throw new Error('You do not have permission to add notes')
    }

    // Get current booking to check access
    const currentBooking = await this.getBookingById(bookingId)
    if (!currentBooking) {
      throw new Error('Booking not found or access denied')
    }

    const updateField = isInternal ? 'internal_notes' : 'notes'
    const updates = { [updateField]: notes }

    return this.updateBooking(bookingId, updates)
  }

  /**
   * Get staff availability for a specific date range
   */
  static async getStaffAvailability(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffBookingWithRelations[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services!service_id!inner (name, duration_minutes, price)
      `)
      .eq('tenant_id', tenantId)
      .eq('staff_id', staffId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Check if staff member can perform action based on permissions
   */
  static async hasPermission(
    permission: keyof StaffPermissions,
    staffId?: string
  ): Promise<boolean> {
    const currentStaffId = staffId || await this.getCurrentStaffId()
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) return false

    const permissions = await this.getStaffPermissions(currentStaffId, tenantId)
    return permissions[permission] || false
  }
}