import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'
import { NotificationTriggers } from './notificationTriggers'

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
    
    // For now, return clients with default values for calculated fields
    // We'll fetch these separately to avoid breaking the display
    return (data || []).map(client => ({
      ...client,
      total_spent: client.total_spent || 0,
      last_visit_date: client.last_visit_date || null
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
    return data
  }

  static async create(client: Omit<ClientInsert, 'tenant_id'>): Promise<Client> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...client, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error

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
      // Don't fail the client creation if notification fails
    }

    return data
  }

  static async update(id: string, updates: Omit<ClientUpdate, 'tenant_id'>): Promise<Client> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('clients')
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
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
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
    
    // Return with default values for calculated fields
    return (data || []).map(client => ({
      ...client,
      total_spent: client.total_spent || 0,
      last_visit_date: client.last_visit_date || null
    }))
  }

}