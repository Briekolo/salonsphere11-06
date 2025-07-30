import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'

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
    return data || []
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
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getBySegment(segment: string): Promise<Client[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    let query = supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenantId)

    // Apply segment-specific filters
    switch (segment) {
      case 'vip':
        query = query.gte('total_spent', 500)
        break
      case 'new':
        query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        break
      case 'inactive':
        query = query.or(`last_visit_date.is.null,last_visit_date.lt.${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}`)
        break
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}