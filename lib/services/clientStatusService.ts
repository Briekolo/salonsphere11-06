import { supabase, getCurrentUserTenantId } from '@/lib/supabase'

export type ClientStatus = 'active' | 'inactive' | 'new' | 'vip'

export interface ActivityMetrics {
  recentBookingsCount: number
  totalBookingsCount: number
  daysSinceLastBooking: number | null
  totalSpent: number
  daysSinceCreated: number
}

const VIP_SPENDING_THRESHOLD = 1000 // €1000 - can be made configurable later

export class ClientStatusService {
  /**
   * Calculate client status based on booking activity and other factors
   * Logic matches the active client calculation in ClientsStats component
   */
  static async calculateClientStatus(clientId: string): Promise<ClientStatus> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    // Get client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single()

    if (clientError || !client) throw clientError || new Error('Client not found')

    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

    // Check for recent bookings (active status)
    // Using the same logic as ClientsStats for consistency
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, scheduled_at')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', ninetyDaysAgo.toISOString())
      .order('scheduled_at', { ascending: false })

    if (bookingsError) throw bookingsError

    // If has recent bookings, check if VIP or active
    if (recentBookings && recentBookings.length > 0) {
      // Check VIP status based on spending or manual assignment
      if ((client.total_spent && client.total_spent >= VIP_SPENDING_THRESHOLD)) {
        return 'vip'
      }
      return 'active'
    }

    // Check if new client (created within last 30 days, no completed bookings yet)
    if (client.created_at && new Date(client.created_at) > thirtyDaysAgo) {
      return 'new'
    }

    // Default to inactive if no recent activity
    return 'inactive'
  }

  /**
   * Get detailed activity metrics for a client
   */
  static async getClientActivityMetrics(clientId: string): Promise<ActivityMetrics> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    // Get client data for created date and total spent
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('created_at, total_spent')
      .eq('id', clientId)
      .eq('tenant_id', tenantId)
      .single()

    if (clientError) throw clientError

    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))

    // Get all bookings for metrics
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('scheduled_at')
      .eq('client_id', clientId)
      .eq('tenant_id', tenantId)
      .order('scheduled_at', { ascending: false })

    if (allBookingsError) throw allBookingsError

    // Get recent bookings count
    const recentBookings = allBookings?.filter(
      booking => new Date(booking.scheduled_at) >= ninetyDaysAgo
    ) || []

    // Calculate days since last booking
    let daysSinceLastBooking: number | null = null
    if (allBookings && allBookings.length > 0) {
      const lastBookingDate = new Date(allBookings[0].scheduled_at)
      daysSinceLastBooking = Math.floor((now.getTime() - lastBookingDate.getTime()) / (24 * 60 * 60 * 1000))
    }

    // Calculate days since created
    const createdDate = client.created_at ? new Date(client.created_at) : now
    const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000))

    return {
      recentBookingsCount: recentBookings.length,
      totalBookingsCount: allBookings?.length || 0,
      daysSinceLastBooking,
      totalSpent: client.total_spent || 0,
      daysSinceCreated
    }
  }

  /**
   * Calculate status for multiple clients efficiently
   */
  static async calculateBulkClientStatus(clientIds: string[]): Promise<Record<string, ClientStatus>> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const results: Record<string, ClientStatus> = {}
    
    // Get all clients data
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, created_at, total_spent')
      .eq('tenant_id', tenantId)
      .in('id', clientIds)

    if (clientsError) throw clientsError

    // Get all bookings for these clients
    const ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000))
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))

    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('tenant_id', tenantId)
      .in('client_id', clientIds)
      .gte('scheduled_at', ninetyDaysAgo.toISOString())

    if (bookingsError) throw bookingsError

    // Create a set of client IDs with recent bookings
    const activeClientIds = new Set(recentBookings?.map(b => b.client_id) || [])

    // Calculate status for each client
    clients?.forEach(client => {
      const hasRecentBookings = activeClientIds.has(client.id)
      
      if (hasRecentBookings) {
        // Check VIP status
        if (client.total_spent && client.total_spent >= VIP_SPENDING_THRESHOLD) {
          results[client.id] = 'vip'
        } else {
          results[client.id] = 'active'
        }
      } else if (client.created_at && new Date(client.created_at) > thirtyDaysAgo) {
        results[client.id] = 'new'
      } else {
        results[client.id] = 'inactive'
      }
    })

    return results
  }

  /**
   * Get status configuration for UI display
   */
  static getStatusConfig(status: ClientStatus) {
    const configs = {
      active: { 
        color: 'bg-green-100 text-green-800', 
        label: 'ACTIEF',
        description: 'Heeft afspraken in de laatste 90 dagen'
      },
      inactive: { 
        color: 'bg-gray-100 text-gray-800', 
        label: 'INACTIEF',
        description: 'Geen recente afspraken (>90 dagen)'
      },
      new: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'NIEUW',
        description: 'Nieuwe klant (<30 dagen)'
      },
      vip: { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'VIP',
        description: 'Waardevolle klant met hoge uitgaven'
      }
    }
    return configs[status] || configs.inactive
  }
}