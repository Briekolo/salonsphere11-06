import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'
import { NotificationTriggers } from './notificationTriggers'
import { ClientStatusService } from './clientStatusService'
import { EmailService } from './emailService'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export class ClientService {
  static async getAll(): Promise<Client[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const clients = data || []
    
    // Calculate status for all clients in bulk for efficiency
    const clientIds = clients.map(c => c.id)
    const statusMap = await ClientStatusService.calculateBulkClientStatus(clientIds)
    
    // Calculate last visit date from bookings for all clients
    const lastVisitMap = await this.calculateBulkLastVisit(clientIds, tenantId)
    
    return clients.map(client => ({
      ...client,
      total_spent: client.total_spent || 0,
      last_visit_date: lastVisitMap[client.id] || null,
      status: statusMap[client.id] || 'inactive'
    }))
  }

  static async getById(id: string): Promise<Client | null> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    if (!data) return null

    // Calculate status for this specific client
    const status = await ClientStatusService.calculateClientStatus(id)
    
    // Calculate last visit from bookings
    const lastVisitMap = await this.calculateBulkLastVisit([id], tenantId)
    
    return {
      ...data,
      last_visit_date: lastVisitMap[id] || null,
      status
    }
  }

  static async create(client: Omit<ClientInsert, 'tenant_id'>): Promise<{
    client: Client;
    warnings?: string[];
  }> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    // Sanitize date fields - convert empty strings to null
    const sanitizedClient = {
      ...client,
      date_of_birth: client.date_of_birth || null
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...sanitizedClient, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error

    const warnings: string[] = []

    // Trigger notification for new client registration
    try {
      await NotificationTriggers.onNewClientRegistration(
        tenantId,
        {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone
        }
      )
    } catch (notificationError) {
      console.error('Failed to send notification for new client registration:', notificationError)
      warnings.push('Interne notificatie kon niet worden verzonden')
    }

    // Send welcome email if enabled
    try {
      const isWelcomeEmailEnabled = await EmailService.checkEmailAutomationEnabled(tenantId, 'welcome')
      if (isWelcomeEmailEnabled && data.email) {
        await EmailService.sendWelcomeEmail(data, tenantId)
      }
    } catch (emailError) {
      console.error('Failed to send welcome email for new client:', emailError)
      // Check if it's an email validation error
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError)
      if (errorMessage.includes('Edge Function returned a non-2xx status code') || 
          errorMessage.includes('invalid email') || 
          errorMessage.includes('email')) {
        warnings.push('Welkomst-e-mail kon niet worden verzonden (controleer e-mailadres)')
      } else {
        warnings.push('Welkomst-e-mail kon niet worden verzonden')
      }
    }

    return {
      client: data,
      ...(warnings.length > 0 && { warnings })
    }
  }

  static async update(id: string, updates: Omit<ClientUpdate, 'tenant_id'>): Promise<Client> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    // Sanitize date fields - convert empty strings to null
    const sanitizedUpdates = {
      ...updates,
      ...(updates.date_of_birth !== undefined && { date_of_birth: updates.date_of_birth || null })
    }

    const { data, error } = await supabase
      .from('clients')
      .update(sanitizedUpdates)
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

    // First, check what related data exists
    const relatedData = await this.checkRelatedData(id, tenantId)
    
    if (relatedData.hasBlockingData) {
      throw new Error(`Kan klant niet verwijderen: ${relatedData.blockingReasons.join(', ')}`)
    }

    // If we have non-blocking related data, warn but proceed
    if (relatedData.hasRelatedData) {
      console.warn(`Deleting client with related data: ${relatedData.relatedDataTypes.join(', ')}`)
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      // Provide more specific error messages based on the error code
      if (error.code === '23503') {
        throw new Error('Kan klant niet verwijderen: er zijn nog gekoppelde records (boekingen, facturen of betalingen). Verwijder eerst deze gegevens.')
      } else if (error.code === '42501') {
        throw new Error('Geen toestemming om deze klant te verwijderen.')
      } else {
        throw new Error(`Fout bij verwijderen van klant: ${error.message}`)
      }
    }
  }

  // Helper method to check for related data before deletion
  static async checkRelatedData(clientId: string, tenantId: string): Promise<{
    hasBlockingData: boolean
    hasRelatedData: boolean
    blockingReasons: string[]
    relatedDataTypes: string[]
  }> {
    const blockingReasons: string[] = []
    const relatedDataTypes: string[] = []

    try {
      // Check for invoices (these block deletion due to ON DELETE RESTRICT)
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (!invoiceError && invoices && invoices.length > 0) {
        blockingReasons.push('er zijn nog facturen gekoppeld aan deze klant')
      }

      // Check for bookings (these should cascade delete, but good to know)
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (!bookingError && bookings && bookings.length > 0) {
        relatedDataTypes.push('boekingen')
      }

      // Check for payments (these should cascade delete)
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('id')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (!paymentError && payments && payments.length > 0) {
        relatedDataTypes.push('betalingen')
      }

      // Check for marketing campaigns (these should cascade delete)
      const { data: campaigns, error: campaignError } = await supabase
        .from('marketing_campaign_recipients')
        .select('id')
        .eq('client_id', clientId)
        .limit(1)

      if (!campaignError && campaigns && campaigns.length > 0) {
        relatedDataTypes.push('marketing campagnes')
      }

    } catch (error) {
      console.warn('Error checking related data:', error)
      // Don't block deletion if we can't check related data
    }

    return {
      hasBlockingData: blockingReasons.length > 0,
      hasRelatedData: relatedDataTypes.length > 0,
      blockingReasons,
      relatedDataTypes
    }
  }

  static async search(query: string): Promise<Client[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const clients = data || []
    
    // Calculate status for all search results in bulk
    const clientIds = clients.map(c => c.id)
    const statusMap = await ClientStatusService.calculateBulkClientStatus(clientIds)
    
    // Calculate last visit date from bookings for all clients
    const lastVisitMap = await this.calculateBulkLastVisit(clientIds, tenantId)
    
    return clients.map(client => ({
      ...client,
      total_spent: client.total_spent || 0,
      last_visit_date: lastVisitMap[client.id] || null,
      status: statusMap[client.id] || 'inactive'
    }))
  }

  // Helper method to calculate last visit dates in bulk for performance
  static async calculateBulkLastVisit(clientIds: string[], tenantId: string): Promise<Record<string, string | null>> {
    if (clientIds.length === 0) return {}

    const { data, error } = await supabase
      .from('bookings')
      .select('client_id, scheduled_at')
      .eq('tenant_id', tenantId)
      .in('client_id', clientIds)
      .lt('scheduled_at', new Date().toISOString()) // Only past appointments
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error('Error fetching booking data for last visit:', error)
      return {}
    }

    const lastVisitMap: Record<string, string | null> = {}
    
    // Initialize all clients to null
    clientIds.forEach(id => {
      lastVisitMap[id] = null
    })

    // Find the most recent booking for each client
    if (data) {
      data.forEach(booking => {
        if (!lastVisitMap[booking.client_id]) {
          lastVisitMap[booking.client_id] = booking.scheduled_at
        }
      })
    }

    return lastVisitMap
  }

}