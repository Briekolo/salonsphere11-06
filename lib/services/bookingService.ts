import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'
import { NotificationTriggers } from './notificationTriggers'
import { serializeError } from '@/lib/utils/error-serializer'
import { logError, debugLog } from '@/lib/utils/error-logger'

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

  static async getByDateRange(startDate: string, endDate: string, filters?: {
    searchTerm?: string
    payment?: string
    service?: string
    staff?: string
  }): Promise<Booking[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    let query = supabase
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

    // Apply filters
    if (filters) {
      // Payment filter
      if (filters.payment && filters.payment !== 'all') {
        const isPaid = filters.payment === 'paid'
        query = query.eq('is_paid', isPaid)
      }

      // Staff filter
      if (filters.staff && filters.staff !== 'all') {
        query = query.eq('staff_id', filters.staff)
      }

      // Service filter
      if (filters.service && filters.service !== 'all') {
        query = query.eq('service_id', filters.service)
      }

      // Search term (searches in client names)
      if (filters.searchTerm) {
        // For now, we'll need to filter this client-side since Supabase doesn't support
        // searching in joined tables directly
        // This is a limitation that could be improved with a custom RPC function
      }
    }

    query = query.order('scheduled_at', { ascending: true })

    const { data, error } = await query

    if (error) throw error
    
    let results = data || []

    // Client-side filtering for search term
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      results = results.filter(booking => {
        const clientName = `${booking.clients?.first_name || ''} ${booking.clients?.last_name || ''}`.toLowerCase()
        const serviceName = (booking.services?.name || '').toLowerCase()
        return clientName.includes(searchLower) || serviceName.includes(searchLower)
      })
    }

    return results
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

  static async getByClientId(clientId: string): Promise<Booking[]> {
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
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
      .order('scheduled_at', { ascending: false }) // Most recent first

    if (error) throw error
    return data || []
  }

  static async create(booking: Omit<BookingInsert, 'tenant_id'>): Promise<Booking> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('bookings')
      .insert({ ...booking, tenant_id: tenantId })
      .select(`
        *,
        clients:client_id (first_name, last_name, email, phone),
        services:service_id (name, duration_minutes, price),
        users:staff_id (first_name, last_name)
      `)
      .single()

    if (error) throw error

    // Trigger notification for new appointment
    debugLog('BookingService.create', 'About to trigger notification', {
      bookingId: data.id,
      tenantId: tenantId,
      staffId: data.staff_id
    });
    
    try {
      await NotificationTriggers.onNewAppointment(
        tenantId,
        data.staff_id,
        {
          id: data.id,
          client_name: `${data.clients?.first_name || ''} ${data.clients?.last_name || ''}`.trim(),
          service_name: data.services?.name || 'Unknown Service',
          scheduled_at: data.scheduled_at
        }
      )
    } catch (notificationError: any) {
      logError('Failed to send notification for new appointment', notificationError, {
        bookingId: data.id,
        tenantId: tenantId,
        context: 'BookingService.create'
      });
      // Don't fail the booking creation if notification fails
    }

    return data
  }

  static async update(id: string, updates: Omit<BookingUpdate, 'tenant_id'>): Promise<Booking> {
    console.log('BookingService.update called:', { id, updates })
    
    try {
      const tenantId = await getCurrentUserTenantId()
      if (!tenantId) {
        const error = new Error('No tenant found - user may not be authenticated properly')
        console.error('Tenant ID error in update:', error)
        throw error
      }

      console.log('Tenant ID:', tenantId)
      
      // Log the exact updates being sent
      console.log('Updates being sent to Supabase:', JSON.stringify(updates, null, 2))
      console.log('Update object keys:', Object.keys(updates))

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          clients:client_id (first_name, last_name, email, phone),
          services:service_id (name, duration_minutes, price),
          users:staff_id (first_name, last_name)
        `)
        .single()

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase update error - Full details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          rawError: error
        })
        
        // Create a more informative error
        const detailedError = new Error(
          `Failed to update booking: ${error.message || 'Unknown error'}`
        )
        // Attach the original error details
        Object.assign(detailedError, {
          code: error.code,
          details: error.details,
          hint: error.hint,
          originalError: error
        })
        
        throw detailedError
      }
      
      if (!data) {
        throw new Error('No data returned from update - booking may not exist or you may not have permission')
      }

      // Trigger notifications for relevant updates
      try {
        // Check if booking is being cancelled (status changed to cancelled)
        if (updates.status === 'cancelled') {
          await NotificationTriggers.onAppointmentCancelled(
            tenantId,
            data.staff_id,
            {
              id: data.id,
              client_name: `${data.clients?.first_name || ''} ${data.clients?.last_name || ''}`.trim(),
              service_name: data.services?.name || 'Unknown Service',
              scheduled_at: data.scheduled_at
            }
          )
        }
        // Check if appointment time was rescheduled
        else if (updates.scheduled_at && updates.scheduled_at !== data.scheduled_at) {
          // For rescheduling, we'll use the new appointment trigger
          await NotificationTriggers.onNewAppointment(
            tenantId,
            data.staff_id,
            {
              id: data.id,
              client_name: `${data.clients?.first_name || ''} ${data.clients?.last_name || ''}`.trim(),
              service_name: data.services?.name || 'Unknown Service',
              scheduled_at: data.scheduled_at
            }
          )
        }
      } catch (notificationError: any) {
        logError('Failed to send notification for booking update', notificationError, {
          bookingId: data.id,
          tenantId: tenantId,
          updateType: updates.status === 'cancelled' ? 'cancellation' : 'reschedule',
          context: 'BookingService.update'
        });
        // Don't fail the update if notification fails
      }
      
      return data
    } catch (error) {
      console.error('BookingService.update error caught:', error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const tenantId = await getCurrentUserTenantId()
      if (!tenantId) throw new Error('No tenant found')

      // Get booking details before deletion for notification
      const bookingToDelete = await this.getById(id)

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('BookingService.delete error:', {
        errorDetails: serializeError(error),
        bookingId: id,
        tenantId: tenantId
      })
      throw error
    }

    // Trigger notification for deleted appointment
    if (bookingToDelete) {
      try {
        await NotificationTriggers.onAppointmentCancelled(
          tenantId,
          bookingToDelete.staff_id,
          {
            id: bookingToDelete.id,
            client_name: `${bookingToDelete.clients?.first_name || ''} ${bookingToDelete.clients?.last_name || ''}`.trim(),
            service_name: bookingToDelete.services?.name || 'Unknown Service',
            scheduled_at: bookingToDelete.scheduled_at
          }
        )
      } catch (notificationError: any) {
        logError('Failed to send notification for booking deletion', notificationError, {
          bookingId: bookingToDelete.id,
          tenantId: tenantId,
          context: 'BookingService.delete'
        });
        // Don't fail the deletion if notification fails
      }
    }
    } catch (error) {
      console.error('BookingService.delete error caught:', error)
      throw error
    }
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

  static async getPaginated(options: {
    limit?: number
    cursor?: string
    direction?: 'future' | 'past'
  } = {}): Promise<{
    data: Booking[]
    hasMore: boolean
    nextCursor?: string
  }> {
    const { limit = 5, cursor, direction = 'future' } = options
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id (first_name, last_name, email, phone),
        services:service_id (name, duration_minutes, price),
        users:staff_id (first_name, last_name)
      `)
      .eq('tenant_id', tenantId)

    if (cursor) {
      if (direction === 'future') {
        query = query.gt('scheduled_at', cursor)
      } else {
        query = query.lt('scheduled_at', cursor)
      }
    } else if (direction === 'future') {
      // If no cursor and direction is future, start from now
      query = query.gte('scheduled_at', new Date().toISOString())
    }

    query = query
      .order('scheduled_at', { ascending: direction === 'future' })
      .limit(limit + 1) // Fetch one extra to check if there are more

    const { data, error } = await query

    if (error) throw error

    const bookings = data || []
    const hasMore = bookings.length > limit
    let resultData = hasMore ? bookings.slice(0, limit) : bookings
    
    // When fetching past appointments (descending order), reverse to maintain chronological order
    if (direction === 'past') {
      resultData = resultData.reverse()
    }
    
    let nextCursor: string | undefined
    if (hasMore && resultData.length > 0) {
      // For past direction, the cursor is the first item (oldest), for future it's the last (newest)
      nextCursor = direction === 'past' 
        ? bookings[limit].scheduled_at // The next item we didn't include
        : resultData[resultData.length - 1].scheduled_at
    }

    return {
      data: resultData,
      hasMore,
      nextCursor
    }
  }
}