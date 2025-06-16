import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export class BookingService {
  static async getAll(): Promise<Booking[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id (first_name, last_name, email, phone),
        services:service_id (name, duration_minutes, price),
        users:staff_id (first_name, last_name)
      `)
      .eq('tenant_id', tenantId)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id (first_name, last_name, email, phone),
        services:service_id (name, duration_minutes, price),
        users:staff_id (first_name, last_name)
      `)
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Booking | null> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id (first_name, last_name, email, phone),
        services:service_id (name, duration_minutes, price),
        users:staff_id (first_name, last_name)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  }

  static async create(booking: Omit<BookingInsert, 'tenant_id'>): Promise<Booking> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .insert({ ...booking, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: Omit<BookingUpdate, 'tenant_id'>): Promise<Booking> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  static async getUpcoming(limit: number = 10): Promise<Booking[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id (first_name, last_name, email, phone),
        services:service_id (name, duration_minutes, price),
        users:staff_id (first_name, last_name)
      `)
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getTodaysBookings(): Promise<Booking[]> {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    return this.getByDateRange(startOfDay, endOfDay)
  }
}